"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube, Truck, ShieldCheck, Globe, CreditCard, BadgePercent, Clock, Phone, Mail, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FooterProps {
    categories: {
        id: string;
        name: string;
        slug: string;
    }[];
    footerBg?: string | null;
    footerLogo?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    facebook?: string | null;
}

export function Footer({ categories = [], footerBg, footerLogo, instagram, youtube, facebook }: FooterProps) {
    const whatsappUrl = `https://wa.me/918154949599?text=${encodeURIComponent("Hello! I would like to know more about M & H products.")}`;
    const [openSection, setOpenSection] = useState<string | null>(null);
    const toggle = (key: string) => setOpenSection(prev => prev === key ? null : key);

    return (
        <>
            {/* Trust Badges Banner */}
            <div className="w-full bg-[#FBFAFA] border-y border-[#EAEAEA] py-0 md:py-[55px]">
                <div className="container mx-auto px-4 md:px-8 max-w-[1240px]">

                    {/* MOBILE: vertical list with dividers — matches reference */}
                    <div className="md:hidden flex flex-col divide-y divide-[#E8E8E8]">
                        {[
                            { Icon: Truck, label: "Free Shipping" },
                            { Icon: ShieldCheck, label: "Assured Quality" },
                            { Icon: Globe, label: "World wide Shipping" },
                            { Icon: CreditCard, label: "100% Secure Payment" },
                            { Icon: BadgePercent, label: "Best Price Promise" },
                        ].map(({ Icon, label }) => (
                            <div key={label} className="flex items-center gap-[14px] py-[14px]">
                                <Icon className="w-[22px] h-[22px] text-black shrink-0" strokeWidth={1.5} />
                                <span className="text-[15px] font-semibold text-black tracking-wide">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* DESKTOP: original horizontal flex row */}
                    <div className="hidden md:flex flex-nowrap items-center justify-center gap-[30px] lg:gap-[50px] text-center">

                        <div className="flex items-center justify-center gap-[12px]">
                            <Truck className="w-[26px] h-[26px] text-black shrink-0" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-black tracking-wide whitespace-nowrap">Free Shipping</span>
                        </div>
                        <div className="w-[1px] h-[24px] bg-[#E1E1E1] shrink-0" />
                        <div className="flex items-center justify-center gap-[12px]">
                            <ShieldCheck className="w-[26px] h-[26px] text-black shrink-0" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-black tracking-wide whitespace-nowrap">Assured Quality</span>
                        </div>
                        <div className="w-[1px] h-[24px] bg-[#E1E1E1] shrink-0" />
                        <div className="flex items-center justify-center gap-[12px]">
                            <Globe className="w-[26px] h-[26px] text-black shrink-0" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-black tracking-wide whitespace-nowrap">World wide Shipping</span>
                        </div>
                        <div className="w-[1px] h-[24px] bg-[#E1E1E1] shrink-0" />
                        <div className="flex items-center justify-center gap-[12px]">
                            <CreditCard className="w-[26px] h-[26px] text-black shrink-0" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-black tracking-wide whitespace-nowrap">100% Secure Payment</span>
                        </div>
                        <div className="w-[1px] h-[24px] bg-[#E1E1E1] shrink-0" />
                        <div className="flex items-center justify-center gap-[12px]">
                            <BadgePercent className="w-[26px] h-[26px] text-black shrink-0" strokeWidth={1.5} />
                            <span className="text-[15px] font-medium text-black tracking-wide whitespace-nowrap">Best Price Promise</span>
                        </div>

                    </div>
                </div>
            </div>

            <footer className="w-full bg-[#1E1E1E] text-white pt-[60px] md:pt-[80px] pb-[30px] md:pb-[50px] font-sans relative overflow-hidden">
                {/* SVG Vector Background with Medium Opacity */}
                {footerBg && (
                    <div
                        className="absolute inset-0 z-0 pointer-events-none"
                        style={{
                            backgroundImage: `url("${footerBg}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.35
                        }}
                    ></div>
                )}

                <div className="container mx-auto px-4 md:px-[24px] relative z-10">

                    {/* Top Section - Split Layout */}
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-[20px] md:mb-[30px] gap-[30px] lg:gap-0">

                        {/* Left: Logo and Social Links */}
                        <div className="w-full lg:w-[15%] pr-[10px] flex flex-col items-start lg:items-start text-left lg:text-left">
                            {/* Logo */}
                            <div className="mb-[15px] md:mb-[20px] h-[45px] md:h-[55px] flex justify-start lg:justify-start items-center w-full pl-[10px] lg:pl-0">
                                <Link href="/" className="inline-block h-full relative" aria-label="Home">
                                    <Image
                                        src={footerLogo || "/logo.png"}
                                        alt="Logo"
                                        width={240}
                                        height={80}
                                        className={`object-contain object-left ${!footerLogo ? "filter brightness-0 invert" : ""} w-auto h-full max-h-full scale-[2.5] lg:scale-[4.0] origin-left -translate-y-[24px] lg:-translate-y-[54px]`}
                                        priority
                                        unoptimized
                                    />
                                </Link>
                            </div>

                            {/* Follow Us + Social Icons — DESKTOP only (mobile version is at bottom) */}
                            <div style={{ transform: 'translate(14px, 18px)' }} className="hidden lg:flex flex-col items-start lg:[transform:translate(14px,62px)]">

                                {/* 'Follow Us!' text */}
                                <h4 className="font-sans text-[13px] md:text-[14px] font-bold tracking-wide mb-[12px] text-[#A67C52]" style={{ color: '#D4AF37' }}>
                                    Follow Us!
                                </h4>

                                {/* Social Icons inside Circles */}
                                <div className="flex items-center justify-center lg:justify-start gap-[10px]">
                                    <a href={instagram || '#'} target={instagram ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Instagram">
                                        <Instagram className="w-[19px] h-[19px]" strokeWidth={2} />
                                    </a>
                                    <a href={youtube || '#'} target={youtube ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Youtube">
                                        <Youtube className="w-[19px] h-[19px]" strokeWidth={2} />
                                    </a>
                                    <a href={facebook || '#'} target={facebook ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Facebook">
                                        <Facebook className="w-[19px] h-[19px]" strokeWidth={2} />
                                    </a>
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] md:w-[42px] md:h-[42px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="WhatsApp">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9" />
                                            <path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                        </svg>
                                    </a>
                                </div>

                            </div>
                        </div>

                        {/* ── MOBILE: Accordion Nav (hidden on lg+) ── */}
                        <div className="lg:hidden w-full divide-y divide-white/10 mt-[10px]">

                            {/* Main Links */}
                            <div>
                                <button onClick={() => toggle('main')} className="w-full flex items-center justify-between py-[16px] text-left">
                                    <span className="text-[15px] font-medium text-white tracking-wide">Main Links</span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-[#A0A0A0] transition-transform duration-300 ${openSection === 'main' ? 'rotate-180' : ''}`} />
                                </button>
                                {openSection === 'main' && (
                                    <div className="pb-[16px] grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                                        <Link href="/about" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">About Us</Link>
                                        <Link href="/stores" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Store Locator</Link>
                                        <Link href="/appointment" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Book Appointment</Link>
                                        <Link href="/faq" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">FAQs</Link>
                                        <Link href="/contact" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Contact Us</Link>
                                        <Link href="/track-order" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Track Order</Link>
                                    </div>
                                )}
                            </div>

                            {/* Policies */}
                            <div>
                                <button onClick={() => toggle('policies')} className="w-full flex items-center justify-between py-[16px] text-left">
                                    <span className="text-[15px] font-medium text-white tracking-wide">Policies</span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-[#A0A0A0] transition-transform duration-300 ${openSection === 'policies' ? 'rotate-180' : ''}`} />
                                </button>
                                {openSection === 'policies' && (
                                    <div className="pb-[16px] grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                                        <Link href="/policies/shipping" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Shipping Policy</Link>
                                        <Link href="/policies/returns" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Return &amp; Exchange</Link>
                                        <Link href="/policies/privacy" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Privacy Policy</Link>
                                        <Link href="/policies/terms" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">Terms of Service</Link>
                                    </div>
                                )}
                            </div>

                            {/* Contact */}
                            <div>
                                <button onClick={() => toggle('contact')} className="w-full flex items-center justify-between py-[16px] text-left">
                                    <span className="text-[15px] font-medium text-white tracking-wide">Contact</span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-[#A0A0A0] transition-transform duration-300 ${openSection === 'contact' ? 'rotate-180' : ''}`} />
                                </button>
                                {openSection === 'contact' && (
                                    <div className="pb-[16px] grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                                        <div className="flex items-center gap-[8px]">
                                            <Clock className="w-[13px] h-[13px] text-[#A0A0A0] shrink-0" strokeWidth={1.5} />
                                            <span className="text-[14px] font-light text-[#CCCCCC]">Mon-Sat | 10AM - 7PM IST</span>
                                        </div>
                                        <div className="flex items-center gap-[8px]">
                                            <Phone className="w-[13px] h-[13px] text-[#A0A0A0] shrink-0" strokeWidth={1.5} />
                                            <a href="tel:+918154949599" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">+91 8154949599</a>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Customer Care */}
                            <div>
                                <button onClick={() => toggle('care')} className="w-full flex items-center justify-between py-[16px] text-left">
                                    <span className="text-[15px] font-medium text-white tracking-wide">Customer Care</span>
                                    <ChevronDown className={`w-[18px] h-[18px] text-[#A0A0A0] transition-transform duration-300 ${openSection === 'care' ? 'rotate-180' : ''}`} />
                                </button>
                                {openSection === 'care' && (
                                    <div className="pb-[16px] grid grid-cols-2 gap-x-[16px] gap-y-[16px]">
                                        <div className="flex items-center gap-[8px]">
                                            <Mail className="w-[13px] h-[13px] text-[#A0A0A0] shrink-0" strokeWidth={1.5} />
                                            <a href="mailto:care@vastraverse.com" className="text-[14px] font-light text-[#CCCCCC] hover:text-[#D4AF37] transition-colors">care@vastraverse.com</a>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Right: Navigation Columns — DESKTOP only */}
                        <div className="hidden lg:grid w-full lg:w-[82%] grid-cols-4 gap-y-[30px] gap-x-[20px] xl:gap-x-[40px] pl-[40px]">

                            {/* Main Links */}
                            <div className="flex flex-col">
                                <h4 className="font-sans text-[15px] md:text-[16px] font-medium text-[#A0A0A0] mb-[12px] md:mb-[16px] whitespace-nowrap">
                                    Main Links
                                </h4>
                                <ul className="space-y-[8px] md:space-y-[10px]">
                                    <li><Link href="/about" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">About Us</Link></li>
                                    <li><Link href="/stores" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Store Locator</Link></li>
                                    <li><Link href="/appointment" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Book Appointment</Link></li>
                                    <li><Link href="/faq" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">FAQs</Link></li>
                                    <li><Link href="/contact" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Contact Us</Link></li>
                                    <li><Link href="/track-order" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Track Order</Link></li>
                                </ul>
                            </div>

                            {/* Policies */}
                            <div className="flex flex-col">
                                <h4 className="font-sans text-[15px] md:text-[16px] font-medium text-[#A0A0A0] mb-[12px] md:mb-[16px] whitespace-nowrap">
                                    Policies
                                </h4>
                                <ul className="space-y-[8px] md:space-y-[10px]">
                                    <li><Link href="/policies/shipping" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Shipping Policy</Link></li>
                                    <li><Link href="/policies/returns" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Return & Exchange</Link></li>
                                    <li><Link href="/policies/privacy" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Privacy Policy</Link></li>
                                    <li><Link href="/policies/terms" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors tracking-wide whitespace-nowrap">Terms of Service</Link></li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div className="flex flex-col">
                                <h4 className="font-sans text-[15px] md:text-[16px] font-medium text-[#A0A0A0] mb-[12px] md:mb-[16px] whitespace-nowrap">
                                    Contact
                                </h4>
                                <ul className="space-y-[12px] md:space-y-[16px]">
                                    <li className="flex items-start gap-[12px] md:gap-[16px]">
                                        <Clock className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#A0A0A0] shrink-0 mt-[2px]" strokeWidth={1.5} />
                                        <span className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] leading-relaxed tracking-wide whitespace-nowrap">
                                            Mon-Sat | 10AM - 7PM IST
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-[12px] md:gap-[16px]">
                                        <Phone className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#A0A0A0] shrink-0 mt-[2px]" strokeWidth={1.5} />
                                        <a href="tel:+918154949599" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors leading-relaxed tracking-wide whitespace-nowrap">
                                            +91 8154949599
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            {/* Customer Care */}
                            <div className="flex flex-col">
                                <h4 className="font-sans text-[15px] md:text-[16px] font-medium text-[#A0A0A0] mb-[12px] md:mb-[16px] whitespace-nowrap">
                                    Customer Care
                                </h4>
                                <ul className="space-y-[12px] md:space-y-[16px]">
                                    <li className="flex items-start gap-[12px] md:gap-[16px]">
                                        <Mail className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#A0A0A0] shrink-0 mt-[2px]" strokeWidth={1.5} />
                                        <a href="mailto:care@vastraverse.com" className="text-[13px] md:text-[14px] font-light text-[#FFFFFF] hover:text-[#D4AF37] transition-colors leading-relaxed tracking-wide whitespace-nowrap">
                                            care@vastraverse.com
                                        </a>
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </div>

                    {/* MOBILE only: Follow Us + Social at bottom-left */}
                    <div className="lg:hidden mt-[24px] mb-[8px]">
                        <h4 className="text-[16px] font-bold tracking-wide mb-[12px]" style={{ color: '#D4AF37' }}>Follow Us!</h4>
                        <div className="flex items-center gap-[10px]">
                            <a href={instagram || '#'} target={instagram ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Instagram">
                                <Instagram className="w-[19px] h-[19px]" strokeWidth={2} />
                            </a>
                            <a href={youtube || '#'} target={youtube ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Youtube">
                                <Youtube className="w-[19px] h-[19px]" strokeWidth={2} />
                            </a>
                            <a href={facebook || '#'} target={facebook ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="Facebook">
                                <Facebook className="w-[19px] h-[19px]" strokeWidth={2} />
                            </a>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#2A2A2A] text-white hover:bg-[#3D3D3D] transition-colors" aria-label="WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9l-5.05.9" />
                                    <path d="M9 10a.5.5 0 0 0 1 0v-1a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Bottom - Copyright Line */}
                    <div className="w-full h-[1px] bg-white/20 mt-[16px] md:mt-[40px]" />

                    {/* Bottom - Copyright Text */}
                    <div className="w-full pt-[20px] pb-[20px] flex flex-col md:flex-row items-center md:items-start justify-between">
                        <p className="text-[12px] md:text-[13px] font-medium text-[#A0A0A0] tracking-wide text-center md:text-left">
                            © Copyright All rights reserved {new Date().getFullYear()} Vâstrâ Verse.
                        </p>
                    </div>

                </div>
            </footer>
        </>
    );
}
