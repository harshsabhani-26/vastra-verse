"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CategoryGridProps {
    categories: {
        id: string;
        name: string;
        image: string | null;
        slug: string;
    }[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
    return (
        <section className="py-20 bg-[#F9F8F4]">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif text-primary tracking-wide uppercase">Shop By Category</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {categories.slice(0, 3).map((cat) => (
                        <div key={cat.id} className="group relative h-[600px] overflow-hidden cursor-pointer">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url(${cat.image || '/placeholder-category.jpg'})` }}
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />

                            <div className="absolute bottom-10 left-0 right-0 text-center">
                                <h3 className="text-white text-2xl font-serif tracking-widest mb-4 uppercase drop-shadow-md">
                                    {cat.name}
                                </h3>
                                <Link href={`/shop?category=${encodeURIComponent(cat.name)}`}>
                                    <span className="inline-block border-b border-white text-white text-sm uppercase tracking-widest pb-1 hover:text-stone-200 transition-colors">
                                        Explore
                                    </span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
