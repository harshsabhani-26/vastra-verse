"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { pixelSearch } from "@/lib/fbq";

// Mock data for "New Arrivals" - in a real app this would be fetched
// Mock data removed



interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Product {
    id: string;
    name: string;
    slug?: string | null;
    price: string | number;
    finalPrice?: string | number;
    images: { url: string }[];
    category?: { slug?: string | null; } | null;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [newArrivals, setNewArrivals] = useState<Product[]>([]);
    const [popularSearches, setPopularSearches] = useState<{ term: string, label: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch New Arrivals and Popular Searches on mount
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";

            // Fetch New Arrivals
            fetch("/api/products?isNewArrival=true&limit=4")
                .then(res => res.json())
                .then(data => {
                    setNewArrivals(data.products || data);
                    setLoading((prev) => false); // Only stop loading if both done? Or separately? distinct loading states might be better but simple boolean works for now
                })
                .catch(err => console.error("Failed to fetch new arrivals", err));

            // Fetch Popular Searches
            fetch("/api/analytics/search/popular")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setPopularSearches(data);
                    }
                })
                .catch(err => console.error("Failed to fetch popular searches", err));

        } else {
            document.body.style.overflow = "unset";
            setQuery(""); // Reset query on close
            setSuggestions([]);
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Debounced Search Suggestions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 1) { // Only search if more than 1 char
                fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`)
                    .then(res => res.json())
                    .then(data => setSuggestions(data.products || data))
                    .catch(err => console.error("Search error", err));
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    const recordSearch = (term: string) => {
        fetch("/api/analytics/search/record", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term }),
        }).catch(err => console.error("Failed to record search", err));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            recordSearch(query.trim());
            // Meta Pixel: Search
            pixelSearch(query.trim());
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    const handleSuggestionClick = (product: Product) => {
        if (query.trim()) recordSearch(query.trim());
        const url = product.slug && product.category?.slug
            ? `/shop/${product.category.slug}/${product.slug}`
            : `/shop/${product.id}`;
        router.push(url);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#FAF9F6] animate-in fade-in duration-200">
            {/* Header */}
            <div className="container mx-auto px-4 py-6">
                <div className="flex justify-end">
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X className="h-6 w-6 text-stone-600" />
                    </button>
                </div>

                {/* Search Input Area */}
                <form onSubmit={handleSearch} className="max-w-6xl mx-auto mt-8 pb-4 relative">
                    <div className="flex items-center gap-4 border-b border-stone-300 pb-2">
                        <Search className="h-6 w-6 text-stone-900" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="SEARCH"
                            className="w-full bg-transparent text-xl md:text-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none font-serif uppercase tracking-wide"
                            autoFocus
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(""); setSuggestions([]); }}
                                className="text-xs font-bold underline tracking-widest text-stone-900 hover:text-stone-700"
                            >
                                CLEAR
                            </button>
                        )}
                        <button
                            type="submit"
                            className="text-xs font-bold underline tracking-widest text-stone-900 hover:text-stone-700 ml-4"
                        >
                            SEARCH
                        </button>
                    </div>
                </form>

                <div className="max-w-6xl mx-auto mt-8 px-0">
                    {/* "Do you mean?" Mockup - Logic would be complex to implement fully, showing placeholder if applicable or omitting if logic not ready.
                        For now, omitting dynamic "Do you mean" as we don't have fuzzy search API.
                    */}

                    {/* Suggestions List */}
                    {suggestions.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Section Header */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b-2 border-primary pb-1 inline-block">
                                    PRODUCTS
                                </h3>
                            </div>

                            {/* Products Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
                                {suggestions.map((product) => (
                                    <div
                                        key={product.id}
                                    onClick={() => handleSuggestionClick(product)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="aspect-[3/4] overflow-hidden bg-stone-100 mb-4 relative">
                                            <Image
                                                src={product.images[0]?.url || "/placeholder.jpg"}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-medium text-primary leading-tight group-hover:underline decoration-1 underline-offset-4">
                                                {product.name}
                                            </h4>
                                            {/* We could add color variant text here if available */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Default View (Popular + New Arrivals) */
                        !query && (
                            <div className="space-y-16 mt-12 animate-in fade-in duration-500">
                                {/* Popular Searches */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-stone-200 pb-2 inline-block">Popular Searches</h3>
                                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                                        {popularSearches.length > 0 ? (
                                            popularSearches.map((search) => (
                                                <Link
                                                    key={search.term}
                                                    href={`/shop?q=${search.term}`}
                                                    onClick={() => {
                                                        recordSearch(search.term);
                                                        onClose();
                                                    }}
                                                    className="text-stone-500 hover:text-primary transition-colors flex items-center gap-2 group text-base"
                                                >
                                                    <Search className="h-4 w-4 text-stone-400 group-hover:text-primary transition-colors" />
                                                    {search.label}
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="text-stone-400 text-sm italic">No popular searches yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* New Arrivals - Separator */}
                                <div className="border-t border-stone-200" />

                                {/* New Arrivals */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary border-b border-stone-200 pb-2 inline-block">New Arrivals</h3>
                                    {loading ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="animate-pulse">
                                                    <div className="aspect-[3/4] bg-stone-200 mb-3" />
                                                    <div className="h-4 bg-stone-200 w-3/4 mb-1" />
                                                    <div className="h-3 bg-stone-200 w-1/4" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : newArrivals.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {newArrivals.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={item.slug && item.category?.slug
                                                        ? `/shop/${item.category.slug}/${item.slug}`
                                                        : `/shop/${item.id}`
                                                    }
                                                    onClick={onClose}
                                                    className="group"
                                                >
                                                    <div className="aspect-[3/4] overflow-hidden bg-stone-100 mb-3 relative">
                                                        <Image
                                                            src={item.images[0]?.url || "/placeholder.jpg"}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            sizes="(max-width: 768px) 50vw, 25vw"
                                                        />
                                                    </div>
                                                    <h4 className="text-xs font-medium text-primary line-clamp-2 mb-1 group-hover:text-secondary transition-colors">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-xs text-stone-500">₹ {Number(item.finalPrice || item.price).toLocaleString()}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-stone-500 text-sm">No new arrivals at the moment.</p>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
