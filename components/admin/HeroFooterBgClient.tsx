"use client";

import { useState } from "react";
import { HeroFooterBgForm } from "@/components/admin/HeroFooterBgForm";
import { ImageIcon, Monitor } from "lucide-react";

interface HeroFooterBgClientProps {
    heroBg: string;
    footerBg: string;
    logo: string;
    footerLogo: string;
}

type Tab = "background" | "logo";

export function HeroFooterBgClient({ heroBg, footerBg, logo, footerLogo }: HeroFooterBgClientProps) {
    const [activeTab, setActiveTab] = useState<Tab>("background");

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Site Assets & Branding</h1>
                <p className="text-sm text-stone-500 mt-1">Manage watermark backgrounds and store logos globally.</p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-stone-200">
                    <button
                        onClick={() => setActiveTab("background")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "background"
                            ? "border-amber-500 text-amber-700 bg-amber-50/50"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                    >
                        <ImageIcon size={16} />
                        Backgrounds
                    </button>
                    <button
                        onClick={() => setActiveTab("logo")}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${activeTab === "logo"
                            ? "border-amber-500 text-amber-700 bg-amber-50/50"
                            : "border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                            }`}
                    >
                        <Monitor size={16} />
                        Logos
                    </button>
                </div>

                <div className="p-6">
                    {activeTab === "background" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg border border-stone-200 p-8">
                                <h2 className="text-xl font-bold tracking-tight text-[#1C1917] mb-6">Hero Background</h2>
                                <HeroFooterBgForm initialUrl={heroBg} type="hero" />
                            </div>
                            <div className="bg-white rounded-lg border border-stone-200 p-8">
                                <h2 className="text-xl font-bold tracking-tight text-[#1C1917] mb-6">Footer Background</h2>
                                <HeroFooterBgForm initialUrl={footerBg} type="footer" />
                            </div>
                        </div>
                    )}

                    {activeTab === "logo" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white rounded-lg border border-stone-200 p-8">
                                <h2 className="text-xl font-bold tracking-tight text-[#1C1917] mb-6">Store Main Logo</h2>
                                <HeroFooterBgForm initialUrl={logo} type="logo" />
                            </div>
                            <div className="bg-white rounded-lg border border-stone-200 p-8">
                                <h2 className="text-xl font-bold tracking-tight text-[#1C1917] mb-6">Store Footer Logo</h2>
                                <HeroFooterBgForm initialUrl={footerLogo} type="footerLogo" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
