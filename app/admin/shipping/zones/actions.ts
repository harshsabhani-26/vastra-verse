'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ShippingZoneType = 'LOCAL' | 'METRO' | 'REST_OF_INDIA' | 'INTERNATIONAL'

export interface ShippingZoneData {
    name: string
    type: ShippingZoneType
    pincodes: string[]
    minDeliveryDays: number
    maxDeliveryDays: number
    baseCharge: number
    perKgCharge: number
    isActive: boolean
}

export async function getShippingZones() {
    try {
        const zones = await prisma.shippingZone.findMany({
            orderBy: [
                { displayOrder: 'asc' },
                { createdAt: 'desc' }
            ]
        })

        const serializedZones = zones.map(zone => ({
            ...zone,
            baseCharge: Number(zone.baseCharge),
            perKgCharge: Number(zone.perKgCharge)
        }))

        return { success: true, zones: serializedZones }
    } catch (error) {
        console.error('Failed to fetch shipping zones:', error)
        return { success: false, error: 'Failed to fetch shipping zones' }
    }
}

export async function getShippingZone(id: string) {
    try {
        const zone = await prisma.shippingZone.findUnique({
            where: { id }
        })
        if (!zone) {
            return { success: false, error: 'Shipping zone not found' }
        }

        const serializedZone = {
            ...zone,
            baseCharge: Number(zone.baseCharge),
            perKgCharge: Number(zone.perKgCharge)
        }

        return { success: true, zone: serializedZone }
    } catch (error) {
        console.error('Failed to fetch shipping zone:', error)
        return { success: false, error: 'Failed to fetch shipping zone' }
    }
}

export async function createShippingZone(data: ShippingZoneData) {
    try {
        const zone = await prisma.shippingZone.create({
            data: {
                name: data.name,
                type: data.type,
                pincodes: data.pincodes,
                minDeliveryDays: data.minDeliveryDays,
                maxDeliveryDays: data.maxDeliveryDays,
                baseCharge: data.baseCharge,
                perKgCharge: data.perKgCharge,
                isActive: data.isActive,
            }
        })

        const serializedZone = {
            ...zone,
            baseCharge: Number(zone.baseCharge),
            perKgCharge: Number(zone.perKgCharge)
        }

        revalidatePath('/admin/shipping')
        return { success: true, zone: serializedZone }
    } catch (error) {
        console.error('Failed to create shipping zone:', error)
        return { success: false, error: 'Failed to create shipping zone' }
    }
}

export async function updateShippingZone(id: string, data: ShippingZoneData) {
    try {
        const zone = await prisma.shippingZone.update({
            where: { id },
            data: {
                name: data.name,
                type: data.type,
                pincodes: data.pincodes,
                minDeliveryDays: data.minDeliveryDays,
                maxDeliveryDays: data.maxDeliveryDays,
                baseCharge: data.baseCharge,
                perKgCharge: data.perKgCharge,
                isActive: data.isActive,
            }
        })

        const serializedZone = {
            ...zone,
            baseCharge: Number(zone.baseCharge),
            perKgCharge: Number(zone.perKgCharge)
        }

        revalidatePath('/admin/shipping')
        return { success: true, zone: serializedZone }
    } catch (error) {
        console.error('Failed to update shipping zone:', error)
        return { success: false, error: 'Failed to update shipping zone' }
    }
}

export async function toggleShippingZone(id: string) {
    try {
        const zone = await prisma.shippingZone.findUnique({ where: { id } })
        if (!zone) {
            return { success: false, error: 'Shipping zone not found' }
        }

        const updated = await prisma.shippingZone.update({
            where: { id },
            data: { isActive: !zone.isActive }
        })

        const serializedZone = {
            ...updated,
            baseCharge: Number(updated.baseCharge),
            perKgCharge: Number(updated.perKgCharge)
        }

        revalidatePath('/admin/shipping')
        return { success: true, zone: serializedZone }
    } catch (error) {
        console.error('Failed to toggle shipping zone:', error)
        return { success: false, error: 'Failed to toggle shipping zone' }
    }
}

export async function deleteShippingZone(id: string) {
    try {
        await prisma.shippingZone.delete({
            where: { id }
        })
        revalidatePath('/admin/shipping')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete shipping zone:', error)
        return { success: false, error: 'Failed to delete shipping zone' }
    }
}

export async function validatePincode(pincode: string) {
    try {
        const zones = await prisma.shippingZone.findMany({
            where: { isActive: true }
        })

        // Find matching zone
        for (const zone of zones) {
            const pincodes = zone.pincodes as string[]
            for (const range of pincodes) {
                if (range.includes('-')) {
                    // Range format: "400001-400100"
                    const [start, end] = range.split('-')
                    if (pincode >= start && pincode <= end) {
                        return { success: true, zone }
                    }
                } else {
                    // Exact match
                    if (pincode === range) {
                        return { success: true, zone }
                    }
                }
            }
        }

        return { success: false, error: 'No shipping zone found for this pincode' }
    } catch (error) {
        console.error('Failed to validate pincode:', error)
        return { success: false, error: 'Failed to validate pincode' }
    }
}
