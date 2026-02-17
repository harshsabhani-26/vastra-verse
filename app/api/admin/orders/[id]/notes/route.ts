import { NextRequest, NextResponse } from "next/server";
import { checkUserRateLimit } from '@/lib/rate-limit';
import prisma from "@/lib/prisma";

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

        const { id } = await params;
        const notes = await prisma.orderNote.findMany({
            where: { orderId: id },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(notes);
    } catch (error) {
        console.error("Error fetching order notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // SECURITY: Rate limiting (30 req/min for admin)
        const rateLimitResult = await checkUserRateLimit(request, 'admin');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        const { id } = await params;
        const body = await request.json();
        const { content, createdBy } = body;

        if (!content || !createdBy) {
            return NextResponse.json(
                { error: "Content and createdBy are required" },
                { status: 400 }
            );
        }

        const note = await prisma.orderNote.create({
            data: {
                orderId: id,
                content,
                createdBy
            }
        });

        // Add timeline entry
        await prisma.orderTimeline.create({
            data: {
                orderId: id,
                event: "Admin Note Added",
                details: content.substring(0, 100),
                createdBy
            }
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json(
            { error: "Failed to create note" },
            { status: 500 }
        );
    }
}
