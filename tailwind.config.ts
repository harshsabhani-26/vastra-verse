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
                    DEFAULT: "#1A3C34", // Deep Emerald Green
                    light: "#2C5E52",
                    dark: "#0F2621",
                },
                secondary: {
                    DEFAULT: "#D4AF37", // Gold
                    light: "#E5C564",
                    dark: "#AA8C2C",
                },
                accent: {
                    DEFAULT: "#8B0000", // Deep Red/Maroon
                    light: "#A52A2A",
                },
                background: "#F9F8F4", // Warm Off-white
                surface: "#FFFFFF",
                text: {
                    main: "#1C1917", // Warm Black
                    muted: "#57534E",
                },
            },
            fontFamily: {
                serif: ["var(--font-crimson-pro)", "serif"],
                sans: ["var(--font-montserrat)", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
