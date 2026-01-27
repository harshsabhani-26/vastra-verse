import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PaymentStatusEnum, PaymentMethodEnum } from "@prisma/client";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Parse workbook
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
            return NextResponse.json(
                { error: "File is empty" },
                { status: 400 }
            );
        }

        // Process rows
        const results = {
            total: jsonData.length,
            success: 0,
            failed: 0,
            errors: [] as any[]
        };

        for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            // Flexible keys: 'Order ID', 'Order No', 'Ref No', 'Amount', 'Cod Amount'
            // Normalize keys to lowercase for matching
            const keys = Object.keys(row).reduce((acc, key) => {
                acc[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = key;
                return acc;
            }, {} as Record<string, string>);

            const idKey = keys["orderid"] || keys["orderno"] || keys["refno"] || keys["awb"];
            const amountKey = keys["amount"] || keys["codamount"] || keys["collectionamount"];

            const orderId = row[idKey]?.toString()?.trim();
            const amount = parseFloat(row[amountKey]);

            if (!orderId) {
                results.failed++;
                results.errors.push({ row: i + 2, error: "Missing Order ID" });
                continue;
            }

            try {
                // Find order
                const order = await prisma.order.findFirst({
                    where: {
                        OR: [
                            { id: orderId },
                            { id: { endsWith: orderId } }, // Handle abbreviated IDs often used by couriers
                            { trackingNumber: orderId }
                        ]
                    },
                    include: { payments: true }
                });

                if (!order) {
                    results.failed++;
                    results.errors.push({ row: i + 2, orderId, error: "Order not found" });
                    continue;
                }

                if (order.paymentStatus === "PAID") {
                    results.failed++;
                    results.errors.push({ row: i + 2, orderId, error: "Already Paid" });
                    continue;
                }

                // Optional: Check amount tolerance (e.g., +/- 10 rupees)
                if (!isNaN(amount) && Math.abs(Number(order.total) - amount) > 10) {
                    results.errors.push({ row: i + 2, orderId, warning: `Amount mismatch: Order ${order.total} vs File ${amount}` });
                    // We still process it but log warning? Or fail? Let's proceed for now as courier might deduct charges
                }

                // Update Order & Create Payment
                await prisma.$transaction(async (tx) => {
                    await tx.order.update({
                        where: { id: order.id },
                        data: {
                            paymentStatus: "PAID"
                        }
                    });

                    // Create Payment
                    const existingPayment = await tx.payment.findFirst({
                        where: {
                            orderId: order.id,
                            status: PaymentStatusEnum.COMPLETED
                        }
                    });

                    if (!existingPayment) {
                        await tx.payment.create({
                            data: {
                                orderId: order.id,
                                amount: !isNaN(amount) ? amount : order.total,
                                currency: "INR",
                                status: PaymentStatusEnum.COMPLETED,
                                method: PaymentMethodEnum.COD,
                                gatewayProvider: "manual_settlement_upload",
                                metadata: {
                                    filename: file.name,
                                    uploadedAt: new Date().toISOString(),
                                    originalRow: row
                                }
                            }
                        });
                    }
                });

                results.success++;

            } catch (error) {
                console.error(`Error processing row ${i}:`, error);
                results.failed++;
                results.errors.push({ row: i + 2, orderId, error: "Database error" });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        console.error("Settlement upload error:", error);
        return NextResponse.json(
            { error: "Failed to process file" },
            { status: 500 }
        );
    }
}
