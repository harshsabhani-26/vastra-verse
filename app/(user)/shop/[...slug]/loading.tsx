/**
 * Product page skeleton — shown instantly during route transition.
 * Matches the actual layout (image gallery left, details right) so
 * the transition feels smooth and content-aware, not just a spinner.
 */
export default function ProductLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb skeleton */}
            <div className="hidden md:block border-b border-primary/10">
                <div className="container mx-auto px-4 md:px-8 py-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                                {i < 4 && <div className="h-3 w-1 bg-gray-200 rounded animate-pulse" />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
                    {/* Image gallery skeleton */}
                    <div className="space-y-3 animate-pulse">
                        <div className="bg-gray-200 aspect-[3/4] w-full" />
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gray-200 w-16 h-20 flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* Product details skeleton */}
                    <div className="space-y-5 pt-2 animate-pulse">
                        {/* Category */}
                        <div className="h-3 bg-gray-200 rounded w-24" />
                        {/* Name */}
                        <div className="space-y-2">
                            <div className="h-7 bg-gray-200 rounded w-3/4" />
                            <div className="h-7 bg-gray-200 rounded w-1/2" />
                        </div>
                        {/* Price */}
                        <div className="h-8 bg-gray-200 rounded w-32" />
                        {/* Description lines */}
                        <div className="space-y-2 pt-2">
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-5/6" />
                            <div className="h-4 bg-gray-200 rounded w-4/6" />
                        </div>
                        {/* Add to cart */}
                        <div className="h-12 bg-gray-200 rounded w-full mt-4" />
                        {/* Wishlist/share row */}
                        <div className="flex gap-3">
                            <div className="h-10 bg-gray-200 rounded w-32" />
                            <div className="h-10 bg-gray-200 rounded w-24" />
                        </div>
                        {/* Specs */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-4 bg-gray-200 rounded w-28" />
                                    <div className="h-4 bg-gray-200 rounded w-40" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
