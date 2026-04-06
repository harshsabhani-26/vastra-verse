"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { checkUserExists, authenticate, register } from "@/lib/actions";
import { GoogleLogo } from "@/components/auth/GoogleLogo";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, Mail } from "lucide-react";

export function UnifiedAuthForm() {
    const [step, setStep] = useState<"EMAIL" | "LOGIN" | "REGISTER">("EMAIL");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    // Login state
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Register state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [newsletter, setNewsletter] = useState(false);

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpMethod] = useState<"email">("email"); // Always email now

    // OTP Timer countdown
    useEffect(() => {
        if (otpTimer > 0) {
            const interval = setInterval(() => {
                setOtpTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [otpTimer]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (!email) {
            toast.error("Please enter your email");
            setIsLoading(false);
            return;
        }

        try {
            const exists = await checkUserExists(email);
            if (exists) {
                // Fetch user name for welcome message
                const response = await fetch(`/api/auth/get-user?email=${encodeURIComponent(email)}`);
                if (response.ok) {
                    const data = await response.json();
                    setUserName(data.name || "");
                }
                setStep("LOGIN");
            } else {
                setStep("REGISTER");
                // Auto-send OTP for new users
                sendOTP("register");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (type: 'register' | 'login') => {
        try {
            const endpoint = '/api/auth/send-otp';
            const body = { email, type };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                setOtpSent(true);
                setOtpTimer(300); // 5 minutes = 300 seconds
                toast.success('OTP sent to your email!');
            } else {
                toast.error(data.error || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Error sending OTP');
        }
    };

    const verifyOTP = async () => {
        if (!otp) {
            toast.error('Please enter OTP');
            return;
        }

        try {
            const body = { email, otp };

            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.valid) {
                setOtpVerified(true);
                toast.success('Email verified successfully!');
            } else {
                toast.error(data.message || 'Invalid OTP');
            }
        } catch (error) {
            toast.error('Error verifying OTP');
        }
    };

    const handleLogin = async (formData: FormData) => {
        const result = await authenticate(undefined, formData);
        if (result) {
            toast.error(result);
        } else {
            toast.success("Welcome back!");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otpVerified) {
            toast.error('Please verify your email first');
            return;
        }

        if (!firstName || !lastName || !password || !phone) {
            toast.error('Please fill in all fields');
            return;
        }

        if (phone.length !== 10) {
            toast.error('Please enter a valid 10-digit phone number');
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('name', `${firstName} ${lastName}`);
        formData.append('password', password);
        formData.append('phone', phone);
        formData.append('newsletter', newsletter.toString());

        const result = await register(undefined, formData);
        if (result && typeof result === 'string') {
            toast.error(result);
        } else {
            toast.success("Account created!");
        }
    };

    const formatTimer = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGoogleSignIn = () => {
        const width = 500;
        const height = 620;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
            `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`,
            "GoogleSignIn",
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (!popup) {
            // Fallback: full redirect if popups are blocked
            window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(callbackUrl)}`;
            return;
        }

        // Poll until popup closes, then refresh session
        const timer = setInterval(() => {
            if (popup.closed) {
                clearInterval(timer);
                router.refresh();
                window.location.reload();
            }
        }, 500);
    };

    return (
        <div className="w-full max-w-md mx-auto px-8 py-10 bg-background shadow-luxury border border-primary/5 rounded-sm animate-fade-in-up">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-serif text-primary tracking-tight">
                    {step === "EMAIL" && "Welcome"}
                    {step === "LOGIN" && "Welcome Back"}
                    {step === "REGISTER" && "Join Vastraa Verse"}
                </h1>
                <p className="text-sm text-text-muted font-light leading-relaxed px-4">
                    {step === "EMAIL" && "Sign in or create an account to continue."}
                    {step === "LOGIN" && userName && `Hello, ${userName.split(' ')[0]}`}
                    {step === "LOGIN" && <br />}
                    {step === "LOGIN" && `Please enter your password for `}
                    {step === "LOGIN" && <span className="text-primary font-medium">{email}</span>}
                    {step === "REGISTER" && "Create an account to unlock exclusive benefits."}
                </p>
            </div>

            {(step === "LOGIN" || step === "REGISTER") && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => setStep("EMAIL")}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-text-muted hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary/20 pb-0.5"
                    >
                        <ArrowRight className="w-3 h-3 rotate-180" />
                        <span>Change Email</span>
                    </button>
                </div>
            )}

            {step === "EMAIL" && (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                            Email Address<span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                            <Input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-9 bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                                required
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary hover:bg-primary-dark text-white uppercase tracking-[0.2em] text-[10px] font-bold rounded-sm shadow-luxury hover:shadow-elevated transition-all"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Continue"}
                    </Button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-primary/10" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-4 text-text-muted uppercase tracking-wider text-[10px]">Or Continue With</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="w-full h-12 border-primary/10 text-primary hover:bg-surface flex items-center justify-center gap-3 rounded-sm font-medium transition-all"
                    >
                        <GoogleLogo />
                        <span className="text-primary text-sm">Google</span>
                    </Button>
                </form>
            )}

            {step === "LOGIN" && (
                <form action={handleLogin} className="space-y-6">
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="redirectTo" value={callbackUrl} />

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                                Password<span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-[10px] uppercase tracking-[0.2em] text-primary hover:text-secondary font-bold transition-colors"
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <button
                            type="button"
                            className="text-text-muted hover:text-primary transition-colors font-light"
                        >
                            Forgot Password?
                        </button>
                        <button
                            type="button"
                            onClick={() => sendOTP('login')}
                            className="text-primary hover:text-secondary transition-colors font-medium border-b border-primary/20 hover:border-secondary"
                        >
                            Login with OTP
                        </button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-primary hover:bg-primary-dark text-white uppercase tracking-[0.2em] text-[10px] font-bold rounded-sm shadow-luxury hover:shadow-elevated transition-all"
                    >
                        Sign In
                    </Button>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                            className="border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-sm"
                        />
                        <label
                            htmlFor="remember"
                            className="text-xs text-text-muted cursor-pointer select-none"
                        >
                            Remember me
                        </label>
                    </div>
                </form>
            )}

            {step === "REGISTER" && (
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                                First Name<span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                                Last Name<span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                                Email<span className="text-red-500">*</span>
                            </label>
                        </div>
                        <Input
                            type="email"
                            value={email}
                            disabled
                            className="bg-secondary/5 border-primary/5 rounded-sm h-11 text-text-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                            Password<span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                                // Allow only digits, max 10
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setPhone(value);
                            }}
                            placeholder="10-digit mobile number"
                            required
                            maxLength={10}
                            className="bg-surface/30 border-primary/10 focus:border-primary rounded-sm h-11 transition-all"
                        />
                        <p className="text-[10px] text-text-muted">For order updates and OTP verification</p>
                    </div>

                    {/* Email Verification Action */}
                    {!otpSent && (
                        <div className="space-y-2 bg-surface/30 p-4 rounded-sm border border-primary/5">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium mb-3 block">
                                Verification
                            </label>
                            <Button
                                type="button"
                                onClick={() => sendOTP('register')}
                                className="w-full h-10 text-[10px] uppercase tracking-wider bg-primary text-white shadow-md hover:bg-primary-dark transition-all"
                            >
                                Send Email OTP
                            </Button>
                        </div>
                    )}

                    {otpSent && (
                        <div className="space-y-2 bg-surface/30 p-4 rounded-sm border border-primary/5">
                            <label className="text-xs text-text-muted font-medium mb-2 block">
                                Enter 6-digit OTP sent to your email
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter OTP"
                                    disabled={otpVerified}
                                    className="bg-white border-primary/10 h-10 rounded-sm text-center tracking-[0.5em] font-medium"
                                    maxLength={6}
                                />
                                {!otpVerified && (
                                    <Button
                                        type="button"
                                        onClick={verifyOTP}
                                        className="h-10 px-6 bg-primary text-white hover:bg-primary-dark uppercase tracking-wider text-[10px] font-bold"
                                    >
                                        Verify
                                    </Button>
                                )}
                                {otpVerified && (
                                    <Button
                                        type="button"
                                        disabled
                                        variant="outline"
                                        className="h-10 px-6 bg-green-50 border-green-200 text-green-700 uppercase tracking-wider text-[10px] font-bold"
                                    >
                                        Verified
                                    </Button>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-[10px] mt-2">
                                <span className="text-text-muted font-medium">
                                    {otpTimer > 0 ? `Resend in ${formatTimer(otpTimer)}` : ""}
                                </span>
                                {otpTimer === 0 && !otpVerified && (
                                    <button
                                        type="button"
                                        onClick={() => sendOTP('register')}
                                        className="text-primary hover:text-secondary font-bold uppercase tracking-wider"
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="newsletter"
                            checked={newsletter}
                            onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                            className="border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-sm"
                        />
                        <label
                            htmlFor="newsletter"
                            className="text-xs text-text-muted cursor-pointer select-none leading-tight"
                        >
                            Subscribe to our newsletter for exclusive updates
                        </label>
                    </div>

                    <Button
                        type="submit"
                        disabled={!otpVerified}
                        className="w-full h-12 bg-primary hover:bg-primary-dark text-white uppercase tracking-[0.2em] text-[10px] font-bold rounded-sm shadow-luxury hover:shadow-elevated transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {otpVerified ? "Create Account" : "Verify Email First"}
                    </Button>

                    <p className="text-[10px] text-center text-text-muted/60">
                        By continuing, you agree to our <span className="text-primary cursor-pointer hover:underline">Terms</span> and <span className="text-primary cursor-pointer hover:underline">Privacy Policy</span>.
                    </p>
                </form>
            )}
        </div>
    );
}
