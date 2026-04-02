import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.storeSettings.findFirst();
        const bg = (settings as any)?.liveShoppingBg || "";
        return NextResponse.json({ bg });
    } catch {
        return NextResponse.json({ bg: "" });
    }
}
