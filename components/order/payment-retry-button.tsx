'use client';

import { useState } from 'react';
import Script from 'next/script';

interface PaymentRetryButtonProps {
    orderId: string;
    amount: number;
    className?: string;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PaymentRetryButton({ orderId, amount, className }: PaymentRetryButtonProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const handleRetry = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Get retry checkout options from API
            const response = await fetch(`/api/orders/${orderId}/retry-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(15000),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to initiate retry');
            }

            const data = await response.json();

            if (!data.checkoutOptions || !window.Razorpay) {
                throw new Error('Payment gateway not available. Please refresh and try again.');
            }

            // 2. Open Razorpay checkout
            const options = {
                ...data.checkoutOptions,
                handler: async (paymentResponse: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    try {
                        // 3. Verify payment
                        const verifyRes = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_signature: paymentResponse.razorpay_signature,
                            }),
                            signal: AbortSignal.timeout(15000),
                        });

                        if (verifyRes.ok) {
                            setSuccess(true);
                            // Redirect to order success page after brief delay
                            setTimeout(() => {
                                window.location.href = `/orders/${orderId}`;
                            }, 1500);
                        } else {
                            const verifyData = await verifyRes.json();
                            setError(verifyData.error || 'Payment verification failed');
                        }
                    } catch (err) {
                        setError('Payment verification failed. Please contact support.');
                    }
                    setLoading(false);
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                        setError('Payment cancelled. You can try again.');
                    },
                },
                theme: {
                    color: '#1C1917',
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                setError(
                    response.error?.description ||
                    'Payment failed. Please try again.'
                );
                setLoading(false);
            });
            rzp.open();
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center gap-2 text-green-600 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Payment successful! Redirecting...
            </div>
        );
    }

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setScriptLoaded(true)}
            />

            <div className="flex flex-col gap-2">
                <button
                    onClick={handleRetry}
                    disabled={loading || !scriptLoaded}
                    className={`
                        inline-flex items-center justify-center gap-2 
                        px-6 py-3 rounded-lg font-medium text-sm
                        transition-all duration-200
                        ${loading || !scriptLoaded
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] shadow-sm hover:shadow-md'
                        }
                        ${className || ''}
                    `}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                        </>
                    ) : !scriptLoaded ? (
                        'Loading payment gateway...'
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Retry Payment — ₹{amount.toLocaleString('en-IN')}
                        </>
                    )}
                </button>

                {error && (
                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        </>
    );
}
