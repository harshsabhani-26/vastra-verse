import Link from "next/link";
import { ArrowRight, MapPin, Mail, Phone, Facebook, Instagram, Youtube, Twitter } from "lucide-react";

interface FooterProps {
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
}

export function Footer({ categories = [] }: FooterProps) {
    return (
        <footer>
            {/* Newsletter Section - Dark Green */}
            <div className="bg-[#1a4d3a] text-white py-12 md:py-16">
                <div className="container mx-auto px-4 md:px-12">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        <h3 className="text-xl md:text-2xl font-serif font-light tracking-wide whitespace-nowrap">
                            Enter Into The World of Vayana Heritage
                        </h3>

                        <div className="w-full md:w-auto md:min-w-[400px] relative">
                            <input
                                type="email"
                                placeholder="Enter Your Email Here"
                                className="w-full bg-transparent border-b border-white/40 py-3 pr-12 text-white placeholder:text-white/60 focus:outline-none focus:border-white transition-colors text-sm md:text-base font-light font-sans tracking-wide"
                            />
                            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors">
                                <ArrowRight className="h-5 w-5 font-thin" strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Section */}
            <div className="bg-[#FEFEFE] pt-16 pb-12">
                <div className="container mx-auto px-4 md:px-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-16">

                        {/* Column 1: Customer Care */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#000000] mb-6">Customer Care</h4>
                            <ul className="space-y-3 text-xs font-normal text-[#333333] tracking-wide">
                                <li><Link href="/policies/shipping" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Orders & Shipment</Link></li>
                                <li><Link href="/policies/returns" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Returns & Exchange</Link></li>
                                <li><Link href="/contact" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Contact Us</Link></li>
                                <li><Link href="/faq" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">FAQs</Link></li>
                                <li><Link href="/gift-cards" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Check Gift Card Balance</Link></li>
                            </ul>
                        </div>

                        {/* Column 2: Categories */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#000000] mb-6">Categories</h4>
                            <ul className="space-y-3 text-xs font-normal text-[#333333] tracking-wide">
                                {categories.slice(0, 5).map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={`/shop?category=${encodeURIComponent(category.name)}`}
                                            className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1"
                                        >
                                            {category.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3: Legal */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#000000] mb-6">Legal</h4>
                            <ul className="space-y-3 text-xs font-normal text-[#333333] tracking-wide">
                                <li><Link href="/policies/corporate" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Corporate Information</Link></li>
                                <li><Link href="/policies/terms" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Terms & Conditions</Link></li>
                                <li><Link href="/policies/privacy" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Privacy Policy</Link></li>
                                <li><Link href="/policies/cookie" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Cookie Policy</Link></li>
                                <li><Link href="/policies/shipping" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Shipping Policy</Link></li>
                            </ul>
                        </div>

                        {/* Column 4: Need Help */}
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#000000] mb-6">Need Help?</h4>
                            <ul className="space-y-3 text-xs font-normal text-[#333333] tracking-wide">
                                <li className="flex items-center gap-3">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#555555]" strokeWidth={1.5} />
                                    <Link href="/stores" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Store Locator</Link>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#555555]" strokeWidth={1.5} />
                                    <a href="https://mail.google.com/mail/?view=cm&fs=1&to=yogitextile43@gmail.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1">Email Us</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#555555]" strokeWidth={1.5} />
                                    <span className="flex items-center gap-1">
                                        WhatsApp / Call Us:
                                        <a href="https://wa.me/919725714184" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-colors hover:underline underline-offset-4 decoration-1 ml-1">
                                            +91 97257 14184
                                        </a>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="border-t border-gray-200 pt-8 mt-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            {/* Left: Copyright */}
                            <p className="text-[10px] uppercase tracking-wider text-[#555555] font-normal order-2 md:order-1">
                                © {new Date().getFullYear()} HOUSE OF VAYANA HERITAGE PRIVATE LIMITED. | ALL RIGHTS RESERVED.
                            </p>

                            {/* Center: Agreement */}
                            <p className="text-[10px] text-[#555555] font-normal uppercase tracking-wider order-3 md:order-2">
                                BY CONTINUING, I AGREE TO <Link href="/policies/privacy" className="underline underline-offset-2 hover:text-[#1a4d3a] transition-colors">VH PRIVACY POLICY</Link> AND <Link href="/policies/terms" className="underline underline-offset-2 hover:text-[#1a4d3a] transition-colors">TERMS OF USE</Link>
                            </p>

                            {/* Right: Socials */}
                            <div className="flex items-center space-x-6 text-[#555555] order-1 md:order-3">
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-all hover:scale-110"><Facebook className="h-4 w-4" strokeWidth={1.5} /></a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-all hover:scale-110"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>
                                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-all hover:scale-110"><Youtube className="h-4 w-4" strokeWidth={1.5} /></a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a4d3a] transition-all hover:scale-110"><Twitter className="h-4 w-4" strokeWidth={1.5} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
