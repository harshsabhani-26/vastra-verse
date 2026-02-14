import prisma from "@/lib/prisma";
import { logError } from "@/lib/logger";

/**
 * Restore product stock when return inspection passes
 * This is called after INSPECTION_PASS action
 */
export async function restoreInventoryForReturn(returnRequestId: string): Promise<void> {
    try {
        // Fetch return request with items
        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id: returnRequestId },
            include: {
                items: {
                    include: {
                        orderItem: {
                            include: { product: true }
                        }
                    }
                },
                order: true
            }
        });

        if (!returnRequest) {
            throw new Error("Return request not found");
        }

        // Update stock for each returned item atomically
        for (const returnItem of returnRequest.items) {
            const { orderItem, quantity } = returnItem;

            await prisma.product.update({
                where: { id: orderItem.productId },
                data: {
                    stock: {
                        increment: quantity // Add back to inventory
                    }
                }
            });

            console.log(`Restored ${quantity} units of product ${orderItem.productId} from return ${returnRequestId}`);
        }

        // Log timeline event
        await prisma.orderTimeline.create({
            data: {
                orderId: returnRequest.orderId,
                event: "INVENTORY_RESTORED",
                details: `Inventory restored for ${returnRequest.items.length} item(s) from return request`,
                createdBy: "SYSTEM"
            }
        });

    } catch (error) {
        logError("INVENTORY_RESTORE", error as Error);
        throw error;
    }
}
