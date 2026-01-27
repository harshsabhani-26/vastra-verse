import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUpPage() {
    return (
        <main className="flex min-h-screen w-full">
            <div className="hidden lg:flex w-1/2 bg-stone-100 items-center justify-center relative overflow-hidden">
                {/* Placeholder for a premium saree image */}
                <div className="absolute inset-0 bg-secondary/10 mix-blend-multiply z-10" />
                <div className="text-center z-20 p-12">
                    <h2 className="text-4xl font-serif text-primary mb-4">Join the Legacy</h2>
                    <p className="text-xl text-stone-600 italic">"Exclusive collections, curated for you"</p>
                </div>
            </div>
            <div className="flex w-full lg:w-1/2 items-center justify-center bg-white p-8">
                <SignUpForm />
            </div>
        </main>
    );
}
