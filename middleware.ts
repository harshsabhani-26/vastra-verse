import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for API routes (including auth)
    if (pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // Add pathname to headers for server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    // Get session with error handling for secret rotation
    let session;
    try {
        session = await auth();
    } catch (error) {
        console.error("Middleware Auth Error (likely invalid session/secret rotation):", error);
        // Forcefully clear the invalid session cookies to fix the loop
        const response = NextResponse.redirect(new URL("/login?error=session_rotated", request.url));
        response.cookies.delete("next-auth.session-token");
        response.cookies.delete("__Secure-next-auth.session-token");
        return response;
    }

    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdminUser = session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase();

    // STRICT ADMIN PANEL PROTECTION
    // Completely hide admin panel from non-admin users
    if (pathname.startsWith("/admin")) {
        // If not logged in OR not the admin email, redirect to homepage
        // This makes the admin panel completely invisible to regular users
        if (!session?.user || !isAdminUser) {
            // Redirect to homepage to make it look like admin panel doesn't exist
            return NextResponse.redirect(new URL("/", request.url));
        }

        // If user is admin and trying to access /admin/login, redirect to dashboard
        if (pathname === "/admin/login") {
            return NextResponse.redirect(new URL("/admin", request.url));
        }

        // Optional: IP-based restriction for extra security
        const allowedIPs = process.env.ALLOWED_IPS?.split(",").map(ip => ip.trim());
        if (allowedIPs && allowedIPs.length > 0) {
            const userIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

            if (!allowedIPs.includes(userIP)) {
                // Redirect to homepage instead of showing error
                // This prevents revealing admin panel existence
                return NextResponse.redirect(new URL("/", request.url));
            }
        }
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
