import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/payment-gateways/[provider]
 * Get payment gateway settings for a specific provider
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const gateway = await prisma.paymentGatewaySettings.findUnique({
            where: { provider },
        });

        if (!gateway) {
            return NextResponse.json(
                { error: "Payment gateway not found" },
                { status: 404 }
            );
        }

        // Mask sensitive data
        const maskedGateway = {
            ...gateway,
            apiSecret: gateway.apiSecret ? "***" + gateway.apiSecret.slice(-4) : null,
            webhookSecret: gateway.webhookSecret ? "***" + gateway.webhookSecret.slice(-4) : null,
        };

        return NextResponse.json({ gateway: maskedGateway });
    } catch (error: any) {
        console.error("Error fetching payment gateway:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch payment gateway" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/admin/payment-gateways/[provider]
 * Update payment gateway settings
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    try {
        const { provider } = await params;
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            isEnabled,
            isTestMode,
            apiKey,
            apiSecret,
            merchantId,
            webhookSecret,
            webhookUrl,
            settings,
        } = body;

        // Upsert gateway settings
        const gateway = await prisma.paymentGatewaySettings.upsert({
            where: { provider },
            create: {
                provider,
                isEnabled: isEnabled ?? false,
                isTestMode: isTestMode ?? true,
                apiKey,
                apiSecret,
                merchantId,
                webhookSecret,
                webhookUrl,
                settings,
            },
            update: {
                isEnabled,
                isTestMode,
                ...(apiKey && { apiKey }),
                ...(apiSecret && { apiSecret }),
                ...(merchantId && { merchantId }),
                ...(webhookSecret && { webhookSecret }),
                ...(webhookUrl && { webhookUrl }),
                ...(settings && { settings }),
            },
        });

        return NextResponse.json({
            success: true,
            gateway: {
                ...gateway,
                apiSecret: gateway.apiSecret ? "***" + gateway.apiSecret.slice(-4) : null,
                webhookSecret: gateway.webhookSecret ? "***" + gateway.webhookSecret.slice(-4) : null,
            },
        });
    } catch (error: any) {
        console.error("Error updating payment gateway:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update payment gateway" },
            { status: 500 }
        );
    }
}
