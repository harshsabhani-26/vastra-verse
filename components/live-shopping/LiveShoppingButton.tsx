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
                style={{
                    position: "fixed",
                    top: "30%",
                    right: "0px",
                    zIndex: 9998,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    width: "72px",
                    padding: "10px 8px 10px",
                    borderRadius: "12px 0 0 12px",
                    background: "#ffffff",
                    color: "#1a1a1a",
                    border: "1px solid rgba(0,0,0,0.08)",
                    boxShadow: "-4px 4px 20px rgba(0,0,0,0.12)",
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(-4px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "-6px 6px 28px rgba(0,0,0,0.18)";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "-4px 4px 20px rgba(0,0,0,0.12)";
                }}
            >
                {/* Pulsing green dot */}
                <span
                    style={{
                        position: "absolute",
                        top: "8px",
                        right: "10px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 0 0 rgba(34, 197, 94, 0.6)",
                        animation: "live-pulse 1.8s ease-in-out infinite",
                    }}
                />

                {/* Orange Video Camera Icon */}
                <span style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "#FF6B00",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "2px",
                }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        width="18"
                        height="18"
                    >
                        <path d="M3 6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-2.5l4 2.5V8L16 10.5V8a2 2 0 0 0-2-2H3z"/>
                    </svg>
                </span>

                <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                    color: "#22c55e",
                }}>
                    LIVE
                </span>
                <span style={{
                    fontSize: "10px",
                    fontWeight: "500",
                    color: "#333333",
                    letterSpacing: "0.01em",
                }}>
                    Shopping
                </span>

                <style>{`
                    @keyframes live-pulse {
                        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
                        70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                    }
                `}</style>
            </button>

            {/* Modal */}
            <LiveShoppingModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
