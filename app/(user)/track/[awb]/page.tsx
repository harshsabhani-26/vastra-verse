import { Suspense } from "react";
import { notFound } from "next/navigation";
import TrackingPageClient from "./TrackingPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ awb: string }> }) {
    const { awb } = await params;
    return {
        title: `Track Shipment ${awb} | Vastra Verse`,
        description: `Track your Vastra Verse shipment with AWB number ${awb}`,
    };
}

async function fetchTrackingData(awb: string) {
    // Build absolute URL for server-side fetch
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    try {
        const res = await fetch(`${baseUrl}/api/tracking/${awb}`, {
            cache: "no-store",
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export default async function TrackingPage({ params }: { params: Promise<{ awb: string }> }) {
    const { awb } = await params;

    if (!awb || awb.length < 5) {
        notFound();
    }

    const trackingData = await fetchTrackingData(awb);

    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                    <div className="animate-pulse text-stone-400">Loading tracking information...</div>
                </div>
            }
        >
            <TrackingPageClient awb={awb} initialData={trackingData} />
        </Suspense>
    );
}
