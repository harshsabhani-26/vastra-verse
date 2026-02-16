import { NextRequest, NextResponse } from "next/server";
import { checkServiceability } from "@/lib/shipping-provider";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        // Admin only
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const pickupPostcode = searchParams.get("pickupPostcode");
        const deliveryPostcode = searchParams.get("deliveryPostcode");
        const weight = searchParams.get("weight");
        const cod = searchParams.get("cod") === "true";

        if (!pickupPostcode || !deliveryPostcode || !weight) {
            return NextResponse.json(
                { error: "Missing required parameters" },
                { status: 400 }
            );
        }

        const couriers = await checkServiceability({
            pickupPostcode,
            deliveryPostcode,
            weight,
            cod
        });

        return NextResponse.json({ couriers });
    } catch (error: any) {
        console.error("Serviceability check failed:", error);
        return NextResponse.json(
            { error: error.message || "Failed to check serviceability" },
            { status: 500 }
        );
    }
}
