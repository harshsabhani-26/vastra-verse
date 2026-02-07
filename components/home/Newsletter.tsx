"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

export function Newsletter() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error("Please enter your email");
            return;
        }

        setLoading(true);

        // TODO: Add newsletter subscription API
        setTimeout(() => {
            toast.success("Thank you for subscribing!");
            setEmail("");
            setLoading(false);
        }, 1000);
    };

    return (
        <section className="w-full bg-primary py-16">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 max-w-full px-4">
                    {/* Left - Heading */}
                    <h3 className="text-base md:text-lg font-serif tracking-[0.05em] text-center md:text-left leading-relaxed text-white">
                        Enter Into The World of <br className="hidden md:block" />
                        <span className="text-secondary italic">Vastra Verse</span>
                    </h3>

                    {/* Right - Email Input */}
                    <form onSubmit={handleSubmit} className="flex items-center gap-4 w-full md:w-auto max-w-full">
                        <div className="relative flex-1 md:max-w-md">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full px-0 py-3 bg-transparent border-b border-white/20 text-white text-base placeholder:text-white/40 focus:outline-none focus:border-secondary transition-all duration-300"
                                disabled={loading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="p-3 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50 text-secondary hover:text-white"
                            aria-label="Subscribe"
                        >
                            <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
