import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductDetails } from "@/components/product/ProductDetails";

// Cache product pages and revalidate every 5 minutes
export const revalidate = 300;

const BASE_URL = "https://vastraaverse.in";

// ── Helper: build a SEO-optimised, unique meta description ──────────────────
function buildMetaDescription(product: {
    name: string;
    fabricType?: string | null;
    occasions?: string[];
    shortDescription?: string | null;
    description?: string | null;
    category?: { name: string } | null;
}): string {
    // Prefer a hand-crafted short description if the editor filled it in
    if (product.shortDescription && product.shortDescription.length >= 80) {
        return product.shortDescription.slice(0, 155);
    }

    // Auto-generate from structured fields
    const fabric = product.fabricType ? `${product.fabricType} ` : "";
    const occasions =
        product.occasions && product.occasions.length > 0
            ? `, perfect for ${product.occasions.slice(0, 2).join(" & ")}`
            : "";
    const category = product.category?.name ? ` ${product.category.name}` : "";

    const generated = `${product.name} — ${fabric}saree${occasions}. Shop our premium${category} collection at Vastraa Verse. Free shipping available.`;

    return generated.slice(0, 155);
}

// ── FIX 5 + FIX 6: generateMetadata for canonical + unique description ──────
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;

    const product = await prisma.product.findUnique({
        where: { id },
        select: {
            name: true,
            shortDescription: true,
            description: true,
            fabricType: true,
            occasions: true,
            images: {
                where: { type: "MAIN" },
                take: 1,
                select: { url: true },
            },
            category: { select: { name: true } },
        },
    });

    if (!product) {
        return {
            title: "Product Not Found | Vastraa Verse",
        };
    }

    const description = buildMetaDescription(product);
    const imageUrl = product.images[0]?.url ?? null;

    return {
        title: `${product.name} | Vastraa Verse`,
        description,
        // FIX 5 — Canonical tag (absolute URL, no trailing slash, non-www)
        alternates: {
            canonical: `${BASE_URL}/shop/${id}`,
        },
        // Open Graph for social share cards
        openGraph: {
            title: `${product.name} | Vastraa Verse`,
            description,
            url: `${BASE_URL}/shop/${id}`,
            siteName: "Vastraa Verse",
            images: imageUrl
                ? [
                      {
                          url: imageUrl,
                          alt: product.name,
                      },
                  ]
                : undefined,
            type: "website",
        },
    };
}

export default async function ProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await auth();

    const product = await prisma.product.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            finalPrice: true,
            discount: true,
            stock: true,
            sku: true,
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
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
            images: {
                orderBy: { position: "asc" },
                select: {
                    id: true,
                    url: true,
                    alt: true,
                    type: true,
                },
            },
        },
    });

    // Check wishlist status
    let isWishlisted = false;
    if (session?.user?.id && product) {
        const wishlistItem = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: product.id,
                },
            },
        });
        isWishlisted = !!wishlistItem;
    }

    if (!product) {
        notFound();
    }

    // ── FIX 2: Product JSON-LD (structured data) ─────────────────────────────
    const displayPrice = product.finalPrice
        ? parseFloat(product.finalPrice.toString())
        : parseFloat(product.price.toString());

    // All image URLs must be absolute for Google to crawl them
    const absoluteImageUrls = product.images
        .filter((img) => img.type === "MAIN" || img.type === "HOVER")
        .map((img) => {
            if (img.url.startsWith("http")) return img.url;
            return `${BASE_URL}${img.url}`;
        });

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: product.sku ?? product.id,
        image: absoluteImageUrls.length > 0 ? absoluteImageUrls : undefined,
        brand: {
            "@type": "Brand",
            name: "Vastraa Verse",
        },
        category: product.category?.name ?? "Saree",
        offers: {
            "@type": "Offer",
            url: `${BASE_URL}/shop/${product.id}`,
            priceCurrency: "INR",
            price: displayPrice.toFixed(2),
            availability:
                product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
                "@type": "Organization",
                name: "Vastraa Verse",
            },
        },
    };

    // ── FIX 4: BreadcrumbList JSON-LD ────────────────────────────────────────
    const breadcrumbItems = [
        { name: "Home", url: BASE_URL },
        { name: "Shop", url: `${BASE_URL}/shop` },
    ];

    if (product.category) {
        breadcrumbItems.push({
            name: product.category.name,
            url: `${BASE_URL}/shop?category=${encodeURIComponent(product.category.slug)}`,
        });
    }

    breadcrumbItems.push({
        name: product.name,
        url: `${BASE_URL}/shop/${product.id}`,
    });

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };

    return (
        <div className="min-h-screen bg-background">
            {/* FIX 2 + FIX 4: Structured data (JSON-LD) injected in page body */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* Breadcrumb / Top Bar */}
            <div className="hidden md:block border-b border-primary/10">
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
