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
                    "sticky top-0 z-50 w-full transition-all duration-300 border-b border-primary/5",
                    isScrolled
                        ? "bg-background/95 backdrop-blur-md shadow-soft py-0"
                        : "bg-background py-2"
                )}
            >
                <div className="container mx-auto px-4 md:px-8">
                    {/* Two-row layout container */}
                    <div className="flex flex-col">
                        {/* Top Row: Mobile Menu and Logo (centered) */}
                        <div className="flex items-center justify-between h-20 relative">
                            {/* Left - Mobile Menu Toggle */}
                            <button
                                className="lg:hidden p-2 text-primary hover:text-secondary transition-colors"
                                onClick={() => setIsMobileMenuOpen(true)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>

                            {/* Center - Logo (Absolutely Positioned) */}
                            <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex-shrink-0 flex items-center gap-2 group">
                                <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-[0.15em] whitespace-nowrap group-hover:text-primary-light transition-colors duration-300">
                                    VASTRA <span className="font-light text-secondary">VERSE</span>
                                </h1>
                            </Link>

                            {/* Right - Mobile Icons */}
                            <div className="lg:hidden flex items-center space-x-2 ml-auto">
                                {/* Search */}
                                <button
                                    className="p-2 text-primary hover:text-secondary transition-colors"
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label="Search"
                                >
                                    <Search className="h-5 w-5" />
                                </button>

                                {/* Cart */}
                                <button
                                    onClick={openCart}
                                    className="p-2 text-primary hover:text-secondary transition-colors relative"
                                    aria-label="Shopping cart"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    {mounted && totalItems() > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-[10px] text-primary-dark flex items-center justify-center rounded-full font-sans font-bold animate-scale-in">
                                            {totalItems()}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Bottom Row: Centered Desktop Navigation and Right Icons */}
                        <div className="hidden lg:flex items-center justify-between pb-4 pt-2">
                            {/* Spacer for flex layout */}
                            <div className="flex-1"></div>

                            {/* Centered Navigation */}
                            <nav className="flex items-center justify-center space-x-12">
                                <Link
                                    href="/shop?sort=newest"
                                    className="text-sm font-sans font-medium text-text-main hover:text-secondary transition-colors tracking-[0.15em] uppercase hover:underline hover:decoration-secondary hover:underline-offset-4"
                                >
                                    New Arrivals
                                </Link>
                                <Link
                                    href="/collections"
                                    className="text-sm font-sans font-medium text-text-main hover:text-secondary transition-colors tracking-[0.15em] uppercase hover:underline hover:decoration-secondary hover:underline-offset-4"
                                >
                                    Collections
                                </Link>
                                <Link
                                    href="/about"
                                    className="text-sm font-sans font-medium text-text-main hover:text-secondary transition-colors tracking-[0.15em] uppercase hover:underline hover:decoration-secondary hover:underline-offset-4"
                                >
                                    Our Story
                                </Link>
                            </nav>

                            {/* Right Icons */}
                            <div className="flex items-center space-x-5 flex-1 justify-end text-primary">
                                {/* Search */}
                                <button
                                    className="p-2 hover:text-secondary transition-colors duration-300 hover-lift"
                                    onClick={() => setIsSearchOpen(true)}
                                    aria-label="Search"
                                >
                                    <Search className="h-5 w-5" />
                                </button>

                                {/* Profile Dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        className={cn(
                                            "p-2 hover:text-secondary transition-colors duration-300 hover-lift",
                                            isProfileOpen ? "text-secondary" : ""
                                        )}
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        aria-label="Account"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isProfileOpen && (
                                        <div className="absolute top-full right-0 mt-4 w-72 bg-white border border-primary/10 shadow-luxury-lg z-50 animate-fade-in-down rounded-sm overflow-hidden">
                                            {status === "authenticated" && session?.user ? (
                                                <>
                                                    <div className="px-6 py-5 border-b border-primary/5 bg-background">
                                                        <p className="text-base font-serif text-primary">Hi, {session.user.name}</p>
                                                        <p className="text-xs text-text-muted mt-1 font-sans">{session.user.email}</p>
                                                    </div>
                                                    <nav className="flex flex-col text-sm text-text-main py-2 font-sans">
                                                        <Link
                                                            href="/profile"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            Profile
                                                        </Link>
                                                        <Link
                                                            href="/orders"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            My Orders
                                                        </Link>
                                                        <Link
                                                            href="/track-order"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            Track Order
                                                        </Link>
                                                        <Link
                                                            href="/wishlist"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            Wishlist
                                                        </Link>
                                                        <Link
                                                            href="/returns"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            Returns
                                                        </Link>
                                                        <Link
                                                            href="/contact"
                                                            className="px-6 py-3 hover:bg-primary/5 hover:text-primary transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            Contact Us
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                signOut();
                                                                setIsProfileOpen(false);
                                                            }}
                                                            className="px-6 py-3 text-left hover:bg-primary/5 hover:text-primary transition-colors w-full text-text-muted"
                                                        >
                                                            Logout
                                                        </button>
                                                    </nav>
                                                </>
                                            ) : (
                                                <div className="p-6 space-y-4">
                                                    <Link href="/login" onClick={() => setIsProfileOpen(false)}>
                                                        <button className="w-full btn-luxury-primary text-xs py-3">
                                                            Log In / Sign Up
                                                        </button>
                                                    </Link>
                                                    <nav className="flex flex-col text-sm text-text-muted space-y-2 pt-2 border-t border-primary/10">
                                                        <Link
                                                            href="/wishlist"
                                                            className="py-2 px-1 hover:text-primary flex items-center gap-3 transition-colors"
                                                            onClick={() => setIsProfileOpen(false)}
                                                        >
                                                            <Heart className="h-4 w-4" /> Wishlist
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
                                    className="p-2 hover:text-secondary transition-colors duration-300 hover-lift"
                                    aria-label="Wishlist"
                                >
                                    <Heart className="h-5 w-5" />
                                </Link>

                                {/* Cart */}
                                <button
                                    onClick={openCart}
                                    className="p-2 hover:text-secondary transition-colors duration-300 relative hover-lift"
                                    aria-label="Shopping cart"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    {mounted && totalItems() > 0 && (
                                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-[10px] text-primary-dark flex items-center justify-center rounded-full font-sans font-bold animate-scale-in">
                                            {totalItems()}
                                        </span>
                                    )}
                                </button>

                                {/* WhatsApp */}
                                <div className="ml-2 hover-lift">
                                    <WhatsAppButton />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in">
                    <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-background shadow-luxury-xl transform transition-transform duration-500 flex flex-col animate-slide-in-left border-r border-secondary/20">
                        <div className="p-6 flex justify-between items-center bg-primary text-background">
                            <h2 className="text-2xl font-serif text-accent tracking-wide">Menu</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 hover:text-accent transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-8 space-y-4">
                            <Link
                                href="/shop?sort=newest"
                                className="block text-lg font-serif text-primary-dark py-4 border-b border-secondary/10 hover:text-primary hover:pl-2 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                New Arrivals
                            </Link>
                            <Link
                                href="/collections"
                                className="block text-lg font-serif text-primary-dark py-4 border-b border-secondary/10 hover:text-primary hover:pl-2 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Collections
                            </Link>
                            <Link
                                href="/about"
                                className="block text-lg font-serif text-primary-dark py-4 border-b border-secondary/10 hover:text-primary hover:pl-2 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Our Story
                            </Link>
                            <Link
                                href="/contact"
                                className="block text-lg font-serif text-primary-dark py-4 border-b border-secondary/10 hover:text-primary hover:pl-2 transition-all"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </nav>
                        <div className="p-8 border-t border-secondary/20 bg-primary/5">
                            {status === "authenticated" ? (
                                <button
                                    onClick={() => {
                                        signOut();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full btn-luxury-outline border-primary text-primary hover:bg-primary hover:text-background"
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
