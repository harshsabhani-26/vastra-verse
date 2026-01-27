import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// GSTIN validation regex
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create tax settings
        let settings = await prisma.taxSettings.findFirst();

        if (!settings) {
            settings = await prisma.taxSettings.create({
                data: {
                    gstEnabled: true,
                    cgstRate: 9,
                    sgstRate: 9,
                    igstRate: 18,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get tax settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch tax settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Validate GSTIN if provided
        if (data.gstin && !GSTIN_REGEX.test(data.gstin)) {
            return NextResponse.json(
                { error: 'Invalid GSTIN format. Expected format: 22AAAAA0000A1Z5' },
                { status: 400 }
            );
        }

        // Get existing settings or create new
        let settings = await prisma.taxSettings.findFirst();

        if (!settings) {
            settings = await prisma.taxSettings.create({
                data,
            });
        } else {
            settings = await prisma.taxSettings.update({
                where: { id: settings.id },
                data,
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'UPDATE_TAX_SETTINGS',
                description: `Updated tax settings${data.gstin ? ` - GSTIN: ${data.gstin}` : ''}`,
                resourceType: 'TaxSettings',
                resourceId: settings.id,
                newValue: data,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'PUT',
                path: '/api/admin/settings/tax',
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Update tax settings error:', error);
        return NextResponse.json({ error: 'Failed to update tax settings' }, { status: 500 });
    }
}
