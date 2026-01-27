'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

// Toggle VIP status for a customer
export async function toggleVIP(userId: string) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isVIP: true },
        });

        if (!user) {
            return { error: 'User not found' };
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isVIP: !user.isVIP },
        });

        revalidatePath('/admin/customers');
        revalidatePath(`/admin/customers/${userId}`);

        return { success: true, isVIP: updatedUser.isVIP };
    } catch (error) {
        console.error('Error toggling VIP status:', error);
        return { error: 'Failed to toggle VIP status' };
    }
}

// Toggle block status for a customer
export async function toggleBlock(userId: string, reason?: string) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isBlocked: true },
        });

        if (!user) {
            return { error: 'User not found' };
        }

        const isBlocked = !user.isBlocked;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isBlocked,
                blockedAt: isBlocked ? new Date() : null,
                blockedReason: isBlocked ? reason || null : null,
            },
        });

        revalidatePath('/admin/customers');
        revalidatePath(`/admin/customers/${userId}`);

        return { success: true, isBlocked: updatedUser.isBlocked };
    } catch (error) {
        console.error('Error toggling block status:', error);
        return { error: 'Failed to toggle block status' };
    }
}

// Add a customer note
export async function addCustomerNote(userId: string, content: string) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        if (!content || !content.trim()) {
            return { error: 'Note content is required' };
        }

        const note = await prisma.customerNote.create({
            data: {
                userId,
                content,
                createdBy: session.user.name || session.user.email || 'Admin',
            },
        });

        revalidatePath(`/admin/customers/${userId}`);

        return { success: true, note };
    } catch (error) {
        console.error('Error adding customer note:', error);
        return { error: 'Failed to add customer note' };
    }
}

// Delete a customer note
export async function deleteCustomerNote(noteId: string) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== 'ADMIN') {
            return { error: 'Unauthorized' };
        }

        const note = await prisma.customerNote.findUnique({
            where: { id: noteId },
            select: { userId: true },
        });

        if (!note) {
            return { error: 'Note not found' };
        }

        await prisma.customerNote.delete({
            where: { id: noteId },
        });

        revalidatePath(`/admin/customers/${note.userId}`);

        return { success: true };
    } catch (error) {
        console.error('Error deleting customer note:', error);
        return { error: 'Failed to delete customer note' };
    }
}
