"use client";

import { AccountSidebar } from "@/components/account/AccountSidebar";

export default function GiftCardsPage() {
    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-4xl">
                        <h1 className="text-3xl font-serif text-primary mb-10 tracking-wide">Gift Cards</h1>
                        <div className="bg-white p-8 border border-stone-200">
                            <p className="text-stone-600">You have no active gift cards.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
