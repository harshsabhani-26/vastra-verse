import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all products with detailed info
        const products = await prisma.product.findMany({
            include: {
                category: true,
                images: {
                    where: { type: 'MAIN' },
                    take: 1,
                },
                orderItems: {
                    where: {
                        order: {
                            status: {
                                not: 'CANCELLED',
                            },
                        },
                    },
                    select: {
                        quantity: true,
                        order: {
                            select: {
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });

        // Calculate inventory value
        let totalInventoryValue = 0;
        let totalInventoryValueAtRetail = 0;
        const categoryInventory: Record<
            string,
            {
                category: string;
                items: number;
                stock: number;
                value: number;
                valueAtRetail: number;
            }
        > = {};

        // Low stock items
        const lowStockItems: Array<{
            id: string;
            name: string;
            category: string;
            currentStock: number;
            lowStockThreshold: number;
            image: string | null;
            reorderSuggestion: number;
        }> = [];

        // Out of stock items
        const outOfStockItems: Array<{
            id: string;
            name: string;
            category: string;
            image: string | null;
            lastSold: Date | null;
        }> = [];

        // Overstock items (slow movers)
        const overstockItems: Array<{
            id: string;
            name: string;
            category: string;
            currentStock: number;
            soldLast30Days: number;
            daysOfInventory: number;
            image: string | null;
        }> = [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        products.forEach((product) => {
            const price = Number(product.price);
            const stock = product.stock;
            const value = price * stock;
            const finalPrice = product.finalPrice ? Number(product.finalPrice) : price;
            const valueAtRetail = finalPrice * stock;

            totalInventoryValue += value;
            totalInventoryValueAtRetail += valueAtRetail;

            // Category aggregation
            const categoryName = product.category.name;
            if (!categoryInventory[categoryName]) {
                categoryInventory[categoryName] = {
                    category: categoryName,
                    items: 0,
                    stock: 0,
                    value: 0,
                    valueAtRetail: 0,
                };
            }
            categoryInventory[categoryName].items += 1;
            categoryInventory[categoryName].stock += stock;
            categoryInventory[categoryName].value += value;
            categoryInventory[categoryName].valueAtRetail += valueAtRetail;

            // Low stock check
            const threshold = product.lowStockThreshold || 10;
            if (stock > 0 && stock <= threshold) {
                // Calculate reorder suggestion based on sales velocity
                const soldRecently = product.orderItems.filter(
                    (item) => item.order.createdAt >= thirtyDaysAgo
                );
                const totalSoldLast30Days = soldRecently.reduce((sum, item) => sum + item.quantity, 0);
                const dailySalesRate = totalSoldLast30Days / 30;
                const reorderSuggestion = Math.ceil(dailySalesRate * 30); // Suggest 30 days worth

                lowStockItems.push({
                    id: product.id,
                    name: product.name,
                    category: categoryName,
                    currentStock: stock,
                    lowStockThreshold: threshold,
                    image: product.images[0]?.url || null,
                    reorderSuggestion: Math.max(reorderSuggestion, threshold * 2),
                });
            }

            // Out of stock check
            if (stock === 0) {
                const lastSale = product.orderItems.length > 0
                    ? product.orderItems[product.orderItems.length - 1].order.createdAt
                    : null;

                outOfStockItems.push({
                    id: product.id,
                    name: product.name,
                    category: categoryName,
                    image: product.images[0]?.url || null,
                    lastSold: lastSale,
                });
            }

            // Overstock check (high inventory but low sales)
            if (stock > 50) {
                const soldRecently = product.orderItems.filter(
                    (item) => item.order.createdAt >= thirtyDaysAgo
                );
                const totalSoldLast30Days = soldRecently.reduce((sum, item) => sum + item.quantity, 0);

                if (totalSoldLast30Days < 10) {
                    const dailySalesRate = totalSoldLast30Days / 30 || 0.1;
                    const daysOfInventory = stock / dailySalesRate;

                    overstockItems.push({
                        id: product.id,
                        name: product.name,
                        category: categoryName,
                        currentStock: stock,
                        soldLast30Days: totalSoldLast30Days,
                        daysOfInventory: Math.round(daysOfInventory),
                        image: product.images[0]?.url || null,
                    });
                }
            }
        });

        // Inventory turnover ratio
        const totalSold = products.reduce((sum, product) => {
            const sold = product.orderItems.reduce((s, item) => s + item.quantity, 0);
            return sum + sold;
        }, 0);

        const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
        const inventoryTurnoverRatio = totalStock > 0 ? totalSold / totalStock : 0;

        // Sort category inventory by value
        const sortedCategoryInventory = Object.values(categoryInventory).sort(
            (a, b) => b.value - a.value
        );

        // Sort overstock by days of inventory
        const sortedOverstock = overstockItems.sort((a, b) => b.daysOfInventory - a.daysOfInventory);

        return NextResponse.json({
            summary: {
                totalInventoryValue,
                totalInventoryValueAtRetail,
                potentialProfit: totalInventoryValueAtRetail - totalInventoryValue,
                totalProducts: products.length,
                totalStock,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
                overstockCount: overstockItems.length,
                inventoryTurnoverRatio,
            },
            categoryBreakdown: sortedCategoryInventory,
            lowStockAlerts: lowStockItems.sort((a, b) => a.currentStock - b.currentStock),
            outOfStockItems: outOfStockItems.sort((a, b) => {
                if (!a.lastSold) return 1;
                if (!b.lastSold) return -1;
                return b.lastSold.getTime() - a.lastSold.getTime();
            }),
            overstockItems: sortedOverstock.slice(0, 20), // Top 20 overstock items
        });
    } catch (error) {
        console.error('Inventory analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
