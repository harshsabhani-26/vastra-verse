import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && nextUrl.pathname === "/login") {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            // Include role from token
            if (token.role && session.user) {
                session.user.role = token.role as "USER" | "ADMIN";
            }
            // Include phone from token
            if (token.phone && session.user) {
                session.user.phone = token.phone;
            }
            // Include phoneVerified from token
            if (token.phoneVerified !== undefined && session.user) {
                session.user.phoneVerified = token.phoneVerified;
            }
            return session;
        },
        async jwt({ token, user, trigger }) {
            // When user first logs in, add role and phone to token
            if (user) {
                // Strict admin email validation (case-insensitive)
                const adminEmail = process.env.ADMIN_EMAIL;

                // Grant ADMIN role if email matches (case-insensitive comparison)
                if (user.email?.toLowerCase() === adminEmail?.toLowerCase()) {
                    token.role = "ADMIN";
                } else {
                    // Force USER role for everyone else
                    token.role = "USER";
                }

                token.phone = user.phone;
                token.phoneVerified = user.phoneVerified;
            }

            // NOTE: Database queries removed from JWT callback
            // This callback runs in Edge Runtime (middleware) where Prisma is not supported
            // Phone verification status updates are handled via session update triggers
            // when the user verifies their phone (see /api/auth/verify-phone)

            return token;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
