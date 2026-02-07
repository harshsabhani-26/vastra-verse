import { ProductCard } from "@/components/product/ProductCard";
import { FilterBar } from "@/components/shop/FilterBar";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

interface ShopPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

import { auth } from "@/auth";

export default async function ShopPage({ searchParams }: ShopPageProps) {
    const params = await searchParams;
    const query = typeof params.q === 'string' ? params.q : undefined;
    const category = typeof params.category === 'string' ? params.category : undefined;
    const sort = typeof params.sort === 'string' ? params.sort : undefined;
    const view = typeof params.view === 'string' ? params.view : '4';

    // Fetch Session & Wishlist
    const session = await auth();
    let wishlistedProductIds = new Set<string>();

    if (session?.user?.id) {
        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId: session.user.id },
            select: { productId: true }
        });
        wishlistedProductIds = new Set(wishlistItems.map(item => item.productId));
    }

    const minPrice = typeof params.minPrice === 'string' ? parseFloat(params.minPrice) : undefined;
    const maxPrice = typeof params.maxPrice === 'string' ? parseFloat(params.maxPrice) : undefined;
    const colors = typeof params.colors === 'string' ? params.colors.split(',') : undefined;

    const where: Prisma.ProductWhereInput = {};

    // Search Logic
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { name: { contains: query, mode: 'insensitive' } } }
        ];
    }

    if (category) {
        where.category = {
            name: {
                equals: category,
                mode: 'insensitive'
            }
        };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (colors && colors.length > 0) {
        where.colors = {
            hasSome: colors
        };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = {};
    if (sort === 'newest') {
        // Enforce STRICT filtering for New Arrivals section
        (where as any).isNewArrival = true;

        orderBy = [
            { createdAt: 'desc' }
        ];
    } else if (sort === 'price_asc') {
        orderBy = { price: 'asc' };
    } else if (sort === 'price_desc') {
        orderBy = { price: 'desc' };
    }

    // If "newest" sort is requested without other filters, we effectively show "New Arrivals"
    // We could also add a dedicated "isNew" field check if strictly needed, but sorting by date is usually what is meant.

    const products = await prisma.product.findMany({
        where,
        orderBy,
        include: {
            category: true,
            images: {
                orderBy: { position: 'asc' }
            }
        }
    });

    // Fetch categories for filter
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, slug: true }
    });

    // Determine grid columns based on view parameter
    const gridCols = view === '2'
        ? 'grid-cols-2 lg:grid-cols-2'
        : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    return (
        <div className="min-h-screen bg-background">
            {/* Top Banner / Breadcrumbs Area */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 pb-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-4">
                    <Link href="/">Home</Link>
                    <span>|</span>
                    <Link href="/shop">Shop</Link>
                    {category && (
                        <>
                            <span>|</span>
                            <span className="text-primary">{category}</span>
                        </>
                    )}
                    {sort === 'newest' && !category && (
                        <>
                            <span>|</span>
                            <span className="text-primary">New Arrivals</span>
                        </>
                    )}
                </div>

                {/* Filter Bar */}
                <FilterBar categories={categories} totalCount={products.length} />
            </div>

            <div className="border-t border-primary/10">
                <div className="container mx-auto px-4 md:px-8 py-12">
                    {products.length === 0 ? (
                        <div className="text-center py-32 animate-fade-in">
                            <div className="max-w-md mx-auto space-y-6">
                                <h2 className="text-2xl md:text-3xl text-primary font-serif font-medium">No treasures found</h2>
                                <p className="text-text-muted font-light leading-relaxed">It seems we current don't have pieces matching your specific criteria.</p>
                                <Link href="/shop">
                                    <button className="bg-primary text-white px-8 py-3.5 uppercase text-xs tracking-[0.2em] font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300">
                                        View All Collections
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className={`grid ${gridCols} gap-3 md:gap-4 lg:gap-x-6 lg:gap-y-12`}>
                            {products.map((product, index) => (
                                <div
                                    key={product.id}
                                    className={`animate-fade-in-up stagger-${Math.min(index % 6 + 1, 6)}`}
                                >
                                    <ProductCard
                                        id={product.id}
                                        name={product.name}
                                        price={product.finalPrice ? parseFloat(product.finalPrice.toString()) : parseFloat(product.price.toString())}
                                        originalPrice={product.finalPrice ? parseFloat(product.price.toString()) : undefined}
                                        discountPercentage={product.discount && product.discountType === 'PERCENTAGE' ? parseFloat(product.discount.toString()) : undefined}
                                        image={product.images[0]?.url || "/images/placeholder.jpg"}
                                        category={product.category.name}
                                        isNew={(product as any).isNewArrival}
                                        isWishlisted={wishlistedProductIds.has(product.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
