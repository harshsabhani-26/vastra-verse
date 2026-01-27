import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// PATCH /api/admin/products/[id] - Update product (especially stock)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        // Check if user is admin
        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Update product with provided fields
        const product = await prisma.product.update({
            where: { id },
            data: body,
            include: {
                category: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            product: {
                ...product,
                price: Number(product.price),
            }
        });
    } catch (error) {
        console.error("[ADMIN_PRODUCT_PATCH]", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}
