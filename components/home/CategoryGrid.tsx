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
    // Display up to 4 categories
    const displayCategories = categories.slice(0, 4);

    return (
        <section className="py-12 md:py-16 bg-background">
            <div className="mx-auto px-4 max-w-[1440px] w-full">
                {/* Section Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <h2 className="heading-lg text-primary uppercase mb-4 tracking-widest">
                        Shop By Category
                    </h2>
                    <p className="text-text-muted text-base tracking-widest max-w-2xl mx-auto font-light">
                        Discover Curated Collections of Handcrafted Heritage
                    </p>
                </div>

                {/* 3-Column Grid with Larger Images */}
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
                    {displayCategories.slice(0, 3).map((cat, index) => {
                        return (
                            <Link
                                key={cat.id}
                                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                className={`group flex flex-col items-center text-center animate-fade-in-up stagger-${index + 1}`}
                            >
                                {/* Category Image - Enhanced */}
                                <div className="relative w-full aspect-[3/4] overflow-hidden mb-8 bg-secondary/10 shadow-soft group-hover:shadow-elevated transition-all duration-500">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out group-hover:scale-105"
                                        style={{
                                            backgroundImage: `url(${cat.image || '/placeholder-category.jpg'})`
                                        }}
                                    />
                                    {/* Subtle overlay on hover */}
                                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                {/* Category Name */}
                                <h3 className="text-lg md:text-xl font-serif text-primary uppercase tracking-[0.2em] group-hover:text-secondary transition-all duration-300">
                                    {cat.name}
                                </h3>
                                <div className="mt-3 w-0 group-hover:w-16 h-[1px] bg-secondary transition-all duration-500 ease-out" />
                            </Link>
                        );
                    })}
                </div>

                {/* View All CTA */}
                <div className="mt-8 text-center">
                    <Link href="/collections">
                        <Button
                            variant="outline"
                            className="h-12 px-12 border-primary/20 text-primary hover:bg-primary hover:text-white hover:border-primary uppercase tracking-[0.2em] text-xs min-w-[240px] transition-all duration-300 font-medium rounded-sm"
                        >
                            View All Categories
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
