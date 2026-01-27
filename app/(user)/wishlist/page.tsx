import { AccountSidebar } from "@/components/account/AccountSidebar";
import { WishlistItem } from "@/components/account/WishlistItem";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Share2 } from "lucide-react";

export default async function WishlistPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const wishlistItems = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
            product: {
                include: {
                    images: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-4xl">
                        <div className="flex items-center gap-4 mb-10">
                            <h1 className="text-3xl font-serif text-primary tracking-wide">Wishlist</h1>
                            <button className="text-stone-400 hover:text-primary transition-colors">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>

                        {wishlistItems.length === 0 ? (
                            <div className="bg-white p-8 border border-stone-200">
                                <p className="text-stone-600">Your wishlist is empty.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {wishlistItems.map(item => (
                                    <WishlistItem
                                        key={item.product.id}
                                        product={{
                                            ...item.product,
                                            price: parseFloat(item.product.price.toString()),
                                            finalPrice: item.product.finalPrice ? parseFloat(item.product.finalPrice.toString()) : null,
                                            discount: item.product.discount ? parseFloat(item.product.discount.toString()) : null,
                                            lowStockThreshold: item.product.lowStockThreshold, // Int is fine
                                            createdAt: item.product.createdAt.toISOString(),
                                            updatedAt: item.product.updatedAt.toISOString(),
                                            images: item.product.images.map(img => img.url)
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
