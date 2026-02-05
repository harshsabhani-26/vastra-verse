"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FeaturedCollection() {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 max-w-[1440px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <div className="relative h-[600px] lg:h-[700px] w-full overflow-hidden shadow-luxury">
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                            style={{ backgroundImage: "url('/images/feature-1.png')" }}
                        />
                    </div>

                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8 px-4 lg:px-0">
                        <span className="text-secondary text-sm tracking-[0.25em] uppercase font-medium">The Royal Collection</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary leading-tight">
                            Timeless Elegance <br /> Reimagined
                        </h2>
                        <p className="text-text-muted text-base font-light font-sans leading-relaxed max-w-lg">
                            Discover our exclusive range of hand-embroidered masterpieces,
                            crafted for those who seek royalty in every fold. An ode to the
                            artisans of Rajasthan.
                        </p>
                        <Link href="/collections/royal">
                            <Button className="bg-primary text-white hover:bg-primary-light hover:shadow-elevated px-10 h-14 text-sm uppercase tracking-[0.2em] rounded-sm transition-all duration-300">
                                Shop The Look
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
