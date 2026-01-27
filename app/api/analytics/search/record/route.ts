import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { term } = await req.json();

        if (!term || typeof term !== 'string' || term.trim().length < 2) {
            return NextResponse.json({ error: "Invalid term" }, { status: 400 });
        }

        const normalizedTerm = term.trim().toLowerCase();

        await prisma.searchQuery.upsert({
            where: { term: normalizedTerm },
            update: {
                count: {
                    increment: 1
                }
            },
            create: {
                term: normalizedTerm,
                count: 1
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error recording search:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
