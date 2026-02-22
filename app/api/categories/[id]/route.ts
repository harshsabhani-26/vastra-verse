import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            return new NextResponse("Category not found", { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        // Admin check
        if (!session || session.user?.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { isActive, isFeatured } = body;

        // Update category
        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(isActive !== undefined && { isActive }),
                ...(isFeatured !== undefined && { isFeatured })
            }
        });

        // Bust Next.js unstable_cache so homepage/shop reflect changes immediately
        revalidateTag('categories', {} as any);

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORY_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        // Admin check
        if (!session || session.user?.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, slug, description, image, icon, isFeatured, isActive } = body;

        // Update category
        const category = await prisma.category.update({
            where: { id },
            data: {
                name,
                slug,
                description,
                image,
                icon,
                isFeatured,
                isActive
            }
        });

        // Bust Next.js unstable_cache so homepage/shop reflect changes immediately
        revalidateTag('categories', {} as any);

        return NextResponse.json(category);
    } catch (error) {
        console.error("[CATEGORY_PUT]", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Error";
        return new NextResponse(`Failed to update category: ${errorMessage}`, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await context.params;

        // Admin check
        if (!session || session.user?.role !== "ADMIN") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productsCount > 0) {
            return new NextResponse(
                `Cannot delete category with ${productsCount} products. Please reassign or delete the products first.`,
                { status: 400 }
            );
        }

        // Delete category
        await prisma.category.delete({
            where: { id }
        });

        // Bust Next.js unstable_cache so homepage/shop reflect changes immediately
        revalidateTag('categories', {} as any);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CATEGORY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
