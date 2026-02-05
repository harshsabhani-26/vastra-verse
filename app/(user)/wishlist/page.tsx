import { AccountSidebar } from "@/components/account/AccountSidebar";
import { WishlistItem } from "@/components/account/WishlistItem";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Share2, Heart } from "lucide-react";
import Link from "next/link";

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
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-4xl animate-fade-in-up">
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary/10">
                            <h1 className="text-3xl font-serif text-primary tracking-tight">My Wishlist</h1>
                            {wishlistItems.length > 0 && (
                                <button className="text-text-muted hover:text-primary transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </button>
                            )}
                        </div>

                        {wishlistItems.length === 0 ? (
                            <div className="bg-surface/30 p-16 text-center rounded-sm border border-primary/5 shadow-sm">
                                <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                                    <Heart className="w-8 h-8 text-primary/40" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-serif text-primary mb-3">Your wishlist is empty</h3>
                                <p className="text-text-muted mb-8 font-light">Save items you love to your wishlist.</p>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center text-primary font-medium hover:text-secondary transition-colors uppercase tracking-[0.2em] text-xs border-b border-primary/30 pb-1 hover:border-secondary"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
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
