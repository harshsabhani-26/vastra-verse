import { NextRequest, NextResponse } from 'next/server';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { requireAdmin, unauthorizedResponse } from '@/lib/auth-utils';
import { validateCursor, validateLimit } from '@/lib/api-utils';
import { withQueryLogging } from '@/lib/query-logger';

/**
 * GET /api/admin/customers - Cursor-based paginated customer list
 * 
 * Query params:
 * - cursor: User ID to start from (optional)
 * - limit: Number of items per page (default: 20, max: 100)
 * - search: Search by name, email, or phone
 * - vipOnly: Filter VIP customers only
 * - blockedOnly: Filter blocked customers only
 */
export async function GET(request: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        // Admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
        }

        const searchParams = request.nextUrl.searchParams;

        // Cursor-based pagination
        const cursor = validateCursor(searchParams.get('cursor'));
        const limit = validateLimit(searchParams.get('limit'), 20, 100);

        // Filters
        const search = searchParams.get('search') || '';
        const vipOnly = searchParams.get('vipOnly') === 'true';
        const blockedOnly = searchParams.get('blockedOnly') === 'true';

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (vipOnly) {
            where.isVIP = true;
        }

        if (blockedOnly) {
            where.isBlocked = true;
        }

        // Fetch customers with cursor pagination
        // NOTE: Removed embedded order aggregation (too slow)
        // Calculate stats on-demand via separate API if needed
        const customers = await withQueryLogging(
            '/api/admin/customers',
            'findMany',
            () => prisma.user.findMany({
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
                    blockedAt: true,
                    createdAt: true,
                    // Removed: orders, addresses aggregation
                    // These should be fetched separately when viewing customer details
                },
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' }
                ],
                ...(cursor ? {
                    cursor: { id: cursor },
                    skip: 1
                } : {}),
                take: limit + 1
            }),
            { cursor, limit, search, vipOnly, blockedOnly }
        );

        // Check for next page
        const hasNextPage = customers.length > limit;
        const items = hasNextPage ? customers.slice(0, limit) : customers;
        const nextCursor = hasNextPage ? items[items.length - 1].id : null;

        return NextResponse.json({
            items,
            nextCursor,
            hasNextPage
        });
    } catch (error) {
        console.error('[ERROR] /api/admin/customers - Failed to fetch customers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch customers' },
            { status: 500 }
        );
    }
}
