import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
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

        // Get the original product
        const original = await prisma.product.findUnique({
            where: { id },
            include: {
                images: {
                    orderBy: { position: 'asc' }
                }
            }
        });

        if (!original) {
            return new NextResponse("Product not found", { status: 404 });
        }

        // Create duplicate
        const duplicate = await prisma.product.create({
            data: {
                name: `${original.name} (Copy)`,
                description: original.description,
                price: original.price,
                stock: original.stock,
                sku: original.sku ? `${original.sku}-COPY` : null,
                discount: original.discount,
                discountType: original.discountType,
                finalPrice: original.finalPrice,
                lowStockThreshold: original.lowStockThreshold,
                status: "DRAFT", // Always set duplicates as draft
                shortDescription: original.shortDescription,
                fabricType: original.fabricType,
                weaveType: original.weaveType,
                borderDescription: original.borderDescription,
                palluDescription: original.palluDescription,
                hasBlousePiece: original.hasBlousePiece,
                blouseFabric: original.blouseFabric,
                sareeLength: original.sareeLength,
                blouseLength: original.blouseLength,
                colors: original.colors,
                occasions: original.occasions,
                careInstructions: original.careInstructions,
                categoryId: original.categoryId,
                isFeatured: false, // Don't duplicate featured status
                images: {
                    create: original.images.map((img, index) => ({
                        url: img.url,
                        type: img.type,
                        position: img.position !== undefined ? img.position : index,
                        width: img.width,
                        height: img.height,
                        fileSize: img.fileSize,
                        alt: img.alt
                    }))
                }
            },
            include: {
                images: true,
                category: true
            }
        });

        return NextResponse.json(duplicate);
    } catch (error) {
        console.error("[PRODUCT_DUPLICATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
