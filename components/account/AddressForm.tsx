"use client";

import { Button } from "@/components/ui/button";
import { addAddress } from "@/app/actions/account";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";

export function AddressForm({ onCancel }: { onCancel: () => void }) {
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await addAddress(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Address added successfully");
                onCancel();
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-8 max-w-lg mt-8">
            <h2 className="text-xl font-serif text-primary">Add New Address</h2>

            <div className="space-y-2">
                <label htmlFor="title" className="block text-xs uppercase tracking-wider text-stone-500">
                    Address Title <span className="text-red-500">*</span>
                </label>
                <input type="text" name="title" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" placeholder="e.g. Home, Work" />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-stone-500">First Name <span className="text-red-500">*</span></label>
                    <input type="text" name="firstName" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-stone-500">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="address1" className="block text-xs uppercase tracking-wider text-stone-500">Address 1 <span className="text-red-500">*</span></label>
                <input type="text" name="address1" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
            </div>

            <div className="space-y-2">
                <label htmlFor="address2" className="block text-xs uppercase tracking-wider text-stone-500">Address 2</label>
                <input type="text" name="address2" className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="country" className="block text-xs uppercase tracking-wider text-stone-500">Country <span className="text-red-500">*</span></label>
                    <select name="country" className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none text-primary">
                        <option value="India">India</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="zipCode" className="block text-xs uppercase tracking-wider text-stone-500">ZIP Code <span className="text-red-500">*</span></label>
                    <input type="text" name="zipCode" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="city" className="block text-xs uppercase tracking-wider text-stone-500">City <span className="text-red-500">*</span></label>
                    <input type="text" name="city" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="state" className="block text-xs uppercase tracking-wider text-stone-500">State <span className="text-red-500">*</span></label>
                    <input type="text" name="state" required className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-wider text-stone-500">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                    <select className="bg-transparent border-b border-stone-300 py-2 focus:outline-none text-primary w-24">
                        <option>+91(IN)</option>
                    </select>
                    <input type="tel" name="phone" required className="flex-1 bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="type" className="block text-xs uppercase tracking-wider text-stone-500">Address Type:</label>
                <select name="type" className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none text-primary">
                    <option value="Shipping">Shipping</option>
                    <option value="Billing">Billing</option>
                </select>
            </div>

            <div className="flex items-center space-x-3 pt-2">
                <input type="checkbox" name="isDefault" id="isDefault" className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary/20 bg-transparent" />
                <label htmlFor="isDefault" className="text-sm text-stone-600">Default Shipping address</label>
            </div>

            <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} className="w-full md:w-auto min-w-[140px] border-primary text-primary hover:bg-primary hover:text-white uppercase tracking-widest text-xs h-12 rounded-none">Cancel</Button>
                <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[140px] bg-stone-500 text-white hover:bg-stone-600 uppercase tracking-widest text-xs h-12 rounded-none">{isPending ? "Saving..." : "Save"}</Button>
            </div>
        </form>
    );
}
