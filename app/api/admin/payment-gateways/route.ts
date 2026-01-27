import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/payment-gateways
 * Get all payment gateway settings
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const gateways = await prisma.paymentGatewaySettings.findMany({
            orderBy: { provider: "asc" },
        });

        // Mask sensitive data
        const maskedGateways = gateways.map(gateway => ({
            ...gateway,
            apiSecret: gateway.apiSecret ? "***" + gateway.apiSecret.slice(-4) : null,
            webhookSecret: gateway.webhookSecret ? "***" + gateway.webhookSecret.slice(-4) : null,
        }));

        return NextResponse.json({ gateways: maskedGateways });
    } catch (error: any) {
        console.error("Error fetching payment gateways:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payment gateways" },
            { status: 500 }
        );
    }
}
