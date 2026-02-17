import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GET /api/admin/customers/[id] - Get customer details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        const customer = await prisma.user.findUnique({
            where: { id },
            include: {
                orders: {
                    select: {
                        id: true,
                        total: true,
                        status: true,
                        paymentStatus: true,
                        createdAt: true,
                        items: {
                            select: {
                                quantity: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                addresses: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                customerNotes: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Calculate statistics
        const totalSpent = customer.orders.reduce(
            (sum, order) => sum + Number(order.total),
            0
        );
        const averageOrderValue = customer.orders.length > 0
            ? totalSpent / customer.orders.length
            : 0;

        return NextResponse.json({
            ...customer,
            statistics: {
                totalOrders: customer.orders.length,
                totalSpent,
                averageOrderValue,
            },
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/customers/[id] - Update customer (VIP, blocked status)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const body = await request.json();

        const updateData: any = {};

        if (typeof body.isVIP === 'boolean') {
            updateData.isVIP = body.isVIP;
        }

        if (typeof body.isBlocked === 'boolean') {
            updateData.isBlocked = body.isBlocked;
            if (body.isBlocked) {
                updateData.blockedAt = new Date();
                updateData.blockedReason = body.blockedReason || null;
            } else {
                updateData.blockedAt = null;
                updateData.blockedReason = null;
            }
        }

        const customer = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        );
    }
}
