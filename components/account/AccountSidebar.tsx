"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";

const sidebarLinks = [
    { name: "Profile", href: "/profile" },
    { name: "Password", href: "/profile/password" }, // Placeholder route
    { name: "Address Book", href: "/profile/address" }, // Placeholder route
    { name: "My Orders", href: "/orders" },
    { name: "My Returns", href: "/returns" },
    { name: "Wishlist", href: "/wishlist" },
    { name: "Gift Cards", href: "/gift-cards" },
];

export function AccountSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <nav className="hidden md:block w-full md:w-64 flex-shrink-0 animate-fade-in bg-surface/30 p-6 rounded-sm border border-primary/5 h-fit">
            {/* User Info */}
            <div className="mb-8 pb-6 border-b border-primary/10">
                <p className="font-serif text-xl text-primary tracking-tight">
                    Hi, {session?.user?.name || "Guest"}
                </p>
                <p className="text-xs text-text-muted mt-1 font-light tracking-wide">
                    {session?.user?.email}
                </p>
            </div>

            <ul className="space-y-2">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    "block text-sm transition-all duration-300 relative pl-4 py-2 rounded-sm border-l-2",
                                    isActive
                                        ? "text-primary font-medium border-primary bg-primary/5 shadow-sm"
                                        : "text-text-muted hover:text-primary hover:bg-secondary/5 border-transparent hover:border-primary/20"
                                )}
                            >
                                {link.name}
                            </Link>
                        </li>
                    );
                })}
                <li className="pt-4 mt-4 border-t border-primary/5">
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block w-full text-left text-sm text-text-muted hover:text-red-600 transition-all duration-300 relative pl-4 py-2 border-l-2 border-transparent hover:bg-red-50 hover:border-red-200 rounded-sm"
                    >
                        Logout
                    </button>
                </li>
            </ul>
        </nav>
    );
}
