import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { checkIpRateLimit } from "@/lib/rate-limit";
import { requireAdmin, unauthorizedResponse } from "@/lib/auth-utils";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { invalidateProducts } from "@/lib/cache-invalidation";

// GET /api/products - Public product listing with pagination
export async function GET(req: NextRequest) {
    // Rate Limiting (20 req/min for public routes)
    const rateLimitResult = await checkIpRateLimit(req, 'default');
    if (rateLimitResult instanceof NextResponse) {
        return rateLimitResult;
    }

    try {
        const { searchParams } = new URL(req.url);

        // Pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Filters
        const categoryId = searchParams.get("categoryId");
        const isNewArrival = searchParams.get("isNewArrival") === "true";
        const search = searchParams.get("search");

        const where: any = {
            status: "PUBLISHED", // Only show published products
        };

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (isNewArrival) {
            where.isNewArrival = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { category: { name: { contains: search, mode: "insensitive" } } },
            ];
        }

        // Use Redis cache for default (unfiltered) requests
        const isDefaultRequest = !categoryId && !isNewArrival && !search && page === 1 && limit === 20;
        const cacheKey = isDefaultRequest ? CACHE_KEYS.PRODUCTS_ALL : null;

        const fetchProducts = async () => {
            const [products, total] = await Promise.all([
                prisma.product.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        discount: true,
                        finalPrice: true,
                        shortDescription: true,
                        isFeatured: true,
                        isNewArrival: true,
                        isBestSeller: true,
                        stock: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                            }
                        },
                        images: {
                            where: { type: "MAIN" },
                            take: 1,
                            select: {
                                url: true,
                                alt: true,
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: limit,
                }),
                prisma.product.count({ where }),
            ]);
            return { products, total };
        };

        const result = cacheKey
            ? await cache.getOrSet(cacheKey, fetchProducts, CACHE_TTL.PRODUCTS_LIST)
            : await fetchProducts();

        const { products, total } = result;

        return NextResponse.json(
            {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasMore: page * limit < total,
                }
            },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                }
            }
        );
    } catch (error) {
        console.error("[PRODUCTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/products - Admin only: Create a new product
export async function POST(req: Request) {
    try {
        // SECURITY: Strict admin authentication check
        const adminCheck = await requireAdmin();
        if (!adminCheck.authorized) {
            return unauthorizedResponse(adminCheck.reason);
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

        const product = await prisma.product.create({
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
                colors,
                occasions,
                careInstructions,
                categoryId,
                images: {
                    create: imagesData.map((img: any, index: number) => ({
                        url: img.url,
                        type: img.type,
                        position: img.position !== undefined ? img.position : index,
                        width: img.width,
                        height: img.height,
                        fileSize: img.fileSize,
                    }))
                }
            },
            include: {
                images: true,
            }
        });

        // Invalidate in-memory/Redis cache AND Next.js unstable_cache
        await invalidateProducts();
        revalidateTag('products', {} as any);
        revalidateTag('new-arrivals', {} as any);
        revalidateTag('best-sellers', {} as any);

        return NextResponse.json(product);
    } catch (error) {
        console.error("[PRODUCTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
