import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: {
                id,
                userId: session.user.id
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: { type: 'MAIN' },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: order.id,
            items: order.items.map(item => ({
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price.toString(),
                product: {
                    name: item.product.name,
                    images: item.product.images.map(img => ({ url: img.url }))
                }
            }))
        });

    } catch (error) {
        console.error("Fetch Order Items Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch order items" },
            { status: 500 }
        );
    }
}
