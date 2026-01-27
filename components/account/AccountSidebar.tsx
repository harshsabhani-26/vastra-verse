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
        <nav className="w-full md:w-64 flex-shrink-0">
            {/* User Info */}
            <div className="mb-8 pb-4 border-b border-stone-200">
                <p className="font-serif text-lg text-primary">
                    Hi, {session?.user?.name || "Guest"}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                    {session?.user?.email}
                </p>
            </div>

            <ul className="space-y-6">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    "block text-sm transition-colors duration-200 relative pl-4",
                                    isActive
                                        ? "text-primary font-medium border-l-2 border-primary"
                                        : "text-stone-500 hover:text-primary border-l-2 border-transparent"
                                )}
                            >
                                {link.name}
                            </Link>
                        </li>
                    );
                })}
                <li>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="block text-sm text-stone-500 hover:text-primary transition-colors duration-200 relative pl-4 border-l-2 border-transparent w-full text-left"
                    >
                        Logout
                    </button>
                </li>
            </ul>
        </nav>
    );
}
