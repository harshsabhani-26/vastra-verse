import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="min-h-[calc(100vh-160px)] flex flex-col justify-center items-center py-12 bg-[#F9F8F4]">
            <UnifiedAuthForm />

            <div className="mt-8 text-center text-xs text-stone-400 max-w-sm">
                By continuing, I agree to Vayana Heritage&apos;s <span className="text-stone-800 font-medium">Privacy Policy</span> and <span className="text-stone-800 font-medium">Terms of Use</span>.
            </div>
        </div>
    );
}
