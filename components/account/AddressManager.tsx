"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./AddressForm";

interface Address {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    isDefault: boolean;
}

export default function AddressManager({ addresses }: { addresses: Address[] }) {
    const [isAdding, setIsAdding] = useState(false);

    if (isAdding) {
        return <AddressForm onCancel={() => setIsAdding(false)} />;
    }

    return (
        <div className="space-y-6">
            {addresses.length === 0 ? (
                <p className="text-stone-600 mb-8">No saved addresses</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="bg-white p-6 border border-stone-200 relative">
                            {addr.isDefault && (
                                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider bg-stone-100 px-2 py-1 text-stone-600">Default</span>
                            )}
                            <h3 className="font-serif text-lg text-primary mb-2">{addr.title}</h3>
                            <p className="text-sm text-stone-600 leading-relaxed">
                                {addr.firstName} {addr.lastName}<br />
                                {addr.address1}<br />
                                {addr.address2 && <>{addr.address2}<br /></>}
                                {addr.city}, {addr.state} {addr.zipCode}<br />
                                {addr.country}
                            </p>
                            <p className="text-sm text-stone-600 mt-2">T: {addr.phone}</p>
                            <div className="mt-4 pt-4 border-t border-stone-100 flex gap-4 text-xs uppercase tracking-wider">
                                <button className="text-stone-500 hover:text-primary">Edit</button>
                                <button className="text-stone-500 hover:text-red-600">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Button
                onClick={() => setIsAdding(true)}
                variant="outline"
                className="w-full md:w-auto px-8 border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-widest text-xs h-12 rounded-none"
            >
                Add New Address
            </Button>

            <div className="pt-4">
                <a href="/profile" className="text-sm underline text-stone-500 hover:text-primary">Back to my account</a>
            </div>
        </div>
    );
}
