"use client";

import dynamic from "next/dynamic";

// FIX: Priority 2 (JavaScript Rendering Blocking) Lazy-load heavy widgets to prevent blocking initial render
export const WhatsAppButton = dynamic(
    () => import("@/components/WhatsAppButton").then((mod) => mod.WhatsAppButton),
    { ssr: false }
);

export const LiveShoppingButton = dynamic(
    () => import("@/components/live-shopping/LiveShoppingButton").then((mod) => mod.LiveShoppingButton),
    { ssr: false }
);
