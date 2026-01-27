import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

interface Insight {
    id: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    category: 'revenue' | 'inventory' | 'customer' | 'product' | 'seasonal';
    title: string;
    description: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
    metrics?: Record<string, number | string>;
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const insights: Insight[] = [];

        // Time periods for analysis
        const now = new Date();
        const last7Days = subDays(now, 7);
        const last30Days = subDays(now, 30);
        const last60Days = subDays(now, 60);
        const last90Days = subDays(now, 90);

        // === REVENUE TREND ANALYSIS ===
        const recentOrders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { gte: last30Days },
            },
            select: {
                total: true,
                createdAt: true,
            },
        });

        const previousOrders = await prisma.order.findMany({
            where: {
                status: { not: 'CANCELLED' },
                createdAt: { gte: last60Days, lt: last30Days },
            },
            select: {
                total: true,
            },
        });

        const recentRevenue = recentOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const previousRevenue = previousOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const revenueTrend = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

        if (revenueTrend > 20) {
            insights.push({
                id: 'revenue-surge',
                type: 'success',
                category: 'revenue',
                title: 'Strong Revenue Growth',
                description: `Revenue has increased by ${revenueTrend.toFixed(1)}% compared to the previous period.`,
                recommendation: 'Capitalize on this momentum by increasing marketing spend and ensuring adequate inventory levels.',
                priority: 'high',
                metrics: { growth: revenueTrend, recentRevenue, previousRevenue },
            });
        } else if (revenueTrend < -10) {
            insights.push({
                id: 'revenue-decline',
                type: 'danger',
                category: 'revenue',
                title: 'Revenue Decline Detected',
                description: `Revenue has decreased by ${Math.abs(revenueTrend).toFixed(1)}% compared to the previous period.`,
                recommendation: 'Review marketing strategies, consider promotional campaigns, and analyze customer feedback.',
                priority: 'high',
                metrics: { decline: Math.abs(revenueTrend), recentRevenue, previousRevenue },
            });
        }

        // === INVENTORY ALERTS ===
        const allProducts = await prisma.product.findMany({
            where: {
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                name: true,
                stock: true,
                lowStockThreshold: true,
            },
        });

        const lowStockProducts = allProducts.filter(p => {
            const threshold = p.lowStockThreshold || 10;
            return p.stock > 0 && p.stock <= threshold;
        });

        if (lowStockProducts.length > 0) {
            insights.push({
                id: 'low-stock-alert',
                type: 'warning',
                category: 'inventory',
                title: 'Low Stock Alert',
                description: `${lowStockProducts.length} products are running low on stock.`,
                recommendation: 'Review and reorder inventory for these products to prevent stockouts.',
                priority: 'high',
                metrics: { affectedProducts: lowStockProducts.length },
            });
        }

        const outOfStockProducts = await prisma.product.findMany({
            where: {
                status: 'PUBLISHED',
                stock: 0,
            },
            select: { id: true },
        });

        if (outOfStockProducts.length > 0) {
            insights.push({
                id: 'out-of-stock',
                type: 'danger',
                category: 'inventory',
                title: 'Out of Stock Products',
                description: `${outOfStockProducts.length} published products are currently out of stock.`,
                recommendation: 'Restock these items immediately or mark them as unavailable to avoid customer disappointment.',
                priority: 'high',
                metrics: { outOfStock: outOfStockProducts.length },
            });
        }

        // === CUSTOMER RETENTION ANALYSIS ===
        const users = await prisma.user.findMany({
            include: {
                orders: {
                    where: { status: { not: 'CANCELLED' } },
                    select: {
                        createdAt: true,
                    },
                },
            },
        });

        const recentCustomersCount = users.filter((u) =>
            u.orders.some((o) => o.createdAt >= last30Days)
        ).length;

        const previousCustomersCount = users.filter((u) =>
            u.orders.some((o) => o.createdAt >= last60Days && o.createdAt < last30Days)
        ).length;

        const repeatCustomers = users.filter((u) => u.orders.length > 1).length;
        const totalCustomersWithOrders = users.filter((u) => u.orders.length > 0).length;
        const repeatRate =
            totalCustomersWithOrders > 0 ? (repeatCustomers / totalCustomersWithOrders) * 100 : 0;

        if (repeatRate < 30) {
            insights.push({
                id: 'low-repeat-rate',
                type: 'warning',
                category: 'customer',
                title: 'Low Customer Retention',
                description: `Only ${repeatRate.toFixed(1)}% of customers make repeat purchases.`,
                recommendation: 'Implement loyalty programs, email marketing campaigns, and improve post-purchase engagement.',
                priority: 'medium',
                metrics: { repeatRate },
            });
        } else if (repeatRate > 50) {
            insights.push({
                id: 'high-retention',
                type: 'success',
                category: 'customer',
                title: 'Strong Customer Loyalty',
                description: `${repeatRate.toFixed(1)}% of customers make repeat purchases.`,
                recommendation: 'Continue current customer engagement strategies and consider VIP programs for top customers.',
                priority: 'low',
                metrics: { repeatRate },
            });
        }

        // === PRODUCT PERFORMANCE ===
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: last30Days },
                    status: { not: 'CANCELLED' },
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        stock: true,
                    },
                },
            },
        });

        const productSales: Record<string, { name: string; quantity: number; stock: number }> = {};
        orderItems.forEach((item) => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.product.name,
                    quantity: 0,
                    stock: item.product.stock,
                };
            }
            productSales[item.productId].quantity += item.quantity;
        });

        const trendingProducts = Object.entries(productSales)
            .filter(([_, data]) => data.quantity > 10)
            .sort((a, b) => b[1].quantity - a[1].quantity)
            .slice(0, 5);

        if (trendingProducts.length > 0) {
            const topProduct = trendingProducts[0][1];
            insights.push({
                id: 'trending-product',
                type: 'success',
                category: 'product',
                title: 'Trending Product Detected',
                description: `"${topProduct.name}" has seen high demand with ${topProduct.quantity} units sold in the last 30 days.`,
                recommendation: 'Ensure adequate stock levels and consider featuring this product in marketing campaigns.',
                priority: 'medium',
                metrics: { productName: topProduct.name, sold: topProduct.quantity },
            });
        }

        // === SEASONAL PATTERN DETECTION ===
        const currentMonth = now.getMonth();
        const festiveMonths = [8, 9, 10, 11]; // Sep, Oct, Nov, Dec (Indian festive season)

        if (festiveMonths.includes(currentMonth)) {
            insights.push({
                id: 'festive-season',
                type: 'info',
                category: 'seasonal',
                title: 'Festive Season Opportunity',
                description: 'Currently in peak festive season for saree sales.',
                recommendation: 'Launch festive collections, run seasonal promotions, and optimize inventory for traditional wear.',
                priority: 'high',
            });
        }

        // === ANOMALY DETECTION ===
        const todaysOrders = await prisma.order.count({
            where: {
                createdAt: { gte: startOfDay(now), lte: endOfDay(now) },
                status: { not: 'CANCELLED' },
            },
        });

        const avgDailyOrders = recentOrders.length / 30;

        if (todaysOrders > avgDailyOrders * 2) {
            insights.push({
                id: 'order-spike',
                type: 'info',
                category: 'revenue',
                title: 'Unusual Order Spike',
                description: `Today's order count (${todaysOrders}) is significantly higher than the daily average (${avgDailyOrders.toFixed(1)}).`,
                recommendation: 'Verify this is genuine demand and ensure fulfillment capacity can handle the surge.',
                priority: 'medium',
                metrics: { todaysOrders, avgDailyOrders },
            });
        }

        // === AOV CHANGES ===
        const recentAOV = recentOrders.length > 0 ? recentRevenue / recentOrders.length : 0;
        const previousAOV = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;
        const aovChange = previousAOV > 0 ? ((recentAOV - previousAOV) / previousAOV) * 100 : 0;

        if (aovChange < -15) {
            insights.push({
                id: 'aov-decline',
                type: 'warning',
                category: 'revenue',
                title: 'Declining Average Order Value',
                description: `Average order value has decreased by ${Math.abs(aovChange).toFixed(1)}%.`,
                recommendation: 'Consider upselling strategies, bundle offers, or minimum order incentives.',
                priority: 'medium',
                metrics: { aovChange, recentAOV, previousAOV },
            });
        }

        // Sort insights by priority
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        insights.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

        return NextResponse.json({
            insights,
            generatedAt: new Date().toISOString(),
            totalInsights: insights.length,
            byPriority: {
                high: insights.filter((i) => i.priority === 'high').length,
                medium: insights.filter((i) => i.priority === 'medium').length,
                low: insights.filter((i) => i.priority === 'low').length,
            },
            byCategory: {
                revenue: insights.filter((i) => i.category === 'revenue').length,
                inventory: insights.filter((i) => i.category === 'inventory').length,
                customer: insights.filter((i) => i.category === 'customer').length,
                product: insights.filter((i) => i.category === 'product').length,
                seasonal: insights.filter((i) => i.category === 'seasonal').length,
            },
        });
    } catch (error) {
        console.error('AI insights error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
