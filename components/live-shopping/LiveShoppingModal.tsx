"use client";

import { useState, useEffect } from "react";

interface LiveShoppingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = "landing" | "booking" | "success";

const TIME_SLOTS = [
    "10:00 AM – 11:00 AM",
    "11:00 AM – 12:00 PM",
    "12:00 PM – 01:00 PM",
    "02:00 PM – 03:00 PM",
    "03:00 PM – 04:00 PM",
    "04:00 PM – 05:00 PM",
    "05:00 PM – 06:00 PM",
];

export default function LiveShoppingModal({ isOpen, onClose }: LiveShoppingModalProps) {
    const [step, setStep] = useState<Step>("landing");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [customBg, setCustomBg] = useState("");

    // Fetch admin-configured background on first open
    useEffect(() => {
        if (isOpen && !customBg) {
            fetch("/api/live-shopping-bg")
                .then((r) => r.json())
                .then((d) => { if (d.bg) setCustomBg(d.bg); })
                .catch(() => {});
        }
    }, [isOpen]);

    const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);

    const [form, setForm] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        appointmentDate: "",
        preferredTime: "",
        message: "",
    });

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    appointmentType: "VIDEO_CALL",
                    storeLocation: "Virtual",
                    allowPhoneContact: true,
                    newsletterSignup: false,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            setStep("success");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to book appointment");
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        onClose();
        // Reset after transition
        setTimeout(() => {
            setStep("landing");
            setError("");
            setForm({
                customerName: "",
                customerEmail: "",
                customerPhone: "",
                appointmentDate: "",
                preferredTime: "",
                message: "",
            });
        }, 300);
    }

    // Get today's date in YYYY-MM-DD for min date
    const today = new Date().toISOString().split("T")[0];

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 10000,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "opacity 0.3s ease",
                    backdropFilter: "blur(2px)",
                }}
            />

            {/* Modal Panel */}
            <div
                style={{
                    position: "fixed",
                    bottom: "100px",
                    right: "24px",
                    zIndex: 10001,
                    width: "340px",
                    maxHeight: "85vh",
                    borderRadius: "20px",
                    overflow: "hidden",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                    transform: isOpen ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
                    display: "flex",
                    flexDirection: "column",
                    background: "#fff",
                }}
            >
                {/* ─── Step 1: Landing ─── */}
                {step === "landing" && (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                        {/* Hero Background */}
                        <div
                            style={{
                                position: "relative",
                                height: "320px",
                                background: "linear-gradient(160deg, #42120F 0%, #6B1E1A 60%, #8B2E28 100%)",
                                overflow: "hidden",
                                flexShrink: 0,
                            }}
                        >
                            {/* Custom background overlay (image or video) */}
                            {customBg && (
                                isVideo(customBg) ? (
                                    <video
                                        src={customBg}
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div style={{
                                        position: "absolute",
                                        inset: 0,
                                        backgroundImage: `url("${customBg}")`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }} />
                                )
                            )}

                            {/* Decorative fabric pattern (only when no custom bg) */}
                            {!customBg && <div style={{
                                position: "absolute",
                                inset: 0,
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }} />}

                            {/* LIVE badge */}
                            <div style={{
                                position: "absolute",
                                top: "16px",
                                left: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                background: "rgba(0,0,0,0.35)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "20px",
                                padding: "5px 12px",
                            }}>
                                <span style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: "#22c55e",
                                    animation: "live-pulse 1.8s ease-in-out infinite",
                                    display: "inline-block",
                                    flexShrink: 0,
                                }} />
                                <span style={{ color: "#22c55e", fontWeight: 700, fontSize: "12px", letterSpacing: "0.08em" }}>LIVE</span>
                                <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500, fontSize: "12px" }}>Shopping</span>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                aria-label="Close"
                                style={{
                                    position: "absolute",
                                    top: "12px",
                                    right: "12px",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "rgba(0,0,0,0.3)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    color: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "16px",
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>

                            {/* Stylist Illustration Area */}
                            <div style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: "24px 24px 20px",
                                background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                            }}>
                                {/* Saree icon */}
                                <div style={{
                                    width: "72px",
                                    height: "72px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(8px)",
                                    border: "2px solid rgba(255,255,255,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: "12px",
                                    fontSize: "32px",
                                }}>
                                    👗
                                </div>
                                <h3 style={{
                                    color: "#fff",
                                    fontFamily: "var(--font-cormorant-infant), serif",
                                    fontSize: "20px",
                                    fontWeight: 600,
                                    textAlign: "center",
                                    margin: "0 0 6px",
                                    lineHeight: 1.3,
                                }}>
                                    Video Shop with a<br />Personal Stylist
                                </h3>
                                <p style={{
                                    color: "rgba(255,255,255,0.75)",
                                    fontSize: "12px",
                                    textAlign: "center",
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}>
                                    Your video will be off. We respect your privacy.
                                </p>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div style={{
                            padding: "20px 20px 16px",
                            display: "flex",
                            gap: "10px",
                            background: "#fff",
                        }}>
                            {/* Live Shop */}
                            <a
                                href="https://wa.me/918154949599?text=Hi%2C%20I%27d%20like%20to%20start%20a%20live%20video%20shopping%20session%20for%20sarees!"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#42120F",
                                    color: "#fff",
                                    borderRadius: "12px",
                                    padding: "14px 10px",
                                    textDecoration: "none",
                                    cursor: "pointer",
                                    transition: "background 0.2s ease",
                                }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#5a1a17")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#42120F")}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14v-4zm-12 0a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z"/>
                                </svg>
                                <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em" }}>Live Shop</span>
                            </a>

                            {/* Book Video Shop */}
                            <button
                                onClick={() => setStep("booking")}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "6px",
                                    background: "#FAF0DB",
                                    color: "#42120F",
                                    borderRadius: "12px",
                                    padding: "14px 10px",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background 0.2s ease",
                                    fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#f5e8c8")}
                                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "#FAF0DB")}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 18H5V8h14v13zM7 10h5v5H7z"/>
                                </svg>
                                <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.02em" }}>Book Video<br/>Shop</span>
                            </button>
                        </div>

                        {/* Powered by */}
                        <div style={{
                            textAlign: "center",
                            padding: "0 0 14px",
                            color: "#999",
                            fontSize: "11px",
                        }}>
                            ✨ Powered by Vastraa Verse
                        </div>
                    </div>
                )}

                {/* ─── Step 2: Booking Form ─── */}
                {step === "booking" && (
                    <div style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
                        {/* Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "16px 16px 14px",
                            borderBottom: "1px solid #f0f0f0",
                            background: "#fff",
                            flexShrink: 0,
                        }}>
                            <button
                                onClick={() => setStep("landing")}
                                aria-label="Back"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "#f5f5f5",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#42120F",
                                    flexShrink: 0,
                                }}
                            >
                                ←
                            </button>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#42120F" }}>
                                    Book Video Shopping
                                </h4>
                                <p style={{ margin: 0, fontSize: "11px", color: "#999" }}>Schedule a 1-on-1 session with our stylist</p>
                            </div>
                            <button
                                onClick={handleClose}
                                aria-label="Close"
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "#f5f5f5",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "16px",
                                    color: "#666",
                                    flexShrink: 0,
                                }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit}
                            style={{ overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
                        >
                            {/* Name */}
                            <div>
                                <label style={labelStyle}>Full Name *</label>
                                <input
                                    required
                                    type="text"
                                    name="customerName"
                                    value={form.customerName}
                                    onChange={handleChange}
                                    placeholder="Your full name"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    required
                                    type="email"
                                    name="customerEmail"
                                    value={form.customerEmail}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={labelStyle}>Phone *</label>
                                <input
                                    required
                                    type="tel"
                                    name="customerPhone"
                                    value={form.customerPhone}
                                    onChange={handleChange}
                                    placeholder="+91 XXXXX XXXXX"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Date */}
                            <div>
                                <label style={labelStyle}>Preferred Date *</label>
                                <input
                                    required
                                    type="date"
                                    name="appointmentDate"
                                    value={form.appointmentDate}
                                    min={today}
                                    onChange={handleChange}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Time Slot */}
                            <div>
                                <label style={labelStyle}>Preferred Time *</label>
                                <select
                                    required
                                    name="preferredTime"
                                    value={form.preferredTime}
                                    onChange={handleChange}
                                    style={inputStyle}
                                >
                                    <option value="">Select a time slot</option>
                                    {TIME_SLOTS.map((slot) => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Message */}
                            <div>
                                <label style={labelStyle}>What are you looking for?</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="E.g. bridal sarees, silk sarees under ₹10,000…"
                                    style={{ ...inputStyle, resize: "none" }}
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{
                                    background: "#FEF2F2",
                                    border: "1px solid #FECACA",
                                    color: "#B91C1C",
                                    fontSize: "12px",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                }}>
                                    {error}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    background: loading ? "#9a6b69" : "#42120F",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "10px",
                                    padding: "14px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    cursor: loading ? "not-allowed" : "pointer",
                                    transition: "background 0.2s ease",
                                    letterSpacing: "0.05em",
                                    fontFamily: "inherit",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                {loading ? (
                                    <>
                                        <span style={{
                                            width: "16px",
                                            height: "16px",
                                            border: "2px solid rgba(255,255,255,0.4)",
                                            borderTopColor: "#fff",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite",
                                            display: "inline-block",
                                        }} />
                                        Booking…
                                    </>
                                ) : "Confirm Appointment →"}
                            </button>

                            <p style={{ fontSize: "11px", color: "#aaa", textAlign: "center", margin: 0 }}>
                                We'll confirm your slot via WhatsApp & email within 2 hours.
                            </p>
                        </form>

                        <style>{`
                            @keyframes spin { to { transform: rotate(360deg); } }
                        `}</style>
                    </div>
                )}

                {/* ─── Step 3: Success ─── */}
                {step === "success" && (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px 24px",
                        textAlign: "center",
                        gap: "16px",
                        minHeight: "320px",
                        background: "#fff",
                    }}>
                        {/* Checkmark */}
                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #42120F, #6B1E1A)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            animation: "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h3 style={{
                            fontFamily: "var(--font-cormorant-infant), serif",
                            fontSize: "22px",
                            fontWeight: 700,
                            color: "#42120F",
                            margin: 0,
                            lineHeight: 1.3,
                        }}>
                            Appointment Booked!
                        </h3>

                        <p style={{ color: "#666", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
                            Our stylist will reach out to confirm your video shopping session via WhatsApp & email. Can&apos;t wait to help you find the perfect saree! 🥻
                        </p>

                        <button
                            onClick={handleClose}
                            style={{
                                marginTop: "8px",
                                background: "#42120F",
                                color: "#fff",
                                border: "none",
                                borderRadius: "10px",
                                padding: "12px 32px",
                                fontSize: "14px",
                                fontWeight: 600,
                                cursor: "pointer",
                                fontFamily: "inherit",
                            }}
                        >
                            Done
                        </button>

                        <style>{`
                            @keyframes scale-in { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        `}</style>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes live-pulse {
                    0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
                    70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
            `}</style>
        </>
    );
}

/* ─── Shared Styles ─── */
const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 600,
    color: "#42120F",
    marginBottom: "5px",
    letterSpacing: "0.03em",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e8e0d8",
    borderRadius: "8px",
    fontSize: "13px",
    color: "#172026",
    background: "#fafafa",
    outline: "none",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
    fontFamily: "inherit",
};
