import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current settings
        let settings = await prisma.systemSettings.findFirst();

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { maintenanceMode: true },
            });
        } else {
            settings = await prisma.systemSettings.update({
                where: { id: settings.id },
                data: { maintenanceMode: !settings.maintenanceMode },
            });
        }

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                userEmail: session.user.email,
                action: 'TOGGLE_MAINTENANCE_MODE',
                description: `${settings.maintenanceMode ? 'Enabled' : 'Disabled'} maintenance mode`,
                resourceType: 'SystemSettings',
                resourceId: settings.id,
                newValue: { maintenanceMode: settings.maintenanceMode },
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
                userAgent: request.headers.get('user-agent'),
                method: 'POST',
                path: '/api/admin/settings/system/toggle-maintenance',
            },
        });

        return NextResponse.json({
            maintenanceMode: settings.maintenanceMode,
            message: `Maintenance mode ${settings.maintenanceMode ? 'enabled' : 'disabled'}`,
        });
    } catch (error) {
        console.error('Toggle maintenance mode error:', error);
        return NextResponse.json({ error: 'Failed to toggle maintenance mode' }, { status: 500 });
    }
}
