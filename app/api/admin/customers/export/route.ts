import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/customers/export - Export customer data as CSV
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const customerIds = body.customerIds || [];

        // Build where clause
        const where: any = {};
        if (customerIds.length > 0) {
            where.id = { in: customerIds };
        }

        // Fetch customers with order statistics
        const customers = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                phoneVerified: true,
                isVIP: true,
                isBlocked: true,
                blockedReason: true,
                createdAt: true,
                orders: {
                    select: {
                        total: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate statistics
        const customersWithStats = customers.map((customer) => {
            const orderCount = customer.orders.length;
            const totalSpent = customer.orders.reduce(
                (sum, order) => sum + Number(order.total),
                0
            );

            return {
                Name: customer.name || 'N/A',
                Email: customer.email,
                Phone: customer.phone || 'N/A',
                'Phone Verified': customer.phoneVerified ? 'Yes' : 'No',
                'Total Orders': orderCount,
                'Total Spent': totalSpent.toFixed(2),
                'VIP Status': customer.isVIP ? 'Yes' : 'No',
                'Blocked': customer.isBlocked ? 'Yes' : 'No',
                'Blocked Reason': customer.blockedReason || 'N/A',
                'Join Date': customer.createdAt.toISOString().split('T')[0],
            };
        });

        // Convert to CSV
        if (customersWithStats.length === 0) {
            return NextResponse.json(
                { error: 'No customers to export' },
                { status: 400 }
            );
        }

        const headers = Object.keys(customersWithStats[0]);
        const csvRows = [
            headers.join(','), // Header row
            ...customersWithStats.map((row) =>
                headers
                    .map((header) => {
                        const value = row[header as keyof typeof row];
                        // Escape quotes and wrap in quotes if contains comma
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    })
                    .join(',')
            ),
        ];

        const csv = csvRows.join('\n');

        // Return CSV file
        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="customers-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error('Error exporting customers:', error);
        return NextResponse.json(
            { error: 'Failed to export customers' },
            { status: 500 }
        );
    }
}
