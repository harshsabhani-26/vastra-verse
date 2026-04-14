"use client";

import { Button } from "@/components/ui/button";
import { Maximize2, Map as MapIcon, Satellite, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";

// Mock Data based on the user's request
const STORES = [
    {
        id: 1,
        name: "Vastraa Verse Surat",
        address: "Shrungal Homes, Opp D-mart, Althan, Surat, Gujarat, India",
        timing: "11am to 7:30pm",
        phone: "+91 81549 49599",
        lat: 21.1448,
        lng: 72.8152,
    }
];

export default function StoreLocatorPage() {
    const [selectedStore, setSelectedStore] = useState(STORES[0]);
    const [mapType, setMapType] = useState<"m" | "k">("m"); // m = map, k = satellite
    const [mapKey, setMapKey] = useState(0);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            mapContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const getMapUrl = (lat: number, lng: number, type: "m" | "k") => {
        const baseUrl = "https://maps.google.com/maps";
        return `${baseUrl}?q=${lat},${lng}&t=${type}&z=15&ie=UTF8&iwloc=near&output=embed`;
    };

    const handleStoreClick = (store: typeof STORES[0]) => {
        setSelectedStore(store);
        setMapKey(prev => prev + 1);
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-stone-200">
                <div className="container mx-auto px-4 py-8 md:py-12 text-center">
                    <h1 className="font-serif text-3xl md:text-5xl text-[#1C1917]">Store Locator</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[700px] lg:h-[75vh]">
                    {/* List View */}
                    <div className="lg:col-span-4 overflow-y-auto pr-2 space-y-4 max-h-[300px] lg:max-h-none">
                        {STORES.map((store) => (
                            <div
                                key={store.id}
                                onClick={() => handleStoreClick(store)}
                                className={`p-6 cursor-pointer transition-all border relative ${selectedStore.id === store.id
                                    ? "bg-[#E5E0D5] border-[#AA8C2C] shadow-sm scale-[1.02]"
                                    : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-sm"
                                    }`}
                            >
                                {selectedStore.id === store.id && (
                                    <div className="absolute right-4 top-4">
                                        <div className="w-2 h-2 rounded-full bg-[#AA8C2C]" title="Selected"></div>
                                    </div>
                                )}
                                <h3 className="font-serif text-xl text-[#1C1917] mb-2">{store.name}</h3>
                                <p className="text-sm text-stone-600 mb-4 leading-relaxed">{store.address}</p>
                                <div className="space-y-1 text-sm text-stone-800">
                                    <p><span className="font-medium">Store Timing:</span> {store.timing}</p>
                                    <p>{store.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Map View Column */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        {/* Map Controls Toolbar - Placed OUTSIDE the iframe to avoid overlap */}
                        <div className="bg-white border border-stone-200 border-b-0 p-2 flex justify-between items-center rounded-t-md">
                            {/* Left: Map Type Toggles */}
                            <div className="flex bg-stone-100 p-1 rounded-md">
                                <button
                                    onClick={() => setMapType("m")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2 ${mapType === "m"
                                        ? "bg-white text-[#1C1917] shadow-sm"
                                        : "text-stone-500 hover:text-stone-700"
                                        }`}
                                >
                                    <MapIcon className="w-3 h-3" /> Map
                                </button>
                                <button
                                    onClick={() => setMapType("k")}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all flex items-center gap-2 ${mapType === "k"
                                        ? "bg-white text-[#1C1917] shadow-sm"
                                        : "text-stone-500 hover:text-stone-700"
                                        }`}
                                >
                                    <Satellite className="w-3 h-3" /> Satellite
                                </button>
                            </div>

                            {/* Right: Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="p-2 text-stone-500 hover:text-[#1C1917] hover:bg-stone-100 rounded-md transition-colors"
                                title="Toggle Fullscreen"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Map Container */}
                        <div
                            ref={mapContainerRef}
                            className="bg-stone-200 flex-1 w-full relative border border-stone-200 shadow-inner rounded-b-md overflow-hidden min-h-[450px] lg:min-h-0"
                        >
                            <iframe
                                key={`${selectedStore.id}-${mapType}-${mapKey}`}
                                src={getMapUrl(selectedStore.lat, selectedStore.lng, mapType)}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full absolute inset-0"
                            ></iframe>

                            {/* Place Card Overlay - Kept inside but positioned bottom-left to avoid top area */}
                            <div className="absolute bottom-6 left-6 bg-white p-4 shadow-lg max-w-sm border-l-4 border-[#AA8C2C] z-10 hidden md:block">
                                <h4 className="font-serif text-lg text-[#1C1917]">{selectedStore.name}</h4>
                                <p className="text-xs text-stone-500 mt-1">{selectedStore.address}</p>
                                <div className="mt-3 flex gap-2">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="sm" className="bg-[#1C1917] text-white text-xs h-8">
                                            Get Directions
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
