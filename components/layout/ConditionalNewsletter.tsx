"use client";

import { usePathname } from "next/navigation";
import { Newsletter } from "@/components/home/Newsletter";

export function ConditionalNewsletter() {
    const pathname = usePathname();

    // Don't show newsletter on home page (it already has one at the bottom)
    if (pathname === "/") {
        return null;
    }

    return <Newsletter />;
}
