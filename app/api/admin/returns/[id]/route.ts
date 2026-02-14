
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ReturnStatus, InspectionStatus } from "@prisma/client";
import { processReturnRefund } from "@/lib/refund-service";
import { restoreInventoryForReturn } from "@/lib/inventory-restore";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, adminNotes } = body;
        // Action: APPROVE, REJECT, MARK_RECEIVED, INSPECTION_PASS, INSPECTION_FAIL, PROCESS_REFUND

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id }
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        let updateData: any = { adminNotes };

        switch (action) {
            case "APPROVE":
                updateData.status = "APPROVED";
                updateData.approvedAt = new Date();
                break;

            case "REJECT":
                updateData.status = "REJECTED";
                updateData.rejectedAt = new Date();
                updateData.inspectionStatus = "NOT_APPLICABLE";
                break;

            case "MARK_RECEIVED":
                updateData.status = "ITEM_RECEIVED";
                updateData.receivedAt = new Date();
                updateData.inspectionStatus = "PENDING"; // Ready for inspection
                break;

            case "INSPECTION_PASS":
                if (returnRequest.status !== "ITEM_RECEIVED") {
                    return NextResponse.json(
                        { error: "Items must be received before inspection" },
                        { status: 400 }
                    );
                }
                updateData.inspectionStatus = "PASSED";

                // Restore inventory
                await restoreInventoryForReturn(id);
                break;

            case "INSPECTION_FAIL":
                if (returnRequest.status !== "ITEM_RECEIVED") {
                    return NextResponse.json(
                        { error: "Items must be received before inspection" },
                        { status: 400 }
                    );
                }
                updateData.inspectionStatus = "FAILED";
                updateData.status = "CLOSED"; // No refund will be issued
                break;

            case "PROCESS_REFUND":
                // Validate inspection passed
                if (returnRequest.inspectionStatus !== "PASSED") {
                    return NextResponse.json(
                        { error: "Return must pass inspection before refund" },
                        { status: 400 }
                    );
                }

                // Call Refund Service
                const result = await processReturnRefund(id, session.user.id);
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }
                // The service handles status updates (REFUND_COMPLETED)
                return NextResponse.json({ success: true, refundId: result.refundId });

            default:
                if (!adminNotes) { // If only updating notes, that's fine
                    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
                }
        }

        const updatedReturn = await prisma.returnRequest.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ success: true, returnRequest: updatedReturn });


    } catch (error) {
        console.error("Admin Return Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update return request" },
            { status: 500 }
        );
    }
}
