import type { Metadata } from "next";
import { Judson, Teachers } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const teachers = Teachers({
    variable: "--font-teachers",
    subsets: ["latin"],
});

const judson = Judson({
    variable: "--font-judson",
    weight: ["400", "700"],
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
    const session = await auth();

    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${teachers.variable} ${judson.variable} antialiased base-transition bg-background text-text-main selection:bg-secondary/30 selection:text-primary-dark`}
                suppressHydrationWarning
            >
                <Providers session={session}>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
