import type { Metadata } from "next";
import { Cormorant_Infant, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";
// Removed WhatsAppButton and LiveShoppingButton unused imports
// FIX 13: Added display: 'swap' to both fonts.
// Next.js default is font-display: optional (hides text until font loads — FOIT).
// swap shows text in the system fallback font immediately, improving perceived FCP.
const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta-sans",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    display: "swap",
});

const cormorantInfant = Cormorant_Infant({
    variable: "--font-cormorant-infant",
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Vastraa Verse | Premium Indian Sarees",
    description: "Experience the elegance of traditional Indian heritage with our curated collection of premium sarees.",
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
};

import { auth } from "@/auth";

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let session = null;
    try {
        session = await auth();
    } catch {
        // Stale session cookie (e.g. AUTH_SECRET changed) — treat as logged out
    }

    return (
        <html lang="en" suppressHydrationWarning>
            {/* Google Analytics */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-1YZHT1P3ED"
                strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
                {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-1YZHT1P3ED');
                `}
            </Script>
            <body
                className={`${plusJakartaSans.variable} ${cormorantInfant.variable} antialiased font-sans bg-bg-grey text-text-main selection:bg-primary/30 selection:text-primary-dark`}
                suppressHydrationWarning
            >
                <Providers session={session}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
