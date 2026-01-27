import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                images: {
                    orderBy: { position: 'asc' }
                }
            }
        });

        if (!product) {
            return new NextResponse("Product not found", { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_GET]", error);
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

        const body = await req.formData();
        const name = body.get("name") as string;
        const price = body.get("price") as string;
        const categoryId = body.get("categoryId") as string;
        const description = body.get("description") as string;
        const stock = body.get("stock") as string;
        const sku = body.get("sku") as string || undefined;
        const discount = body.get("discount") as string;
        const discountType = body.get("discountType") as string;
        const finalPrice = body.get("finalPrice") as string;
        const lowStockThreshold = body.get("lowStockThreshold") as string;
        const status = body.get("status") as string;
        const isNewArrival = body.get("isNewArrival") === "true";
        const isBestSeller = body.get("isBestSeller") === "true";
        const shortDescription = body.get("shortDescription") as string || undefined;

        // Saree-specific fields
        const fabricType = body.get("fabricType") as string || undefined;
        const weaveType = body.get("weaveType") as string || undefined;
        const borderDescription = body.get("borderDescription") as string || undefined;
        const palluDescription = body.get("palluDescription") as string || undefined;
        const hasBlousePiece = body.get("hasBlousePiece") === "true";
        const blouseFabric = body.get("blouseFabric") as string || undefined;
        const sareeLength = body.get("sareeLength") as string || undefined;
        const blouseLength = body.get("blouseLength") as string || undefined;
        const careInstructions = body.get("careInstructions") as string || undefined;

        // Parse arrays
        const colors = JSON.parse(body.get("colors") as string || "[]");
        const occasions = JSON.parse(body.get("occasions") as string || "[]");
        const imagesData = JSON.parse(body.get("images") as string || "[]");

        // Update product
        const product = await prisma.product.update({
            where: { id },
            data: {
                name,
                price: parseFloat(price),
                description,
                stock: parseInt(stock),
                sku,
                discount: discount ? parseFloat(discount) : 0,
                discountType: discountType || "PERCENTAGE",
                finalPrice: finalPrice ? parseFloat(finalPrice) : parseFloat(price),
                lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
                status,
                isNewArrival,
                isBestSeller,
                shortDescription,
                fabricType,
                weaveType,
                borderDescription,
                palluDescription,
                hasBlousePiece,
                blouseFabric,
                sareeLength,
                blouseLength,
                colors: { set: colors },
                occasions: { set: occasions },
                careInstructions,
                categoryId,
                images: {
                    // Delete existing images that are not in the new images array
                    deleteMany: {
                        id: {
                            notIn: imagesData.filter((img: any) => img.id).map((img: any) => img.id)
                        }
                    },
                    // Update existing images or create new ones
                    upsert: imagesData.map((img: any, index: number) => ({
                        where: { id: img.id || 'new-' + index },
                        create: {
                            url: img.url,
                            type: img.type,
                            position: img.position !== undefined ? img.position : index,
                            width: img.width,
                            height: img.height,
                            fileSize: img.fileSize,
                        },
                        update: {
                            url: img.url,
                            type: img.type,
                            position: img.position !== undefined ? img.position : index,
                            width: img.width,
                            height: img.height,
                            fileSize: img.fileSize,
                        }
                    }))
                }
            },
            include: {
                images: {
                    orderBy: { position: 'asc' }
                },
                category: true
            }
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCT_PUT]", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Error";
        return new NextResponse(`Failed to update product: ${errorMessage}`, { status: 500 });
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

        // Delete product (images will be cascade deleted due to onDelete: Cascade)
        await prisma.product.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[PRODUCT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
