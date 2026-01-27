"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Building2 } from "lucide-react";

export default function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <form action={dispatch} className="space-y-6 w-full max-w-sm">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-serif text-primary">Welcome Back</h1>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your account</p>
            </div>
            <div className="space-y-4">
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
                        placeholder="Password"
                        required
                        minLength={6}
                    />
                </div>
            </div>
            <LoginButton />
            <div className="flex h-8 items-end space-x-1" aria-live="polite" aria-atomic="true">
                {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                )}
            </div>
            <div className="text-center text-sm">
                <p>Don't have an account? <Link href="/signup" className="underline hover:text-primary">Sign up</Link></p>
            </div>
        </form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <Button className="w-full bg-primary hover:bg-primary-light text-white rounded-none h-12" aria-disabled={pending} disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
        </Button>
    );
}
