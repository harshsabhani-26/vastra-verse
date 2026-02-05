import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen w-full bg-background">
            <div className="hidden lg:flex w-1/2 bg-surface/10 items-center justify-center relative overflow-hidden">
                {/* Background Pattern or Image */}
                <div className="absolute inset-0 bg-primary/5 pattern-grid-lg opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />

                <div className="text-center z-20 p-16 max-w-lg">
                    <h2 className="text-5xl font-serif text-primary mb-6 tracking-tight leading-tight">Join the Legacy</h2>
                    <p className="text-xl text-text-muted italic font-light tracking-wide">"Exclusive collections, curated for the discerning few."</p>
                </div>
            </div>
            <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-8 lg:p-16">
                <UnifiedAuthForm />
            </div>
        </main>
    );
}
