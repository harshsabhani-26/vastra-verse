import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create store settings
        let settings = await prisma.storeSettings.findFirst();

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data: {
                    storeName: 'My Store',
                    country: 'India',
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get store settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch store settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Get existing settings or create new
        let settings = await prisma.storeSettings.findFirst();

        if (!settings) {
            settings = await prisma.storeSettings.create({
                data,
            });
        } else {
            settings = await prisma.storeSettings.update({
                where: { id: settings.id },
                data,
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'UPDATE_STORE_SETTINGS',
                description: `Updated store settings`,
                resourceType: 'StoreSettings',
                resourceId: settings.id,
                newValue: data,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'PUT',
                path: '/api/admin/settings/store',
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Update store settings error:', error);
        return NextResponse.json({ error: 'Failed to update store settings' }, { status: 500 });
    }
}
