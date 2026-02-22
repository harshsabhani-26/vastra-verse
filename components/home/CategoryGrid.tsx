"use client";

import Link from "next/link";
import Image from "next/image";

interface CategoryGridProps {
    categories: {
        id: string;
        name: string;
        image: string | null;
        slug: string;
    }[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
    // Only show categories added via admin panel — no placeholders
    if (categories.length === 0) return null;

    const displayCategories = categories.slice(0, 8);

    return (
        <section className="w-full bg-bg-grey py-[30px] md:py-[50px]">
            <div className="container mx-auto px-4 md:px-[24px]">

                {/* Section Header */}
                <div className="flex flex-col items-center text-center mb-[24px] md:mb-[40px]">
                    <h3 className="w-full font-serif text-[26px] md:text-[38px] text-[#172026] uppercase leading-[1.3] text-center font-semibold">
                        Top Categories
                    </h3>
                </div>

                {/* Category Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-[16px] md:gap-[24px]">
                    {displayCategories.map((cat, index) => (
                        <Link
                            key={`${cat.id}-${index}`}
                            href={`/shop?category=${encodeURIComponent(cat.slug || cat.name.toLowerCase())}`}
                            className="group"
                        >
                            <div className="bg-white rounded-[8px] overflow-hidden border border-[#e5e5e5]">
                                {/* Portrait Image Container */}
                                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
                                    {cat.image ? (
                                        <Image
                                            src={cat.image}
                                            alt={cat.name}
                                            fill
                                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                            className="object-cover object-top group-hover:scale-[1.08] transition duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Category Name */}
                                <div className="px-[12px] py-[14px] md:py-[16px] text-center">
                                    <h3 className="font-sans text-[16px] md:text-[18px] font-medium text-[#172026] leading-[25px] group-hover:text-primary transition-colors">
                                        {cat.name}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
