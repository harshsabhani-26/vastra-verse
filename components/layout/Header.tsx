"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore, useHeaderStore } from "@/lib/store";
import { useSession, signOut } from "next-auth/react";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { useWishlistStore } from "@/lib/wishlist-store";
import { LoginModal } from "@/components/auth/LoginModal";

// SVG Icons from reference
const Icons = {
    Search: (props: any) => (
        <svg width="16" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
            <path d="M97.524 460.531c0 200.485 162.524 363.008 363.008 363.008 97.851 0 186.661-38.717 251.943-101.669 1.326-1.741 2.784-3.418 4.379-5.013s3.272-3.052 5.013-4.379c62.956-65.282 101.673-154.092 101.673-251.948 0-200.484-162.523-363.008-363.008-363.008-200.484 0-363.008 162.524-363.008 363.008zM749.875 818.839c-79.077 63.932-179.736 102.224-289.344 102.224-254.345 0-460.531-206.19-460.531-460.532 0-254.345 206.187-460.531 460.531-460.531 254.343 0 460.532 206.187 460.532 460.531 0 109.607-38.293 210.276-102.229 289.349l190.878 190.878c19.042 19.042 19.042 49.918 0 68.959s-49.918 19.042-68.959 0l-190.878-190.878z" fill="rgb(66, 18, 15)" />
        </svg>
    ),
    Truck: (props: any) => (
        <svg width="24" height="24" viewBox="0 0 1317 1024" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
            <path d="M891.348 0h-884.11v843.503h101.18c12.116 85.558 85.649 151.357 174.552 151.357s162.436-65.799 174.552-151.357h349.147v0.98h3.604c12.542 85.080 85.85 150.377 174.412 150.377s161.87-65.297 174.412-150.377h126.357v-292.001l-239.392-292h-154.712v-260.482zM449.502 760.535c-23.991-68.862-89.491-118.277-166.533-118.277s-142.541 49.415-166.532 118.277h-26.233v-677.569h718.18v177.516h-1.716v500.052h-357.166zM984.683 911.896c-51.351 0-93.013-41.467-93.335-92.74v-1.195c0.322-51.273 41.984-92.74 93.335-92.74 51.551 0 93.335 41.789 93.335 93.335 0 51.551-41.784 93.34-93.335 93.34zM984.683 642.258c-34.275 0-66.267 9.782-93.335 26.702v-325.512h115.444l195.691 238.696v179.376h-50.927c-23.708-69.378-89.463-119.262-166.873-119.262zM189.633 818.556c0-51.546 41.788-93.335 93.337-93.335s93.337 41.789 93.337 93.335c0 51.551-41.788 93.34-93.337 93.34s-93.337-41.789-93.337-93.34z" fill="rgb(66, 18, 15)" />
        </svg>
    ),
    User: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgb(66, 18, 15)" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }} {...props}>
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    Heart: (props: any) => (
        <svg width="24" height="23" viewBox="0 0 1073 1024" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible' }} {...props}>
            <path d="M318.66 0.557l-19.651 2.731c-30.769 4.145-70.851 16.872-101.864 32.378-91.234 45.544-157.306 130.682-184.174 237.275-14.726 58.563-17.018 127.805-6.339 190.562 26.331 154.379 127.415 301.396 293.498 426.91 57.246 43.252 137.167 91.867 198.997 121.027 21.748 10.24 23.503 10.776 36.523 10.776 12.873 0 14.921-0.585 36.035-10.386 62.318-28.916 147.749-81.237 207.092-126.878 100.108-76.995 176.128-161.841 226.645-252.977 84.553-152.575 88.747-330.849 10.923-462.896-52.565-89.137-135.948-146.822-239.080-165.352-24.332-4.389-70.363-4.34-93.867 0.049-54.301 10.515-104.258 36.903-143.555 75.825l-7.704 7.607-15.555-14.19c-41.642-38.132-79.628-58.417-127.561-68.169-17.359-3.56-58.124-5.998-70.363-4.291zM386.244 104.615c38.619 13.312 65.926 36.328 104.399 87.966 11.508 15.458 23.601 21.943 40.765 21.845 20.773-0.146 31.793-7.607 49.201-33.402 8.582-12.727 43.593-47.25 56.222-55.442 46.958-30.525 98.694-36.328 157.403-17.603 53.531 16.407 99.582 51.119 130.097 98.060 34.085 51.541 49.835 107.471 49.786 177.006 0 62.22-12.727 117.418-40.667 176.127-30.184 63.39-68.706 114.883-133.315 178.030-66.17 64.707-138.386 116.931-229.376 165.986-10.572 5.934-21.392 11.415-32.427 16.433-4.047 1.024-13.214-3.17-46.226-21.211-84.845-46.373-157.5-99.523-220.598-161.304-59.441-58.222-95.817-105.326-125.269-162.085-37.010-71.29-52.712-141.896-48.128-216.502 5.998-97.768 52.907-182.662 124.879-226.060 53.833-32.475 118.101-43.447 163.255-27.843z" fill="rgb(66, 18, 15)" />
        </svg>
    ),
    Cart: (props: any) => (
        <svg width="22" height="24" viewBox="0 0 935 1024" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle', overflow: 'visible' }} {...props}>
            <path d="M308.143 71.238c46.049-45.855 108.459-71.487 173.44-71.237 123.29 0.047 225.244 91.358 241.971 210.043h121.522c23.543 0 43.012 18.326 44.442 41.824l42.772 704.454c0.744 12.252-3.606 24.273-12.021 33.213s-20.146 14.007-32.421 14.007h-843.326c-12.276 0-24.008-5.067-32.421-14.007s-12.762-20.961-12.018-33.213l42.771-704.454c1.427-23.498 20.899-41.824 44.44-41.824h151.316c7.436-52.286 31.673-101.105 69.534-138.806zM329.077 210.045h304.013c-15.663-69.272-77.592-120.999-151.601-120.999h-0.187c-41.336-0.175-81.039 16.122-110.329 45.289-21.016 20.927-35.43 47.243-41.896 75.71zM129.194 299.088l-37.365 615.411h748.711l-37.363-615.411h-673.983zM302.187 408.303h91.161v89.045h-91.161v-89.045zM572.118 408.303h91.158v89.045h-91.158v-89.045z" fill="rgb(66, 18, 15)" />
        </svg>
    ),
    IndFlag: () => (
        <svg width="24" height="16" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
            <rect width="900" height="200" fill="#FF9933" />
            <rect y="200" width="900" height="200" fill="#FFFFFF" />
            <rect y="400" width="900" height="200" fill="#138808" />
            <circle cx="450" cy="300" r="60" fill="none" stroke="#000080" strokeWidth="4" />
        </svg>
    ),
    Chevron: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"></polyline></svg>
    )
};

const NAV_CATEGORIES = [
    { label: "Sarees", href: "/shop?category=sarees" },
    { label: "Fabrics", href: "/shop?category=fabrics" },
    { label: "Fabric To Form", href: "/shop?category=fabric-to-form" },
    { label: "Lehenga", href: "/shop?category=lehenga" },
    { label: "Wedding Collections", href: "/collections?type=wedding" },
    { label: "Salwar Kameez", href: "/shop?category=salwar-kameez" },
    { label: "Saree Collections", href: "/collections?type=saree" },
    { label: "Festive Edits", href: "/collections?type=festive" },
    { label: "Kurtis", href: "/shop?category=kurtis" },
    { label: "Gowns", href: "/shop?category=gowns" },
    { label: "Blouses", href: "/shop?category=blouses" },
    { label: "Accessories", href: "/shop?category=accessories" },
    { label: "Men", href: "/shop?category=men" },
];

interface HeaderProps {
    logo?: string | null;
    mainCategories?: { id: string; name: string; href: string; mobileImage?: string | null }[];
}

export function Header({ logo, mainCategories = [] }: HeaderProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
    const { openCart, totalItems, syncWithUser, clearUserCart } = useCartStore();
    const { totalItems: wishlistCount, syncWithUser: syncWishlist, clearWishlist } = useWishlistStore();
    const { data: session, status } = useSession();
    const [mounted, setMounted] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const router = useRouter();

    const isProductPage = pathname?.startsWith('/shop/') && pathname !== '/shop';
    const productName = useHeaderStore(state => state.productName);

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            syncWithUser();
            syncWishlist();
        } else if (status === "unauthenticated") {
            clearUserCart();
            clearWishlist();
        }
    }, [status, syncWithUser, clearUserCart, syncWishlist, clearWishlist]);


    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
        }
    };

    return (
        <header className="w-full bg-white z-50 relative sticky top-0 font-sans shadow-sm">
            {/* ROW 2: Logo | Search | Actions */}
            <div className="container mx-auto px-6 md:px-[60px]">
                <div className="relative flex py-[8px] md:py-[12px] items-center">

                    {/* Mobile Header Left Section */}
                    {isProductPage ? (
                        <div className="flex md:hidden items-center gap-3 shrink-0 h-[40px] pl-[5px]">
                            <button
                                onClick={() => router.back()}
                                className="p-1 -ml-2 text-[#42120F]"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <Link
                                href="/"
                                className="w-[32px] h-[32px] rounded-full bg-[#42120F] text-white flex items-center justify-center shadow-sm shrink-0"
                                aria-label="Home"
                            >
                                <Home className="w-[16px] h-[16px]" strokeWidth={2} />
                            </Link>
                            <h1 className="text-[18px] font-medium text-[#42120F] truncate w-full flex-1 ml-2 text-center mr-auto mr-1" style={{ fontFamily: '"Playfair Display", serif', letterSpacing: '0.05em' }}>
                                {productName}
                            </h1>
                        </div>
                    ) : (
                        <div className="xl:hidden relative md:absolute md:left-0 flex items-center z-10 shrink-0">
                            <button
                                className="navTrigger-root cursor-pointer inline-flex items-center justify-center leading-none pointer-events-auto text-center h-[40px] md:h-[4rem] w-[40px] md:w-[4rem] flex-col"
                                onClick={() => setIsMobileMenuOpen(true)}
                                aria-label="Toggle navigation panel"
                            >
                                <span className="w-[24px] md:w-[30px] h-[2px] md:h-[3px] my-[3px] md:my-[5px] bg-primary"></span>
                                <span className="w-[24px] md:w-[30px] h-[2px] md:h-[3px] my-[3px] md:my-[5px] bg-primary"></span>
                                <span className="w-[24px] md:w-[30px] h-[2px] md:h-[3px] my-[3px] md:my-[5px] bg-primary"></span>
                            </button>
                        </div>
                    )}

                    {/* Logo — Centered on mobile, left aligned on desktop */}
                    <div className={cn(
                        "flex items-center shrink-0 h-[40px] md:h-[50px]",
                        isProductPage
                            ? "hidden md:flex md:pl-[48px] xl:pl-0 xl:-ml-[30px] md:-ml-[20px] ml-auto md:ml-0"
                            : "absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:pl-[48px] xl:pl-0 xl:-ml-[30px] md:-ml-[20px]"
                    )}>
                        <Link href="/" className="w-[100px] md:w-[150px] h-full flex items-center" aria-label="Vastraa Verse">
                            <Image
                                src={logo || "/logo.png"}
                                alt="Vastraa Verse Logo"
                                width={150}
                                height={50}
                                className="object-contain max-h-full w-auto scale-[2] md:scale-[3] origin-left"
                                priority
                                unoptimized
                            />
                        </Link>
                    </div>

                    {/* Search Bar (Middle - Light Grey BG) - Hidden on mobile */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="searchTrigger-root hidden md:flex h-[48px] items-center ml-0 md:ml-[8px] lg:ml-[16px] w-full md:w-[320px] lg:w-[420px] xl:w-[550px] bg-[#F3F3F3] border border-gray-200 mt-[12px] md:mt-0 px-[16px] md:px-[24px] rounded-[6px] overflow-hidden hover:bg-[#e8e8e8] duration-[300ms] transition-colors cursor-text shrink-0"
                        onClick={() => {
                            const input = document.getElementById('header-search-input');
                            if (input) input.focus();
                        }}
                    >
                        <Icons.Search />
                        <input
                            id="header-search-input"
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="searchTrigger-label sm:ml-2 pl-[16px] text-[14px] font-[400] text-text-muted w-full bg-transparent border-none outline-none placeholder-text-muted"
                            placeholder="Search for products and more"
                        />
                    </form>

                    {/* Right Actions Container */}
                    <div className="flex items-center ml-auto shrink-0 gap-[2px] md:gap-0">

                        {/* Search Icon (Mobile Only) */}
                        <div className="w-auto md:hidden block ml-[5px]">
                            <button className="p-[6px] flex items-center relative" onClick={(e) => { e.preventDefault(); setIsSearchOpen(true); }}>
                                <Icons.Search width="20" height="20" />
                            </button>
                        </div>



                        {status !== "authenticated" && (
                            <div className="w-auto ml-0 md:ml-[0.8rem]">
                                <button className="p-[6px] md:p-[8px] flex items-center relative" onClick={() => setIsTrackOrderOpen(true)}>
                                    <Icons.Truck width="20" height="20" className="md:w-[24px] md:h-[24px]" />
                                </button>
                            </div>
                        )}

                        {/* Wishlist Icon */}
                        <Link href="/wishlist">
                            <div className="w-auto ml-0 md:ml-[0.6rem]">
                                <button className="p-[6px] md:p-[8px] flex items-center relative">
                                    <Icons.Heart width="20" height="19" className="md:w-[24px] md:h-[23px]" />
                                    {mounted && wishlistCount() > 0 && (
                                        <span className="absolute top-0 right-0 flex items-center justify-center rounded-full font-bold bg-[#1a1a1a] text-white text-[10px] md:text-[12px] min-w-[18px] h-[18px] md:min-w-[22px] md:h-[22px] px-[4px] md:px-[5px] leading-none shadow-sm">
                                            {wishlistCount()}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </Link>

                        {/* Cart Icon */}
                        <div className="cartTrigger-triggerContainer items-center lg:grid ml-0 md:ml-[0.6rem]">
                            <button
                                onClick={openCart}
                                className="p-[6px] md:p-[8px] flex items-center relative"
                                aria-label="Toggle mini cart"
                            >
                                <Icons.Cart width="18" height="20" className="md:w-[22px] md:h-[24px]" />
                                {mounted && totalItems() > 0 && (
                                    <span className="absolute top-0 right-0 flex items-center justify-center rounded-full font-bold bg-[#1a1a1a] text-white text-[10px] md:text-[12px] min-w-[18px] h-[18px] md:min-w-[22px] md:h-[22px] px-[4px] md:px-[5px] leading-none shadow-sm">
                                        {totalItems()}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Profile Area (Avatar when logged in, or Login Text when logged out) */}
                        {status === "authenticated" && session?.user ? (
                            <div className={cn("hidden md:flex w-auto ml-0 md:ml-[0.6rem] relative", isProductPage && "hidden md:block")} ref={profileRef}>
                                <button
                                    className="p-[6px] md:p-[8px] flex items-center"
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    aria-label="Your account"
                                >
                                    <Icons.User width="20" height="20" className="md:w-[24px] md:h-[24px]" />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileOpen && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 w-[310px] z-[100] bg-white shadow-[0_12px_48px_rgba(0,0,0,0.08)] border border-[#EBEBEB] rounded-[8px] p-[20px] pt-[24px] transform origin-top-right transition-all duration-300 ease-out animate-in fade-in zoom-in-95">
                                        <div className="mb-[16px] pb-[20px] border-b border-[#EBEBEB] flex items-center gap-[16px]">
                                            <div className="flex items-center justify-center w-[54px] h-[54px] rounded-full bg-[#f4eade] shrink-0 border border-[#eddccc] shadow-sm">
                                                <span className="text-[22px] text-[#172026] font-normal font-sans uppercase">{session.user.name?.charAt(0) ?? session.user.email?.charAt(0)}</span>
                                            </div>
                                            <div className="overflow-hidden flex flex-col justify-center">
                                                <p className="font-semibold text-[#172026] text-[17px] leading-[22px] tracking-tight truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{session.user.name}</p>
                                                <p className="text-[14px] text-[#717171] mt-[3px] leading-tight truncate font-light tracking-wide">{(session.user as any)?.phone || session.user.email}</p>
                                            </div>
                                        </div>
                                        <nav className="flex flex-col gap-[4px] mt-[4px]">
                                            {[
                                                { href: "/profile", label: "Account" },
                                                { href: "/orders", label: "Orders" },
                                                { href: "/profile/addresses", label: "Addresses" },
                                                { href: "/wishlist", label: "Wishlist" },
                                            ].map(link => (
                                                <Link key={link.href} href={link.href} className="group relative flex items-center w-full px-[12px] py-[10px] rounded-[6px] text-[15px] font-medium text-[#2c3338] leading-[19px] overflow-hidden transition-all duration-300 hover:text-[#42120F]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                                    <div className="absolute inset-0 bg-[#fbf5ee] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-in-out"></div>
                                                    <span className="relative transform transition-transform duration-300 group-hover:translate-x-[4px]">{link.label}</span>
                                                </Link>
                                            ))}
                                        </nav>
                                        <div className="h-[1px] w-full bg-[#EBEBEB] my-[10px]"></div>
                                        <button onClick={() => { clearUserCart(); clearWishlist(); signOut(); }} className="group relative flex items-center w-full px-[12px] py-[10px] rounded-[6px] text-[15px] font-medium text-[#2c3338] leading-[19px] overflow-hidden transition-all duration-300 hover:text-[#d32f2f]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                            <div className="absolute inset-0 bg-[#fdf2f2] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-in-out"></div>
                                            <span className="relative transform transition-transform duration-300 group-hover:translate-x-[4px]">Sign Out</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {/* Desktop Login Button */}
                        {status !== "authenticated" && (
                            <div className="w-auto hidden md:flex z-[20] ml-[1.5rem]">
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="w-auto flex items-center justify-center bg-primary text-[#FFFFFF] leading-[1.2] font-semibold text-[16px] px-[32px] py-[16px] tracking-[0.05rem] hover:opacity-90 transition-opacity rounded-[6px]"
                                >
                                    Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>



            {/* Desktop Category Image Slider (hidden on mobile) */}
            {mainCategories && mainCategories.length > 0 && (
                <div className="hidden md:block w-full bg-[#f8f8f8] border-b border-gray-200 py-4">
                    <div className="container mx-auto px-6 md:px-[60px]">
                        <div
                            className="flex justify-start overflow-x-auto gap-6 pb-2 md:pl-[75px]"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        >
                            {mainCategories.map((cat) => (
                                <Link
                                    key={`desktop-slider-${cat.id}`}
                                    href={cat.href}
                                    className="flex flex-col items-center gap-2 flex-shrink-0 w-[110px] group"
                                >
                                    <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-2 border-white shadow-md bg-white relative flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                                        {cat.mobileImage ? (
                                            <Image
                                                src={cat.mobileImage}
                                                alt={cat.name}
                                                fill
                                                className="object-cover"
                                                sizes="100px"
                                            />
                                        ) : (
                                            <span className="block w-full h-full bg-[#f3f3f3]" />
                                        )}
                                    </div>
                                    <span className="text-[14px] font-semibold text-center leading-tight text-stone-800 group-hover:text-primary transition-colors">
                                        {cat.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Category Slider (Visible only on mobile, hidden on product pages) */}
            {!(pathname?.startsWith('/shop/') && pathname !== '/shop') && (
                <div className="md:hidden w-full bg-[#f8f8f8] py-3 border-b border-gray-200">
                    <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {mainCategories.map(cat => (
                            <Link
                                key={`mobile-slider-${cat.id}`}
                                href={cat.href}
                                className="flex flex-col items-center gap-2 flex-shrink-0 w-[90px]"
                            >
                                <div className="w-[80px] h-[80px] rounded-full overflow-hidden border-2 border-white shadow-md bg-white relative flex items-center justify-center">
                                    {cat.mobileImage ? (
                                        <Image
                                            src={cat.mobileImage}
                                            alt={cat.name}
                                            fill
                                            className="object-cover"
                                            sizes="80px"
                                        />
                                    ) : (
                                        <span className="text-[#e0e0e0] opacity-50 block w-full h-full bg-[#f3f3f3]" />
                                    )}
                                </div>
                                <span className="text-[13px] font-semibold text-center leading-tight truncate w-full text-stone-800">
                                    {cat.name}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed inset-y-0 left-0 w-[85%] max-w-[360px] bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Mobile Menu Header — User Profile Strip */}
                        <div className="flex items-center justify-between px-[20px] py-[16px] border-b border-[#EAEAEA] bg-white">
                            {status === "authenticated" && session?.user ? (
                                <div className="flex items-center gap-[14px]">
                                    {/* Initial Avatar */}
                                    <div className="w-[42px] h-[42px] rounded-full bg-[#f4eade] border border-[#eddccc] flex items-center justify-center shrink-0">
                                        <span className="text-[18px] font-semibold text-[#172026] uppercase">
                                            {session.user.name?.charAt(0) ?? session.user.email?.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-[#888] font-normal leading-tight">Hi,</p>
                                        <p className="text-[15px] font-semibold text-[#172026] leading-tight">{session.user.name}</p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                                    className="flex items-center gap-[14px] text-left"
                                >
                                    {/* Generic user avatar circle */}
                                    <div className="w-[42px] h-[42px] rounded-full bg-[#F3F3F3] border border-[#E0E0E0] flex items-center justify-center shrink-0">
                                        <Icons.User width="22" height="22" />
                                    </div>
                                    <div>
                                        <p className="text-[12px] text-[#888] font-normal leading-tight">Welcome</p>
                                        <p className="text-[15px] font-semibold text-[#172026] leading-tight">Signup/login</p>
                                    </div>
                                </button>
                            )}
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#172026] p-[4px]">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        {/* Nav Links with Chevrons */}
                        <nav className="flex-1 overflow-y-auto">
                            {mainCategories && mainCategories.length > 0 ? mainCategories.map(c => ({ label: c.name, href: c.href })).map(cat => (
                                <Link
                                    key={cat.href}
                                    href={cat.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="flex items-center justify-between px-[20px] py-[16px] text-[15px] text-primary font-semibold border-b border-[#F0F0F0] hover:bg-[#F9F9F9] transition-colors"
                                >
                                    <span>{cat.label}</span>
                                    <Icons.Chevron className="w-[16px] h-[16px] text-[#AAAAAA] shrink-0" />
                                </Link>
                            )) : (
                                <div className="p-6 text-center text-gray-500">No categories available</div>
                            )}

                            {/* Logged Out Links (Distinct Section) */}
                            {status !== "authenticated" && (
                                <div className="bg-[#f0ece1] pt-[8px] pb-[32px] mt-auto flex-1 min-h-full">
                                    <button
                                        onClick={() => { setIsMobileMenuOpen(false); setIsLoginModalOpen(true); }}
                                        className="w-full text-left px-[20px] py-[14px] text-[15px] font-medium text-[#172026] hover:bg-[#e6e2d6] transition-colors"
                                    >
                                        Log In / Sign Up
                                    </button>
                                    {[
                                        { label: "My Account", href: "/profile" },
                                        { label: "My Orders", href: "/orders" },
                                        { label: "Wishlist", href: "/wishlist" },
                                        { label: "Gift Card", href: "/gift-cards" },
                                        { label: "Book an Appointment", href: "/appointment" },
                                        { label: "Store Locator", href: "/stores" },
                                        { label: "Contact Us", href: "/contact" },
                                    ].map((link, idx) => (
                                        <Link
                                            key={idx}
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-[20px] py-[14px] text-[15px] font-medium text-[#172026] hover:bg-[#e6e2d6] transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {/* Account Links — shown only when logged in */}
                            {status === "authenticated" && (
                                <div className="bg-[#f0ece1] pb-[32px]">
                                    {[
                                        { label: "My Account", href: "/profile" },
                                        { label: "My Orders", href: "/orders" },
                                        { label: "Wishlist", href: "/wishlist" },
                                        { label: "Gift Card", href: "/gift-cards" },
                                        { label: "Book an Appointment", href: "/appointment" },
                                        { label: "Store Locator", href: "/stores" },
                                        { label: "Contact Us", href: "/contact" },
                                    ].map((link) => {
                                        const isActive = pathname === link.href;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`block px-[20px] py-[16px] text-[15px] transition-colors ${isActive
                                                    ? "text-[#42120F] font-semibold"
                                                    : "text-[#3D2C1E] font-normal hover:text-[#42120F]"
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                    <button
                                        onClick={() => { setIsMobileMenuOpen(false); clearUserCart(); clearWishlist(); signOut(); }}
                                        className="w-full text-left px-[20px] py-[16px] text-[15px] font-normal text-[#3D2C1E] hover:text-[#42120F] transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </nav>
                    </div>
                </div>
            )}

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            {/* Track Order Modal */}
            {isTrackOrderOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white p-8 max-w-[500px] w-full relative shadow-lg rounded-[8px]">
                        <button onClick={() => setIsTrackOrderOpen(false)} className="absolute top-6 right-6 text-text-muted hover:text-text-main">
                            <X className="w-6 h-6" />
                        </button>
                        <h2 className="text-[24px] font-medium text-text-main mb-3">Track Order</h2>
                        <p className="text-[16px] text-text-muted mb-8 leading-relaxed">
                            Enter your email or mobile number below to see your order status.
                        </p>
                        <form onSubmit={(e) => { e.preventDefault(); setIsTrackOrderOpen(false); }}>
                            <div className="flex gap-4 mb-8 relative items-center">
                                <label className="text-[16px] text-text-main w-[140px] leading-tight shrink-0">
                                    Your Mobile<br />Number / Email *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-[50px] px-4 border border-border-light text-[16px] outline-none focus:border-primary rounded-[6px]"
                                />
                            </div>
                            <button type="submit" className="w-full bg-[#3F110D] text-white h-[54px] font-medium text-[18px] hover:bg-[#2e0c09] transition-colors rounded-[6px]">
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}

// Simple X icon for mobile menu close
function X(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    );
}
