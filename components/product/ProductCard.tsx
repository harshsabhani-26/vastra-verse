import Image from "next/image";
import Link from "next/link";
import { WishlistToggle } from "@/components/product/WishlistToggle";
import { ShareButton } from "@/components/product/ShareButton";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
    id: string;
    /** Clean URL slug, e.g. "embrodery-saree" */
    slug?: string;
    /** Category slug, e.g. "saree/embroidery-saree" — used to build /shop/[cat]/[product] */
    categorySlug?: string;
    name: string;
    price: number;
    image: string;
    category: string;
    originalPrice?: number;
    discountPercentage?: number;
    isNew?: boolean;
    isWishlisted?: boolean;
}

export function ProductCard({
    id,
    slug,
    categorySlug,
    name,
    price,
    originalPrice,
    discountPercentage,
    image,
    category,
    isNew,
    isWishlisted
}: ProductCardProps) {
    // Auto-generate a slug from name when DB slug is missing
    const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const productUrlSlug = slug || slugify(name);
    const href = categorySlug ? `/shop/${categorySlug}/${productUrlSlug}` : `/shop/${id}`;
    return (
        <div className="group relative block animate-fade-in-up">
            <div className="relative aspect-[3/4] overflow-hidden bg-secondary/5 shadow-soft group-hover:shadow-elevated transition-all duration-700 ease-out">
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {isNew && (
                        <span className="bg-primary text-white text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium shadow-sm animate-fade-in">
                            New
                        </span>
                    )}
                    {discountPercentage && discountPercentage > 0 ? (
                        <span className="bg-white text-primary text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium shadow-sm border border-primary/10 animate-fade-in">
                            -{discountPercentage}%
                        </span>
                    ) : null}
                </div>

                {/* Wishlist + Share – stacked top-right */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-center">
                    <WishlistToggle
                        productId={id}
                        initialIsWishlisted={isWishlisted}
                        className="transition-transform duration-300 hover:scale-110 text-primary hover:text-secondary"
                    />
                    <ShareButton
                        productName={name}
                        productId={id}
                        iconOnly
                    />
                </div>

                {/* Product Image */}
                <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Quick View Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
                    <Link href={href}>
                        <Button className="w-full bg-white/95 text-primary hover:bg-primary hover:text-white border border-primary/10 shadow-lg text-xs uppercase tracking-[0.2em] h-10 font-medium transition-all duration-300">
                            Quick View
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Product Info */}
            <div className="mt-5 text-center space-y-2">
                <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-medium transition-colors group-hover:text-primary/70">{category}</p>
                <h3 className="text-base font-medium text-primary font-serif line-clamp-2 px-2 group-hover:text-secondary transition-colors duration-300">
                    <Link href={href}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {name}
                    </Link>
                </h3>
                <div className="flex items-center justify-center gap-3 pt-1">
                    {originalPrice && originalPrice > price ? (
                        <>
                            <p className="text-xs text-text-muted line-through font-light">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </p>
                            <p className="text-base font-medium text-primary">
                                ₹{price.toLocaleString('en-IN')}
                            </p>
                        </>
                    ) : (
                        <p className="text-base font-medium text-primary">
                            ₹{price.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
