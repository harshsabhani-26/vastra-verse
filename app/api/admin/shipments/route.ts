import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/shipments
 *
 * Admin-only: List shipments with pagination, status filter, AWB search.
 * Also returns KPI summary in a single request.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
        const status = searchParams.get("status");
        const search = searchParams.get("search")?.trim();

        // Build where clause
        const where: any = {};
        if (status && status !== "all") {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { awbNumber: { contains: search, mode: "insensitive" } },
                { order: { customerName: { contains: search, mode: "insensitive" } } },
            ];
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Parallel fetch: shipments + total count + KPIs
        const [shipments, totalCount, ...kpiResults] = await Promise.all([
            prisma.shipment.findMany({
                where,
                include: {
                    order: {
                        select: {
                            customerName: true,
                            paymentMethod: true,
                            total: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            prisma.shipment.count({ where }),
            // KPI: Active shipments
            prisma.shipment.count({
                where: {
                    status: {
                        notIn: ["DELIVERED", "CANCELLED", "FAILED", "RETURN_DELIVERED", "RTO_DELIVERED"],
                    },
                },
            }),
            // KPI: Delivered today
            prisma.shipment.count({
                where: { status: "DELIVERED", deliveredAt: { gte: today } },
            }),
            // KPI: Delayed
            prisma.shipment.count({
                where: {
                    status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] },
                    estimatedDeliveryAt: { lt: now },
                },
            }),
            // KPI: RTO initiated
            prisma.shipment.count({
                where: { status: { in: ["RTO_INITIATED", "RETURN_INITIATED", "RETURN_PICKED"] } },
            }),
            // KPI: Pending pickups
            prisma.shipment.count({
                where: { status: { in: ["READY_TO_SHIP", "LABEL_GENERATED"] } },
            }),
            // KPI: Total shipments
            prisma.shipment.count(),
        ]);

        const [activeShipments, deliveredToday, delayedShipments, rtoInitiated, pendingPickups, totalShipments] =
            kpiResults;

        // Serialize Decimal fields
        const serializedShipments = shipments.map((s) => ({
            id: s.id,
            orderId: s.orderId,
            awbNumber: s.awbNumber,
            courierName: s.courierName,
            status: s.status,
            isReturn: s.isReturn,
            pickupScheduledAt: s.pickupScheduledAt?.toISOString() || null,
            shippedAt: s.shippedAt?.toISOString() || null,
            deliveredAt: s.deliveredAt?.toISOString() || null,
            estimatedDeliveryAt: s.estimatedDeliveryAt?.toISOString() || null,
            shippingCost: s.shippingCost ? Number(s.shippingCost) : null,
            profitImpact: s.profitImpact ? Number(s.profitImpact) : null,
            createdAt: s.createdAt.toISOString(),
            order: {
                customerName: s.order.customerName,
                paymentMethod: s.order.paymentMethod,
                total: Number(s.order.total),
            },
        }));

        return NextResponse.json({
            shipments: serializedShipments,
            totalCount,
            kpis: {
                activeShipments,
                deliveredToday,
                delayedShipments,
                rtoInitiated,
                pendingPickups,
                totalShipments,
            },
        });
    } catch (error: any) {
        console.error("[Admin Shipments API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch shipments" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/shipments
 *
 * Create a new shipment for an order via Shiprocket
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, dimensions, pickupLocation, pickupPincode } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // Fetch Order details
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                user: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (order.status !== "CONFIRMED" && order.status !== "PACKED") {
            return NextResponse.json(
                { error: "Order must be CONFIRMED or PACKED to create shipment" },
                { status: 400 }
            );
        }

        // Check if shipment already exists
        const existingShipment = await prisma.shipment.findFirst({
            where: { orderId: orderId, status: { notIn: ["CANCELLED", "FAILED"] } },
        });

        if (existingShipment) {
            return NextResponse.json(
                { error: "Active shipment already exists for this order" },
                { status: 400 }
            );
        }

        // Import Shiprocket dynamically to avoid circular issues
        const { createShipment, assignAwb } = await import("@/lib/shiprocket/shipment");

        // Parse address fields
        const addressMatch = order.shippingAddress?.match(/\d{6}/);
        const pincode = addressMatch ? addressMatch[0] : "110001";

        // Build Shiprocket order payload
        const nameParts = (order.customerName || order.user.name || "Customer").split(" ");
        const weight = dimensions?.weight || Math.max(order.items.length * 0.5, 0.5);

        const payload = {
            order_id: order.id,
            order_date: order.createdAt.toISOString().split("T")[0],
            channel_id: "",
            billing_customer_name: nameParts[0] || "Customer",
            billing_last_name: nameParts.slice(1).join(" ") || "",
            billing_address: order.shippingAddress || "N/A",
            billing_city: order.shippingCity || "Unknown",
            billing_pincode: pincode,
            billing_state: order.shippingState || "Unknown",
            billing_country: "India",
            billing_email: order.user.email || "",
            billing_phone: (order.customerPhone || "9999999999").replace(/\D/g, "").slice(-10),
            shipping_is_billing: true,
            order_items: order.items.map((item) => ({
                name: item.product.name,
                sku: item.product.sku || item.product.id,
                units: item.quantity,
                selling_price: Number(item.price),
            })),
            payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
            sub_total: Number(order.total),
            length: dimensions?.length || 30,
            breadth: dimensions?.breadth || 20,
            height: dimensions?.height || 10,
            weight,
            pickup_location: pickupLocation || process.env.SHIPROCKET_PICKUP_LOCATION || "Vastraa Verse- Office",
        };

        // Create order on Shiprocket
        const shiprocketResponse = await createShipment(payload as any);
        console.log("[SHIPROCKET RESPONSE]:", JSON.stringify(shiprocketResponse, null, 2));

        if (!shiprocketResponse.order_id || !shiprocketResponse.shipment_id) {
            throw new Error(`Shiprocket error: ${shiprocketResponse.status_code} — ${JSON.stringify(shiprocketResponse)}`);
        }

        // Assign AWB
        let awbNumber: string | null = null;
        let courierName: string | null = "Shiprocket";
        try {
            const awbResponse = await assignAwb({
                shipment_id: shiprocketResponse.shipment_id,
            });
            awbNumber = awbResponse.response?.data?.awb_code || null;
            courierName = awbResponse.response?.data?.courier_name || "Shiprocket";
        } catch (awbErr) {
            console.warn("[SHIPROCKET] AWB assignment failed, will retry:", awbErr);
        }

        // Save Shipment to DB
        const shipment = await prisma.shipment.create({
            data: {
                orderId: order.id,
                awbNumber,
                shiprocketOrderId: String(shiprocketResponse.order_id),
                courierName,
                status: "READY_TO_SHIP",
                carrier: "SHIPROCKET",
                weight,
                length: dimensions?.length || 30,
                breadth: dimensions?.breadth || 20,
                height: dimensions?.height || 10,
                providerResponse: shiprocketResponse as any,
            },
        });

        // Update Order status
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: "SHIPPED",
                trackingNumber: awbNumber || String(shiprocketResponse.order_id),
                courierName,
            },
        });

        return NextResponse.json({ success: true, shipment });
    } catch (error: any) {
        console.error("[Admin Shipment Create API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create shipment" },
            { status: 500 }
        );
    }
}
