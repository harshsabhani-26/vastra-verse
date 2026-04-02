/**
 * Inngest Shipping Cron Jobs
 *
 * Scheduled background jobs for shipping operations:
 * - syncTrackingCron: Sync tracking for all in-transit shipments (every 15 min)
 * - ndrEscalationCron: Escalate unresolved NDRs (daily at 10 AM IST)
 * - shipmentHealthCheck: Daily health check for stale shipments
 */

import { inngest, logJobStart, logJobComplete, logJobError } from "@/lib/inngest";
import prisma from "@/lib/prisma";
import { syncTracking } from "@/services/shipping/trackingService";
import { fetchAndSyncNdrs } from "@/services/shipping/ndrService";
import { notificationService } from "@/lib/notifications/notificationService";
import { logInfo, logError } from "@/lib/logger";

// ─── Sync Tracking Cron (every 15 minutes) ─────────────────────────────────

/**
 * Fetches all in-transit shipments and syncs their tracking data
 * from Shiprocket. Runs every 15 minutes.
 *
 * Processes shipments in batches to avoid API rate limits.
 */
export const syncTrackingCron = inngest.createFunction(
    {
        id: "shipping-sync-tracking",
        name: "Sync Shipping Tracking",
        retries: 1,
        concurrency: {
            limit: 1, // Only one instance at a time
        },
    },
    { cron: "*/15 * * * *" },
    async ({ step }) => {
        const startTime = Date.now();
        logJobStart("shipping-sync-tracking", {});

        // Step 1: Fetch all active AWB numbers
        const awbNumbers = await step.run("fetch-active-awbs", async () => {
            const activeShipments = await prisma.shipment.findMany({
                where: {
                    status: {
                        in: [
                            "READY_TO_SHIP",
                            "LABEL_GENERATED",
                            "PICKUP_SCHEDULED",
                            "PICKED_UP",
                            "IN_TRANSIT",
                            "OUT_FOR_DELIVERY",
                            "DELIVERY_ATTEMPTED",
                        ],
                    },
                    awbNumber: { not: null },
                },
                select: {
                    awbNumber: true,
                },
                take: 100, // Process up to 100 per cycle
            });

            return activeShipments
                .map((s) => s.awbNumber)
                .filter(Boolean) as string[];
        });

        if (awbNumbers.length === 0) {
            logJobComplete("shipping-sync-tracking", { synced: 0 }, Date.now() - startTime);
            return { synced: 0, errors: 0 };
        }

        // Step 2: Sync in batches of 50 to avoid Shiprocket rate limits
        let synced = 0;
        let errors = 0;
        const BATCH_SIZE = 50;

        for (let i = 0; i < awbNumbers.length; i += BATCH_SIZE) {
            const batch = awbNumbers.slice(i, i + BATCH_SIZE);
            const batchIndex = Math.floor(i / BATCH_SIZE);

            await step.run(`sync-batch-${batchIndex}`, async () => {
                for (const awb of batch) {
                    try {
                        await syncTracking(awb);
                        synced++;
                    } catch (err) {
                        errors++;
                        logError("TRACKING_CRON", err, { awb });
                    }
                }
            });

            // Delay between batches to respect rate limits
            if (i + BATCH_SIZE < awbNumbers.length) {
                await step.sleep(`batch-delay-${batchIndex}`, "2s");
            }
        }

        logJobComplete(
            "shipping-sync-tracking",
            { synced, errors, total: awbNumbers.length, batches: Math.ceil(awbNumbers.length / BATCH_SIZE) },
            Date.now() - startTime
        );

        return { synced, errors, total: awbNumbers.length };
    }
);

// ─── NDR Escalation Cron (daily at 10 AM IST) ──────────────────────────────

/**
 * Daily job that:
 * 1. Syncs latest NDRs from Shiprocket tracking data
 * 2. Escalates unresolved NDRs older than 48 hours to admin
 *
 * Runs at 10 AM IST (04:30 UTC).
 */
export const ndrEscalationCron = inngest.createFunction(
    {
        id: "shipping-ndr-escalation",
        name: "NDR Sync & Escalation",
        retries: 2,
    },
    { cron: "30 4 * * *" }, // 10:00 AM IST = 04:30 UTC
    async ({ step }) => {
        const startTime = Date.now();
        logJobStart("shipping-ndr-escalation", {});

        // Step 1: Sync NDRs from Shiprocket tracking
        const syncResult = await step.run("sync-ndrs", async () => {
            return await fetchAndSyncNdrs();
        });

        logInfo("NDR_ESCALATION", "NDR sync phase complete", {
            synced: syncResult.synced,
            skipped: syncResult.skipped,
            errors: syncResult.errors,
        });

        // Step 2: Find unresolved NDRs older than 48 hours
        const escalationThreshold = new Date();
        escalationThreshold.setHours(escalationThreshold.getHours() - 48);

        const unresolvedNdrs = await step.run("find-unresolved", async () => {
            return await prisma.ndrEvent.findMany({
                where: {
                    resolvedAt: null,
                    actionTaken: null,
                    attemptDate: {
                        lt: escalationThreshold,
                    },
                },
                include: {
                    shipment: {
                        select: {
                            id: true,
                            awbNumber: true,
                            orderId: true,
                            order: {
                                select: {
                                    id: true,
                                    userId: true,
                                },
                            },
                        },
                    },
                },
                take: 50,
            });
        });

        if (unresolvedNdrs.length === 0) {
            logJobComplete(
                "shipping-ndr-escalation",
                { synced: syncResult.synced, escalated: 0 },
                Date.now() - startTime
            );
            return {
                synced: syncResult.synced,
                escalated: 0,
            };
        }

        // Step 3: Send admin escalation notification
        await step.run("escalate-to-admin", async () => {
            const awbList = unresolvedNdrs
                .map((n: { awbNumber: string }) => n.awbNumber)
                .slice(0, 10)
                .join(", ");

            await notificationService.sendImmediate({
                role: "ADMIN",
                type: "NEW_ORDER",
                title: `⚠️ ${unresolvedNdrs.length} NDRs Require Attention`,
                message: `${unresolvedNdrs.length} NDR event(s) have been unresolved for over 48 hours. AWBs: ${awbList}${unresolvedNdrs.length > 10
                    ? ` and ${unresolvedNdrs.length - 10} more`
                    : ""
                    }`,
                priority: "HIGH",
                actionUrl: "/admin/shipping/ndr",
                actionText: "View NDRs",
                data: {
                    count: unresolvedNdrs.length,
                    waybills: unresolvedNdrs.map((n: { awbNumber: string }) => n.awbNumber),
                },
            });

            logInfo("NDR_ESCALATION", "Admin escalation sent", {
                count: unresolvedNdrs.length,
            });
        });

        logJobComplete(
            "shipping-ndr-escalation",
            {
                synced: syncResult.synced,
                escalated: unresolvedNdrs.length,
            },
            Date.now() - startTime
        );

        return {
            synced: syncResult.synced,
            escalated: unresolvedNdrs.length,
        };
    }
);

// ─── Shipment Health Check (daily at midnight IST) ──────────────────────────

/**
 * Daily health check that identifies stale or problematic shipments:
 * - Shipments stuck in READY_TO_SHIP for > 24 hours
 * - Shipments in PICKUP_SCHEDULED for > 48 hours without progress
 * - Shipments in transit for > 10 days
 *
 * Sends an admin alert if any anomalies are found.
 */
export const shipmentHealthCheck = inngest.createFunction(
    {
        id: "shipping-health-check",
        name: "Daily Shipment Health Check",
        retries: 1,
    },
    { cron: "30 18 * * *" }, // 00:00 AM IST = 18:30 UTC (previous day)
    async ({ step }) => {
        const startTime = Date.now();
        logJobStart("shipping-health-check", {});

        const now = new Date();

        // Step 1: Check for stale shipments
        const staleShipments = await step.run("check-stale-shipments", async () => {
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const tenDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

            const [stuckReadyToShip, stuckPickup, longTransit] = await Promise.all([
                // Shipments stuck in READY_TO_SHIP > 24h
                prisma.shipment.count({
                    where: {
                        status: "READY_TO_SHIP",
                        createdAt: { lt: oneDayAgo },
                    },
                }),
                // Shipments stuck in PICKUP_SCHEDULED > 48h
                prisma.shipment.count({
                    where: {
                        status: "PICKUP_SCHEDULED",
                        createdAt: { lt: twoDaysAgo },
                    },
                }),
                // Shipments in same status > 3 days
                prisma.shipment.count({
                    where: {
                        status: { in: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY_ATTEMPTED"] },
                        createdAt: { lt: tenDaysAgo },
                    },
                }),
            ]);

            return { stuckReadyToShip, stuckPickup, longTransit };
        });

        const totalIssues =
            staleShipments.stuckReadyToShip +
            staleShipments.stuckPickup +
            staleShipments.longTransit;

        // Step 2: Send alert if issues found
        if (totalIssues > 0) {
            await step.run("send-health-alert", async () => {
                const issues: string[] = [];
                if (staleShipments.stuckReadyToShip > 0) {
                    issues.push(`${staleShipments.stuckReadyToShip} stuck in Ready to Ship (>24h)`);
                }
                if (staleShipments.stuckPickup > 0) {
                    issues.push(`${staleShipments.stuckPickup} stuck in Pickup Scheduled (>48h)`);
                }
                if (staleShipments.longTransit > 0) {
                    issues.push(`${staleShipments.longTransit} stuck in same status (>3 days)`);
                }

                await notificationService.sendImmediate({
                    role: "ADMIN",
                    type: "NEW_ORDER",
                    title: `📦 Shipment Health: ${totalIssues} issue(s)`,
                    message: `Daily shipment health check found:\n${issues.map((i) => `• ${i}`).join("\n")}`,
                    priority: "NORMAL",
                    actionUrl: "/admin/shipping",
                    actionText: "View Shipments",
                    data: staleShipments,
                });

                logInfo("HEALTH_CHECK", "Health alert sent", {
                    totalIssues,
                    ...staleShipments,
                });
            });
        }

        logJobComplete(
            "shipping-health-check",
            { totalIssues, ...staleShipments },
            Date.now() - startTime
        );

        return {
            totalIssues,
            ...staleShipments,
        };
    }
);
