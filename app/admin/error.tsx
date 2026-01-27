'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, LayoutDashboard, Bug } from 'lucide-react';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Admin Panel Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full">
                <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-stone-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-serif text-[#1C1917]">Admin Panel Error</h1>
                            <p className="text-sm text-stone-500">Something unexpected occurred</p>
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="mb-6">
                        <p className="text-stone-700 mb-4">
                            An error occurred while processing your request. This has been logged and will be investigated.
                        </p>

                        {/* Error Details (Always show for admins) */}
                        <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                            <div className="flex items-start gap-2 mb-2">
                                <Bug className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-stone-700 mb-1">Error Details:</p>
                                    <p className="text-xs font-mono text-red-600 break-words">
                                        {error.message}
                                    </p>
                                </div>
                            </div>
                            {error.digest && (
                                <p className="text-xs text-stone-500 mt-2 pl-6">
                                    Reference ID: <code className="bg-white px-1 rounded">{error.digest}</code>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1C1917] text-white rounded hover:bg-stone-800 transition-colors text-sm font-medium"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Try Again
                        </button>
                        <Link
                            href="/admin"
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition-colors text-sm font-medium"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    </div>

                    {/* Support Note */}
                    <p className="text-xs text-stone-500 text-center mt-6">
                        If this error persists, please check the server logs or contact technical support.
                    </p>
                </div>
            </div>
        </div>
    );
}
