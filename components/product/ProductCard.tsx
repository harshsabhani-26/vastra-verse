import Image from "next/image";
import Link from "next/link";
import { WishlistToggle } from "@/components/product/WishlistToggle";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
    id: string;
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
    name,
    price,
    originalPrice,
    discountPercentage,
    image,
    category,
    isNew,
    isWishlisted
}: ProductCardProps) {
    return (
        <div className="group relative block">
            <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                {isNew && (
                    <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[10px] uppercase tracking-wider px-2 py-1">
                        New Arrival
                    </span>
                )}
                {discountPercentage && discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] uppercase tracking-wider px-2 py-1" style={{ top: isNew ? '2.5rem' : '0.5rem' }}>
                        -{discountPercentage}%
                    </span>
                )}
                <WishlistToggle
                    productId={id}
                    initialIsWishlisted={isWishlisted}
                    className="absolute top-2 right-2"
                />

                <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Quick Add Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button className="w-full bg-white text-primary hover:bg-primary hover:text-white font-serif uppercase tracking-widest text-xs">
                        Quick View
                    </Button>
                </div>
            </div>

            <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-stone-500 uppercase tracking-wide">{category}</p>
                <h3 className="text-sm font-medium text-text-main font-serif">
                    <Link href={`/shop/${id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {name}
                    </Link>
                </h3>
                <div className="flex items-center justify-center gap-2">
                    {originalPrice && originalPrice > price ? (
                        <>
                            <p className="text-sm font-medium text-primary">
                                ₹{price.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-stone-400 line-through">
                                ₹{originalPrice.toLocaleString('en-IN')}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm font-medium text-primary">
                            ₹{price.toLocaleString('en-IN')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
