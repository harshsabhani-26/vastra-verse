"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FeaturedCollection() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="relative h-[700px] w-full overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: "url('/images/feature-1.png')" }}
                        />
                    </div>

                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left space-y-8 px-4 lg:px-12">
                        <span className="text-primary text-sm tracking-[0.2em] uppercase">The Royal Collection</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-primary leading-tight">
                            Timeless Elegance <br /> Reimagined
                        </h2>
                        <p className="text-stone-600 font-sans leading-relaxed max-w-md">
                            Discover our exclusive range of hand-embroidered masterpieces,
                            crafted for those who seek royalty in every fold. An ode to the
                            artisans of Rajasthan.
                        </p>
                        <Link href="/collections/royal">
                            <Button variant="gold" className="h-14 px-8 text-sm uppercase tracking-widest min-w-[180px]">
                                Shop The Look
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
