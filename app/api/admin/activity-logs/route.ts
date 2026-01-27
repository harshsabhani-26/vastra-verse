import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const resourceType = searchParams.get('resourceType');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (userId) {
            where.userId = userId;
        }

        if (action) {
            where.action = action;
        }

        if (resourceType) {
            where.resourceType = resourceType;
        }

        if (status) {
            where.status = status;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = startOfDay(new Date(startDate));
            }
            if (endDate) {
                where.createdAt.lte = endOfDay(new Date(endDate));
            }
        }

        // Get logs
        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get activity logs error:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
