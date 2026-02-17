
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ReturnStatus } from "@prisma/client";
import { checkUserRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(req, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const session = await auth();
        // Role check
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") as ReturnStatus | undefined;
        const orderId = searchParams.get("orderId");

        const where: any = {};
        if (status) where.status = status;
        if (orderId) where.orderId = orderId;

        const returns = await prisma.returnRequest.findMany({
            where,
            include: {
                user: {
                    select: { name: true, email: true, phone: true }
                },
                order: {
                    select: {
                        total: true
                    }
                },
                items: {
                    include: {
                        orderItem: {
                            include: {
                                product: {
                                    select: { name: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { requestedAt: 'desc' }
        });

        return NextResponse.json(returns);

    } catch (error) {
        console.error("Admin Returns List Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch returns" },
            { status: 500 }
        );
    }
}
