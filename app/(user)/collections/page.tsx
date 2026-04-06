import { ProductCard } from "@/components/product/ProductCard";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const metadata = {
    title: "Collections | Vastraa Verse",
    description: "Explore our exclusive collections of heritage weaves and contemporary designs.",
};

// Cache collections page and revalidate every 5 minutes
export const revalidate = 300;

async function getProducts() {
    try {
        const products = await prisma.product.findMany({
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                name: true,
                price: true,
                finalPrice: true,
                discount: true,
                discountType: true,
                isNewArrival: true,
                createdAt: true,
                category: {
                    select: {
                        name: true
                    }
                },
                images: {
                    where: { type: 'MAIN' },
                    take: 1,
                    select: {
                        url: true
                    }
                }
            }
        });
        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export default async function CollectionsPage() {
    const products = await getProducts();
    const session = await auth();

    let wishlistedProductIds = new Set<string>();
    if (session?.user?.id) {
        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId: session.user.id },
            select: { productId: true }
        });
        wishlistedProductIds = new Set(wishlistItems.map(item => item.productId));
    }

    return (
        <div className="bg-[#FAF9F6] min-h-screen pb-20">
            {/* Header / Hero */}
            <div className="bg-primary pt-32 pb-16 px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-wide">
                    Our Collections
                </h1>
                <p className="text-white/80 max-w-2xl mx-auto font-light text-lg">
                    Discover our carefully curated ranges of heritage weaves and contemporary designs.
                </p>
            </div>

            <div className="container mx-auto px-4 md:px-8 -mt-8">
                {products.length === 0 ? (
                    <div className="bg-white p-12 text-center shadow-sm">
                        <p className="text-stone-500 text-lg">No products found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12 bg-white p-8 shadow-sm">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                price={product.finalPrice ? parseFloat(product.finalPrice.toString()) : parseFloat(product.price.toString())}
                                originalPrice={product.finalPrice ? parseFloat(product.price.toString()) : undefined}
                                discountPercentage={product.discount && product.discountType === 'PERCENTAGE' ? parseFloat(product.discount.toString()) : undefined}
                                image={product.images[0]?.url || "/images/placeholder.jpg"}
                                category={product.category.name}
                                isNew={product.isNewArrival}
                                isWishlisted={wishlistedProductIds.has(product.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
