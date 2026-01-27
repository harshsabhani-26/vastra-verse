import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

// POST reorder categories
export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session || session.user?.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { categories } = body;

        // Update display order for all categories
        await Promise.all(
            categories.map((cat: { id: string; displayOrder: number }) =>
                prisma.category.update({
                    where: { id: cat.id },
                    data: { displayOrder: cat.displayOrder }
                })
            )
        );

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CATEGORIES_REORDER]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
