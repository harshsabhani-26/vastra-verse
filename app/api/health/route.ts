import { NextResponse } from "next/server";

/**
 * Health Check Endpoint
 * 
 * Used to verify:
 * - Server is running
 * - Environment variables are configured
 * - Basic functionality is operational
 * 
 * Access: /api/health
 */
export async function GET() {
    try {
        // Check critical environment variables
        const envStatus = {
            database: !!process.env.DATABASE_URL,
            auth: !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL,
            adminEmail: !!process.env.ADMIN_EMAIL,
        };

        const allConfigured = Object.values(envStatus).every(status => status);

        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            environment: {
                configured: allConfigured,
                details: envStatus,
            },
            nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
        }, {
            status: allConfigured ? 200 : 500,
        });
    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString(),
        }, {
            status: 500,
        });
    }
}
