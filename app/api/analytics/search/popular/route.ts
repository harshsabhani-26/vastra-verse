import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const popularSearches = await prisma.searchQuery.findMany({
            orderBy: {
                count: 'desc',
            },
            take: 6,
            select: {
                term: true,
            }
        });

        // Format to match the UI expectation
        const formattedSearches = popularSearches.map(s => ({
            term: s.term,
            label: s.term.charAt(0).toUpperCase() + s.term.slice(1) // Capitalize for label
        }));

        return NextResponse.json(formattedSearches);
    } catch (error) {
        console.error("Error fetching popular searches:", error);
        return NextResponse.json([], { status: 500 });
    }
}
