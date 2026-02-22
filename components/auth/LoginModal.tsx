"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        // Prevent body scroll while modal is open
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div className="relative bg-white w-full max-w-[420px] mx-4 px-8 py-8 shadow-2xl rounded-sm">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Close login modal"
                >
                    <svg width="16" height="16" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                        <path d="M997.293 124.385l-97.76-97.76-387.574 387.573-387.573-387.573-97.76 97.76 387.573 387.573-387.573 387.574 97.76 97.76 387.573-387.574 387.574 387.574 97.76-97.76-387.574-387.574 387.574-387.573z" fill="currentColor" />
                    </svg>
                </button>

                {/* Title */}
                <h2 className="text-[22px] font-semibold text-[#172026] mb-6">Login or SignUp</h2>

                {/* Form */}
                <form action={dispatch} className="space-y-4">
                    <input
                        id="modal-email"
                        type="email"
                        name="email"
                        placeholder="Your Mobile Number / Email *"
                        required
                        className="w-full h-[48px] border border-gray-300 px-4 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#172026] rounded-sm"
                    />
                    <input
                        id="modal-password"
                        type="password"
                        name="password"
                        placeholder="Password *"
                        required
                        minLength={6}
                        className="w-full h-[48px] border border-gray-300 px-4 text-[14px] text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#172026] rounded-sm"
                    />

                    {errorMessage && (
                        <p className="text-sm text-red-500">{errorMessage}</p>
                    )}

                    <ContinueButton />
                </form>

                {/* Divider */}
                <div className="flex items-center my-5">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="px-3 text-[13px] text-gray-400">or continue with</span>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google Sign In */}
                <button
                    onClick={() => signIn("google")}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200 h-[44px] rounded-sm text-[14px] text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                    Sign in with Google
                </button>

                {/* Sign up link */}
                <p className="text-center text-[13px] text-gray-500 mt-5">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" onClick={onClose} className="text-[#172026] font-semibold underline hover:opacity-80">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
}

function ContinueButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className="w-full h-[48px] bg-primary text-white text-[14px] font-semibold tracking-wider rounded-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
            {pending ? "Please wait..." : "Continue"}
        </button>
    );
}
