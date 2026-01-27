import type { Metadata } from "next";
import { Montserrat, Crimson_Pro } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const montserrat = Montserrat({
    variable: "--font-montserrat",
    subsets: ["latin"],
});

const crimsonPro = Crimson_Pro({
    variable: "--font-crimson-pro",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Vayana Heritage | Premium Indian Sarees",
    description: "Experience the elegance of traditional Indian heritage with our curated collection of premium sarees.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${montserrat.variable} ${crimsonPro.variable} antialiased base-transition bg-white text-gray-900 selection:bg-brand-gold/20`}
                suppressHydrationWarning
            >
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
