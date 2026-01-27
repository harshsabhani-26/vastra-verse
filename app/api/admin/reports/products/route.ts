import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Default to last 30 days
        const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all order items in the date range with product details
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: {
                        gte: startOfDay(start),
                        lte: endOfDay(end),
                    },
                    status: {
                        not: 'CANCELLED',
                    },
                },
            },
            include: {
                product: {
                    include: {
                        category: true,
                        images: {
                            where: { type: 'MAIN' },
                            take: 1,
                        },
                    },
                },
                order: {
                    select: {
                        createdAt: true,
                        status: true,
                    },
                },
            },
        });

        // Group by product
        const productStats: Record<
            string,
            {
                id: string;
                name: string;
                category: string;
                image: string | null;
                quantitySold: number;
                revenue: number;
                orders: number;
                averagePrice: number;
            }
        > = {};

        orderItems.forEach((item) => {
            const key = item.productId;
            if (!productStats[key]) {
                productStats[key] = {
                    id: item.product.id,
                    name: item.product.name,
                    category: item.product.category.name,
                    image: item.product.images[0]?.url || null,
                    quantitySold: 0,
                    revenue: 0,
                    orders: 0,
                    averagePrice: 0,
                };
            }
            productStats[key].quantitySold += item.quantity;
            productStats[key].revenue += Number(item.price) * item.quantity;
            productStats[key].orders += 1;
        });

        // Calculate average price
        Object.values(productStats).forEach((stat) => {
            stat.averagePrice = stat.quantitySold > 0 ? stat.revenue / stat.quantitySold : 0;
        });

        // Sort products
        const productArray = Object.values(productStats);
        const topByRevenue = [...productArray].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        const topByQuantity = [...productArray].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);
        const bottomPerformers = [...productArray].sort((a, b) => a.revenue - b.revenue).slice(0, 10);

        // Performance by category
        const categoryStats: Record<
            string,
            {
                category: string;
                revenue: number;
                quantitySold: number;
                orders: number;
            }
        > = {};

        orderItems.forEach((item) => {
            const category = item.product.category.name;
            if (!categoryStats[category]) {
                categoryStats[category] = {
                    category,
                    revenue: 0,
                    quantitySold: 0,
                    orders: 0,
                };
            }
            categoryStats[category].revenue += Number(item.price) * item.quantity;
            categoryStats[category].quantitySold += item.quantity;
            categoryStats[category].orders += 1;
        });

        const categoryPerformance = Object.values(categoryStats).sort((a, b) => b.revenue - a.revenue);

        // Stock turnover analysis
        const allProducts = await prisma.product.findMany({
            where: {
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                name: true,
                stock: true,
                price: true,
            },
        });

        const stockTurnover = allProducts.map((product) => {
            const sold = productStats[product.id]?.quantitySold || 0;
            const currentStock = product.stock;
            const turnoverRate = currentStock > 0 ? (sold / currentStock) * 100 : 0;

            return {
                id: product.id,
                name: product.name,
                sold,
                currentStock,
                turnoverRate,
                status:
                    turnoverRate > 100
                        ? 'high'
                        : turnoverRate > 50
                            ? 'good'
                            : turnoverRate > 20
                                ? 'moderate'
                                : 'slow',
            };
        });

        const sortedTurnover = stockTurnover.sort((a, b) => b.turnoverRate - a.turnoverRate);

        // Discount effectiveness
        const productsWithDiscount = await prisma.product.findMany({
            where: {
                discount: {
                    gt: 0,
                },
                status: 'PUBLISHED',
            },
            select: {
                id: true,
                name: true,
                price: true,
                discount: true,
                discountType: true,
            },
        });

        const discountEffectiveness = productsWithDiscount.map((product) => {
            const stats = productStats[product.id];
            return {
                id: product.id,
                name: product.name,
                discount: Number(product.discount),
                discountType: product.discountType,
                revenue: stats?.revenue || 0,
                quantitySold: stats?.quantitySold || 0,
            };
        });

        const sortedDiscountEffectiveness = discountEffectiveness
            .filter((p) => p.quantitySold > 0)
            .sort((a, b) => b.revenue - a.revenue);

        return NextResponse.json({
            topProducts: {
                byRevenue: topByRevenue,
                byQuantity: topByQuantity,
            },
            bottomPerformers,
            categoryPerformance,
            stockTurnover: sortedTurnover,
            discountEffectiveness: sortedDiscountEffectiveness,
            summary: {
                totalProductsSold: productArray.length,
                totalRevenue: productArray.reduce((sum, p) => sum + p.revenue, 0),
                totalQuantitySold: productArray.reduce((sum, p) => sum + p.quantitySold, 0),
            },
            dateRange: {
                start: format(start, 'yyyy-MM-dd'),
                end: format(end, 'yyyy-MM-dd'),
            },
        });
    } catch (error) {
        console.error('Product analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
