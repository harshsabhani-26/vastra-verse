import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getEnvironment } from '@/lib/db-safety';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Auth check — admin only
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const environment = getEnvironment();
        const startTime = Date.now();

        // 1. Database connection check
        let connectionStatus = 'disconnected';
        try {
            await prisma.$queryRaw`SELECT 1`;
            connectionStatus = 'connected';
        } catch {
            connectionStatus = 'error';
        }
        const connectionTime = Date.now() - startTime;

        // 2. Check migration status
        let migrationStatus = 'unknown';
        let pendingMigrations: string[] = [];
        let appliedMigrations: number = 0;
        try {
            const migrations = await prisma.$queryRaw`
        SELECT "migration_name", "finished_at" 
        FROM "_prisma_migrations" 
        ORDER BY "finished_at" DESC
      ` as any[];

            appliedMigrations = migrations.length;
            const failedMigrations = migrations.filter((m: any) => !m.finished_at);
            pendingMigrations = failedMigrations.map((m: any) => m.migration_name);
            migrationStatus = pendingMigrations.length > 0 ? 'pending' : 'up-to-date';
        } catch {
            migrationStatus = 'error';
        }

        // 3. Check last seed execution
        let lastSeed = null;
        let seedVersion = null;
        try {
            const lastLog = await prisma.migrationLog.findFirst({
                where: { type: 'SEED' },
                orderBy: { executedAt: 'desc' },
            });
            if (lastLog) {
                lastSeed = lastLog.executedAt;
                seedVersion = lastLog.version;
            }
        } catch {
            // MigrationLog table may not exist yet
        }

        // 4. Last migration log
        let lastMigration = null;
        try {
            const lastMigLog = await prisma.migrationLog.findFirst({
                where: { type: 'MIGRATION' },
                orderBy: { executedAt: 'desc' },
            });
            if (lastMigLog) {
                lastMigration = lastMigLog.executedAt;
            }
        } catch {
            // Table may not exist
        }

        // 5. Count records in config tables
        const [
            storeSettingsCount,
            taxSettingsCount,
            shippingSettingsCount,
            shippingZoneCount,
            courierPartnerCount,
            emailSettingsCount,
            systemSettingsCount,
        ] = await Promise.all([
            prisma.storeSettings.count(),
            prisma.taxSettings.count(),
            prisma.shippingSettings.count(),
            prisma.shippingZone.count(),
            prisma.courierPartner.count(),
            prisma.emailSettings.count(),
            prisma.systemSettings.count(),
        ]);

        return NextResponse.json({
            status: 'healthy',
            environment,
            timestamp: new Date().toISOString(),
            database: {
                connectionStatus,
                connectionTimeMs: connectionTime,
                migrationStatus,
                appliedMigrations,
                pendingMigrations,
                lastMigration,
            },
            seed: {
                version: seedVersion,
                lastExecution: lastSeed,
            },
            configTables: {
                storeSettings: storeSettingsCount,
                taxSettings: taxSettingsCount,
                shippingSettings: shippingSettingsCount,
                shippingZones: shippingZoneCount,
                courierPartners: courierPartnerCount,
                emailSettings: emailSettingsCount,
                systemSettings: systemSettingsCount,
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
