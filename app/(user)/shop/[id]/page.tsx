import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductDetails } from "@/components/product/ProductDetails";

// Cache product pages and revalidate every 5 minutes
export const revalidate = 300;

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            category: true,
            images: {
                orderBy: { position: 'asc' }
            }
        }
    });

    // Check wishlist status
    let isWishlisted = false;
    if (session?.user?.id && product) {
        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id
                }
            }
        });
        isWishlisted = !!wishlistItem;
    }

    if (!product) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb / Top Bar */}
            <div className="border-b border-primary/10">
                <div className="container mx-auto px-4 md:px-8 py-4">
                    <div className="text-[10px] uppercase tracking-widest text-text-muted">
                        Home / Shop / {product.category?.name} / {product.name}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
                    {/* Image Gallery - Left Side */}
                    <div>
                        <ProductImageGallery
                            images={product.images || []}
                            productName={product.name}
                        />
                    </div>

                    {/* Product Details - Right Side (Sticky) */}
                    <div>
                        <ProductDetails
                            product={{
                                ...product,
                                price: product.price ? product.price.toString() : null,
                                finalPrice: product.finalPrice ? product.finalPrice.toString() : null,
                                discount: product.discount ? product.discount.toString() : null,
                            }}
                            initialIsWishlisted={isWishlisted}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
