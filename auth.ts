import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

import Google from "next-auth/providers/google";

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60,  // 7 days (audit: reduced from 30 days to limit token theft window)
        updateAge: 12 * 60 * 60,    // 12 hours (audit: was 24h — refresh more frequently)
    },
    // Explicitly configure secure cookies for production
    // Simplified configuration - let NextAuth handle secure cookies automatically
    debug: false,
    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true, // Allow linking Google with existing email accounts
            authorization: {
                params: {
                    prompt: "consent", // Force account selection and consent every time
                    access_type: "offline",
                },
            },
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;

                    if (!user.password) return null;

                    // Check if account is locked
                    if (user.lockedUntil && user.lockedUntil > new Date()) {
                        console.log(`Account locked until ${user.lockedUntil}`);
                        throw new Error('Account is temporarily locked. Please try again later.');
                    }

                    // Get system settings for max attempts
                    const systemSettings = await prisma.systemSettings.findFirst();
                    const maxAttempts = systemSettings?.maxLoginAttempts || 5;
                    const lockoutDuration = systemSettings?.lockoutDuration || 30;

                    const passwordsMatch = await bcrypt.compare(password, user.password);

                    if (passwordsMatch) {
                        // Successful login - reset failed attempts and update last login
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: 0,
                                lockedUntil: null,
                                lastLoginAt: new Date(),
                            },
                        });

                        // Log successful login
                        await prisma.activityLog.create({
                            data: {
                                userId: user.id,
                                userEmail: user.email,
                                action: 'LOGIN',
                                description: 'User logged in successfully',
                                resourceType: 'User',
                                resourceId: user.id,
                                status: 'SUCCESS',
                            },
                        });

                        // SECURITY: Detect new IP for admin logins
                        const adminEmail = process.env.ADMIN_EMAIL;
                        if (user.email?.toLowerCase() === adminEmail?.toLowerCase()) {
                            try {
                                const { detectNewIPAndNotify } = await import('@/lib/admin-security');
                                // We can't get the IP from the credentials provider directly,
                                // so we check/update IP lazily via the session/JWT callbacks
                                // and the admin-security module handles the notification.
                                // Mark the user for IP check on next admin API request.
                                console.log(`[SECURITY] Admin login detected for ${user.email}`);
                            } catch (err) {
                                console.error('[SECURITY] Failed to initialize IP detection:', err);
                            }
                        }

                        return user;
                    } else {
                        // Failed login - increment counter
                        const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
                        const shouldLock = newFailedAttempts >= maxAttempts;

                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                failedLoginAttempts: newFailedAttempts,
                                ...(shouldLock && {
                                    lockedUntil: new Date(Date.now() + lockoutDuration * 60 * 1000),
                                }),
                            },
                        });

                        // Log failed login
                        await prisma.activityLog.create({
                            data: {
                                userId: user.id,
                                userEmail: user.email,
                                action: 'LOGIN',
                                description: `Failed login attempt (${newFailedAttempts}/${maxAttempts})`,
                                resourceType: 'User',
                                resourceId: user.id,
                                status: 'FAILED',
                            },
                        });

                        if (shouldLock) {
                            throw new Error(`Account locked after ${maxAttempts} failed attempts. Try again in ${lockoutDuration} minutes.`);
                        }
                    }
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
});
