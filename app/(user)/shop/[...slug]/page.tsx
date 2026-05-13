import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductDetails } from "@/components/product/ProductDetails";
import { ProductCard } from "@/components/product/ProductCard";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// ISR — revalidate every 5 minutes
export const revalidate = 300;

const BASE_URL = "https://vastraaverse.in";

// ── Cached Data Fetchers ─────────────────────────────────────────────────────
// cache() dedupes during the same render pass (e.g. metadata + page)
// unstable_cache() stores the result in Next.js Data Cache across requests
export const getCachedCategory = cache(
    (categorySlug: string) => unstable_cache(
        async () => {
            return prisma.category.findFirst({
                where: { slug: { equals: categorySlug, mode: "insensitive" } },
                select: { id: true, name: true, slug: true, description: true },
            });
        },
        [`category-${categorySlug}`],
        { revalidate: 60, tags: ['categories'] }
    )()
);

export const getCachedProducts = cache(
    (categorySlug: string) => unstable_cache(
        async () => {
            return prisma.product.findMany({
                where: {
                    status: "PUBLISHED",
                    category: {
                        OR: [
                            { slug: { equals: categorySlug, mode: "insensitive" } },
                            { slug: { startsWith: `${categorySlug}/`, mode: "insensitive" } },
                        ],
                    },
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    price: true,
                    finalPrice: true,
                    discount: true,
                    discountType: true,
                    isNewArrival: true,
                    category: { select: { name: true, slug: true } },
                    images: {
                        where: { type: "MAIN" },
                        take: 1,
                        select: { url: true, alt: true },
                    },
                },
            });
        },
        [`products-${categorySlug}`],
        { revalidate: 60, tags: ['products'] }
    )()
);

export const getCachedProductDetails = cache(
    (productSlug: string, categorySlug: string) => unstable_cache(
        async () => {
            return prisma.product.findFirst({
                where: {
                    slug: productSlug,
                    category: { slug: { equals: categorySlug, mode: "insensitive" } },
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    finalPrice: true,
                    discount: true,
                    discountType: true,
                    stock: true,
                    sku: true,
                    slug: true,
                    fabricType: true,
                    weaveType: true,
                    careInstructions: true,
                    isNewArrival: true,
                    isBestSeller: true,
                    categoryId: true,
                    colors: true,
                    occasions: true,
                    borderDescription: true,
                    palluDescription: true,
                    blouseFabric: true,
                    hasBlousePiece: true,
                    shortDescription: true,
                    sareeLength: true,
                    blouseLength: true,
                    updatedAt: true,
                    category: {
                        select: { id: true, name: true, slug: true },
                    },
                    images: {
                        orderBy: { position: "asc" },
                        select: { id: true, url: true, alt: true, type: true },
                    },
                },
            });
        },
        [`product-${categorySlug}-${productSlug}`],
        { revalidate: 60, tags: ['products'] }
    )()
);

// ── generateStaticParams ─────────────────────────────────────────────────────
// Pre-renders all active category pages and all published product pages at
// build time so Google gets instant HTML responses (no server-render delay).
export async function generateStaticParams() {
    const paths: { slug: string[] }[] = [];

    try {
        // Category pages — slug like "saree/embroidery-saree" → ["saree", "embroidery-saree"]
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            select: { slug: true },
        });

        for (const cat of categories) {
            paths.push({ slug: cat.slug.split("/") });
        }

        // Product pages — slug like "saree/embroidery-saree" + product.slug
        // → ["saree", "embroidery-saree", "embrodery-saree"]
        const products = await prisma.product.findMany({
            where: {
                status: "PUBLISHED",
                slug: { not: null },
            },
            select: {
                slug: true,
                category: { select: { slug: true } },
            },
        });

        for (const product of products) {
            if (product.slug && product.category?.slug) {
                paths.push({
                    slug: [...product.category.slug.split("/"), product.slug],
                });
            }
        }
    } catch {
        // DB unavailable at build time — fall back to SSR
    }

    return paths;
}

// ── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
    const { slug } = await params;

    // ── Product page (2+ segments: category/product-slug or parent/category/product-slug) ──
    if (slug.length >= 2) {
        const productSlug = slug[slug.length - 1];
        const categorySlug = slug.slice(0, -1).join("/");
        const canonicalUrl = `${BASE_URL}/shop/${categorySlug}/${productSlug}`;

        // ✅ Reuse the cached fetcher — no duplicate DB query
        const product = await getCachedProductDetails(productSlug, categorySlug);

        if (product) {
            const desc = buildProductDescription(product);
            const imageUrl = product.images[0]?.url ?? null;

            return {
                title: `${product.name} | Vastraa Verse`,
                description: desc,
                alternates: { canonical: canonicalUrl },
                openGraph: {
                    title: `${product.name} | Vastraa Verse`,
                    description: desc,
                    url: canonicalUrl,
                    siteName: "Vastraa Verse",
                    images: imageUrl ? [{ url: imageUrl, alt: product.name }] : undefined,
                    type: "website",
                },
            };
        }
        // Not a product — fall through to category metadata
    }

    // ── Category page (1–2 segments: saree or saree/embroidery-saree) ────────
    const categorySlug = slug.join("/");
    const category = await prisma.category.findFirst({
        where: { slug: { equals: categorySlug, mode: "insensitive" } },
        select: { name: true, description: true },
    });

    let categoryName = category?.name;
    let description = category?.description;

    if (!category) {
        const mainCategory = await prisma.mainCategory.findFirst({
            where: {
                OR: [
                    { href: { equals: `/shop/${categorySlug}`, mode: "insensitive" } },
                    { name: { equals: categorySlug, mode: "insensitive" } }
                ]
            }
        });
        if (mainCategory) {
            categoryName = mainCategory.name;
        }
    }

    categoryName = categoryName ?? slug[slug.length - 1];
    const canonicalUrl = `${BASE_URL}/shop/${categorySlug}`;

    return {
        title: `${categoryName} | Shop Sarees | Vastraa Verse`,
        description:
            description ??
            `Shop premium ${categoryName} at Vastraa Verse. Handcrafted sarees, free shipping available.`,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title: `${categoryName} | Vastraa Verse`,
            url: canonicalUrl,
            siteName: "Vastraa Verse",
            type: "website",
        },
    };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildProductDescription(product: {
    name: string;
    fabricType?: string | null;
    occasions?: string[];
    shortDescription?: string | null;
    description?: string | null;
    category?: { name: string } | null;
}): string {
    if (product.shortDescription && product.shortDescription.length >= 80) {
        return product.shortDescription.slice(0, 155);
    }
    const fabric = product.fabricType ? `${product.fabricType} ` : "";
    const occasions =
        product.occasions && product.occasions.length > 0
            ? `, perfect for ${product.occasions.slice(0, 2).join(" & ")}`
            : "";
    const category = product.category?.name ? ` ${product.category.name}` : "";
    return `${product.name} — ${fabric}saree${occasions}. Shop our premium${category} collection at Vastraa Verse. Free shipping available.`.slice(
        0,
        155
    );
}

// ── Page component ─────────────────────────────────────────────────────────
export default async function ShopSlugPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;
    const session = await auth();

    // ── PRODUCT PAGE (2+ segments: /shop/sarees/product-slug) ─────────────────
    if (slug.length >= 2) {
        const productSlug = slug[slug.length - 1];
        const categorySlug = slug.slice(0, -1).join("/");

        // Helper: generate slug from name (mirrors ProductCard logic)
        const slugify = (str: string) =>
            str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

        const productSelect = {
            id: true,
            name: true,
            description: true,
            price: true,
            finalPrice: true,
            discount: true,
            discountType: true,
            stock: true,
            sku: true,
            slug: true,
            fabricType: true,
            weaveType: true,
            careInstructions: true,
            isNewArrival: true,
            isBestSeller: true,
            categoryId: true,
            colors: true,
            occasions: true,
            borderDescription: true,
            palluDescription: true,
            blouseFabric: true,
            hasBlousePiece: true,
            shortDescription: true,
            sareeLength: true,
            blouseLength: true,
            updatedAt: true,
            category: {
                select: { id: true, name: true, slug: true },
            },
            images: {
                orderBy: { position: "asc" as const },
                select: { id: true, url: true, alt: true, type: true },
            },
        };

        // 1️⃣ Try cached exact slug match first
        let product = await getCachedProductDetails(productSlug, categorySlug);

        // 2️⃣ Fallback: find by name-derived slug (for legacy products without a slug in DB)
        // Uses a targeted query — NOT a full category scan
        if (!product) {
            const fallback = await prisma.product.findFirst({
                where: {
                    category: { slug: { equals: categorySlug, mode: "insensitive" } },
                    slug: null, // only products without a slug need this fallback
                },
                select: productSelect,
            });
            if (fallback && slugify(fallback.name) === productSlug) {
                product = fallback;
            }
        }

        if (product) {
            // ✅ Parallelise: wishlist check fires simultaneously with product data
            const [isWishlistedResult] = await Promise.all([
                session?.user?.id
                    ? prisma.wishlist.findUnique({
                          where: {
                              userId_productId: {
                                  userId: session.user.id,
                                  productId: product.id,
                              },
                          },
                      })
                    : Promise.resolve(null),
            ]);
            const isWishlisted = !!isWishlistedResult;

        const displayPrice = product.finalPrice
            ? parseFloat(product.finalPrice.toString())
            : parseFloat(product.price.toString());

        const absoluteImageUrls = product.images
            .filter((img) => img.type === "MAIN" || img.type === "FRONT_VIEW")
            .map((img) => (img.url.startsWith("http") ? img.url : `${BASE_URL}${img.url}`));

        const productJsonLd = {
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.sku ?? product.id,
            image: absoluteImageUrls.length > 0 ? absoluteImageUrls : undefined,
            brand: { "@type": "Brand", name: "Vastraa Verse" },
            category: product.category?.name ?? "Saree",
            offers: {
                "@type": "Offer",
                url: `${BASE_URL}/shop/${categorySlug}/${productSlug}`,
                priceCurrency: "INR",
                price: displayPrice.toFixed(2),
                availability:
                    product.stock > 0
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                seller: { "@type": "Organization", name: "Vastraa Verse" },
            },
        };

        const breadcrumbJsonLd = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
                { "@type": "ListItem", position: 2, name: "Shop", item: `${BASE_URL}/shop` },
                ...(product.category
                    ? [
                          {
                              "@type": "ListItem",
                              position: 3,
                              name: product.category.name,
                              // FIX: clean URL — was /shop?category=...
                              item: `${BASE_URL}/shop/${product.category.slug}`,
                          },
                      ]
                    : []),
                {
                    "@type": "ListItem",
                    position: product.category ? 4 : 3,
                    name: product.name,
                    item: `${BASE_URL}/shop/${categorySlug}/${productSlug}`,
                },
            ],
        };

            return (
                <div className="min-h-screen bg-background">
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
                    />
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
                    />

                    {/* Breadcrumb */}
                    <div className="hidden md:block border-b border-primary/10">
                        <div className="container mx-auto px-4 md:px-8 py-4">
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted">
                                <Link href="/">Home</Link>
                                <span>|</span>
                                <Link href="/shop">Shop</Link>
                                {product.category && (
                                    <>
                                        <span>|</span>
                                        <Link href={`/shop/${product.category.slug}`}>
                                            {product.category.name}
                                        </Link>
                                    </>
                                )}
                                <span>|</span>
                                <span className="text-primary">{product.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 md:px-8 py-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
                            <div>
                                <ProductImageGallery
                                    images={product.images || []}
                                    productName={product.name}
                                />
                            </div>
                            <div>
                                <ProductDetails
                                    product={{
                                        ...product,
                                        price: product.price ? product.price.toString() : null,
                                        finalPrice: product.finalPrice
                                            ? product.finalPrice.toString()
                                            : null,
                                        discount: product.discount
                                            ? product.discount.toString()
                                            : null,
                                    }}
                                    initialIsWishlisted={isWishlisted}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        // Not a product page — fall through to category page logic
    }

    // ── CATEGORY PAGE (1–2 segments: /shop/saree or /shop/saree/embroidery-saree) ─
    const categorySlug = slug.join("/");

    const mainCategory = slug.length === 1 ? await prisma.mainCategory.findFirst({
        where: {
            OR: [
                { href: { equals: `/shop/${categorySlug}`, mode: "insensitive" } },
                { name: { equals: categorySlug, mode: "insensitive" } }
            ]
        }
    }) : null;

    let category: any = await prisma.category.findFirst({
        where: { slug: { equals: categorySlug, mode: "insensitive" } },
        select: { id: true, name: true, slug: true, description: true },
    });

    const isMainCategoryPage = !!mainCategory && slug.length === 1;

    if (isMainCategoryPage) {
        category = {
            id: mainCategory.id,
            name: mainCategory.name,
            slug: categorySlug,
            description: null,
        };
    } else if (!category) {
        if (slug.length === 1) {
            // Check if it's a legacy product ID link
            const legacyProduct = await prisma.product.findUnique({
                where: { id: slug[0] },
                select: {
                    id: true, name: true, description: true, price: true,
                    finalPrice: true, discount: true, discountType: true,
                    stock: true, sku: true, slug: true, fabricType: true,
                    weaveType: true, careInstructions: true, isNewArrival: true,
                    isBestSeller: true, categoryId: true, colors: true,
                    occasions: true, borderDescription: true, palluDescription: true,
                    blouseFabric: true, hasBlousePiece: true, shortDescription: true,
                    sareeLength: true, blouseLength: true, updatedAt: true,
                    category: { select: { id: true, name: true, slug: true } },
                    images: { orderBy: { position: "asc" }, select: { id: true, url: true, alt: true, type: true } },
                },
            });
            if (legacyProduct) {
                // If it has a proper slug, redirect to canonical URL
                if (legacyProduct.slug && legacyProduct.category?.slug) {
                    redirect(`/shop/${legacyProduct.category.slug}/${legacyProduct.slug}`);
                }
                // No slug — render the product page directly from ID
                let isWishlisted = false;
                if (session?.user?.id) {
                    const wl = await prisma.wishlist.findUnique({
                        where: { userId_productId: { userId: session.user.id, productId: legacyProduct.id } },
                    });
                    isWishlisted = !!wl;
                }
                return (
                    <div className="min-h-screen bg-background">
                        <div className="hidden md:block border-b border-primary/10">
                            <div className="container mx-auto px-4 md:px-8 py-4">
                                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted">
                                    <Link href="/">Home</Link>
                                    <span>|</span>
                                    <Link href="/shop">Shop</Link>
                                    {legacyProduct.category && (
                                        <>
                                            <span>|</span>
                                            <Link href={`/shop/${legacyProduct.category.slug}`}>
                                                {legacyProduct.category.name}
                                            </Link>
                                        </>
                                    )}
                                    <span>|</span>
                                    <span className="text-primary">{legacyProduct.name}</span>
                                </div>
                            </div>
                        </div>
                        <div className="container mx-auto px-4 md:px-8 py-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
                                <div>
                                    <ProductImageGallery images={legacyProduct.images || []} productName={legacyProduct.name} />
                                </div>
                                <div>
                                    <ProductDetails
                                        product={{
                                            ...legacyProduct,
                                            price: legacyProduct.price?.toString() ?? null,
                                            finalPrice: legacyProduct.finalPrice?.toString() ?? null,
                                            discount: legacyProduct.discount?.toString() ?? null,
                                        }}
                                        initialIsWishlisted={isWishlisted}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }
        }
        notFound();
    }

    let subCategories: { id: string; name: string; slug: string; image: string | null }[] = [];
    if (isMainCategoryPage) {
        subCategories = await prisma.category.findMany({
            where: {
                isActive: true,
                slug: { startsWith: `${categorySlug}/`, mode: "insensitive" },
            },
            orderBy: { displayOrder: "asc" },
            select: { id: true, name: true, slug: true, image: true },
        });
    }

    let wishlistedProductIds = new Set<string>();
    let products: {
        id: string;
        name: string;
        slug: string | null;
        price: any;
        finalPrice: any;
        discount: any;
        discountType: string | null;
        isNewArrival: boolean | null;
        category: { name: string; slug: string };
        images: { url: string; alt: string | null }[];
    }[] = [];

    if (!isMainCategoryPage) {
        // Wishlist for logged-in user
        if (session?.user?.id) {
            const wishlistItems = await prisma.wishlist.findMany({
                where: { userId: session.user.id },
                select: { productId: true },
            });
            wishlistedProductIds = new Set(wishlistItems.map((item) => item.productId));
        }

        products = await prisma.product.findMany({
            where: {
                status: "PUBLISHED",
                category: {
                    OR: [
                        { slug: { equals: categorySlug, mode: "insensitive" } },
                        { slug: { startsWith: `${categorySlug}/`, mode: "insensitive" } },
                    ],
                },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                finalPrice: true,
                discount: true,
                discountType: true,
                isNewArrival: true,
                category: { select: { name: true, slug: true } },
                images: {
                    where: { type: "MAIN" },
                    take: 1,
                    select: { url: true, alt: true },
                },
            },
        });
    }

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
            { "@type": "ListItem", position: 2, name: "Shop", item: `${BASE_URL}/shop` },
            {
                "@type": "ListItem",
                position: 3,
                name: category.name,
                item: `${BASE_URL}/shop/${categorySlug}`,
            },
        ],
    };

    return (
        <div className="min-h-screen bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 pb-2">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-4">
                    <Link href="/">Home</Link>
                    <span>|</span>
                    <Link href="/shop">Shop</Link>
                    <span>|</span>
                    <span className="text-primary">{category.name}</span>
                </div>

                {(category.description || isMainCategoryPage) && (
                    <h1 className="text-2xl md:text-3xl font-serif font-medium text-primary mb-2">
                        {category.name}
                    </h1>
                )}
                {!category.description && !isMainCategoryPage && (
                    <h1 className="sr-only">{category.name}</h1>
                )}
            </div>

            <div className="border-t border-primary/10">
                <div className="container mx-auto px-4 md:px-8 py-12">
                    {isMainCategoryPage ? (
                        subCategories.length === 0 ? (
                            <div className="text-center py-24 animate-fade-in">
                                <div className="max-w-md mx-auto space-y-6">
                                    <h2 className="text-2xl md:text-3xl text-primary font-serif font-medium">
                                        No sub-categories yet
                                    </h2>
                                    <p className="text-text-muted font-light leading-relaxed">
                                        Add sub-categories to show them here.
                                    </p>
                                    <Link href="/shop">
                                        <button className="bg-primary text-white px-8 py-3.5 uppercase text-xs tracking-[0.2em] font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300">
                                            View All Collections
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-x-6 lg:gap-y-10">
                                {subCategories.map((subCategory, index) => (
                                    <Link
                                        key={subCategory.id}
                                        href={`/shop/${subCategory.slug}`}
                                        className={`group animate-fade-in-up stagger-${Math.min(index % 6 + 1, 6)}`}
                                    >
                                        <div className="bg-white overflow-hidden border border-primary/10 shadow-soft">
                                            <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
                                                {subCategory.image ? (
                                                    <Image
                                                        src={subCategory.image}
                                                        alt={subCategory.name}
                                                        fill
                                                        loading="lazy"
                                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                        className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.04]"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="py-[12px] text-center px-[8px]">
                                                <h3 className="font-sans text-[15px] md:text-[17px] font-normal text-[#172026] leading-[1.3] group-hover:text-primary transition-colors">
                                                    {subCategory.name}
                                                </h3>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )
                    ) : products.length === 0 ? (
                        <div className="text-center py-32 animate-fade-in">
                            <div className="max-w-md mx-auto space-y-6">
                                <h2 className="text-2xl md:text-3xl text-primary font-serif font-medium">
                                    No products yet
                                </h2>
                                <p className="text-text-muted font-light leading-relaxed">
                                    We're adding new pieces to this collection soon.
                                </p>
                                <Link href="/shop">
                                    <button className="bg-primary text-white px-8 py-3.5 uppercase text-xs tracking-[0.2em] font-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300">
                                        View All Collections
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-x-6 lg:gap-y-12">
                            {products.map((product, index) => (
                                <div
                                    key={product.id}
                                    className={`animate-fade-in-up stagger-${Math.min(index % 6 + 1, 6)}`}
                                >
                                    <ProductCard
                                        id={product.id}
                                        slug={product.slug ?? undefined}
                                        categorySlug={product.category?.slug ?? undefined}
                                        name={product.name}
                                        price={
                                            product.finalPrice
                                                ? parseFloat(product.finalPrice.toString())
                                                : parseFloat(product.price.toString())
                                        }
                                        originalPrice={
                                            product.finalPrice
                                                ? parseFloat(product.price.toString())
                                                : undefined
                                        }
                                        discountPercentage={
                                            product.discount &&
                                            product.discountType === "PERCENTAGE"
                                                ? parseFloat(product.discount.toString())
                                                : undefined
                                        }
                                        image={
                                            product.images[0]?.url ||
                                            "/images/placeholder.jpg"
                                        }
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
