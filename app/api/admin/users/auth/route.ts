import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();

        // Check if user is admin
        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const search = searchParams.get("search") || "";
        const provider = searchParams.get("provider") || "all"; // all, google, credentials
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "desc";

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {
            role: "USER", // Only show regular users, not admins
        };

        // Search filter
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Date range filter
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Get users with their accounts (for provider info)
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                [sortBy]: sortOrder,
            },
            include: {
                accounts: {
                    select: {
                        provider: true,
                        createdAt: true,
                    },
                },
                sessions: {
                    orderBy: {
                        lastActivityAt: "desc",
                    },
                    take: 1,
                    select: {
                        ipAddress: true,
                        userAgent: true,
                        lastActivityAt: true,
                    },
                },
                activityLogs: {
                    where: {
                        action: "LOGIN",
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 5,
                    select: {
                        action: true,
                        description: true,
                        status: true,
                        createdAt: true,
                        ipAddress: true,
                    },
                },
                _count: {
                    select: {
                        orders: true,
                    },
                },
            },
        });

        // Filter by provider after fetching (since it's a relation)
        let filteredUsers = users;
        if (provider !== "all") {
            filteredUsers = users.filter((user) => {
                if (provider === "google") {
                    return user.accounts.some((acc) => acc.provider === "google");
                } else if (provider === "credentials") {
                    return user.password !== null && user.accounts.length === 0;
                }
                return true;
            });
        }

        // Get total count for pagination
        const totalCount = await prisma.user.count({ where });

        // Calculate statistics
        const [totalUsers, googleUsers, credentialUsers, todayUsers, weekUsers] = await Promise.all([
            prisma.user.count({ where: { role: "USER" } }),
            prisma.account.count({
                where: {
                    provider: "google",
                    user: { role: "USER" },
                },
            }),
            prisma.user.count({
                where: {
                    role: "USER",
                    password: { not: null },
                },
            }),
            prisma.user.count({
                where: {
                    role: "USER",
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            prisma.user.count({
                where: {
                    role: "USER",
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);

        // Transform users data for response
        const transformedUsers = filteredUsers.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            phone: user.phone,
            isVIP: user.isVIP,
            isBlocked: user.isBlocked,
            twoFactorEnabled: user.twoFactorEnabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            lastLoginIP: user.lastLoginIP,
            failedLoginAttempts: user.failedLoginAttempts,
            authProviders: user.accounts.map((acc) => ({
                provider: acc.provider,
                createdAt: acc.createdAt,
            })),
            hasPassword: user.password !== null,
            latestSession: user.sessions[0] || null,
            recentLoginActivity: user.activityLogs,
            ordersCount: user._count.orders,
        }));

        return NextResponse.json({
            users: transformedUsers,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
            },
            stats: {
                totalUsers,
                googleUsers,
                credentialUsers,
                todayUsers,
                weekUsers,
            },
        });
    } catch (error) {
        console.error("Error fetching user auth data:", error);
        return NextResponse.json(
            { error: "Failed to fetch user authentication data" },
            { status: 500 }
        );
    }
}
