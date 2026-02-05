'use server'

import prisma from "@/lib/prisma"

export async function trackOrder(orderId: string) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                timeline: true
                // Add tracking details if available in schema
                // trackingNumber: true, 
                // courier: true
            }
        })

        if (!order) {
            return { success: false, error: "Order not found. Please check the ID and try again." }
        }

        return {
            success: true,
            order: {
                id: order.id,
                status: order.status,
                date: order.createdAt.toLocaleDateString(),
                timeline: order.timeline
            }
        }
    } catch (error) {
        console.error("Tracking error:", error)
        return { success: false, error: "Something went wrong. Please try again later." }
    }
}
