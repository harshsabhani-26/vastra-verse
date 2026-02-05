import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#4A3B32", // Deep Walnut Brown
                    light: "#6D5849",   // Lighter Walnut
                    dark: "#2E150B",    // Dark Cocoa
                },
                secondary: {
                    DEFAULT: "#D4AF37", // Muted Gold (Classic Luxury)
                    light: "#E6C87A",   // Light Champagne Gold
                    dark: "#A68625",    // Antique Gold
                },
                accent: {
                    DEFAULT: "#C5A085", // Warm Beige / Terracotta tint
                    light: "#DEC0AA",   // Pale Beige
                },
                background: "#F9F7F2", // Warm Ivory (Dominant Light)
                surface: "#FFFFFF",     // Pure White (Cards/Modals)
                text: {
                    main: "#2E150B",    // Deepest Brown (Almost Black)
                    muted: "#8A7E76",   // Warm Grey
                    secondary: "#4A3B32", // Primary Brown
                    light: "#F9F7F2",   // Ivory (for dark backgrounds)
                },
                luxury: {
                    black: "#1A1A1A",
                    gold: "#D4AF37",
                }
            },
            fontFamily: {
                serif: ["var(--font-judson)", "serif"],
                sans: ["var(--font-teachers)", "sans-serif"],
            },
            spacing: {
                'section-sm': '3rem', // 48px - Increased for airiness
                'section-md': '5rem', // 80px
                'section-lg': '8rem',   // 128px
                'section-xl': '10rem',   // 160px
            },
            backgroundImage: {
                "gradient-luxury": "linear-gradient(to bottom, #F9F7F2 0%, #FFFDF9 100%)",
                "gradient-gold": "linear-gradient(135deg, #D4AF37 0%, #E6C87A 100%)",
                "gradient-dark": "linear-gradient(135deg, #4A3B32 0%, #2E150B 100%)",
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(74, 59, 50, 0.05)',
                'card': '0 0 0 1px rgba(74, 59, 50, 0.05), 0 2px 8px rgba(74, 59, 50, 0.05)',
                'elevated': '0 20px 40px -4px rgba(74, 59, 50, 0.1)',
                'luxury': '0 10px 30px -5px rgba(74, 59, 50, 0.08)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
            }
        },
    },
    plugins: [],
};
export default config;
