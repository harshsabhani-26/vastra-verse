/**
 * Shop listing skeleton — shown instantly during route transition.
 * Next.js renders this while the async Server Component fetches data.
 * Eliminates the blank white screen users see when navigating to /shop.
 */
export default function ShopLoading() {
    return (
        <div className="min-h-screen bg-background">
            {/* Breadcrumb skeleton */}
            <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-4 pb-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-10 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                {/* Filter bar skeleton */}
                <div className="flex gap-3 py-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
                    ))}
                </div>
            </div>

            <div className="border-t border-primary/10">
                <div className="container mx-auto px-4 md:px-8 py-12">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-x-6 lg:gap-y-12">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-gray-200 aspect-[3/4] w-full" />
                                <div className="mt-4 space-y-2 text-center">
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
