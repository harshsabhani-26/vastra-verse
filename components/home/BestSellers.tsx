import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getBestSellers } from "@/lib/data/products";
import { AddToCartButton } from "@/components/home/AddToCartButton";

export async function BestSellers() {
    const products = await getBestSellers();

    // Only show products added via admin panel — no placeholders
    if (products.length === 0) return null;

    const displayProducts = products.slice(0, 8);

    return (
        <section className="w-full pt-[30px] pb-[40px] md:pt-[40px] md:pb-[80px] bg-white">
            <div className="container mx-auto px-4 md:px-[24px]">
                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-[24px] md:mb-[40px]">
                    <h3 className="w-full font-serif text-[26px] md:text-[38px] text-[#172026] uppercase leading-[1.3] text-center font-semibold">
                        Best Selling
                    </h3>
                </div>

                {/* Product Slider (Mobile) / Grid (Desktop) */}
                <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-x-[16px] px-[16px] -mx-[16px] md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-x-[40px] md:gap-y-[64px] pb-4 md:pb-0 md:px-0 md:mx-0">
                    {displayProducts.map((product: any) => (
                        <div key={product.id} className="group flex flex-col min-w-[240px] max-w-[240px] w-[65vw] snap-start shrink-0 md:w-auto md:min-w-0 md:max-w-none">
                            {/* Image Card */}
                            <Link
                                href={`/shop/${product.id}`}
                                className="relative w-full aspect-[1.85/3] overflow-hidden bg-[#e8e4df] mb-[20px] block"
                            >
                                {product.images?.[0] ? (
                                    <Image
                                        src={product.images[0].url}
                                        alt={product.images[0].alt || product.name}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                        className="object-cover object-top"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                                        No Image
                                    </div>
                                )}

                                {/* Dark overlay on hover */}
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Add to Cart button - slides up from bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-[16px] translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out z-10">
                                    <AddToCartButton
                                        productId={product.id}
                                        productName={product.name}
                                        productPrice={product.finalPrice ? parseFloat(product.finalPrice.toString()) : parseFloat(product.price.toString())}
                                        productImage={product.images?.[0]?.url || '/placeholder.jpg'}
                                    />
                                </div>
                            </Link>

                            {/* Product Info */}
                            <div className="flex flex-col items-start text-left">
                                {/* Badge */}
                                {product.isBestSeller && (
                                    <span className="inline-block bg-[#fff8e6] text-[#b8860b] text-[11px] font-sans font-normal px-[10px] py-[3px] rounded-full mb-[6px] border border-[#e6cc80]">
                                        Best Seller
                                    </span>
                                )}

                                {/* Product Name */}
                                <Link href={`/shop/${product.id}`}>
                                    <h3 className="font-sans text-[14px] md:text-[15px] text-[#172026] font-medium leading-[1.4] mb-[6px] line-clamp-2 hover:text-primary transition-colors">
                                        {product.name}
                                    </h3>
                                </Link>

                                {/* Price */}
                                <div className="flex items-center gap-[6px]">
                                    <span className="font-sans text-[15px] md:text-[16px] font-bold text-[#172026]">
                                        ₹{product.finalPrice ? parseFloat(product.finalPrice.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : parseFloat(product.price.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All CTA */}
                <div className="mt-[32px] md:mt-[48px] flex justify-center">
                    <Link href="/collections" className="inline-block">
                        <Button
                            variant="outline"
                            className="h-[44px] px-[32px] bg-transparent border-[1.5px] border-text-main text-text-main hover:bg-text-main hover:text-white font-sans text-[13px] font-bold tracking-wide uppercase transition-colors rounded-none"
                        >
                            View All Collections
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
