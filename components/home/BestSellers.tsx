import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { unstable_cache } from 'next/cache';

// Cached bestsellers query - revalidates every 5 minutes
const getBestSellers = unstable_cache(
    async () => {
        try {
            const products = await prisma.product.findMany({
                where: {
                    isBestSeller: true,
                    status: "PUBLISHED"
                },
                take: 6,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    discount: true,
                    finalPrice: true,
                    isNewArrival: true,
                    images: {
                        where: { type: 'MAIN' },
                        take: 1,
                        select: {
                            url: true,
                            alt: true,
                        }
                    },
                    category: {
                        select: {
                            name: true,
                        }
                    }
                },
                orderBy: {
                    updatedAt: 'desc'
                }
            });
            return products;
        } catch (error) {
            console.error("Failed to fetch best sellers:", error);
            return [];
        }
    },
    ['bestsellers'],
    {
        revalidate: 300, // 5 minutes
        tags: ['products', 'bestsellers']
    }
);

export async function BestSellers() {
    const products = await getBestSellers();

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-20 bg-[#FAF9F6]">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center text-center mb-12 space-y-4">
                    <span className="text-primary text-sm tracking-[0.2em] uppercase">Curated Collection</span>
                    <h2 className="text-3xl md:text-4xl font-serif text-primary">Best Selling Masterpieces</h2>
                    <div className="h-px w-24 bg-primary/30 mt-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/shop/${product.id}`}
                            className="group cursor-pointer"
                        >
                            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100 mb-4">
                                {product.images[0] ? (
                                    <Image
                                        src={product.images[0].url}
                                        alt={product.images[0].alt || product.name}
                                        fill
                                        priority={index < 3}  // Priority load first 3 images
                                        loading={index < 3 ? undefined : "lazy"}  // Lazy load rest
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <Image
                                        src="https://images.unsplash.com/photo-1610189012906-47833cc180bb?auto=format&fit=crop&q=80&w=800"
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                )}
                                {product.isNewArrival && (
                                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] uppercase tracking-wider px-3 py-1">
                                        New
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <Button className="w-full bg-white text-primary hover:bg-stone-50 border border-transparent shadow-lg text-xs uppercase tracking-widest h-10">
                                        View Details
                                    </Button>
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <p className="text-xs text-stone-500 uppercase tracking-wider">
                                    {product.category.name}
                                </p>
                                <h3 className="font-serif text-lg text-primary group-hover:text-primary/80 transition-colors">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-center gap-2">
                                    {product.discount && Number(product.discount) > 0 ? (
                                        <>
                                            <span className="text-stone-400 line-through text-sm">
                                                ₹{parseFloat(product.price.toString()).toLocaleString()}
                                            </span>
                                            <span className="text-primary font-medium">
                                                ₹{product.finalPrice ? parseFloat(product.finalPrice.toString()).toLocaleString() : parseFloat(product.price.toString()).toLocaleString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-primary font-medium">
                                            ₹{parseFloat(product.price.toString()).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <Link href="/collections">
                        <Button variant="outline" className="h-12 px-8 border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-widest text-xs min-w-[200px]">
                            View All Collections
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
