"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
            <CartDrawer />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#333',
                        color: '#fff',
                        fontFamily: 'var(--font-montserrat)'
                    }
                }}
            />
        </SessionProvider>
    );
}
