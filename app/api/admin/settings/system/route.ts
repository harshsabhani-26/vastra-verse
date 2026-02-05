import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get or create system settings
        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: {
                    currency: 'INR',
                    currencySymbol: '₹',
                    timezone: 'Asia/Kolkata',
                    sessionTimeout: 30,
                    passwordMinLength: 12,
                    maxLoginAttempts: 5,
                    lockoutDuration: 30,
                },
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get system settings error:', error);
        return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
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
        let settings = await prisma.systemSettings.findFirst();

        const oldValue = settings ? { ...settings } : null;

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data,
            });
        } else {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data,
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'UPDATE_SYSTEM_SETTINGS',
                description: `Updated system settings`,
                resourceType: 'SystemSettings',
                resourceId: settings.id,
                oldValue: oldValue as any,
                newValue: data,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'PUT',
                path: '/api/admin/settings/system',
            },
        });

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Update system settings error:', error);
        return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 });
    }
}
