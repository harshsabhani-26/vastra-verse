import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * TEMPORARY DEBUG ENDPOINT
 * Visit /api/debug-session to see your current session data
 * DELETE THIS FILE AFTER DEBUGGING!
 */
export async function GET() {
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        session: {
            exists: !!session,
            user: session?.user ? {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role,
                name: session.user.name,
            } : null,
        },
        environment: {
            adminEmail,
            nextAuthUrl: process.env.NEXTAUTH_URL,
            nextAuthSecretExists: !!process.env.NEXTAUTH_SECRET,
            nodeEnv: process.env.NODE_ENV,
        },
        adminCheck: {
            isEmailMatch: session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase(),
            isRoleAdmin: session?.user?.role === "ADMIN",
            shouldHaveAccess: session?.user?.role === "ADMIN" && session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase(),
        }
    });
}
