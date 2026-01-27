import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
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
            return session;
        },
        async jwt({ token, user }) {
            // When user first logs in, add role and phone to token
            if (user) {
                // Strict admin email validation
                const adminEmail = process.env.ADMIN_EMAIL;

                // Grant ADMIN role if email matches exactly (regardless of DB role)
                if (user.email === adminEmail) {
                    token.role = "ADMIN";
                } else {
                    // Force USER role for everyone else
                    token.role = "USER";
                }

                token.phone = user.phone;
            }
            return token;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
