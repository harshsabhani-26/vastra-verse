"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Package,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search
} from "lucide-react";

interface TrackingData {
    awb: string;
    courierName?: string;
    status: string;
    isReturn: boolean;
    pickupScheduledAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    estimatedDeliveryAt?: string;
    trackingUrl?: string;
    liveTracking?: {
        current_status: string;
        destination: string;
        origin: string;
        edd?: string;
        shipment_track_activities?: Array<{
            date: string;
            activity: string;
            location: string;
        }>;
    };
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    PENDING: { label: "Pending", icon: Clock, color: "bg-gray-100 text-gray-800" },
    READY_TO_SHIP: { label: "Ready to Ship", icon: Package, color: "bg-blue-100 text-blue-800" },
    PICKUP_SCHEDULED: { label: "Pickup Scheduled", icon: Clock, color: "bg-purple-100 text-purple-800" },
    IN_TRANSIT: { label: "In Transit", icon: Truck, color: "bg-yellow-100 text-yellow-800" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", icon: Truck, color: "bg-orange-100 text-orange-800" },
    DELIVERED: { label: "Delivered", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
    RETURN_INITIATED: { label: "Return Initiated", icon: AlertCircle, color: "bg-orange-100 text-orange-800" }
};


function TrackOrderContent() {
    const searchParams = useSearchParams();
    const [awbInput, setAwbInput] = useState(searchParams.get("awb") || "");
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const awbFromUrl = searchParams.get("awb");
        if (awbFromUrl) {
            fetchTracking(awbFromUrl);
        }
    }, [searchParams]);

    const fetchTracking = async (awb: string) => {
        if (!awb || awb.length < 10) {
            setError("Please enter a valid AWB number");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/tracking/${awb}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Shipment not found");
            }

            setTracking(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch tracking information");
            setTracking(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchTracking(awbInput);
    };

    const statusConfig = tracking ? STATUS_CONFIG[tracking.status] : null;
    const StatusIcon = statusConfig?.icon;

    return (
        <div className="min-h-screen bg-stone-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-stone-900 mb-2">Track Your Order</h1>
                    <p className="text-stone-600">Enter your AWB number to track your shipment</p>
                </div>

                <form onSubmit={handleSearch} className="mb-8">
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter AWB Number (e.g., SR1234567890)"
                            value={awbInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAwbInput(e.target.value.toUpperCase())}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading}>
                            {loading ? "Tracking..." : <><Search className="w-4 h-4 mr-2" />Track</>}
                        </Button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {tracking && (
                    <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                            <div>
                                <p className="text-sm text-stone-500">AWB Number</p>
                                <p className="font-mono font-semibold text-lg">{tracking.awb}</p>
                            </div>
                            {statusConfig && (
                                <Badge className={`${statusConfig.color} px-4 py-2`}>
                                    {StatusIcon && <StatusIcon className="w-4 h-4 mr-2" />}
                                    {statusConfig.label}
                                </Badge>
                            )}
                        </div>

                        {tracking.courierName && (
                            <div>
                                <p className="text-sm text-stone-500">Courier Partner</p>
                                <p className="font-semibold">{tracking.courierName}</p>
                            </div>
                        )}

                        {tracking.estimatedDeliveryAt && (
                            <div>
                                <p className="text-sm text-stone-500">Estimated Delivery</p>
                                <p className="font-semibold">
                                    {new Date(tracking.estimatedDeliveryAt).toLocaleDateString('en-IN', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}

                        {tracking.liveTracking?.shipment_track_activities && (
                            <div>
                                <h3 className="font-semibold mb-4">Tracking Timeline</h3>
                                <div className="space-y-4">
                                    {tracking.liveTracking.shipment_track_activities.map((activity, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-stone-300'}`} />
                                                {index < tracking.liveTracking!.shipment_track_activities!.length - 1 && (
                                                    <div className="w-0.5 h-12 bg-stone-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <p className="font-medium text-stone-900">{activity.activity}</p>
                                                <p className="text-sm text-stone-600">{activity.location}</p>
                                                <p className="text-xs text-stone-500 mt-1">
                                                    {new Date(activity.date).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tracking.trackingUrl && (
                            <div className="pt-4 border-t border-stone-200">
                                <Button asChild variant="outline" className="w-full">
                                    <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
                                        View Detailed Tracking on Courier Website
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-stone-50 py-12 px-4 flex justify-center items-center">
                <p className="text-stone-500">Loading tracking page...</p>
            </div>
        }>
            <TrackOrderContent />
        </Suspense>
    );
}
