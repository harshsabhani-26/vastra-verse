import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getNewArrivals } from "@/lib/data/products";

export async function NewArrivals() {
    const products = await getNewArrivals();

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="py-10 md:py-12 lg:py-16 bg-background">
            <div className="container mx-auto px-4 max-w-[1440px]">
                {/* Editorial Section Header */}
                <div className="flex flex-col items-center text-center mb-10 space-y-4">
                    <span className="text-secondary text-xs tracking-[0.3em] uppercase font-medium">Fresh From The Loom</span>
                    <h2 className="heading-lg text-primary uppercase mb-4 tracking-widest">
                        New Arrivals
                    </h2>
                    <div className="h-[1px] w-24 bg-primary/20 mt-2" />
                </div>

                {/* Editorial Product Grid - 3:4 Portrait Format */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {products.map((product, index) => (
                        <Link
                            key={product.id}
                            href={`/shop/${product.id}`}
                            className="group cursor-pointer"
                        >
                            {/* Controlled Portrait Image Container */}
                            <div className="relative aspect-[3/4] overflow-hidden bg-secondary/5 mb-6 shadow-soft group-hover:shadow-elevated transition-all duration-500">
                                {product.images[0] ? (
                                    <Image
                                        src={product.images[0].url}
                                        alt={product.images[0].alt || product.name}
                                        fill
                                        priority={index < 3}
                                        loading={index < 3 ? undefined : "lazy"}
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                ) : (
                                    <Image
                                        src="https://images.unsplash.com/photo-1610189012906-47833cc180bb?auto=format&fit=crop&q=80&w=800"
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    />
                                )}

                                {/* New Badge - Always show for new arrivals */}
                                <div className="absolute top-4 left-4 bg-primary text-white text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 font-medium shadow-sm">
                                    New
                                </div>

                                {/* Subtle Hover Overlay */}
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                {/* Refined View Details Button */}
                                <div className="absolute bottom-6 left-6 right-6 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                    <Button className="w-full bg-white/95 text-primary hover:bg-white hover:text-secondary border border-primary/5 shadow-lg text-xs uppercase tracking-[0.2em] h-10 font-medium">
                                        View Details
                                    </Button>
                                </div>
                            </div>

                            {/* Refined Product Info */}
                            <div className="text-center space-y-2">
                                <p className="text-xs md:text-[10px] text-text-muted uppercase tracking-[0.2em] font-medium">
                                    {product.category.name}
                                </p>
                                <h3 className="font-serif text-lg text-primary group-hover:text-secondary transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <div className="flex items-center justify-center gap-3 pt-1">
                                    {product.discount && Number(product.discount) > 0 ? (
                                        <>
                                            <span className="text-text-muted line-through text-sm font-light">
                                                ₹{parseFloat(product.price.toString()).toLocaleString()}
                                            </span>
                                            <span className="text-primary font-medium text-base">
                                                ₹{product.finalPrice ? parseFloat(product.finalPrice.toString()).toLocaleString() : parseFloat(product.price.toString()).toLocaleString()}
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-primary font-medium text-base">
                                            ₹{parseFloat(product.price.toString()).toLocaleString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All CTA */}
                <div className="mt-8 text-center">
                    <Link href="/shop?sort=newest">
                        <Button
                            variant="outline"
                            className="h-12 px-12 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary uppercase tracking-[0.2em] text-xs min-w-[240px] transition-all duration-300 font-medium rounded-sm"
                        >
                            View All New Arrivals
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
