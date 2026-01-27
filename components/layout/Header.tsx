"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingBag, Search, User, Menu, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { SearchOverlay } from "@/components/search/SearchOverlay";

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { openCart, totalItems } = useCartStore();
    const { data: session, status } = useSession();
    const [mounted, setMounted] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);

        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Main Header */}
            <header
                className={cn(
                    "sticky top-0 z-50 w-full transition-all duration-300 bg-white",
                    isScrolled ? "shadow-sm border-b border-stone-100" : "border-b border-transparent"
                )}
            >
                <div className="container mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Mobile Menu Toggle */}
                        <button
                            className="lg:hidden p-2"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu className="h-5 w-5 text-primary" />
                        </button>

                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0">
                            <h1 className="text-xl md:text-2xl font-serif text-primary tracking-wide">
                                VAYANA <span className="text-secondary">HERITAGE</span>
                            </h1>
                        </Link>

                        {/* Desktop Navigation - Centered */}
                        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center space-x-8">
                            <Link
                                href="/shop?sort=newest"
                                className="text-xs font-sans font-medium text-luxury-charcoal hover:text-gold transition-colors tracking-wider uppercase link-luxury"
                            >
                                New Arrivals
                            </Link>
                            <Link
                                href="/collections"
                                className="text-xs font-sans font-medium text-luxury-charcoal hover:text-gold transition-colors tracking-wider uppercase link-luxury"
                            >
                                Collections
                            </Link>
                            <Link
                                href="/about"
                                className="text-xs font-sans font-medium text-luxury-charcoal hover:text-gold transition-colors tracking-wider uppercase link-luxury"
                            >
                                Our Story
                            </Link>
                        </nav>

                        {/* Right Icons */}
                        <div className="flex items-center space-x-1 lg:space-x-2">
                            {/* Search */}
                            <button
                                className="p-2 hover:bg-luxury-stone rounded-sm transition-all duration-luxury hidden sm:flex"
                                onClick={() => setIsSearchOpen(true)}
                                aria-label="Search"
                            >
                                <Search className="h-5 w-5 text-luxury-charcoal" />
                            </button>

                            {/* Profile Dropdown */}
                            <div className="relative" ref={profileRef}>
                                <button
                                    className={cn(
                                        "p-2 rounded-sm transition-all duration-luxury",
                                        isProfileOpen ? "bg-luxury-stone" : "hover:bg-luxury-stone"
                                    )}
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    aria-label="Account"
                                >
                                    <User className="h-5 w-5 text-luxury-charcoal" />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <div className="absolute top-full right-0 mt-3 w-72 bg-white border border-border shadow-luxury-lg z-50 animate-fade-in">
                                        {status === "authenticated" && session?.user ? (
                                            <>
                                                <div className="px-6 py-4 border-b border-border bg-luxury-sand">
                                                    <p className="text-sm font-serif text-luxury-black">Hi, {session.user.name}</p>
                                                    <p className="text-xs text-text-secondary mt-1">{session.user.email}</p>
                                                </div>
                                                <nav className="flex flex-col text-sm text-text-secondary py-2">
                                                    <Link
                                                        href="/profile"
                                                        className="px-6 py-3 hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Profile
                                                    </Link>
                                                    <Link
                                                        href="/orders"
                                                        className="px-6 py-3 hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        My Orders
                                                    </Link>
                                                    <Link
                                                        href="/wishlist"
                                                        className="px-6 py-3 hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Wishlist
                                                    </Link>
                                                    <Link
                                                        href="/returns"
                                                        className="px-6 py-3 hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Returns
                                                    </Link>
                                                    <Link
                                                        href="/contact"
                                                        className="px-6 py-3 hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Contact Us
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            signOut();
                                                            setIsProfileOpen(false);
                                                        }}
                                                        className="px-6 py-3 text-left hover:bg-luxury-sand hover:text-luxury-black transition-all duration-luxury w-full"
                                                    >
                                                        Logout
                                                    </button>
                                                </nav>
                                            </>
                                        ) : (
                                            <div className="p-4">
                                                <Link href="/login" onClick={() => setIsProfileOpen(false)}>
                                                    <button className="w-full btn-luxury-outline">
                                                        Log In / Sign Up
                                                    </button>
                                                </Link>
                                                <nav className="flex flex-col text-sm text-text-secondary mt-4 space-y-1">
                                                    <Link
                                                        href="/wishlist"
                                                        className="py-2 px-3 hover:bg-luxury-sand hover:text-luxury-black flex items-center gap-3 transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        <Heart className="h-4 w-4" /> Wishlist
                                                    </Link>
                                                    <Link
                                                        href="/track-order"
                                                        className="py-2 px-3 hover:bg-luxury-sand hover:text-luxury-black flex items-center gap-3 transition-all duration-luxury"
                                                        onClick={() => setIsProfileOpen(false)}
                                                    >
                                                        Track Order
                                                    </Link>
                                                </nav>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Wishlist */}
                            <Link
                                href="/wishlist"
                                className="p-2 hover:bg-luxury-stone rounded-sm transition-all duration-luxury hidden sm:flex"
                                aria-label="Wishlist"
                            >
                                <Heart className="h-5 w-5 text-luxury-charcoal" />
                            </Link>

                            {/* Cart */}
                            <button
                                onClick={openCart}
                                className="p-2 hover:bg-luxury-stone rounded-sm transition-all duration-luxury relative"
                                aria-label="Shopping cart"
                            >
                                <ShoppingBag className="h-5 w-5 text-luxury-charcoal" />
                                {mounted && totalItems() > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gold text-[10px] text-white flex items-center justify-center rounded-full font-sans font-semibold">
                                        {totalItems()}
                                    </span>
                                )}
                            </button>

                            {/* WhatsApp */}
                            <WhatsAppButton />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-luxury-black/50 lg:hidden">
                    <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-luxury-lg transform transition-transform duration-300 flex flex-col">
                        <div className="p-6 flex justify-between items-center border-b border-border">
                            <h2 className="text-2xl font-serif text-luxury-black">Menu</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 hover:bg-luxury-stone rounded-sm transition-colors"
                            >
                                <X className="h-6 w-6 text-text-secondary" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-6 space-y-2">
                            <Link
                                href="/shop?sort=newest"
                                className="block text-base font-sans font-medium text-luxury-charcoal py-3 border-b border-border uppercase tracking-wider hover:text-gold transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                New Arrivals
                            </Link>
                            <Link
                                href="/collections"
                                className="block text-base font-sans font-medium text-luxury-charcoal py-3 border-b border-border uppercase tracking-wider hover:text-gold transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Collections
                            </Link>
                            <Link
                                href="/about"
                                className="block text-base font-sans font-medium text-luxury-charcoal py-3 border-b border-border uppercase tracking-wider hover:text-gold transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Our Story
                            </Link>
                            <Link
                                href="/contact"
                                className="block text-base font-sans font-medium text-luxury-charcoal py-3 border-b border-border uppercase tracking-wider hover:text-gold transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </nav>
                        <div className="p-6 border-t border-border bg-luxury-sand">
                            {status === "authenticated" ? (
                                <button
                                    onClick={() => {
                                        signOut();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full btn-luxury-outline"
                                >
                                    Logout
                                </button>
                            ) : (
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <button className="w-full btn-luxury-primary">
                                        Log In / Sign Up
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </>
    );
}
