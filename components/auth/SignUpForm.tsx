"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignUpForm() {
    const [errorMessage, dispatch] = useActionState(register, undefined);

    return (
        <form action={dispatch} className="space-y-6 w-full max-w-sm">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-serif text-primary">Create Account</h1>
                <p className="text-sm text-muted-foreground">Join Vayana Heritage for exclusive access</p>
            </div>
            <div className="space-y-4">
                <div>
                    <Input
                        className="w-full"
                        id="name"
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        required
                    />
                </div>
                <div>
                    <Input
                        className="w-full"
                        id="email"
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        required
                    />
                </div>
                <div>
                    <Input
                        className="w-full"
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Password (Min 6 chars)"
                        required
                        minLength={6}
                    />
                </div>
            </div>
            <SignUpButton />
            <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                )}
            </div>
            <div className="text-center text-sm">
                <p>Already have an account? <Link href="/login" className="underline hover:text-primary">Sign in</Link></p>
            </div>
        </form>
    );
}

function SignUpButton() {
    const { pending } = useFormStatus();

    return (
        <Button className="w-full bg-primary hover:bg-primary-light text-white rounded-none h-12" aria-disabled={pending} disabled={pending}>
            {pending ? "Creating Account..." : "Sign Up"}
        </Button>
    );
}
