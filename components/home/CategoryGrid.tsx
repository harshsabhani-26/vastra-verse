"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface CategoryGridProps {
    categories: {
        id: string;
        name: string;
        image: string | null;
        slug?: string;
        href?: string;
    }[];
}

const ITEMS_PER_PAGE = 4; // 2×2 per page on mobile

export function CategoryGrid({ categories }: CategoryGridProps) {
    const [currentPage, setCurrentPage] = useState(0);

    if (categories.length === 0) return null;

    const displayCategories = categories.slice(0, 8);

    // ------------ MOBILE: paginated 2×2 carousel ------------
    const totalPages = Math.ceil(displayCategories.length / ITEMS_PER_PAGE);
    const pageCategories = displayCategories.slice(
        currentPage * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE + ITEMS_PER_PAGE
    );

    // Shared card renderer
    const CategoryCard = ({ cat, index }: { cat: typeof displayCategories[0]; index: number }) => (
        <Link
            key={`${cat.id}-${index}`}
            href={cat.href || `/shop/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="group"
        >
            <div className="bg-white overflow-hidden">
                {/* Portrait Image */}
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50">
                    {cat.image ? (
                        <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            // First category is usually the LCP on homepage — load eagerly
                            {...(index === 0
                                ? { priority: true, loading: "eager" as const }
                                : { loading: "lazy" as const, decoding: "async" as const }
                            )}
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                            className="object-cover object-top group-hover:scale-[1.05] transition duration-300"
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
                <div className="py-[12px] text-center px-[8px]">
                    <h3 className="font-sans text-[15px] md:text-[18px] font-normal text-[#172026] leading-[1.3] group-hover:text-primary transition-colors">
                        {cat.name}
                    </h3>
                </div>
            </div>
        </Link>
    );

    return (
        <section className="w-full bg-bg-grey py-[30px] md:py-[50px]">

            {/* Section Header */}
            <div className="flex flex-col items-center text-center mb-[20px] md:mb-[40px] px-4">
                <h3 className="w-full font-serif text-[24px] md:text-[38px] text-[#172026] uppercase leading-[1.3] text-center font-semibold tracking-[0.05em]">
                    Top Categories
                </h3>
            </div>

            {/* ─── MOBILE: 2×2 paged carousel (hidden on md+) ─── */}
            <div className="md:hidden px-[12px]">
                {/* 2-column grid for current page */}
                <div className="grid grid-cols-2 gap-[8px]">
                    {pageCategories.map((cat, index) => (
                        <CategoryCard key={cat.id} cat={cat} index={index} />
                    ))}
                </div>

                {/* Pagination dots */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-[8px] mt-[16px]">
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                aria-label={`Go to page ${i + 1}`}
                                className={`rounded-full transition-all duration-300 ${i === currentPage
                                        ? "bg-[#172026] w-[22px] h-[8px] rounded-[4px]"
                                        : "bg-[#c5c5c5] w-[8px] h-[8px]"
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* View More Categories button */}
                <div className="mt-[20px] flex justify-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center justify-center border border-[#172026] text-[#172026] font-sans font-semibold text-[14px] tracking-wide px-[32px] h-[48px] hover:bg-[#172026] hover:text-white transition-colors"
                    >
                        View More Categories
                    </Link>
                </div>
            </div>

            {/* ─── DESKTOP: regular grid (hidden on mobile) ─── */}
            <div className="hidden md:block container mx-auto px-[24px]">
                <div className="grid grid-cols-3 md:grid-cols-4 gap-[24px]">
                    {displayCategories.map((cat, index) => (
                        <CategoryCard key={cat.id} cat={cat} index={index} />
                    ))}
                </div>
            </div>

        </section>
    );
}
