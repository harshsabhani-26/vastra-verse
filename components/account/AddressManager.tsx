"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddressForm } from "./AddressForm";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react";

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
                <div className="bg-surface/30 p-16 text-center rounded-sm border border-primary/5 shadow-sm">
                    <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-soft">
                        <MapPin className="w-8 h-8 text-primary/40" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-serif text-primary mb-3">No saved addresses</h3>
                    <p className="text-text-muted mb-8 font-light">Add an address for faster checkout.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => (
                        <div key={addr.id} className="bg-background p-6 border border-primary/10 rounded-sm shadow-sm hover:shadow-luxury transition-all duration-300 relative group">
                            {addr.isDefault && (
                                <span className="absolute top-4 right-4 text-[10px] uppercase tracking-wider bg-primary/10 px-2 py-1 text-primary rounded-sm font-medium">Default</span>
                            )}
                            <div className="mb-4">
                                <h3 className="font-serif text-lg text-primary mb-1">{addr.title}</h3>
                                <div className="h-0.5 w-8 bg-primary/20"></div>
                            </div>

                            <div className="space-y-1 text-sm text-text-muted leading-relaxed">
                                <p className="font-medium text-primary">{addr.firstName} {addr.lastName}</p>
                                <p>{addr.address1}</p>
                                {addr.address2 && <p>{addr.address2}</p>}
                                <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                                <p>{addr.country}</p>
                                <p className="pt-2 text-xs"><span className="text-primary/60 uppercase tracking-wider">Phone:</span> {addr.phone}</p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-primary/5 flex gap-4">
                                <button className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted hover:text-primary transition-colors font-medium">
                                    <Edit2 className="w-3 h-3" /> Edit
                                </button>
                                <button className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-muted hover:text-red-500 transition-colors font-medium">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Button
                onClick={() => setIsAdding(true)}
                className="w-full md:w-auto px-8 bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-bold shadow-luxury hover:shadow-elevated transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add New Address
            </Button>
        </div>
    );
}
