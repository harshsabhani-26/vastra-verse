import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { createShipment, generateAWB, getShippingLabel, checkServiceability } from "@/lib/shipping-provider";
import { createShipmentRecord } from "@/lib/shipment-service";
import { getRecommendedCourier } from "@/lib/courier-performance";
import { EventDispatcher } from "@/lib/services/event-dispatcher";

/**
 * POST /api/admin/shipments
 * Create a new shipment for an order
 */
export async function POST(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { orderId, weight, length, breadth, height, preferredCourier } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: "Order ID is required" },
                { status: 400 }
            );
        }

        // Fetch order with items
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                user: true
            }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        // Validate order status
        if (order.status === "PENDING" || order.status === "CANCELLED") {
            return NextResponse.json(
                { error: "Order must be confirmed before creating shipment" },
                { status: 400 }
            );
        }

        // Check if shipment already exists
        const existingShipment = await prisma.shipment.findFirst({
            where: {
                orderId,
                isReturn: false,
                status: { notIn: ["CANCELLED", "FAILED"] }
            }
        });

        if (existingShipment) {
            return NextResponse.json(
                { error: "Active shipment already exists for this order" },
                { status: 400 }
            );
        }

        // Parse shipping address
        const addressParts = (order.shippingAddress || "").split(", ");
        if (addressParts.length < 6) {
            return NextResponse.json(
                { error: "Invalid shipping address format. Please update order shipping address." },
                { status: 400 }
            );
        }

        const [address, city, state, country, zip] = addressParts;

        // Validate pincode and state (basic check)
        if (!zip || zip.length !== 6) {
            return NextResponse.json(
                { error: "Invalid pincode format" },
                { status: 400 }
            );
        }

        // Default dimensions if not provided
        const finalWeight = Number(weight) || 0.5;
        const finalLength = Number(length) || 30;
        const finalBreadth = Number(breadth) || 20;
        const finalHeight = Number(height) || 10;

        // Get courier recommendation
        let recommendedCourier: string | null = null;
        if (!preferredCourier) {
            recommendedCourier = await getRecommendedCourier(zip);
            console.log("[Admin] Recommended courier:", recommendedCourier);
        }

        // Prepare shipment data
        const shipmentParams = {
            orderId: order.id,
            orderNumber: order.id.slice(0, 10),
            orderDate: order.createdAt.toISOString().split("T")[0],
            pickupLocation: "Primary",
            billingCustomerName: order.customerName?.split(" ")[0] || "Customer",
            billingLastName: order.customerName?.split(" ").slice(1).join(" ") || "Name",
            billingAddress: address,
            billingCity: city,
            billingState: state,
            billingPincode: zip,
            billingCountry: country || "India",
            billingEmail: order.user?.email || "customer@example.com",
            billingPhone: order.customerPhone || "0000000000",
            shippingIsBilling: true,
            orderItems: order.items.map((item) => ({
                name: item.product.name,
                sku: item.product.sku || item.product.id.slice(0, 10),
                units: item.quantity,
                selling_price: Number(item.price),
                discount: 0,
                tax: 0,
                hsn: 0
            })),
            paymentMethod: order.paymentMethod === "COD" ? "COD" as const : "Prepaid" as const,
            subTotal: Number(order.subtotal || order.total),
            length: finalLength,
            breadth: finalBreadth,
            height: finalHeight,
            weight: finalWeight
        };

        // Retry logic for shipment creation
        let shiprocketResponse;
        let lastError;
        const maxRetries = 2;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`[Admin] Creating Shiprocket shipment (Attempt ${attempt + 1}/${maxRetries})`);
                shiprocketResponse = await createShipment(shipmentParams);
                break; // Success, exit loop
            } catch (error: any) {
                lastError = error;
                console.error(`[Admin] Attempt ${attempt + 1} failed:`, error.message);

                if (attempt < maxRetries - 1) {
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
                }
            }
        }

        if (!shiprocketResponse) {
            console.error("[Admin] All shipment creation attempts failed");
            return NextResponse.json(
                { error: `Failed to create shipment: ${lastError?.message || "Unknown error"}` },
                { status: 500 }
            );
        }

        // Generate AWB
        let awbData;
        try {
            awbData = await generateAWB(shiprocketResponse.shipment_id);
        } catch (error) {
            console.error("[Admin] AWB generation failed:", error);
            // Continue without AWB for now
        }

        // Get label URL
        let labelUrl;
        try {
            const label = await getShippingLabel([shiprocketResponse.shipment_id]);
            labelUrl = label.label_url;
        } catch (error) {
            console.error("[Admin] Label generation failed:", error);
        }

        // Create shipment record in database
        const shipment = await createShipmentRecord({
            orderId: order.id,
            providerShipmentId: shiprocketResponse.shipment_id.toString(),
            awbNumber: awbData?.awb_code || shiprocketResponse.awb_code,
            courierName: awbData?.courier_name || shiprocketResponse.courier_name || recommendedCourier || undefined,
            labelUrl: labelUrl,
            trackingUrl: `https://shiprocket.co/tracking/${awbData?.awb_code || shiprocketResponse.awb_code}`,
            status: "READY_TO_SHIP",
            providerResponse: shiprocketResponse,
            weight: finalWeight,
            length: finalLength,
            breadth: finalBreadth,
            height: finalHeight,
            createdBy: session.user.id
        });

        // Update order status
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "PACKED",
                trackingNumber: shipment.awbNumber
            }
        });

        // Fire event notification (non-blocking)
        EventDispatcher.shipmentCreated({
            id: shipment.id,
            orderId: order.id,
            awbNumber: shipment.awbNumber,
            courierName: shipment.courierName,
        }).catch(() => { });

        return NextResponse.json({
            success: true,
            shipment: {
                id: shipment.id,
                awbNumber: shipment.awbNumber,
                courierName: shipment.courierName,
                labelUrl: shipment.labelUrl,
                trackingUrl: shipment.trackingUrl,
                status: shipment.status,
                recommendedCourier: recommendedCourier || undefined
            }
        });

    } catch (error: any) {
        console.error("[Admin] Shipment creation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create shipment" },
            { status: 500 }
        );
    }
}
