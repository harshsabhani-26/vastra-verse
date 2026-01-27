import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const reportType = searchParams.get('type') || 'sales';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let csvContent = '';
        let filename = '';

        switch (reportType) {
            case 'sales': {
                const salesResponse = await fetch(
                    `${request.url.split('/export')[0]}/sales?startDate=${startDate}&endDate=${endDate}`
                );
                const salesData = await salesResponse.json();

                csvContent = 'Date,Revenue,Orders,Average Order Value\n';
                salesData.timeSeries.forEach((row: any) => {
                    csvContent += `${row.date},${row.revenue},${row.orders},${row.aov}\n`;
                });

                filename = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            }

            case 'products': {
                const productsResponse = await fetch(
                    `${request.url.split('/export')[0]}/products?startDate=${startDate}&endDate=${endDate}`
                );
                const productsData = await productsResponse.json();

                csvContent = 'Product Name,Category,Quantity Sold,Revenue,Average Price\n';
                productsData.topProducts.byRevenue.forEach((product: any) => {
                    csvContent += `"${product.name}","${product.category}",${product.quantitySold},${product.revenue},${product.averagePrice}\n`;
                });

                filename = `products-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            }

            case 'inventory': {
                const inventoryResponse = await fetch(
                    `${request.url.split('/export')[0]}/inventory`
                );
                const inventoryData = await inventoryResponse.json();

                csvContent = 'Category,Items,Stock,Value,Retail Value\n';
                inventoryData.categoryBreakdown.forEach((cat: any) => {
                    csvContent += `"${cat.category}",${cat.items},${cat.stock},${cat.value},${cat.valueAtRetail}\n`;
                });

                filename = `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            }

            case 'customers': {
                const customersResponse = await fetch(
                    `${request.url.split('/export')[0]}/customers?startDate=${startDate}&endDate=${endDate}`
                );
                const customersData = await customersResponse.json();

                csvContent = 'Customer Name,Email,Total Spent,Order Count,Lifetime Value,Is VIP\n';
                customersData.topCustomers.forEach((customer: any) => {
                    csvContent += `"${customer.name || 'N/A'}","${customer.email}",${customer.totalSpent},${customer.orderCount},${customer.lifetimeValue},${customer.isVIP}\n`;
                });

                filename = `customers-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            }

            case 'finance': {
                const financeResponse = await fetch(
                    `${request.url.split('/export')[0]}/finance?startDate=${startDate}&endDate=${endDate}`
                );
                const financeData = await financeResponse.json();

                csvContent = 'Date,Revenue,Order Count\n';
                financeData.dailyRevenue.forEach((row: any) => {
                    csvContent += `${format(new Date(row.date), 'yyyy-MM-dd')},${row.revenue},${row.count}\n`;
                });

                filename = `finance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            }

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }

        // Return CSV file
        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('CSV export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
