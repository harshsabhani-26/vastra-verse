'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, LayoutDashboard } from 'lucide-react';

export default function PaymentsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[ERROR:ADMIN_PAYMENTS]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white rounded-lg border border-stone-200 shadow-sm p-8 max-w-md w-full text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-lg font-serif text-[#1C1917] mb-2">Payments failed to load</h2>
                <p className="text-sm text-stone-500 mb-1">
                    An error occurred while loading the payments page.
                </p>
                {error.digest && (
                    <p className="text-xs text-stone-400 mb-4">
                        Ref: <code className="bg-stone-100 px-1 rounded">{error.digest}</code>
                    </p>
                )}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={reset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1C1917] text-white rounded text-sm hover:bg-stone-800 transition-colors"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Retry
                    </button>
                    <Link
                        href="/admin"
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 rounded text-sm hover:bg-stone-50 transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
