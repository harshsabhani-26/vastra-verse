"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Lock, Mail, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials");
                setLoading(false);
                return;
            }

            // Check if user has admin access
            const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "yogitextile43@gmail.com";
            if (email !== adminEmail) {
                setError("Access Denied - You are not authorized to access admin panel");
                setLoading(false);
                return;
            }

            router.push("/admin");
            router.refresh();
        } catch (err) {
            setError("An error occurred. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Admin Badge */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-serif text-white mb-2">Admin Panel</h1>
                    <p className="text-stone-400 text-sm">M & H Heritage</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-2xl p-8">
                    <h2 className="text-2xl font-semibold text-stone-800 mb-6 text-center">
                        Secure Login
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@example.com"
                                    className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 font-medium transition-colors"
                        >
                            {loading ? "Authenticating..." : "Login to Admin Panel"}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-stone-200">
                        <p className="text-xs text-stone-500 text-center">
                            This is a secure area. Unauthorized access is prohibited.
                        </p>
                    </div>
                </div>

                {/* Back to Site */}
                <div className="text-center mt-6">
                    <a
                        href="/"
                        className="text-sm text-stone-400 hover:text-white transition-colors"
                    >
                        ← Back to Website
                    </a>
                </div>
            </div>
        </div>
    );
}
