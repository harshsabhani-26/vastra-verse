import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import Image from "next/image";
import { Suspense } from "react";

export default function LoginPage() {
    return (
        <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center items-center py-16 bg-background animate-fade-in">
            <Suspense fallback={<div className="h-96 w-full flex items-center justify-center">Loading...</div>}>
                <UnifiedAuthForm />
            </Suspense>

            <div className="mt-8 text-center text-[10px] text-text-muted max-w-sm tracking-wide">
                By continuing, I agree to Vastraa Verse&apos;s <span className="text-primary font-medium hover:underline cursor-pointer">Privacy Policy</span> and <span className="text-primary font-medium hover:underline cursor-pointer">Terms of Use</span>.
            </div>
        </div>
    );
}
