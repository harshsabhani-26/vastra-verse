'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface ShippingSettingsData {
    freeShippingEnabled: boolean
    freeShippingThreshold: number
    codEnabled: boolean
    codMaxAmount: number
    codExtraCharges: number
    giftWrapEnabled: boolean
    giftWrapCharge: number
    giftWrapMessageMaxLength: number
    internationalEnabled: boolean
    autoSendTrackingEmail: boolean
    defaultCourierId?: string | null
}

export async function getShippingSettings() {
    try {
        // Get or create singleton settings
        let settings = await prisma.shippingSettings.findFirst()

        if (!settings) {
            // Create default settings if none exist
            settings = await prisma.shippingSettings.create({
                data: {
                    freeShippingEnabled: false,
                    freeShippingThreshold: 500,
                    codEnabled: true,
                    codMaxAmount: 10000,
                    codExtraCharges: 40,
                    giftWrapEnabled: true,
                    giftWrapCharge: 50,
                    giftWrapMessageMaxLength: 200,
                    internationalEnabled: false,
                    autoSendTrackingEmail: true,
                }
            })
        }

        const serializedSettings: ShippingSettingsData & { id: string } = {
            id: settings.id,
            freeShippingEnabled: settings.freeShippingEnabled,
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            codEnabled: settings.codEnabled,
            codMaxAmount: Number(settings.codMaxAmount),
            codExtraCharges: Number(settings.codExtraCharges),
            giftWrapEnabled: settings.giftWrapEnabled,
            giftWrapCharge: Number(settings.giftWrapCharge),
            giftWrapMessageMaxLength: settings.giftWrapMessageMaxLength,
            internationalEnabled: settings.internationalEnabled,
            autoSendTrackingEmail: settings.autoSendTrackingEmail,
            defaultCourierId: settings.defaultCourierId
        }

        return { success: true, settings: serializedSettings }
    } catch (error) {
        console.error('Failed to fetch shipping settings:', error)
        return { success: false, error: 'Failed to fetch shipping settings' }
    }
}

export async function updateShippingSettings(data: ShippingSettingsData) {
    try {
        // Get existing settings or create new
        let settings = await prisma.shippingSettings.findFirst()

        if (!settings) {
            settings = await prisma.shippingSettings.create({ data })
        } else {
            settings = await prisma.shippingSettings.update({
                where: { id: settings.id },
                data
            })
        }

        const serializedSettings: ShippingSettingsData & { id: string } = {
            id: settings.id,
            freeShippingEnabled: settings.freeShippingEnabled,
            freeShippingThreshold: Number(settings.freeShippingThreshold),
            codEnabled: settings.codEnabled,
            codMaxAmount: Number(settings.codMaxAmount),
            codExtraCharges: Number(settings.codExtraCharges),
            giftWrapEnabled: settings.giftWrapEnabled,
            giftWrapCharge: Number(settings.giftWrapCharge),
            giftWrapMessageMaxLength: settings.giftWrapMessageMaxLength,
            internationalEnabled: settings.internationalEnabled,
            autoSendTrackingEmail: settings.autoSendTrackingEmail,
            defaultCourierId: settings.defaultCourierId
        }

        revalidatePath('/admin/shipping')
        return { success: true, settings: serializedSettings }
    } catch (error) {
        console.error('Failed to update shipping settings:', error)
        return { success: false, error: 'Failed to update shipping settings' }
    }
}

export async function calculateShipping(data: {
    pincode: string
    weight: number // in kg
    orderTotal: number
    paymentMethod?: string
}) {
    try {
        const settings = await prisma.shippingSettings.findFirst()
        if (!settings) {
            return { success: false, error: 'Shipping settings not configured' }
        }

        // Check free shipping
        if (settings.freeShippingEnabled && data.orderTotal >= Number(settings.freeShippingThreshold)) {
            return {
                success: true,
                shippingCharge: 0,
                isFreeShipping: true,
                codCharges: data.paymentMethod === 'COD' && settings.codEnabled ? Number(settings.codExtraCharges) : 0
            }
        }

        // Find shipping zone for pincode
        const zones = await prisma.shippingZone.findMany({
            where: { isActive: true }
        })

        let matchedZone = null
        for (const zone of zones) {
            const pincodes = zone.pincodes as string[]
            for (const range of pincodes) {
                if (range.includes('-')) {
                    const [start, end] = range.split('-')
                    if (data.pincode >= start && data.pincode <= end) {
                        matchedZone = zone
                        break
                    }
                } else if (data.pincode === range) {
                    matchedZone = zone
                    break
                }
            }
            if (matchedZone) break
        }

        if (!matchedZone) {
            return { success: false, error: 'Shipping not available for this pincode' }
        }

        // Calculate shipping
        const baseCharge = Number(matchedZone.baseCharge)
        const perKgCharge = Number(matchedZone.perKgCharge)
        const shippingCharge = baseCharge + (perKgCharge * data.weight)

        const codCharges = data.paymentMethod === 'COD' && settings.codEnabled
            ? Number(settings.codExtraCharges)
            : 0

        return {
            success: true,
            shippingCharge,
            codCharges,
            isFreeShipping: false,
            zone: {
                name: matchedZone.name,
                deliveryDays: `${matchedZone.minDeliveryDays}-${matchedZone.maxDeliveryDays} days`
            }
        }
    } catch (error) {
        console.error('Failed to calculate shipping:', error)
        return { success: false, error: 'Failed to calculate shipping' }
    }
}
