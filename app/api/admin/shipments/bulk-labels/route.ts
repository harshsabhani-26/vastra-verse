import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { shipmentIds } = await req.json();

        if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
            return NextResponse.json({ error: "Invalid shipment IDs" }, { status: 400 });
        }

        // Fetch shipments with label URLs
        const shipments = await prisma.shipment.findMany({
            where: {
                id: { in: shipmentIds },
                labelUrl: { not: null },
            },
            select: {
                labelUrl: true,
            },
        });

        if (shipments.length === 0) {
            return NextResponse.json({ error: "No labels found for selected shipments" }, { status: 404 });
        }

        // For now, return the first label URL
        // In production, you'd merge multiple PDFs or create a ZIP
        const firstLabelUrl = shipments[0].labelUrl;

        if (!firstLabelUrl) {
            return NextResponse.json({ error: "Label URL not available" }, { status: 404 });
        }

        // Fetch the PDF
        const response = await fetch(firstLabelUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch label");
        }

        const pdfBuffer = await response.arrayBuffer();

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="shipping-labels-${Date.now()}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("[Bulk Labels Error]:", error);
        return NextResponse.json(
            { error: "Failed to download labels", message: error.message },
            { status: 500 }
        );
    }
}
