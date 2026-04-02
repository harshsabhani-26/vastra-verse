import type { Metadata } from "next";
import { Cormorant_Infant, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { LiveShoppingButton } from "@/components/live-shopping/LiveShoppingButton";

const plusJakartaSans = Plus_Jakarta_Sans({
    variable: "--font-plus-jakarta-sans", // Match custom tailwind variable
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const cormorantInfant = Cormorant_Infant({
    variable: "--font-cormorant-infant", // Match custom tailwind variable
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Vastra Verse | Premium Indian Sarees",
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
            <body
                className={`${plusJakartaSans.variable} ${cormorantInfant.variable} antialiased font-sans bg-bg-grey text-text-main selection:bg-primary/30 selection:text-primary-dark`}
                suppressHydrationWarning
            >
                <Providers session={session}>
                    {children}
                </Providers>
                <LiveShoppingButton />
                <WhatsAppButton
                    phoneNumber="919876543210"
                    defaultMessage="Hello! I'm interested in your saree collection."
                />
            </body>
        </html>
    );
}
