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

    // Format category slug for display 
    let displayCategory = "Category";
    if (currentCategory) {
        const lastPart = currentCategory.split('/').pop() || currentCategory;
        displayCategory = lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

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
        <div className="w-full py-3 md:py-4 bg-background sticky top-16 z-40 border-b border-primary/10 shadow-sm transition-all duration-300">
            <div className="flex flex-col gap-4">

                {/* Mobile: Filters in clean grid */}
                <div className="grid grid-cols-2 gap-3 md:hidden">
                    <FilterDropdown label={displayCategory}>
                        <div className="p-2 space-y-2 min-w-[200px] animate-fade-in-down">
                            <p
                                className={`text-sm cursor-pointer transition-colors ${!currentCategory ? 'text-primary font-medium' : 'text-text-muted hover:text-primary'}`}
                                onClick={() => handleCategoryChange(true)}
                            >
                                All Categories
                            </p>
                            {categories.map((category) => (
                                <p
                                    key={category.id}
                                    className={`text-sm cursor-pointer transition-colors ${currentCategory === category.name ? 'text-primary font-medium' : 'text-text-muted hover:text-primary'}`}
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

                    <FilterDropdown label="Sort">
                        <div className="p-1">
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('sort', 'newest');
                                    router.push(`/shop?${params.toString()}`);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors rounded-sm"
                            >
                                Newest
                            </button>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('sort', 'price_asc');
                                    router.push(`/shop?${params.toString()}`);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors rounded-sm"
                            >
                                Price: Low to High
                            </button>
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.set('sort', 'price_desc');
                                    router.push(`/shop?${params.toString()}`);
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors rounded-sm"
                            >
                                Price: High to Low
                            </button>
                        </div>
                    </FilterDropdown>
                </div>

                {/* Desktop: Horizontal filters */}
                <div className="hidden md:flex md:flex-row items-center justify-between">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-6 lg:gap-8">
                        <FilterDropdown label={displayCategory}>
                            <div className="p-2 space-y-2 min-w-[200px] animate-fade-in-down">
                                <p
                                    className={`text-sm cursor-pointer transition-colors ${!currentCategory ? 'text-primary font-medium' : 'text-text-muted hover:text-primary'}`}
                                    onClick={() => handleCategoryChange(true)}
                                >
                                    All Categories
                                </p>
                                {categories.map((category) => (
                                    <p
                                        key={category.id}
                                        className={`text-sm cursor-pointer transition-colors ${currentCategory === category.name ? 'text-primary font-medium' : 'text-text-muted hover:text-primary'}`}
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
                            <p className="text-sm text-text-muted">Vastraa Verse</p>
                        </FilterDropdown>

                        <FilterDropdown label="Product Type">
                            <div className="p-2 space-y-2">
                                <p className="text-sm text-text-muted">Clothing</p>
                                <p className="text-sm text-text-muted">Accessories</p>
                            </div>
                        </FilterDropdown>
                    </div>

                    {/* Right Side Tools */}
                    <div className="flex items-center gap-6 ml-auto">
                        <div className="flex items-center gap-3 border-l border-primary/20 pl-6 h-6">
                            <button
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    params.delete('view');
                                    router.push(`/shop?${params.toString()}`);
                                }}
                                className={`flex items-center justify-center transition-all duration-200 ${!searchParams.get('view') || searchParams.get('view') === '4'
                                    ? 'text-primary scale-110'
                                    : 'text-primary/40 hover:text-primary/70'
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
                                className={`flex items-center justify-center transition-all duration-200 ${searchParams.get('view') === '2'
                                    ? 'text-primary scale-110'
                                    : 'text-primary/40 hover:text-primary/70'
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

                        <div className="flex items-center gap-1 text-sm text-text-muted">
                            <span className="font-medium text-primary">{totalCount}</span>
                            <span>Results</span>
                            <span className="mx-1">|</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center gap-1 cursor-pointer text-text-main hover:text-primary transition-colors">
                                        <span className="font-medium">Sort</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-0 bg-surface border-primary/10 animate-fade-in-down" align="end">
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.set('sort', 'newest');
                                                router.push(`/shop?${params.toString()}`);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors"
                                        >
                                            Newest
                                        </button>
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.set('sort', 'price_asc');
                                                router.push(`/shop?${params.toString()}`);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors"
                                        >
                                            Price: Low to High
                                        </button>
                                        <button
                                            onClick={() => {
                                                const params = new URLSearchParams(searchParams.toString());
                                                params.set('sort', 'price_desc');
                                                router.push(`/shop?${params.toString()}`);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-secondary/10 hover:text-primary transition-colors"
                                        >
                                            Price: High to Low
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                {/* Mobile Results Count */}
                <div className="md:hidden flex items-center justify-center text-sm text-text-muted">
                    <span className="font-medium text-primary">{totalCount}</span>
                    <span className="ml-1">Results</span>
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
                    <span className={`text-base font-sans transition-colors ${open ? "text-primary font-medium" : "text-text-main hover:text-primary"}`}>
                        {label}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180 text-primary" : "text-primary/40 group-hover:text-primary"}`} />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 bg-surface border-primary/10" align="start">
                {children}
            </PopoverContent>
        </Popover>
    )
}
