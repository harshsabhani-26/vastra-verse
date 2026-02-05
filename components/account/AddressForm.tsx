"use client";

import { Button } from "@/components/ui/button";
import { addAddress } from "@/app/actions/account";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/input";

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
        <form action={handleSubmit} className="space-y-6 max-w-2xl bg-background p-6 rounded-sm border border-primary/5 shadow-luxury animate-fade-in-up md:p-8">
            <h2 className="text-2xl font-serif text-primary mb-6 tracking-tight">Add New Address</h2>

            <div className="space-y-2">
                <label htmlFor="title" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    Address Title <span className="text-red-500">*</span>
                </label>
                <Input type="text" name="title" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" placeholder="e.g. Home, Work" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">First Name <span className="text-red-500">*</span></label>
                    <Input type="text" name="firstName" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Last Name <span className="text-red-500">*</span></label>
                    <Input type="text" name="lastName" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="address1" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Address Line 1 <span className="text-red-500">*</span></label>
                <Input type="text" name="address1" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
            </div>

            <div className="space-y-2">
                <label htmlFor="address2" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Address Line 2</label>
                <Input type="text" name="address2" className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label htmlFor="country" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Country <span className="text-red-500">*</span></label>
                    <select name="country" className="w-full bg-surface/30 border border-primary/10 rounded-sm px-3 h-11 focus:outline-none focus:border-primary transition-colors text-primary text-sm">
                        <option value="India">India</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="zipCode" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">ZIP Code <span className="text-red-500">*</span></label>
                    <Input type="text" name="zipCode" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                    <label htmlFor="city" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">City <span className="text-red-500">*</span></label>
                    <Input type="text" name="city" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="state" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">State <span className="text-red-500">*</span></label>
                    <Input type="text" name="state" required className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Phone Number <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                    <select className="bg-surface/30 border border-primary/10 rounded-sm px-3 h-11 focus:outline-none text-primary w-24 text-sm">
                        <option>+91(IN)</option>
                    </select>
                    <Input type="tel" name="phone" required className="flex-1 bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11" />
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="type" className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">Address Type</label>
                <select name="type" className="w-full bg-surface/30 border border-primary/10 rounded-sm px-3 h-11 focus:outline-none focus:border-primary text-primary text-sm transition-colors">
                    <option value="Shipping">Shipping</option>
                    <option value="Billing">Billing</option>
                </select>
            </div>

            <div className="flex items-center space-x-3 pt-2">
                <input type="checkbox" name="isDefault" id="isDefault" className="h-4 w-4 rounded-sm border-primary/20 text-primary focus:ring-primary/20 bg-transparent" />
                <label htmlFor="isDefault" className="text-sm text-text-muted hover:text-primary transition-colors cursor-pointer select-none">Set as default shipping address</label>
            </div>

            <div className="flex gap-4 pt-6 mt-6 border-t border-primary/5">
                <Button type="button" variant="ghost" onClick={onCancel} className="flex-1 text-text-muted hover:text-primary hover:bg-surface uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-bold transition-all">Cancel</Button>
                <Button type="submit" disabled={isPending} className="flex-1 bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-bold shadow-luxury hover:shadow-elevated transition-all">{isPending ? "Saving..." : "Save Address"}</Button>
            </div>
        </form>
    );
}
