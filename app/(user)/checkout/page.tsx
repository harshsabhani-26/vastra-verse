"use client";


import { createOrder, checkUserPhoneVerification, getUserPhoneVerificationStatus } from "@/app/actions/checkout";
import { getAddresses, addAddress } from "@/app/actions/account";
import { useCartStore } from "@/lib/store";
import { applyCoupon, getAutoApplyCoupons } from "@/app/admin/coupons/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Tag, X, Loader2, Check, Gift, ChevronDown, Phone, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Script from "next/script";
import Image from "next/image";

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    categoryId?: string;
}

interface AppliedCoupon {
    code: string;
    discount: number;
    type: string;
    isAutoApplied?: boolean;
}

interface SavedAddress {
    id: string;
    title: string;
    firstName: string;
    lastName: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    isDefault: boolean;
}

import { useRouter } from "next/navigation";

export default function CheckoutPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [subtotal, setSubtotal] = useState(0);
    const [shippingCharges] = useState(0);
    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [mounted, setMounted] = useState(false);
    const [processing, setProcessing] = useState(false); // Prevent double payments
    const { toast } = useToast();

    // Form Stats
    const [formData, setFormData] = useState({
        phone: "",
        firstName: "",
        lastName: "",
        address1: "",
        address2: "",
        country: "India",
        zip: "",
        city: "",
        state: "",
        recipientPhone: ""
    });

    // Validation State
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [paymentMethod, setPaymentMethod] = useState("prepaid");
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponError, setCouponError] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isCheckingAutoApply, setIsCheckingAutoApply] = useState(false);

    // Phone verification state
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);

    // MSG91 config (public env vars)
    const msg91Config = {
        widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '',
        tokenAuth: process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '',
    };

    // Fetch verified phone on mount
    useEffect(() => {
        if (!mounted || !session?.user?.id) return;
        
        // Only fetch if phone is empty
        if (!formData.phone) {
            getUserPhoneVerificationStatus().then((result) => {
                if (result.isVerified && result.phone) {
                    setIsPhoneVerified(true);
                    setFormData(prev => ({ ...prev, phone: result.phone! }));
                }
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, session?.user?.id]);

    // Auto-check if the entered phone is already verified
    const checkPhoneVerification = useCallback(async (phone: string) => {
        if (phone.length !== 10) {
            setIsPhoneVerified(false);
            return;
        }
        setIsCheckingVerification(true);
        try {
            const result = await checkUserPhoneVerification(phone);
            setIsPhoneVerified(result.isVerified);
        } catch {
            setIsPhoneVerified(false);
        } finally {
            setIsCheckingVerification(false);
        }
    }, []);

    // Debounced phone verification check
    useEffect(() => {
        if (!mounted) return;
        const timer = setTimeout(() => {
            checkPhoneVerification(formData.phone);
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.phone, mounted, checkPhoneVerification]);

    // Poll the DB to confirm verification status after MSG91 widget interaction.
    // MSG91 fires 'failure' even for internal hCaptcha network errors — so we always
    // re-check the DB as the source of truth rather than trusting the widget callbacks.
    const pollVerificationStatus = async (phone: string, maxAttempts = 5, intervalMs = 1500) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await checkUserPhoneVerification(phone);
                if (result.isVerified) {
                    setIsPhoneVerified(true);
                    setIsVerifying(false);
                    toast({ title: "✓ Verified", description: "Phone number verified successfully!" });
                    router.refresh();
                    return;
                }
            } catch {
                // Ignore transient errors and keep polling
            }
            // Wait before next attempt (skip waiting on the last attempt)
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
        }
        // After all attempts, still not verified
        setIsVerifying(false);
        toast({
            variant: "destructive",
            title: "Verification Incomplete",
            description: "OTP not confirmed. Please try again or re-enter your number."
        });
    };

    // Dynamically load MSG91 otp-provider.js only when needed (on "Verify" click).
    // Loading it eagerly via <Script afterInteractive> caused "Maximum call stack
    // size exceeded" because otp-provider.js runs hCaptcha init code that
    // recursively errors during cold start on the checkout page.
    const loadMsg91Script = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            if ((window as any).initSendOTP) { resolve(); return; }
            const existing = document.getElementById('msg91-otp-provider');
            if (existing) {
                // Script tag exists but initSendOTP not ready yet — wait briefly
                const wait = setInterval(() => {
                    if ((window as any).initSendOTP) { clearInterval(wait); resolve(); }
                }, 100);
                setTimeout(() => { clearInterval(wait); reject(new Error('MSG91 load timeout')); }, 8000);
                return;
            }
            const s = document.createElement('script');
            s.id = 'msg91-otp-provider';
            s.src = 'https://verify.msg91.com/otp-provider.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load MSG91 script'));
            document.head.appendChild(s);
        });
    };
    // Handle MSG91 verification — loads the SDK on-demand to prevent page crash
    const handleVerifyPhone = async () => {
        const phone = formData.phone;
        if (!phone || phone.length !== 10) {
            toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid 10-digit mobile number" });
            return;
        }

        if (!msg91Config.widgetId || !msg91Config.tokenAuth) {
            toast({ variant: "destructive", title: "Configuration Error", description: "Phone verification is not configured. Please contact support at care@vastraverse.com" });
            return;
        }

        setIsVerifying(true);

        // Load MSG91 script on demand (not auto-loaded to prevent page crash)
        try {
            await loadMsg91Script();
        } catch {
            toast({ variant: "destructive", title: "Error", description: "Failed to load verification widget. Please check your connection and try again." });
            setIsVerifying(false);
            return;
        }

        try {
            (window as any).initSendOTP({
                widgetId: msg91Config.widgetId,
                tokenAuth: msg91Config.tokenAuth,
                mobile: '91' + phone,
                identifier: '91' + phone,
                initialCountry: 'auto',
                geoIpLookup: function (callback: any) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 3000);
                    fetch('https://api.db-ip.com/v2/free/self', {
                        signal: controller.signal,
                        cache: 'default'
                    })
                        .then(res => {
                            clearTimeout(timeoutId);
                            if (!res?.ok) throw new Error('Network response not ok');
                            return res.json();
                        })
                        .then(data => {
                            const countryCode = data?.countryCode?.toLowerCase();
                            callback(countryCode || 'in');
                        })
                        .catch((err) => {
                            clearTimeout(timeoutId);
                            console.warn('Auto country detection failed, using fallback:', err?.message);
                            callback('in');
                        });
                },
                success: async (data: any) => {
                    console.log('[OTP] MSG91 success data:', JSON.stringify(data));
                    try {
                        const token = data?.token
                            || data?.message
                            || data?.authToken
                            || data?.['access-token']
                            || (typeof data === 'string' ? data : null);

                        console.log('[OTP] Extracted token:', token ? token.substring(0, 20) + '...' : 'null');

                        if (token && typeof token === 'string' && token.length > 10) {
                            const res = await fetch('/api/auth/verify-phone', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token, phone })
                            });
                            const responseData = await res.json().catch(() => ({ success: false }));
                            if (res.ok && responseData.success) {
                                toast({ title: "✓ Verified", description: responseData.alreadyVerified ? "Phone already verified" : "Phone number verified successfully!" });
                                setIsPhoneVerified(true);
                                setIsVerifying(false);
                                router.refresh();
                                return;
                            }
                        }

                        const directRes = await fetch('/api/auth/verify-phone', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: token || 'widget-success', phone, widgetSuccess: true })
                        });
                        const directData = await directRes.json().catch(() => ({ success: false }));
                        if (directRes.ok && directData.success) {
                            toast({ title: "✓ Verified", description: "Phone number verified successfully!" });
                            setIsPhoneVerified(true);
                            setIsVerifying(false);
                            router.refresh();
                        } else {
                            await pollVerificationStatus(phone);
                        }
                    } catch (error) {
                        console.warn('[OTP] success callback error:', error);
                        await pollVerificationStatus(phone);
                    }
                },
                failure: async () => {
                    await pollVerificationStatus(phone);
                }
            });
        } catch (error) {
            console.error('Error initializing MSG91:', error);
            toast({ variant: "destructive", title: "Error", description: "Failed to initialize verification. Please try again." });
            setIsVerifying(false);
        }
    };

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [saveToAddressBook, setSaveToAddressBook] = useState(false);
    const [addressTitle, setAddressTitle] = useState("");

    // Fetch saved addresses
    const userId = session?.user?.id;
    useEffect(() => {
        if (!mounted || !userId) return;
        getAddresses().then((addresses) => {
            setSavedAddresses(addresses as SavedAddress[]);
            // Auto-select default address — pass addresses directly to avoid
            // reading the stale savedAddresses closure value
            const defaultAddr = addresses.find((addr) => addr.isDefault);
            if (defaultAddr) {
                const address = addresses.find((a) => a.id === defaultAddr.id);
                if (address) {
                    setSelectedAddressId(defaultAddr.id);
                    setFormData(prev => ({
                        ...prev,
                        firstName: address.firstName,
                        lastName: address.lastName,
                        address1: address.address1,
                        address2: address.address2 || "",
                        country: address.country,
                        zip: address.zipCode,
                        city: address.city,
                        state: address.state,
                        recipientPhone: address.phone,
                    }));
                }
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, userId]);

    // Handle address selection
    const handleSelectAddress = (addressId: string) => {
        const address = savedAddresses.find((a) => a.id === addressId);
        if (!address) return;

        setSelectedAddressId(addressId);
        setFormData({
            phone: formData.phone, // Keep phone from existing state (for verification)
            firstName: address.firstName,
            lastName: address.lastName,
            address1: address.address1,
            address2: address.address2 || "",
            country: address.country,
            zip: address.zipCode,
            city: address.city,
            state: address.state,
            recipientPhone: address.phone,
        });
    };

    // Apply coupon handler
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponError("");
        setIsApplyingCoupon(true);
        try {
            const result = await applyCoupon(couponCode.trim(), {
                userId: session?.user?.id || "guest",
                subtotal,
                shippingCharges,
                items: cartItems.map((item) => ({
                    productId: item.id,
                    categoryId: item.categoryId || "",
                    price: item.price,
                    quantity: item.quantity,
                })),
            });
            if (result.success) {
                setAppliedCoupon({
                    code: result.couponCode!,
                    discount: result.discount!,
                    type: result.couponType!,
                });
                setCouponCode("");
                toast({ title: "Coupon Applied!", description: `You saved ₹${result.discount?.toLocaleString('en-IN')}` });
            } else {
                setCouponError(result.error || "Invalid coupon code");
            }
        } catch {
            setCouponError("Failed to apply coupon. Please try again.");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    // Initial Cart Logic (omitted for brevity, keep existing)
    useEffect(() => {
        setMounted(true);
        const cartStorage = localStorage.getItem("vastra-verse-cart-storage");
        if (cartStorage) {
            try {
                const storage = JSON.parse(cartStorage);
                const items = storage.state?.items || [];
                setCartItems(items);
                const sum = items.reduce((acc: number, item: CartItem) => acc + (item.price * item.quantity), 0);
                setSubtotal(sum);
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Existing coupon logic... (keep or restore if needed, but for now focus on validation)
    // Assuming coupon logic was lost in previous overwrite, restoring simplified version or just placeholders if not critical for this step.
    // Actually, let's keep it simple and focus on the requested features: Validation & Payment Step.

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.phone) newErrors.phone = "Phone number is required";
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.address1) newErrors.address1 = "Address is required";
        if (!formData.zip) newErrors.zip = "ZIP code is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.recipientPhone) newErrors.recipientPhone = "Recipient phone is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = async () => {
        if (step === 'shipping') {
            // If phone is not verified, trigger OTP verification first
            if (!isPhoneVerified) {
                if (!formData.phone || formData.phone.length !== 10) {
                    // Scroll to phone field and show error
                    setErrors(prev => ({ ...prev, phone: "Please enter a valid 10-digit number to verify" }));
                    document.querySelector<HTMLInputElement>('input[name="phone"]')?.focus();
                    return;
                }
                // Trigger OTP verification — after success, isPhoneVerified becomes true
                handleVerifyPhone();
                return;
            }

            if (validateForm()) {
                // Save address to Address Book if checkbox is checked
                if (saveToAddressBook && addressTitle.trim()) {
                    const addressFormData = new FormData();
                    addressFormData.append("title", addressTitle.trim());
                    addressFormData.append("firstName", formData.firstName);
                    addressFormData.append("lastName", formData.lastName);
                    addressFormData.append("address1", formData.address1);
                    addressFormData.append("address2", formData.address2);
                    addressFormData.append("country", formData.country);
                    addressFormData.append("state", formData.state);
                    addressFormData.append("city", formData.city);
                    addressFormData.append("zipCode", formData.zip);
                    addressFormData.append("phone", formData.recipientPhone);
                    addressFormData.append("type", "Shipping");
                    addressFormData.append("isDefault", "off");

                    try {
                        const result = await addAddress(addressFormData);
                        if (result.success) {
                            toast({ title: "Address Saved", description: "Address has been saved to your Address Book" });
                            // Refresh addresses
                            const updatedAddresses = await getAddresses();
                            setSavedAddresses(updatedAddresses as SavedAddress[]);
                        } else if (result.error) {
                            toast({ variant: "destructive", title: "Failed to save address", description: result.error });
                        }
                    } catch (error) {
                        console.error("Error saving address:", error);
                    }
                }

                setStep('payment');
                window.scrollTo(0, 0);
            }
        } else {
            // FIX: Prevent double submission
            if (processing) return;
            setProcessing(true);

            try {
                // FIX: Validate cart before creating order
                const { validateCartBeforeCheckout } = await import('@/app/actions/validate-cart');
                const validationResult = await validateCartBeforeCheckout(
                    cartItems.map(item => ({
                        id: item.id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                );

                if (!validationResult.valid) {
                    validationResult.errors.forEach(err => toast({ variant: "destructive", title: "Cart Error", description: err }));
                    setProcessing(false);
                    return;
                }

                if (validationResult.warnings && validationResult.warnings.length > 0) {
                    validationResult.warnings.forEach(warn => toast({ title: "Note", description: warn }));
                }

                // Place Order Logic
                // Generate a unique session ID for idempotency
                const checkoutSessionId = crypto.randomUUID();

                const payload = new FormData();
                Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
                payload.append("cartItems", JSON.stringify(cartItems));
                payload.append("subtotal", subtotal.toString());
                payload.append("shippingCharges", shippingCharges.toString());
                payload.append("payment", paymentMethod);
                payload.append("checkoutSessionId", checkoutSessionId);

                // Include discount and coupon if applied
                const discount = appliedCoupon?.discount || 0;
                payload.append("discount", discount.toString());

                // No GST calculation per current settings
                const taxAmount = 0;

                const finalTotal = subtotal - discount + shippingCharges;
                payload.append("total", finalTotal.toString());

                if (appliedCoupon) {
                    payload.append("couponCode", appliedCoupon.code);
                    if (appliedCoupon.type) {
                        // Pass validation if needed
                    }
                }

                try {
                    const result = await createOrder(payload);

                    if (result.success) {
                        if (result.isPrepaid && result.orderData) {
                            // PREPAID: No Order created yet, proceed with Razorpay payment
                            const response = await fetch("/api/payment/razorpay", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    amount: finalTotal,
                                    currency: "INR",
                                    receipt: `temp_${Date.now()}`,
                                    notes: {
                                        userId: result.orderData.userId,
                                        checkoutSessionId,
                                    },
                                    orderData: result.orderData,
                                    checkoutSessionId,
                                }),
                            });

                            const razorpayOrder = await response.json();

                            if (!razorpayOrder.id) {
                                toast({ variant: "destructive", title: "Error", description: "Failed to create payment order" });
                                setProcessing(false);
                                return;
                            }

                            const options = {
                                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                                amount: razorpayOrder.amount,
                                currency: razorpayOrder.currency,
                                name: "Vastraa Verse",
                                description: "Order Payment",
                                image: "/images/logo.png",
                                order_id: razorpayOrder.id,
                                handler: async function (response: any) {
                                    // Send orderData along with payment details to verification
                                    const verifyRes = await fetch("/api/payment/verify", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            razorpay_order_id: response.razorpay_order_id,
                                            razorpay_payment_id: response.razorpay_payment_id,
                                            razorpay_signature: response.razorpay_signature,
                                            orderData: result.orderData,
                                            checkoutSessionId,
                                        }),
                                    });

                                    const verifyData = await verifyRes.json();
                                    if (verifyData.success) {
                                        // CRITICAL: Clear client-side cart before redirect
                                        useCartStore.getState().clearCart();
                                        console.log("[CART_CLEARED]", { orderId: verifyData.orderId, paymentMethod: "Prepaid" });
                                        window.location.href = "/checkout/success";
                                    } else {
                                        toast({ variant: "destructive", title: "Error", description: verifyData.error || "Payment verification failed" });
                                        setProcessing(false);
                                    }
                                },
                                prefill: {
                                    name: `${formData.firstName} ${formData.lastName}`,
                                    email: session?.user?.email || "",
                                    contact: `+91${formData.phone}`,
                                },
                                notes: {
                                    address: `${formData.address1}, ${formData.city}, ${formData.zip}`
                                },
                                theme: {
                                    color: "#1C1917",
                                },
                                modal: {
                                    ondismiss: function () {
                                        toast({ title: "Payment Cancelled", description: "You cancelled the payment. No order was created." });
                                        setProcessing(false);
                                    }
                                }
                            };

                            // FIX 11: Safety guard — in the rare case lazyOnload
                            // script hasn't fired yet, show a user-friendly message.
                            if (!(window as any).Razorpay) {
                                toast({
                                    variant: "destructive",
                                    title: "Payment not ready",
                                    description: "Please wait a moment and try again."
                                });
                                setProcessing(false);
                                return;
                            }

                            const rzp1 = new (window as any).Razorpay(options);

                            rzp1.on('payment.failed', function (response: any) {
                                console.warn('[Razorpay] Payment failed:', response.error);
                                toast({ variant: "destructive", title: "Payment Failed", description: response?.error?.description || 'Payment failed. No order was created.' });
                                setProcessing(false);
                            });

                            rzp1.open();
                        } else if (result.isCOD && result.orderId) {
                            // COD: Order already created, clear cart and redirect to success
                            useCartStore.getState().clearCart();
                            console.log("[CART_CLEARED]", { orderId: result.orderId, paymentMethod: "COD" });
                            window.location.href = "/checkout/success";
                        } else {
                            toast({ variant: "destructive", title: "Error", description: "Unexpected response from server" });
                            setProcessing(false);
                        }
                    } else {
                        toast({ variant: "destructive", title: "Error", description: (result as any).error || "Failed to create order" });
                        setProcessing(false);
                    }
                } catch (error) {
                    console.error("Order creation failed", error);
                    toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
                    setProcessing(false);
                }
            } catch (validationError) {
                console.error("Cart validation error:", validationError);
                toast({ variant: "destructive", title: "Validation Error", description: "Failed to validate cart. Please refresh and try again." });
                setProcessing(false);
            }
        }
    };

    const getFinalTotal = () => subtotal; // Simplified for now

    if (!mounted) return null;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-stone-600 mb-4 font-serif">Your cart is empty</p>
                    <Button onClick={() => window.location.href = "/shop"} className="bg-[#1C1917] text-white rounded-none">CONTINUE SHOPPING</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] py-16">
            {/* Razorpay: deferred to browser idle — only needed on payment click */}
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />
            {/* MSG91 otp-provider.js is now loaded on-demand in loadMsg91Script()
                to prevent its hCaptcha init from crashing the checkout page. */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-7 space-y-8">
                        {step === 'shipping' ? (
                            <>
                                {/* Header */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">STEP 1 OF 2</p>
                                    <h1 className="text-4xl font-serif text-[#1C1917]">Shipping</h1>
                                </div>

                                {/* Saved Addresses Selector */}
                                {savedAddresses.length > 0 && (
                                    <div className="pb-6 border-b border-stone-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] uppercase tracking-widest text-[#1C1917] font-medium flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Saved Addresses
                                                <span className="text-xs text-stone-400 font-normal normal-case tracking-normal">({savedAddresses.length})</span>
                                            </label>
                                        </div>
                                        <div className="flex gap-3">
                                            <select
                                                value={selectedAddressId || ""}
                                                onChange={(e) => {
                                                    if (e.target.value === "new") {
                                                        setSelectedAddressId(null);
                                                        setFormData({
                                                            phone: formData.phone,
                                                            firstName: "",
                                                            lastName: "",
                                                            address1: "",
                                                            address2: "",
                                                            country: "India",
                                                            zip: "",
                                                            city: "",
                                                            state: "",
                                                            recipientPhone: "",
                                                        });
                                                    } else if (e.target.value) {
                                                        handleSelectAddress(e.target.value);
                                                    }
                                                }}
                                                className="flex-1 h-11 px-4 bg-background border border-stone-200 rounded-sm text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] transition-colors"
                                            >
                                                <option value="">Select a saved address</option>
                                                {savedAddresses.map((addr) => (
                                                    <option key={addr.id} value={addr.id}>
                                                        {addr.title} - {addr.address1}, {addr.city}
                                                    </option>
                                                ))}
                                                <option value="new">+ Enter New Address</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Phone Verification Section */}
                                <div className="py-6 border-b border-stone-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] uppercase tracking-widest text-[#1C1917] font-medium">
                                            Phone Number <span className="text-red-500">*</span>
                                        </label>
                                        {isCheckingVerification ? (
                                            <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium px-2 py-0.5 flex items-center gap-1">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Checking...
                                            </span>
                                        ) : isPhoneVerified ? (
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
                                                <select className="h-11 px-3 bg-stone-50 border border-stone-200 text-sm text-[#1C1917] focus:outline-none focus:border-[#1C1917] w-20 rounded-sm">
                                                    <option>+91</option>
                                                </select>
                                            </div>
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-stone-400" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={(e) => {
                                                        handleInputChange(e);
                                                        // Reset verification when phone changes
                                                        if (isPhoneVerified) setIsPhoneVerified(false);
                                                    }}
                                                    disabled={isPhoneVerified}
                                                    maxLength={10}
                                                    pattern="[0-9]{10}"
                                                    className={cn(
                                                        "w-full h-11 pl-9 border bg-transparent focus:outline-none text-sm text-[#1C1917] rounded-sm transition-all",
                                                        errors.phone ? "border-red-500" : "border-stone-200 focus:border-[#1C1917]",
                                                        isPhoneVerified && "opacity-70 cursor-not-allowed bg-stone-50"
                                                    )}
                                                    placeholder="9876543210"
                                                />
                                                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                            </div>
                                        </div>

                                        {isPhoneVerified ? (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsPhoneVerified(false);
                                                    setFormData(prev => ({ ...prev, phone: "" }));
                                                }}
                                                className="w-full sm:w-auto h-11 px-6 text-[10px] uppercase tracking-[0.2em] border-stone-200 hover:border-[#1C1917] hover:bg-stone-50 text-[#1C1917] rounded-sm transition-all"
                                            >
                                                Edit
                                            </Button>
                                        ) : (
                                            <Button
                                                type="button"
                                                onClick={handleVerifyPhone}
                                                disabled={isVerifying || !formData.phone || formData.phone.length !== 10}
                                                className="w-full sm:w-auto h-11 px-8 bg-[#1C1917] text-white hover:bg-[#333333] uppercase tracking-[0.2em] text-[10px] font-bold shadow-luxury hover:shadow-elevated rounded-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="w-4 h-4 bg-[#AA8C2C] flex items-center justify-center rounded-[2px]">
                                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                        </div>
                                        <span className="text-xs text-[#AA8C2C] font-medium">Link this number with my profile for future login</span>
                                    </div>
                                </div>

                                {/* Shipping Address Form */}
                                <div className="space-y-6">
                                    <h2 className="text-[10px] uppercase tracking-widest text-[#1C1917]">SHIPPING ADDRESS</h2>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-8 sm:gap-y-6">
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">First Name *</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.firstName ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="First Name"
                                            />
                                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">Last Name *</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.lastName ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="Last Name"
                                            />
                                            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">Address 1 *</label>
                                            <input
                                                type="text"
                                                name="address1"
                                                value={formData.address1}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.address1 ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="Street Address"
                                            />
                                            {errors.address1 && <p className="text-xs text-red-500 mt-1">{errors.address1}</p>}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 block">Address 2</label>
                                            <input
                                                type="text"
                                                name="address2"
                                                value={formData.address2}
                                                onChange={handleInputChange}
                                                className="w-full py-2 border-b border-stone-300 bg-transparent focus:outline-none focus:border-[#1C1917] text-sm"
                                                placeholder="Apartment, Suite, etc."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">Country *</label>
                                            <div className="w-full py-2 border-b border-stone-300 bg-transparent text-sm text-[#1C1917]">
                                                India
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">ZIP Code *</label>
                                            <input
                                                type="text"
                                                name="zip"
                                                value={formData.zip}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.zip ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="Zip Code"
                                            />
                                            {errors.zip && <p className="text-xs text-red-500 mt-1">{errors.zip}</p>}
                                        </div>

                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">City *</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.city ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="City"
                                            />
                                            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">State *</label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                className={cn(
                                                    "w-full py-2 border-b bg-transparent focus:outline-none text-sm",
                                                    errors.state ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                )}
                                                placeholder="State"
                                            />
                                            {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
                                        </div>

                                        <div className="mt-4 col-span-2 flex items-end gap-4 max-w-md">
                                            <div className="w-24">
                                                <div className="h-9 border-b border-stone-300 flex items-center text-sm font-medium text-[#1C1917]">+91 (IN)</div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase tracking-widest text-red-700 mb-1 block">Recipient Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    name="recipientPhone"
                                                    value={formData.recipientPhone}
                                                    onChange={handleInputChange}
                                                    className={cn(
                                                        "w-full py-1 border-b bg-transparent focus:outline-none text-sm",
                                                        errors.recipientPhone ? "border-red-500" : "border-stone-300 focus:border-[#1C1917]"
                                                    )}
                                                    placeholder=""
                                                />
                                                {errors.recipientPhone && <p className="text-xs text-red-500 mt-1">{errors.recipientPhone}</p>}
                                            </div>
                                        </div>

                                        {/* Save Address to Address Book */}
                                        {!selectedAddressId && (
                                            <div className="mt-6 p-4 bg-stone-50 border border-stone-200 rounded-sm">
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        id="saveAddress"
                                                        checked={saveToAddressBook}
                                                        onChange={(e) => setSaveToAddressBook(e.target.checked)}
                                                        className="mt-1 h-4 w-4 rounded-sm border-stone-300 text-[#1C1917] focus:ring-[#1C1917] cursor-pointer"
                                                    />
                                                    <div className="flex-1">
                                                        <label htmlFor="saveAddress" className="text-sm text-[#1C1917] font-medium cursor-pointer">
                                                            Save this address to my Address Book
                                                        </label>
                                                        {saveToAddressBook && (
                                                            <div className="mt-3">
                                                                <input
                                                                    type="text"
                                                                    value={addressTitle}
                                                                    onChange={(e) => setAddressTitle(e.target.value)}
                                                                    placeholder="e.g. Home, Office, Parents House"
                                                                    className="w-full h-10 px-3 border border-stone-300 rounded-sm text-sm focus:outline-none focus:border-[#1C1917] transition-colors"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Header */}
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">STEP 2 OF 2</p>
                                    <h1 className="text-4xl font-serif text-[#1C1917]">Payment</h1>
                                </div>

                                {/* Shipping Address Summary */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-sm font-medium text-[#1C1917]">Shipping Address</h3>
                                        <button onClick={() => setStep('shipping')} className="text-xs underline text-[#1C1917]">Edit</button>
                                    </div>
                                    <div className="p-4 bg-stone-50 text-sm text-stone-600">
                                        <p>{formData.firstName} {formData.lastName} {formData.address1} {formData.address2}, {formData.city}, {formData.state}</p>
                                        <p>{formData.zip}</p>
                                        <p>{formData.phone}</p>
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <h3 className="text-sm font-medium text-[#1C1917]">Billing Address</h3>
                                    <div className="border border-stone-300 p-3 flex justify-between items-center bg-white">
                                        <span className="text-sm text-stone-600 truncate max-w-[80%]">
                                            {formData.firstName} {formData.lastName} {formData.address1}...
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-stone-400" />
                                    </div>
                                    <div className="flex gap-4 text-xs underline text-[#1C1917]">
                                        <button>Update Address</button>
                                        <button>Add New</button>
                                    </div>
                                </div>

                                {/* Gift Card */}
                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Gift className="w-4 h-4 text-stone-400" />
                                            <span className="text-sm font-medium text-[#1C1917]">Have a Gift Card?</span>
                                        </div>
                                        <button className="text-xs text-[#AA8C2C] uppercase tracking-wider font-medium">Apply now</button>
                                    </div>
                                </div>

                                {/* Coupon Code */}
                                <div className="space-y-3 pt-4 border-t border-stone-200">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-stone-400" />
                                        <span className="text-sm font-medium text-[#1C1917]">Apply Coupon Code</span>
                                    </div>

                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-green-800 tracking-wide">{appliedCoupon.code}</p>
                                                    <p className="text-xs text-green-600 mt-0.5">You save ₹{appliedCoupon.discount.toLocaleString('en-IN')}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setAppliedCoupon(null); setCouponError(""); }}
                                                className="text-green-600 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                                title="Remove coupon"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                                                placeholder="Enter coupon code"
                                                className={cn(
                                                    "flex-1 h-10 px-4 border bg-white text-sm text-[#1C1917] focus:outline-none rounded-sm transition-all uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal",
                                                    couponError ? "border-red-400 focus:border-red-500" : "border-stone-200 focus:border-[#1C1917]"
                                                )}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={isApplyingCoupon || !couponCode.trim()}
                                                className="h-10 px-5 bg-[#1C1917] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#333333] transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                                            >
                                                {isApplyingCoupon ? (
                                                    <><Loader2 className="w-3 h-3 animate-spin" /> Applying</>
                                                ) : 'Apply'}
                                            </button>
                                        </div>
                                    )}

                                    {couponError && (
                                        <p className="text-xs text-red-500 flex items-center gap-1">
                                            <X className="w-3 h-3" />
                                            {couponError}
                                        </p>
                                    )}
                                </div>

                                {/* Payment Options */}
                                <div className="space-y-4 pt-4 border-t border-stone-200">
                                    <h3 className="text-sm font-medium text-[#1C1917]">Payment options</h3>

                                    <div className="space-y-3">
                                        {/* Prepaid Option */}
                                        <label
                                            htmlFor="prepaid"
                                            className={cn(
                                                "flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all",
                                                paymentMethod === 'prepaid'
                                                    ? "border-[#1C1917] bg-stone-50"
                                                    : "border-stone-200 hover:border-stone-400"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                id="prepaid"
                                                name="paymentMethod"
                                                checked={paymentMethod === 'prepaid'}
                                                onChange={() => setPaymentMethod('prepaid')}
                                                className="accent-[#1C1917] mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-[#1C1917] block">Pay Online</span>
                                                <p className="text-xs text-stone-500 mt-1">Debit / Credit Card, Netbanking, Wallet, UPI</p>
                                            </div>
                                            {/* Card icons */}
                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                {['UPI', 'CARD', 'NET'].map((m) => (
                                                    <span key={m} className="text-[9px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-medium tracking-wide">{m}</span>
                                                ))}
                                            </div>
                                        </label>

                                        {/* Cash on Delivery Option */}
                                        <label
                                            htmlFor="cod"
                                            className={cn(
                                                "flex items-start gap-3 p-4 border rounded-sm cursor-pointer transition-all",
                                                paymentMethod === 'cod'
                                                    ? "border-[#1C1917] bg-stone-50"
                                                    : "border-stone-200 hover:border-stone-400"
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                id="cod"
                                                name="paymentMethod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="accent-[#1C1917] mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-[#1C1917] block">Cash on Delivery (COD)</span>
                                                <p className="text-xs text-stone-500 mt-1">Pay in cash when your order is delivered to your doorstep</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold tracking-wide">COD</span>
                                            </div>
                                        </label>

                                        {/* COD Info Banner */}
                                        {paymentMethod === 'cod' && (
                                            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-sm text-xs text-amber-800">
                                                <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <p className="font-semibold text-amber-900 mb-0.5">Cash on Delivery</p>
                                                    <p>Please keep the exact amount ready at the time of delivery. Our delivery partner will collect payment when your order arrives.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* RIGHT COLUMN - SUMMARY */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#FAF9F6] border border-stone-200 p-6 sm:p-8 lg:sticky lg:top-8">
                            <h3 className="text-[10px] uppercase tracking-widest text-[#1C1917] font-bold mb-6">ORDER SUMMARY</h3>

                            <div className="space-y-6 mb-8">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-20 h-28 relative bg-stone-100 flex-shrink-0">
                                            <Image src={item.image} alt={item.name} width={80} height={112} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-serif text-[#1C1917] text-sm leading-tight mb-1">{item.name}</h4>
                                            <p className="text-sm font-medium text-[#1C1917] mb-2">₹{item.price.toLocaleString()}</p>
                                            <div className="space-y-0.5 text-[10px] text-stone-500 uppercase tracking-wide">
                                                <p>Qty: {item.quantity}</p>
                                                <p>Colour: Ivory</p>
                                                <p>Size: XS</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-stone-200 pt-4 space-y-2 mb-8">
                                <div className="flex justify-between text-sm text-stone-600">
                                    <span>Subtotal ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} Items)</span>
                                    <span>₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-[#1C1917]">
                                    <span>Total</span>
                                    <span>₹{(subtotal + shippingCharges - (appliedCoupon?.discount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {step === 'payment' && (
                                <p className="text-[10px] text-stone-500 mb-4">
                                    By clicking on payment you are agreeing with the <span className="underline cursor-pointer">terms and conditions</span>.
                                </p>
                            )}

                            {step === 'shipping' && !isPhoneVerified && (
                                <p className="text-xs text-amber-600 mb-3 text-center flex items-center justify-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Phone verification required — clicking below will open OTP
                                </p>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={processing || isVerifying}
                                className="w-full h-12 bg-[#1C1917] hover:bg-[#333333] disabled:opacity-50 text-white rounded-none uppercase tracking-widest text-xs font-bold"
                            >
                                {isVerifying
                                    ? 'SENDING OTP...'
                                    : processing
                                        ? 'PROCESSING...'
                                        : step === 'shipping'
                                            ? (!isPhoneVerified ? 'VERIFY & CONTINUE' : 'NEXT: PAYMENT')
                                            : 'PLACE ORDER'
                                }
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
