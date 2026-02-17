'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for CSRF token management
 * 
 * Fetches a CSRF token from the server and provides it for
 * inclusion in mutation request headers.
 * 
 * Usage:
 * ```tsx
 * const { csrfToken, csrfFetch, refreshToken } = useCSRFToken();
 * 
 * // Option 1: Use csrfFetch (auto-includes header)
 * const res = await csrfFetch('/api/admin/products', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 * });
 * 
 * // Option 2: Manual header inclusion
 * fetch('/api/admin/products', {
 *   method: 'POST',
 *   headers: {
 *     'x-csrf-token': csrfToken,
 *     'Content-Type': 'application/json',
 *   },
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function useCSRFToken() {
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/csrf-token', {
                credentials: 'include', // Include cookies
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Not authenticated, token not needed
                    setIsLoading(false);
                    return;
                }
                throw new Error(`Failed to fetch CSRF token: ${response.status}`);
            }

            const data = await response.json();
            setCsrfToken(data.csrfToken);
        } catch (err) {
            console.error('[CSRF] Failed to fetch token:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch token on mount
    useEffect(() => {
        fetchToken();
    }, [fetchToken]);

    // Auto-refresh token every 50 minutes (before 1-hour expiry)
    useEffect(() => {
        const interval = setInterval(fetchToken, 50 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchToken]);

    /**
     * Enhanced fetch that automatically includes CSRF token
     * Handles 403 CSRF errors by refreshing the token and retrying once
     */
    const csrfFetch = useCallback(
        async (url: string, options: RequestInit = {}): Promise<Response> => {
            const headers = new Headers(options.headers);

            // Add CSRF token for mutation methods
            const method = (options.method || 'GET').toUpperCase();
            if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
                headers.set('x-csrf-token', csrfToken);
            }

            // Ensure content type is set
            if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
                headers.set('Content-Type', 'application/json');
            }

            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });

            // If CSRF error, refresh token and retry once
            if (response.status === 403) {
                const data = await response.clone().json().catch(() => ({}));
                if (data.error?.startsWith('CSRF_')) {
                    console.warn('[CSRF] Token rejected, refreshing...');
                    await fetchToken();

                    // Retry with new token
                    const retryHeaders = new Headers(options.headers);
                    retryHeaders.set('x-csrf-token', csrfToken);
                    if (!retryHeaders.has('Content-Type') && options.body && typeof options.body === 'string') {
                        retryHeaders.set('Content-Type', 'application/json');
                    }

                    return fetch(url, {
                        ...options,
                        headers: retryHeaders,
                        credentials: 'include',
                    });
                }
            }

            return response;
        },
        [csrfToken, fetchToken]
    );

    return {
        csrfToken,
        csrfFetch,
        refreshToken: fetchToken,
        isLoading,
        error,
    };
}
