"use client";

import { Button } from "@/components/ui/button";
import { updateProfile } from "@/app/actions/account";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";

interface UserData {
    name: string | null;
    email: string | null;
    phone: string | null;
    newsletter: boolean;
}

export function ProfileForm({ user }: { user: UserData }) {
    const [isPending, startTransition] = useTransition();

    // Split name
    const fullName = user.name || "";
    const [firstNameDefault, ...lastNameParts] = fullName.split(" ");
    const lastNameDefault = lastNameParts.join(" ");

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated successfully");
            }
        });
    }

    return (
        <form action={handleSubmit} className="space-y-8">
            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-stone-500">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        defaultValue={firstNameDefault}
                        required
                        className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary font-medium"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-stone-500">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        defaultValue={lastNameDefault}
                        required
                        className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary font-medium"
                    />
                </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
                <label htmlFor="mobile" className="block text-xs uppercase tracking-wider text-stone-500">
                    Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4 items-end">
                    <select className="bg-transparent border-b border-stone-300 py-2 focus:outline-none text-primary w-20">
                        <option>+91</option>
                    </select>
                    <input
                        type="tel"
                        name="mobile"
                        id="mobile"
                        defaultValue={user.phone || ""}
                        required
                        maxLength={10}
                        pattern="[0-9]{10}"
                        className="flex-1 bg-transparent border-b border-stone-300 py-2 focus:outline-none focus:border-primary transition-colors text-primary font-medium"
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <label htmlFor="email" className="block text-xs uppercase tracking-wider text-stone-500">
                    Email <span className="text-red-500">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    defaultValue={user.email || ""}
                    disabled
                    className="w-full bg-transparent border-b border-stone-300 py-2 focus:outline-none text-stone-500 cursor-not-allowed"
                />
                <div className="mt-4 text-xs text-stone-500 space-y-1">
                    <p>Wish to change your email?</p>
                    <p>Reach out to us at <a href="mailto:care@anitadongre.com" className="underline hover:text-primary">care@anitadongre.com</a> or</p>
                    <p>call us at +91 99993 13366</p>
                </div>
            </div>

            {/* Newsletter */}
            <div className="flex items-center space-x-3 pt-4">
                <input
                    type="checkbox"
                    name="newsletter"
                    id="newsletter"
                    defaultChecked={user.newsletter}
                    className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary/20 bg-transparent"
                />
                <label htmlFor="newsletter" className="text-sm text-stone-600">
                    I would like to receive the Newsletter
                </label>
            </div>

            {/* Actions */}
            {/* Actions */}
            <div className="flex gap-4 pt-8">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full md:w-auto min-w-[200px] border-stone-800 text-stone-800 hover:bg-stone-50 uppercase tracking-widest text-xs h-12 rounded-none font-medium"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full md:w-auto min-w-[200px] bg-[#1a1a1a] text-white hover:bg-black uppercase tracking-widest text-xs h-12 rounded-none font-medium"
                >
                    {isPending ? "Saving..." : "Save"}
                </Button>
            </div>
        </form>
    );
}
