import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        container: {
            center: true,
            padding: '1rem',
            screens: {
                xl: '1420px',
            },
        },
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#42120F", // Dark Maroon
                    dark: "#2A0907",
                },
                text: {
                    main: "#172026", // Off-black standard text
                    muted: "#666666",
                },
                bg: {
                    grey: "#F4F4F4",    // Light Grey Top Categories
                    beige: "#FAF0DB",   // Warm Beige Occasion
                    ultralight: "#F5F5F5", // Minimal grey backgrounds
                },
                border: {
                    light: "#E2E8F0",
                    dark: "#172026",
                }
            },
            fontFamily: {
                serif: ["var(--font-cormorant-infant)", "serif"],
                sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
            },
            spacing: {
                'section-sm': '3rem',
                'section-md': '5rem',
                'section-lg': '8rem',
            },
        },
    },
    plugins: [],
};
export default config;
