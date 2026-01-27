import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Middleware to protect ALL admin API routes
export async function adminApiAuth(request: NextRequest) {
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;

    // Check if user is authenticated and is the admin
    if (!session?.user || session.user.email !== adminEmail) {
        return NextResponse.json(
            { error: "Unauthorized access" },
            { status: 401 }
        );
    }

    return null; // Allow access
}

// Helper function to use in API routes
export async function requireAdmin() {
    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!session?.user || session.user.email !== adminEmail) {
        throw new Error("Unauthorized");
    }

    return session;
}
