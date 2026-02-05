"use client";

import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/actions/account";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

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
            <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                    <Input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        id="currentPassword"
                        required
                        className="pl-9 pr-10 bg-background border-primary/20 focus:border-primary focus:ring-0 rounded-sm h-11 transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-3.5 text-text-muted hover:text-primary transition-colors"
                    >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
                <label htmlFor="newPassword" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                    <Input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        required
                        className="pl-9 pr-10 bg-background border-primary/20 focus:border-primary focus:ring-0 rounded-sm h-11 transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3.5 text-text-muted hover:text-primary transition-colors"
                    >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 text-[10px] text-text-muted bg-surface/30 p-4 rounded-sm border border-primary/5">
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
            <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                    <Input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        required
                        className="pl-9 pr-10 bg-background border-primary/20 focus:border-primary focus:ring-0 rounded-sm h-11 transition-all"
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3.5 text-text-muted hover:text-primary transition-colors"
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t border-primary/10 mt-8">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-text-muted hover:text-primary hover:bg-surface uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-medium transition-all"
                    onClick={() => (document.getElementById("password-form") as HTMLFormElement).reset()}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-bold shadow-luxury hover:shadow-elevated transition-all"
                >
                    {isPending ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </form>
    );
}
