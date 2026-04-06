"use client";

import { useState } from "react";
import LiveShoppingModal from "./LiveShoppingModal";

export function LiveShoppingButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating LIVE Shopping Button */}
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Open Live Shopping"
                className="fixed top-[30%] right-0 z-[9998] flex flex-col items-center justify-center gap-1 w-[56px] md:w-[72px] py-2 md:py-[10px] px-1.5 md:px-2 rounded-l-xl bg-white text-[#1a1a1a] border border-black/10 shadow-[-4px_4px_20px_rgba(0,0,0,0.12)] cursor-pointer transition-all duration-200 hover:-translate-x-1 hover:shadow-[-6px_6px_28px_rgba(0,0,0,0.18)]"
            >
                {/* Pulsing green dot */}
                <span
                    className="absolute top-1.5 md:top-2 right-1.5 md:right-[10px] w-[6px] md:w-2 h-[6px] md:h-2 rounded-full bg-green-500"
                    style={{
                        animation: "live-pulse 1.8s ease-in-out infinite",
                    }}
                />

                {/* Orange Video Camera Icon */}
                <span className="flex items-center justify-center mb-0 md:mb-[2px] w-7 h-7 md:w-9 md:h-9 rounded-full bg-[#FF6B00]">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]"
                    >
                        <path d="M3 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5l4 2.5V8L16 10.5V8a2 2 0 0 0-2-2H3z"/>
                    </svg>
                </span>

                <span className="text-[8px] md:text-[10px] font-bold tracking-wider leading-none text-green-500">
                    LIVE
                </span>
                <span className="text-[8px] md:text-[10px] font-medium tracking-wide text-[#333333]">
                    Shopping
                </span>

                <style>{`
                    @keyframes live-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
                        70% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }
                    @media (min-width: 768px) {
                        @keyframes live-pulse {
                            0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
                            70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                            100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                        }
                    }
                `}</style>
            </button>

            {/* Modal */}
            <LiveShoppingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
