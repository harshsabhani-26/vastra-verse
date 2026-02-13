"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateProfile } from "@/app/actions/account";
import { useState, useTransition, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Check, Mail, Phone, User as UserIcon, Loader2 } from "lucide-react";

interface UserData {
    name: string | null;
    email: string | null;
    phone: string | null;
    phoneVerified: boolean;
    newsletter: boolean;
}

interface MSG91Config {
    widgetId: string;
    tokenAuth: string;
}

export function ProfileForm({ user, msg91Config }: { user: UserData; msg91Config: MSG91Config }) {
    const [isPending, startTransition] = useTransition();

    // Split name
    const fullName = user.name || "";
    const [firstNameDefault, ...lastNameParts] = fullName.split(" ");
    const lastNameDefault = lastNameParts.join(" ");

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Profile updated successfully");
            }
        });
    }

    // Phone state
    const [currentPhone, setCurrentPhone] = useState(user.phoneVerified ? (user.phone || "") : "");
    const [isEditing, setIsEditing] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Derived state: User is verified only if user.phoneVerified is true AND the input matches the saved phone
    // However, since we now blank the input if unverified, currentPhone will be empty or user typed.
    // So if user.phoneVerified is false, isVerified should be false.
    // If user.phoneVerified is true, checking against user.phone ensures we detect changes.
    const isVerified = user.phoneVerified && user.phone === currentPhone;

    return (
        <form action={handleSubmit} className="space-y-8 animate-fade-in-up">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="firstName" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                        First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                        <Input
                            type="text"
                            name="firstName"
                            id="firstName"
                            defaultValue={firstNameDefault}
                            required
                            className="pl-9 bg-background border-primary/20 focus:border-primary focus:ring-0 rounded-sm h-11 transition-all"
                            placeholder="Your First Name"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="lastName" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                        Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-primary/40" />
                        <Input
                            type="text"
                            name="lastName"
                            id="lastName"
                            defaultValue={lastNameDefault}
                            required
                            className="pl-9 bg-background border-primary/20 focus:border-primary focus:ring-0 rounded-sm h-11 transition-all"
                            placeholder="Your Last Name"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Number */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label htmlFor="mobile" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                        Mobile Number <span className="text-red-500">*</span>
                    </label>
                    {isVerified ? (
                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 gap-1 px-3 py-1 font-medium rounded-full shadow-sm">
                            <Check className="w-3 h-3" />
                            Verified
                        </Badge>
                    ) : (
                        <span className="text-[10px] uppercase tracking-wider text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Unverified
                        </span>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex gap-3 flex-1">
                        <div className="flex-shrink-0">
                            <select className="h-11 px-3 bg-surface border border-primary/20 text-sm text-primary focus:outline-none focus:border-primary w-20 rounded-sm">
                                <option>+91</option>
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                            <Input
                                type="tel"
                                name="mobile"
                                id="mobile"
                                value={currentPhone}
                                onChange={(e) => setCurrentPhone(e.target.value)}
                                disabled={isVerified && !isEditing}
                                required
                                maxLength={10}
                                placeholder="99999 99999"
                                pattern="[0-9]{10}"
                                className={`pl-9 bg-background border-primary/20 h-11 rounded-sm transition-all focus:border-primary focus:ring-0 ${isVerified && !isEditing ? 'opacity-70 cursor-not-allowed bg-surface' : 'bg-background'}`}
                            />
                        </div>
                    </div>

                    {isVerified && !isEditing ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsEditing(true);
                                setCurrentPhone("");
                            }}
                            className="w-full sm:w-auto h-11 px-6 text-[10px] uppercase tracking-[0.2em] border-primary/20 hover:border-primary hover:bg-surface text-primary rounded-sm transition-all"
                        >
                            Edit
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={async () => {
                                if (!currentPhone || currentPhone.length !== 10) {
                                    toast.error('Please enter a valid 10-digit mobile number');
                                    return;
                                }

                                // Check if MSG91 configuration is available
                                if (!msg91Config.widgetId || !msg91Config.tokenAuth) {
                                    toast.error('Phone verification is not configured. Please contact support at care@vastraverse.com');
                                    console.error('MSG91 configuration missing:', {
                                        widgetId: !!msg91Config.widgetId,
                                        tokenAuth: !!msg91Config.tokenAuth,
                                        envVars: {
                                            NEXT_PUBLIC_MSG91_WIDGET_ID: !!process.env.NEXT_PUBLIC_MSG91_WIDGET_ID,
                                            NEXT_PUBLIC_MSG91_TOKEN_AUTH: !!process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH
                                        }
                                    });
                                    return;
                                }



                                setIsVerifying(true);

                                // Debug logging
                                console.log('=== MSG91 Widget Debug ===');
                                console.log('Config:', {
                                    widgetId: msg91Config.widgetId,
                                    tokenAuth: msg91Config.tokenAuth?.substring(0, 10) + '...',
                                    mobile: '91' + currentPhone
                                });
                                console.log('initSendOTP type:', typeof (window as any).initSendOTP);

                                // Trigger MSG91 OTP widget
                                try {
                                    console.log('Calling initSendOTP...');
                                    (window as any).initSendOTP({
                                        widgetId: msg91Config.widgetId,
                                        tokenAuth: msg91Config.tokenAuth,
                                        mobile: '91' + currentPhone,
                                        identifier: '91' + currentPhone,
                                        // Multi-layered GeoIP disable approach
                                        // Option 1: Override GeoIP lookup with immediate callback
                                        geoIpLookup: (callback: any) => {
                                            // Return India immediately, prevent any external API calls
                                            callback('in');
                                        },
                                        // Option 2: Set initial country explicitly
                                        initialCountry: 'in',
                                        // Option 3: Disable auto country detection
                                        autoCountry: false,
                                        defaultCountry: 'in',
                                        // Option 4: Configure intl-tel-input directly if MSG91 exposes it
                                        intlTelInputOptions: {
                                            initialCountry: 'in',
                                            geoIpLookup: (callback: any) => callback('in')
                                        },
                                        success: async (data: any) => {
                                            try {
                                                // Handle various response formats
                                                const token = data.token || data.message || (typeof data === 'string' ? data : null);

                                                if (!token) {
                                                    toast.error('Could not retrieve verification token');
                                                    setIsVerifying(false);
                                                    return;
                                                }

                                                // Update phoneVerified status
                                                const res = await fetch('/api/auth/verify-phone', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ token: token, phone: currentPhone })
                                                });
                                                const responseData = await res.json();
                                                if (res.ok) {
                                                    toast.success('Phone verified successfully!');
                                                    window.location.reload();
                                                } else {
                                                    toast.error(responseData.error || 'Verification failed');
                                                    setIsVerifying(false);
                                                }
                                            } catch (error) {
                                                console.error('Error during verification:', error);
                                                toast.error('An error occurred during verification');
                                                setIsVerifying(false);
                                            }
                                        },
                                        failure: () => {
                                            toast.error('Verification failed. Please try again.');
                                            setIsVerifying(false);
                                        }
                                    });
                                } catch (error) {
                                    console.error('Error initializing MSG91:', error);
                                    toast.error('Failed to initialize verification. Please try again.');
                                    setIsVerifying(false);
                                }
                            }}
                            disabled={isVerifying}
                            className="w-full sm:w-auto h-11 px-8 bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] font-bold shadow-luxury hover:shadow-elevated rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                'Verify Now'
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
                <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] text-text-muted font-medium">
                    Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-primary/40" />
                    <Input
                        type="email"
                        id="email"
                        defaultValue={user.email || ""}
                        disabled
                        className="pl-9 bg-surface/50 border-primary/10 text-text-muted cursor-not-allowed rounded-sm h-11"
                    />
                </div>
                <div className="flex items-start gap-3 mt-3 p-4 bg-surface border border-primary/5 rounded-sm text-xs text-text-muted">
                    <div className="shrink-0 text-primary mt-0.5 font-serif italic">i</div>
                    <div>
                        <p className="mb-1">To change your email address, please contact our support team:</p>
                        <div className="font-medium flex flex-wrap gap-x-4 gap-y-1 text-primary">
                            <a href="mailto:care@vastraverse.com" className="hover:text-secondary underline underline-offset-4 transition-colors">care@vastraverse.com</a>
                            <span className="text-primary/20">|</span>
                            <span>+91 99993 13366</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Newsletter */}
            <div className="flex items-center space-x-3 pt-2">
                <input
                    type="checkbox"
                    name="newsletter"
                    id="newsletter"
                    defaultChecked={user.newsletter}
                    className="h-4 w-4 rounded-sm border-primary/20 text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                />
                <label htmlFor="newsletter" className="text-sm text-text-muted cursor-pointer select-none hover:text-primary transition-colors">
                    Subscribe to our newsletter for exclusive updates
                </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-8 border-t border-primary/10 mt-8">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 md:flex-none md:w-32 text-text-muted hover:text-primary hover:bg-surface uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-medium transition-all"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 md:flex-none md:w-48 bg-primary text-white hover:bg-primary-dark uppercase tracking-[0.2em] text-[10px] h-12 rounded-sm font-bold shadow-luxury hover:shadow-elevated transition-all"
                >
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
