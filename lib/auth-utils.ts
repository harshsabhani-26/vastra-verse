import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

/**
 * Centralized admin verification utility
 * Checks both role AND email against ADMIN_EMAIL environment variable
 */
export async function isAdmin(session: Session | null): Promise<boolean> {
    if (!session?.user) {
        return false;
    }

    const adminEmail = process.env.ADMIN_EMAIL;

    // Strict verification: must have ADMIN role AND match admin email (case-insensitive)
    return (
        session.user.role === "ADMIN" &&
        session.user.email?.toLowerCase() === adminEmail?.toLowerCase()
    );
}

/**
 * Admin verification for API routes
 * Returns authorization status with detailed reason for logging
 */
export async function requireAdmin(request?: Request): Promise<{
    authorized: boolean;
    session: Session | null;
    reason?: string;
}> {
    const session = await auth();

    if (!session?.user) {
        return {
            authorized: false,
            session: null,
            reason: "No active session"
        };
    }

    if (session.user.role !== "ADMIN") {
        return {
            authorized: false,
            session,
            reason: `Insufficient permissions - role: ${session.user.role}`
        };
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (session.user.email?.toLowerCase() !== adminEmail?.toLowerCase()) {
        return {
            authorized: false,
            session,
            reason: `Email mismatch - expected: ${adminEmail}, got: ${session.user.email}`
        };
    }

    return {
        authorized: true,
        session
    };
}

/**
 * Consistent unauthorized response for API routes
 */
export function unauthorizedResponse(reason?: string): NextResponse {
    const response = {
        error: "Unauthorized",
        message: "Admin access required"
    };

    // In development, include reason for debugging
    if (process.env.NODE_ENV === "development" && reason) {
        (response as any).debug = reason;
    }

    return NextResponse.json(response, { status: 403 });
}

/**
 * Log unauthorized admin access attempt
 */
export async function logUnauthorizedAccess(
    session: Session | null,
    path: string,
    reason: string,
    ipAddress?: string
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId: session?.user?.id || null,
                userEmail: session?.user?.email || "anonymous",
                action: "UNAUTHORIZED_ADMIN_ACCESS",
                description: `Unauthorized access attempt to ${path}`,
                resourceType: "AdminPanel",
                path: path,
                status: "FAILED",
                ipAddress: ipAddress || "unknown",
                oldValue: { reason } as any,
            }
        });
    } catch (error) {
        // Don't throw errors in logging to prevent disrupting main flow
        console.error("[AUTH_UTILS] Failed to log unauthorized access:", error);
    }
}

/**
 * Log successful admin access
 */
export async function logAdminAccess(
    session: Session,
    action: string,
    description: string,
    resourceType?: string,
    resourceId?: string
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email || "unknown",
                action,
                description,
                resourceType: resourceType || "AdminPanel",
                resourceId,
                status: "SUCCESS",
            }
        });
    } catch (error) {
        console.error("[AUTH_UTILS] Failed to log admin access:", error);
    }
}
