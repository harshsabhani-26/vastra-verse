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
        strategy: "jwt", // Use JWT for flexibility, but Adapter supports database sessions too. 
        // Note: With Adapter, default strategy is "database". Explicitly setting "jwt" allows 
        // credentials provider to work alongside OAuth without complicated session handling.
    },
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
                                // Note: IP would be set via a callback
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
