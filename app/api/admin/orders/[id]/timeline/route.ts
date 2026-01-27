import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const timeline = await prisma.orderTimeline.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(timeline);
    } catch (error) {
        console.error("Error fetching order timeline:", error);
        return NextResponse.json(
            { error: "Failed to fetch timeline" },
            { status: 500 }
        );
    }
}
