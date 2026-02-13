import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Add pathname to headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    // Get session with error handling
    let session;
    try {
        session = await auth();
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("Auth error:", error);
        }
        const errorResponse = NextResponse.redirect(new URL("/login?error=session_expired", request.url));
        errorResponse.cookies.delete("next-auth.session-token");
        errorResponse.cookies.delete("__Secure-next-auth.session-token");
        return errorResponse;
    }

    // Create response with headers
    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // ============================================
    // ENTERPRISE SECURITY HEADERS
    // ============================================

    // HSTS
    response.headers.set(
        'Strict-Transport-Security',
        'max-age=63072000; includeSubDomains; preload'
    );

    // Prevent clickjacking
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // Prevent MIME sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(self), payment=(self), interest-cohort=()'
    );

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com https://*.msg91.com https://js.hcaptcha.com https://*.hcaptcha.com https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.msg91.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https://*.unsplash.com https://*.razorpay.com https://*.supabase.co https://res.cloudinary.com https://*.googleapis.com https://*.gstatic.com https://cdnjs.cloudflare.com",
        "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://*.msg91.com https://*.supabase.co https://*.hcaptcha.com",
        "frame-src 'self' https://api.razorpay.com https://*.msg91.com https://*.google.com https://maps.google.com https://*.hcaptcha.com https://newassets.hcaptcha.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'"
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    // ============================================
    // ADMIN PANEL PROTECTION
    // ============================================

    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdminUser = session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase();

    if (pathname.startsWith("/admin")) {
        if (!session?.user || !isAdminUser) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        if (pathname === "/admin/login") {
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
