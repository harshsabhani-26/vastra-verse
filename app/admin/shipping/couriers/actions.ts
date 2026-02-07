'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export interface CourierPartnerData {
    name: string
    trackingUrlTemplate?: string
    supportsCOD: boolean
    supportsInternational: boolean
    isActive: boolean
}

export async function getCourierPartners() {
    try {
        const partners = await prisma.courierPartner.findMany({
            orderBy: [
                { displayOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        })
        return { success: true, partners }
    } catch (error) {
        console.error('Failed to fetch courier partners:', error)
        return { success: false, error: 'Failed to fetch courier partners' }
    }
}

export async function getCourierPartner(id: string) {
    try {
        const partner = await prisma.courierPartner.findUnique({
            where: { id }
        })
        if (!partner) {
            return { success: false, error: 'Courier partner not found' }
        }
        return { success: true, partner }
    } catch (error) {
        console.error('Failed to fetch courier partner:', error)
        return { success: false, error: 'Failed to fetch courier partner' }
    }
}

export async function createCourierPartner(data: CourierPartnerData) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const partner = await prisma.courierPartner.create({
            data: {
                name: data.name,
                trackingUrlTemplate: data.trackingUrlTemplate,
                supportsCOD: data.supportsCOD,
                supportsInternational: data.supportsInternational,
                isActive: data.isActive,
            }
        })
        revalidatePath('/admin/shipping')
        return { success: true, partner }
    } catch (error) {
        console.error('Failed to create courier partner:', error)
        return { success: false, error: 'Failed to create courier partner' }
    }
}

export async function updateCourierPartner(id: string, data: CourierPartnerData) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const partner = await prisma.courierPartner.update({
            where: { id },
            data: {
                name: data.name,
                trackingUrlTemplate: data.trackingUrlTemplate,
                supportsCOD: data.supportsCOD,
                supportsInternational: data.supportsInternational,
                isActive: data.isActive,
            }
        })
        revalidatePath('/admin/shipping')
        return { success: true, partner }
    } catch (error) {
        console.error('Failed to update courier partner:', error)
        return { success: false, error: 'Failed to update courier partner' }
    }
}

export async function toggleCourierPartner(id: string) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const partner = await prisma.courierPartner.findUnique({ where: { id } })
        if (!partner) {
            return { success: false, error: 'Courier partner not found' }
        }

        const updated = await prisma.courierPartner.update({
            where: { id },
            data: { isActive: !partner.isActive }
        })
        revalidatePath('/admin/shipping')
        return { success: true, partner: updated }
    } catch (error) {
        console.error('Failed to toggle courier partner:', error)
        return { success: false, error: 'Failed to toggle courier partner' }
    }
}

export async function deleteCourierPartner(id: string) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await prisma.courierPartner.delete({
            where: { id }
        })
        revalidatePath('/admin/shipping')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete courier partner:', error)
        return { success: false, error: 'Failed to delete courier partner' }
    }
}

export async function reorderCouriers(updates: { id: string; displayOrder: number }[]) {
    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await Promise.all(
            updates.map(({ id, displayOrder }) =>
                prisma.courierPartner.update({
                    where: { id },
                    data: { displayOrder }
                })
            )
        )
        revalidatePath('/admin/shipping')
        return { success: true }
    } catch (error) {
        console.error('Failed to reorder couriers:', error)
        return { success: false, error: 'Failed to reorder couriers' }
    }
}
