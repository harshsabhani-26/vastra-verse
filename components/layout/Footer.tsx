import Link from "next/link";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";

interface FooterProps {
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
}

export function Footer({ categories = [] }: FooterProps) {
    return (
        <footer className="bg-background border-t border-primary/10 text-text-main pt-16">
            {/* Main Footer Section */}
            <div className="container mx-auto px-4 md:px-12 max-w-[1400px]">
                {/* Links Section */}
                <div className="pb-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 lg:gap-12">
                    {/* Column 1: Shop */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            Shop
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted hover:text-primary transition-colors duration-300 font-sans">
                            {categories.slice(0, 4).map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/shop?category=${encodeURIComponent(category.name)}`}
                                        className="hover:text-secondary transition-colors duration-300"
                                    >
                                        {category.name}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/shop" className="hover:text-secondary transition-colors duration-300 font-medium">
                                    View All
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 2: Customer Care */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            Customer Care
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted font-sans">
                            <li>
                                <Link href="/contact" className="hover:text-secondary transition-colors duration-300">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/shipping" className="hover:text-secondary transition-colors duration-300">
                                    Shipping Info
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/returns" className="hover:text-secondary transition-colors duration-300">
                                    Returns
                                </Link>
                            </li>
                            <li>
                                <Link href="/faq" className="hover:text-secondary transition-colors duration-300">
                                    FAQs
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: My Account */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            My Account
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted font-sans">
                            <li>
                                <Link href="/profile" className="hover:text-secondary transition-colors duration-300">
                                    Profile
                                </Link>
                            </li>
                            <li>
                                <Link href="/orders" className="hover:text-secondary transition-colors duration-300">
                                    Orders
                                </Link>
                            </li>
                            <li>
                                <Link href="/wishlist" className="hover:text-secondary transition-colors duration-300">
                                    Wishlist
                                </Link>
                            </li>
                            <li>
                                <Link href="/cart" className="hover:text-secondary transition-colors duration-300">
                                    Cart
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: About Us */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            About Us
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted font-sans">
                            <li>
                                <Link href="/about" className="hover:text-secondary transition-colors duration-300">
                                    Our Story
                                </Link>
                            </li>
                            <li>
                                <Link href="/stores" className="hover:text-secondary transition-colors duration-300">
                                    Store Locator
                                </Link>
                            </li>
                            <li>
                                <Link href="/appointments" className="hover:text-secondary transition-colors duration-300">
                                    Book Appointment
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 5: Policies */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            Policies
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted font-sans">
                            <li>
                                <Link href="/policies/privacy" className="hover:text-secondary transition-colors duration-300">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/terms" className="hover:text-secondary transition-colors duration-300">
                                    Terms of Use
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/cookie" className="hover:text-secondary transition-colors duration-300">
                                    Cookie Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 6: Contact Info */}
                    <div>
                        <h4 className="text-sm font-serif font-bold uppercase tracking-[0.15em] text-primary mb-8">
                            Contact
                        </h4>
                        <ul className="space-y-4 text-sm text-text-muted font-sans">
                            <li>
                                <a
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=yogitextile43@gmail.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-secondary transition-colors duration-300"
                                >
                                    Email Us
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://wa.me/919725714184"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-secondary transition-colors duration-300"
                                >
                                    WhatsApp
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+919725714184"
                                    className="hover:text-secondary transition-colors duration-300"
                                >
                                    +91 97257 14184
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Section - Copyright and Social - Dark Contrast */}
            <div className="bg-primary text-background py-8">
                <div className="container mx-auto px-4 md:px-12 max-w-[1400px]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        {/* Left - Copyright and Legal */}
                        <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-background/70 uppercase tracking-widest font-sans">
                            <p suppressHydrationWarning>
                                © {new Date().getFullYear()} Vastra Verse Private Limited.
                            </p>
                            <span className="hidden md:inline text-background/30">|</span>
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/policies/privacy"
                                    className="hover:text-secondary transition-colors"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href="/policies/terms"
                                    className="hover:text-secondary transition-colors"
                                >
                                    Terms
                                </Link>
                            </div>
                        </div>

                        {/* Right - Social Icons */}
                        <div className="flex items-center space-x-6 text-background/80">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-secondary transition-colors duration-300 transform hover:scale-110"
                                aria-label="Facebook"
                            >
                                <Facebook className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-secondary transition-colors duration-300 transform hover:scale-110"
                                aria-label="Instagram"
                            >
                                <Instagram className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                            <a
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-secondary transition-colors duration-300 transform hover:scale-110"
                                aria-label="YouTube"
                            >
                                <Youtube className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-secondary transition-colors duration-300 transform hover:scale-110"
                                aria-label="Twitter"
                            >
                                <Twitter className="h-5 w-5" strokeWidth={1.5} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
