'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    {/* Error Icon */}
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>

                    {/* Error Message */}
                    <h1 className="text-2xl font-serif text-[#1C1917] mb-2">
                        Something went wrong!
                    </h1>
                    <p className="text-stone-600 mb-6">
                        We encountered an unexpected error. Please try again or return to the homepage.
                    </p>

                    {/* Error Details (Development Only) */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="bg-stone-50 rounded p-4 mb-6 text-left">
                            <p className="text-xs font-mono text-stone-700 break-words">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-stone-500 mt-2">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#1a4d3a] text-white rounded hover:bg-[#153e2e] transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Try Again
                        </button>
                        <Link
                            href="/"
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
