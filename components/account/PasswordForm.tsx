"use client";

import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/actions/account";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

export function PasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    async function handleSubmit(formData: FormData) {
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        // Validate password complexity
        const hasMinLength = newPassword.length >= 8;
        const hasNumber = /\d/.test(newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasUpper = /[A-Z]/.test(newPassword);

        if (!hasMinLength || !hasNumber || !hasSpecial || !hasLower || !hasUpper) {
            toast.error("Password does not meet requirements");
            return;
        }

        startTransition(async () => {
            const result = await changePassword(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Password changed successfully");
                (document.getElementById("password-form") as HTMLFormElement).reset();
            }
        });
    }

    return (
        <form id="password-form" action={handleSubmit} className="space-y-8 max-w-lg">
            {/* Current Password */}
            <div className="space-y-2 relative">
                <label htmlFor="currentPassword" className="block text-sm text-stone-500">
                    Old Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        id="currentPassword"
                        required
                        className="w-full bg-transparent border-b border-stone-300 py-2 pr-10 focus:outline-none focus:border-primary transition-colors text-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-0 top-2 text-stone-400 hover:text-primary"
                    >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* New Password */}
            <div className="space-y-2 relative">
                <label htmlFor="newPassword" className="block text-sm text-stone-500">
                    Set password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        required
                        className="w-full bg-transparent border-b border-stone-300 py-2 pr-10 focus:outline-none focus:border-primary transition-colors text-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-0 top-2 text-stone-400 hover:text-primary"
                    >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 text-xs text-stone-500">
                    <ul className="list-disc pl-4 space-y-1">
                        <li>8 characters minimum</li>
                        <li>One number</li>
                        <li>At least 1 special character</li>
                    </ul>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>One lowercase character</li>
                        <li>One uppercase character</li>
                    </ul>
                </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2 relative">
                <label htmlFor="confirmPassword" className="block text-sm text-stone-500">
                    Confirm password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        required
                        className="w-full bg-transparent border-b border-stone-300 py-2 pr-10 focus:outline-none focus:border-primary transition-colors text-primary"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-0 top-2 text-stone-400 hover:text-primary"
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-primary-dark text-white hover:bg-primary-dark/90 border-none uppercase tracking-widest text-xs h-12 rounded-none"
                    onClick={() => (document.getElementById("password-form") as HTMLFormElement).reset()}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-black text-white hover:bg-black/90 uppercase tracking-widest text-xs h-12 rounded-none"
                >
                    {isPending ? "Saving..." : "Save"}
                </Button>
            </div>

            <div className="pt-4">
                <a href="/profile" className="text-sm underline text-stone-500 hover:text-primary">Back to my account</a>
            </div>
        </form>
    );
}
