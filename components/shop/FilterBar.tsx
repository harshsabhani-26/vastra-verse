"use client"

import { ChevronDown, SlidersHorizontal, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { PriceFilter } from "./filters/PriceFilter"
import { ColorFilter } from "./filters/ColorFilter"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface Category {
    id: string
    name: string
    slug: string
}

export function FilterBar({ categories = [], totalCount = 0 }: { categories?: Category[], totalCount?: number }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentCategory = searchParams.get('category')

    const handleCategoryChange = (exclude: boolean, categoryName?: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (exclude || !categoryName) {
            params.delete('category')
        } else {
            params.set('category', categoryName)
        }
        router.push(`/shop?${params.toString()}`)
    }

    return (
        <div className="w-full py-4 bg-[#FAF9F6]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-6 md:gap-8">
                    <FilterDropdown label={currentCategory || "Category"}>
                        <div className="p-2 space-y-2 min-w-[200px]">
                            <p
                                className={`text-sm cursor-pointer ${!currentCategory ? 'text-[#1C1917] font-medium' : 'text-stone-600 hover:text-black'}`}
                                onClick={() => handleCategoryChange(true)}
                            >
                                All Categories
                            </p>
                            {categories.map((category) => (
                                <p
                                    key={category.id}
                                    className={`text-sm cursor-pointer ${currentCategory === category.name ? 'text-[#1C1917] font-medium' : 'text-stone-600 hover:text-black'}`}
                                    onClick={() => handleCategoryChange(false, category.name)}
                                >
                                    {category.name}
                                </p>
                            ))}
                        </div>
                    </FilterDropdown>

                    <FilterDropdown label="Price">
                        <PriceFilter />
                    </FilterDropdown>

                    <FilterDropdown label="Color">
                        <ColorFilter />
                    </FilterDropdown>

                    <FilterDropdown label="Brand">
                        <p className="text-sm text-stone-600">Vayana Heritage</p>
                    </FilterDropdown>

                    <FilterDropdown label="Product Type">
                        <div className="p-2 space-y-2">
                            <p className="text-sm text-stone-600">Clothing</p>
                            <p className="text-sm text-stone-600">Accessories</p>
                        </div>
                    </FilterDropdown>
                </div>

                {/* Right Side Tools */}
                <div className="flex items-center gap-6 ml-auto">
                    <div className="flex items-center gap-3 border-l border-stone-300 pl-6 h-6">
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.delete('view');
                                router.push(`/shop?${params.toString()}`);
                            }}
                            className={`flex items-center justify-center transition-colors ${!searchParams.get('view') || searchParams.get('view') === '4'
                                    ? 'text-stone-900'
                                    : 'text-stone-400 hover:text-stone-600'
                                }`}
                            title="4 columns"
                        >
                            <LayoutGrid
                                className="h-4 w-4"
                                fill={(!searchParams.get('view') || searchParams.get('view') === '4') ? "currentColor" : "none"}
                            />
                        </button>
                        <button
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.set('view', '2');
                                router.push(`/shop?${params.toString()}`);
                            }}
                            className={`flex items-center justify-center transition-colors ${searchParams.get('view') === '2'
                                    ? 'text-stone-900'
                                    : 'text-stone-400 hover:text-stone-600'
                                }`}
                            title="2 columns"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill={searchParams.get('view') === '2' ? "currentColor" : "none"}
                                stroke={searchParams.get('view') === '2' ? "none" : "currentColor"}
                                strokeWidth="2"
                            >
                                <rect x="3" y="3" width="7" height="18" />
                                <rect x="14" y="3" width="7" height="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-stone-500">
                        <span>{totalCount} Results</span>
                        <span className="mx-1">|</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-1 cursor-pointer text-[#1C1917]">
                                    <span className="font-medium">Sort</span>
                                    <ChevronDown className="h-3 w-3" />
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-0 bg-white border-stone-200" align="end">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.set('sort', 'newest');
                                            router.push(`/shop?${params.toString()}`);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-[#1C1917]"
                                    >
                                        Newest
                                    </button>
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.set('sort', 'price_asc');
                                            router.push(`/shop?${params.toString()}`);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-[#1C1917]"
                                    >
                                        Price: Low to High
                                    </button>
                                    <button
                                        onClick={() => {
                                            const params = new URLSearchParams(searchParams.toString());
                                            params.set('sort', 'price_desc');
                                            router.push(`/shop?${params.toString()}`);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-[#1C1917]"
                                    >
                                        Price: High to Low
                                    </button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FilterDropdown({ label, children }: { label: string, children: React.ReactNode }) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer group">
                    <span className={`text-base font-sans transition-colors ${open ? "text-[#1C1917] font-medium" : "text-[#1C1917] hover:text-stone-600"}`}>
                        {label}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180 text-[#1C1917]" : "text-stone-400 group-hover:text-stone-600"}`} />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-[#FAF9F6] border-stone-200" align="start">
                {children}
            </PopoverContent>
        </Popover>
    )
}
