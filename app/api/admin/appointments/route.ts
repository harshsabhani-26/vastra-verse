import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        if (status && status !== "all") {
            where.status = status.toUpperCase();
        }

        if (search) {
            where.OR = [
                { customerName: { contains: search, mode: "insensitive" } },
                { customerEmail: { contains: search, mode: "insensitive" } },
                { customerPhone: { contains: search, mode: "insensitive" } },
            ];
        }

        // Fetch appointments
        const [appointments, total] = await Promise.all([
            prisma.appointment.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.appointment.count({ where }),
        ]);

        // Get stats
        const stats = await prisma.appointment.groupBy({
            by: ["status"],
            _count: true,
        });

        const statusCounts = {
            total,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            rescheduled: 0,
        };

        stats.forEach((stat) => {
            const status = stat.status.toLowerCase() as keyof typeof statusCounts;
            if (status in statusCounts) {
                statusCounts[status] = stat._count;
            }
        });

        return NextResponse.json({
            appointments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            stats: statusCounts,
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        return NextResponse.json(
            { error: "Failed to fetch appointments" },
            { status: 500 }
        );
    }
}
