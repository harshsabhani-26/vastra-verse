/**
 * Inngest Job: Inventory Updates
 *
 * Handles atomic stock changes with cache invalidation
 * and low-stock alerting.
 *
 * Retries: 3 attempts (data integrity critical)
 */

import { inngest, logJobStart, logJobComplete, logJobError } from '@/lib/inngest';
import prisma from '@/lib/prisma';
import { invalidateProduct } from '@/lib/cache-invalidation';
import { logInfo, logError } from '@/lib/logger';

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);

export const processInventoryUpdate = inngest.createFunction(
    {
        id: 'process-inventory-update',
        name: 'Process Inventory Update',
        retries: 3,
    },
    { event: 'inventory/update' },
    async ({ event, step }) => {
        const { productId, quantityChange, reason, orderId } = event.data;
        const startTime = Date.now();

        logJobStart('process-inventory-update', { productId, quantityChange, reason });

        // Step 1: Atomic stock update in DB
        const updatedProduct = await step.run('update-stock', async () => {
            const product = await prisma.product.update({
                where: { id: productId },
                data: {
                    stock: {
                        increment: quantityChange, // negative = decrement
                    },
                },
                select: {
                    id: true,
                    name: true,
                    stock: true,
                    lowStockThreshold: true,
                },
            });

            logInfo('INVENTORY', `Stock updated: ${product.name} → ${product.stock} (${quantityChange > 0 ? '+' : ''}${quantityChange})`, {
                productId,
                newStock: product.stock,
                change: quantityChange,
                reason,
            });

            return product;
        });

        // Step 2: Invalidate product cache
        await step.run('invalidate-cache', async () => {
            await invalidateProduct(productId);
        });

        // Step 3: Check low stock and alert
        const threshold = updatedProduct.lowStockThreshold ?? LOW_STOCK_THRESHOLD;
        if (updatedProduct.stock <= threshold && quantityChange < 0) {
            await step.run('low-stock-alert', async () => {
                logInfo('INVENTORY', `⚠️ LOW STOCK ALERT: ${updatedProduct.name} — ${updatedProduct.stock} remaining`, {
                    productId,
                    stock: updatedProduct.stock,
                    threshold,
                });

                // Create in-app notification for admins
                try {
                    await prisma.notification.create({
                        data: {
                            role: 'ADMIN',
                            type: 'LOW_STOCK_ALERT',
                            title: 'Low Stock Alert',
                            message: `${updatedProduct.name} has only ${updatedProduct.stock} units left (threshold: ${threshold})`,
                            data: { productId, stock: updatedProduct.stock, threshold },
                        },
                    });
                } catch {
                    // Non-critical, continue
                }

                // If stock is 0, mark product as out of stock
                if (updatedProduct.stock <= 0) {
                    await prisma.product.update({
                        where: { id: productId },
                        data: { status: 'OUT_OF_STOCK' },
                    });
                    logInfo('INVENTORY', `Product ${updatedProduct.name} marked OUT_OF_STOCK`, { productId });
                }
            });
        }

        logJobComplete('process-inventory-update', { productId, newStock: updatedProduct.stock }, Date.now() - startTime);
        return { success: true, productId, newStock: updatedProduct.stock };
    }
);
