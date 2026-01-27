import { notificationService } from '../notificationService';
import { Product } from '@prisma/client';

/**
 * Trigger notification when product stock is low
 */
export async function notifyLowStock(product: Product, threshold: number = 10) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'LOW_STOCK_ALERT',
        title: 'Low Stock Alert',
        message: `${product.name} has only ${product.stock} units left (threshold: ${threshold})`,
        priority: 'HIGH',
        resourceType: 'Product',
        resourceId: product.id,
        actionUrl: `/admin/products/edit/${product.id}`,
        actionText: 'Update Stock',
        data: {
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            threshold,
        },
    });
}

/**
 * Trigger notification when product is out of stock
 */
export async function notifyOutOfStock(product: Product) {
    await notificationService.sendImmediate({
        role: 'ADMIN',
        type: 'OUT_OF_STOCK',
        title: 'Out of Stock Alert',
        message: `${product.name} is now out of stock!`,
        priority: 'URGENT',
        resourceType: 'Product',
        resourceId: product.id,
        actionUrl: `/admin/products/edit/${product.id}`,
        actionText: 'Restock Now',
        data: {
            productId: product.id,
            productName: product.name,
        },
    });
}

/**
 * Check and notify if stock needs attention after order or update
 */
export async function checkStockLevels(product: Product, lowStockThreshold: number = 10) {
    if (product.stock === 0) {
        await notifyOutOfStock(product);
    } else if (product.stock <= lowStockThreshold) {
        await notifyLowStock(product, lowStockThreshold);
    }
}
