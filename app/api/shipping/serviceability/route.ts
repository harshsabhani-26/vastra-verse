import { NextRequest, NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shiprocket/serviceability";

export const dynamic = "force-dynamic";

/**
 * GET /api/shipping/serviceability?pincode=110001&cod=false
 *
 * PUBLIC endpoint — called during customer checkout to verify delivery pincode.
 * No auth required. Uses the store's pickup pincode from env var.
 *
 * Query params:
 *   pincode  – 6-digit customer delivery pincode (required)
 *   cod      – "true" | "false" — whether COD payment is selected (optional, default false)
 *   weight   – package weight in kg (optional, default 0.5)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const pincode = searchParams.get("pincode")?.trim();
        const cod = searchParams.get("cod") === "true";
        const weight = parseFloat(searchParams.get("weight") || "0.5");

        if (!pincode || !/^\d{6}$/.test(pincode)) {
            return NextResponse.json(
                { error: "A valid 6-digit pincode is required" },
                { status: 400 }
            );
        }

        const pickupPin = process.env.SHIPROCKET_PICKUP_PINCODE || "395007";

        const result = await checkServiceability(pickupPin, pincode, weight, cod);

        return NextResponse.json({
            pincode,
            available: result.serviceable,
            serviceable: result.serviceable,
            codAvailable: result.codAvailable,
            couriers: result.couriers.slice(0, 5).map((c) => ({
                name: c.name,
                rate: c.freightCharge,
                etd: c.estimatedDays || "3-5 days",
            })),
            cheapestRate: result.cheapestRate,
        });
    } catch (error: any) {
        console.error("[Serviceability] Check failed:", error);
        return NextResponse.json(
            { error: "Failed to check serviceability. Please try again." },
            { status: 500 }
        );
    }
}
