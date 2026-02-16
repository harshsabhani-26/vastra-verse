
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { ReturnStatus, InspectionStatus } from "@prisma/client";
import { processReturnRefund } from "@/lib/refund-service";
import { restoreInventoryForReturn } from "@/lib/inventory-restore";
import { EventDispatcher } from "@/lib/services/event-dispatcher";

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
        const { action, adminNotes, refundDetails } = body;
        // Action: APPROVE, REJECT, MARK_RECEIVED, INSPECTION_PASS, INSPECTION_FAIL, 
        //         PROCESS_REFUND (online), PROCESS_COD_REFUND (manual), CONFIRM_COD_REFUND

        const returnRequest = await prisma.returnRequest.findUnique({
            where: { id },
            include: { order: true }
        });

        if (!returnRequest) {
            return NextResponse.json({ error: "Return request not found" }, { status: 404 });
        }

        let updateData: any = { adminNotes };

        switch (action) {
            case "APPROVE":
                updateData.status = "APPROVED";
                updateData.approvedAt = new Date();
                // Fire event notification
                EventDispatcher.returnApproved({
                    id,
                    orderId: returnRequest.orderId,
                }).catch(() => { });
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

                // Update Order Status to RETURNED
                // This reflects that the item has been received and approved
                await prisma.order.update({
                    where: { id: returnRequest.orderId },
                    data: { status: "RETURNED" }
                });
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

                // Automatic refund (online) or manual (COD)
                const result = await processReturnRefund(id, session.user.id, refundDetails);
                if (!result.success) {
                    return NextResponse.json({ error: result.error }, { status: 400 });
                }
                return NextResponse.json({
                    success: true,
                    refundId: result.refundId,
                    message: result.message
                });

            case "PROCESS_COD_REFUND":
                // Manual COD refund
                if (returnRequest.inspectionStatus !== "PASSED") {
                    return NextResponse.json(
                        { error: "Return must pass inspection before refund" },
                        { status: 400 }
                    );
                }

                if (!refundDetails) {
                    return NextResponse.json(
                        { error: "Refund details required (method, UPI/Bank info)" },
                        { status: 400 }
                    );
                }

                const codResult = await processReturnRefund(id, session.user.id, refundDetails);
                if (!codResult.success) {
                    return NextResponse.json({ error: codResult.error }, { status: 400 });
                }
                return NextResponse.json({
                    success: true,
                    refundId: codResult.refundId,
                    message: codResult.message
                });

            case "CONFIRM_COD_REFUND":
                // Confirm manual refund was sent
                const { confirmCODRefund } = await import("@/lib/refund-service");
                const { refundId } = body;

                if (!refundId) {
                    return NextResponse.json(
                        { error: "Refund ID required" },
                        { status: 400 }
                    );
                }

                const confirmResult = await confirmCODRefund(refundId, session.user.id);
                if (!confirmResult.success) {
                    return NextResponse.json({ error: confirmResult.error }, { status: 400 });
                }
                return NextResponse.json({ success: true, message: confirmResult.message });

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
