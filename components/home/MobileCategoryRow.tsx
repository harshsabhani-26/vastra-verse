"use client";

import Link from "next/link";
import Image from "next/image";

interface MobileCategoryRowProps {
    categories: {
        id: string;
        name: string;
        image: string | null;
        slug?: string;
        href?: string;
    }[];
}

export function MobileCategoryRow({ categories }: MobileCategoryRowProps) {
    if (!categories || categories.length === 0) return null;

    // Filter or reorder categories if you want, here we take all
    // Focus on exact design: circular icons, snap scrolling, right below header
    return (
        <div className="w-full bg-transparent md:hidden pt-[10px]">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-[16px] px-[16px] pb-[16px]">
                {categories.map((cat, idx) => (
                    <Link
                        key={cat.id}
                        href={cat.href || `/shop/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="flex flex-col items-center gap-[6px] min-w-[72px] max-w-[72px] snap-center cursor-pointer shrink-0 group"
                    >
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-white border-[1px] border-[#ebebeb] shadow-[0_2px_8px_rgba(0,0,0,0.04)] relative shrink-0 transition-transform group-active:scale-95">
                            {cat.image ? (
                                <Image
                                    src={cat.image}
                                    alt={cat.name}
                                    fill
                                    sizes="72px"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#f4f4f4] flex items-center justify-center">
                                    <span className="text-[10px] text-gray-400 font-medium">NA</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[12px] md:text-[13px] font-medium leading-[1.2] text-[#172026] text-center line-clamp-2 w-full truncate">
                            {cat.name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
