import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// POST /api/admin/customers/bulk-message - Send bulk messages to customers
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customerIds, subject, message, channel } = body;

        if (!customerIds || customerIds.length === 0) {
            return NextResponse.json(
                { error: 'No customers selected' },
                { status: 400 }
            );
        }

        if (!message || !message.trim()) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Fetch customer contact details
        const customers = await prisma.user.findMany({
            where: {
                id: { in: customerIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        });

        // TODO: Integrate with email/SMS service
        // For now, we'll just return a success response with the data that would be sent

        const messageData = {
            recipients: customers.length,
            channel: channel || 'email', // 'email' or 'sms'
            subject,
            message,
            customers: customers.map((c) => ({
                id: c.id,
                name: c.name,
                contact: channel === 'sms' ? c.phone : c.email,
            })),
            timestamp: new Date().toISOString(),
            sentBy: session.user.name || session.user.email,
        };

        // Log the message attempt (optional - could create a BulkMessage model)
        console.log('Bulk message prepared:', messageData);

        return NextResponse.json({
            success: true,
            message: 'Message prepared for sending',
            data: messageData,
            note: 'Email/SMS service integration required to send actual messages',
        });
    } catch (error) {
        console.error('Error preparing bulk message:', error);
        return NextResponse.json(
            { error: 'Failed to prepare bulk message' },
            { status: 500 }
        );
    }
}
