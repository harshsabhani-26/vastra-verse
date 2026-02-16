import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { getEnvironment } from '@/lib/db-safety';

export async function POST(req: Request) {
    try {
        // Admin only
        const session = await auth();
        if (!session?.user || (session.user as any).role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const environment = getEnvironment();
        const { confirmed } = await req.json();

        // Require explicit confirmation in production
        if (environment === 'production' && !confirmed) {
            return NextResponse.json(
                {
                    error: 'Production seed requires confirmation',
                    requiresConfirmation: true,
                    environment,
                },
                { status: 400 }
            );
        }

        const startTime = Date.now();

        // Dynamically import and run seeds
        // Using dynamic import since seeds are CommonJS
        const { seedStoreSettings } = require('@/../prisma/seeds/store.seed');
        const { seedTaxSettings } = require('@/../prisma/seeds/tax.seed');
        const { seedShippingSettings } = require('@/../prisma/seeds/shipping.seed');
        const { seedCourierPartners } = require('@/../prisma/seeds/courier.seed');
        const { seedEmailSettings } = require('@/../prisma/seeds/email.seed');
        const { seedSystemSettings } = require('@/../prisma/seeds/system.seed');

        const results: { name: string; status: string; error?: string }[] = [];

        const seeds = [
            { name: 'StoreSettings', fn: seedStoreSettings },
            { name: 'TaxSettings', fn: seedTaxSettings },
            { name: 'ShippingSettings', fn: seedShippingSettings },
            { name: 'CourierPartners', fn: seedCourierPartners },
            { name: 'EmailSettings', fn: seedEmailSettings },
            { name: 'SystemSettings', fn: seedSystemSettings },
        ];

        for (const seed of seeds) {
            try {
                await seed.fn(prisma);
                results.push({ name: seed.name, status: 'success' });
            } catch (error: any) {
                results.push({ name: seed.name, status: 'failed', error: error.message });
                // In production, stop on first failure
                if (environment === 'production') break;
            }
        }

        const duration = Date.now() - startTime;
        const failedCount = results.filter(r => r.status === 'failed').length;

        // Log to MigrationLog
        try {
            await prisma.migrationLog.create({
                data: {
                    version: '1.0.0',
                    type: 'SEED',
                    status: failedCount === 0 ? 'SUCCESS' : 'FAILED',
                    environment,
                    executedBy: session.user.email || 'admin',
                    duration,
                    notes: `Admin UI seed: ${results.length - failedCount} succeeded, ${failedCount} failed`,
                },
            });
        } catch {
            // Non-fatal logging failure
        }

        return NextResponse.json({
            success: failedCount === 0,
            environment,
            duration,
            results,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
