"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { checkUserExists, authenticate, register, googleSignIn } from "@/lib/actions";
import { GoogleLogo } from "@/components/auth/GoogleLogo";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function UnifiedAuthForm() {
    const [step, setStep] = useState<"EMAIL" | "LOGIN" | "REGISTER">("EMAIL");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState("");
    const router = useRouter();

    // Login state
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    // Register state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [newsletter, setNewsletter] = useState(false);

    // OTP state
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpVerified, setOtpVerified] = useState(false);

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
            const response = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, type }),
            });

            const data = await response.json();

            if (data.success) {
                setOtpSent(true);
                setOtpTimer(300); // 5 minutes = 300 seconds
                toast.success('OTP sent to your email!');

                // Show OTP in development
                if (data.otp) {
                    toast.success(`Development OTP: ${data.otp}`, { duration: 10000 });
                }
            } else {
                toast.error('Failed to send OTP');
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
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
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

        if (!firstName || !lastName || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        const formData = new FormData();
        formData.append('email', email);
        formData.append('name', `${firstName} ${lastName}`);
        formData.append('password', password);
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

    return (
        <div className="w-full max-w-md mx-auto px-8 py-10 bg-white shadow-sm border border-stone-100">
            <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-serif text-primary tracking-wide">
                    {step === "EMAIL" && "Login or Signup"}
                    {step === "LOGIN" && "Welcome Back"}
                    {step === "REGISTER" && "Welcome to M & H!"}
                </h1>
                <p className="text-sm text-stone-500 font-sans leading-relaxed px-4">
                    {step === "EMAIL" && "To quickly find your favourite items, saved addresses and payments."}
                    {step === "LOGIN" && userName && `Welcome back ${userName.split(' ')[0]},`}
                    {step === "LOGIN" && <br />}
                    {step === "LOGIN" && `Please enter password for `}
                    {step === "LOGIN" && <span className="text-stone-700 font-medium">{email}</span>}
                    {step === "REGISTER" && "Let's know you better and make sure that you never lose access to your account"}
                </p>
            </div>

            {step === "LOGIN" && (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => setStep("EMAIL")}
                        className="flex items-center gap-2 text-stone-600 hover:text-primary text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        <span>Back</span>
                    </button>
                </div>
            )}

            {step === "REGISTER" && (
                <div className="mb-4">
                    <button
                        type="button"
                        onClick={() => setStep("EMAIL")}
                        className="flex items-center gap-2 text-stone-600 hover:text-primary text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        <span>Back</span>
                    </button>
                </div>
            )}

            {step === "EMAIL" && (
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                            Email Id / Mobile number<span className="text-red-600">*</span>
                        </label>
                        <Input
                            type="email"
                            placeholder=""
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-white border-stone-300 focus:ring-primary h-12 rounded-sm text-stone-800"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-[#8B8B8B] hover:bg-[#757575] text-white uppercase tracking-widest text-sm font-medium rounded-sm"
                    >
                        {isLoading ? "Checking..." : "Continue"}
                    </Button>

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-stone-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white px-4 text-stone-500">Or Login With</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        onClick={() => googleSignIn()}
                        className="w-full h-12 border-stone-200 text-stone-600 hover:bg-stone-50 flex items-center justify-center gap-3 rounded-sm font-medium"
                    >
                        <GoogleLogo />
                        <span className="text-stone-600">Google</span>
                    </Button>
                </form>
            )}

            {step === "LOGIN" && (
                <form action={handleLogin} className="space-y-6">
                    <input type="hidden" name="email" value={email} />

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                                Password<span className="text-red-600">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-blue-600 hover:text-blue-700 uppercase"
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        <Input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            required
                            className="bg-white border-stone-300 h-12 rounded-sm"
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <button
                            type="button"
                            className="text-red-600 hover:text-red-700 font-medium"
                        >
                            Forgot Password?
                        </button>
                        <button
                            type="button"
                            onClick={() => sendOTP('login')}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Verify via OTP
                        </button>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#8B8B8B] hover:bg-[#757575] text-white uppercase tracking-widest text-sm font-medium rounded-sm"
                    >
                        Continue
                    </Button>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <label
                            htmlFor="remember"
                            className="text-sm text-stone-600 cursor-pointer"
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
                            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                                First Name<span className="text-red-600">*</span>
                            </label>
                            <Input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                className="bg-white border-stone-300 h-12 rounded-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                                Last Name<span className="text-red-600">*</span>
                            </label>
                            <Input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                className="bg-white border-stone-300 h-12 rounded-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs text-stone-500 font-medium">
                                Email<span className="text-red-600">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setStep("EMAIL")}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Change
                            </button>
                        </div>
                        <Input
                            type="email"
                            value={email}
                            disabled
                            className="bg-stone-50 border-stone-300 h-12 rounded-sm text-stone-600"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wide text-stone-500 font-medium">
                            Password<span className="text-red-600">*</span>
                        </label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="bg-white border-stone-300 h-12 rounded-sm"
                        />
                    </div>

                    {otpSent && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs text-stone-600 font-medium">
                                    Please enter the OTP to verify your email
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter OTP"
                                        disabled={otpVerified}
                                        className="bg-white border-stone-300 h-12 rounded-sm"
                                        maxLength={6}
                                    />
                                    {!otpVerified && (
                                        <Button
                                            type="button"
                                            onClick={verifyOTP}
                                            variant="outline"
                                            className="h-12 px-6"
                                        >
                                            Verify
                                        </Button>
                                    )}
                                    {otpVerified && (
                                        <Button
                                            type="button"
                                            disabled
                                            variant="outline"
                                            className="h-12 px-6 bg-green-50 border-green-300 text-green-700"
                                        >
                                            ✓ Verified
                                        </Button>
                                    )}
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-stone-500">
                                        {otpTimer > 0 ? formatTimer(otpTimer) : ""}
                                    </span>
                                    {otpTimer === 0 && !otpVerified && (
                                        <button
                                            type="button"
                                            onClick={() => sendOTP('register')}
                                            className="text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="newsletter"
                            checked={newsletter}
                            onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                        />
                        <label
                            htmlFor="newsletter"
                            className="text-sm text-stone-600 cursor-pointer"
                        >
                            I would like to receive the Newsletter
                        </label>
                    </div>

                    <Button
                        type="submit"
                        disabled={!otpVerified}
                        className="w-full h-12 bg-[#8B8B8B] hover:bg-[#757575] text-white uppercase tracking-widest text-sm font-medium rounded-sm disabled:opacity-50"
                    >
                        {otpVerified ? "Create Account" : "Verify Email First"}
                    </Button>

                    <p className="text-xs text-center text-stone-400">
                        Commerce cloud does not share or sell personal info. See{" "}
                        <span className="text-stone-600 font-medium cursor-pointer">privacy policy</span>
                    </p>
                </form>
            )}
        </div>
    );
}
