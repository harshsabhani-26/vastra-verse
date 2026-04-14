"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getLiveShoppingBg(): Promise<string> {
    const settings = await prisma.storeSettings.findFirst()
    return settings?.liveShoppingBg || ""
}

export async function updateLiveShoppingBg(url: string) {
    const settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { liveShoppingBg: url },
        })
    } else {
        await prisma.storeSettings.create({
            data: { liveShoppingBg: url },
        })
    }
    revalidatePath("/admin/live-shopping")
    revalidatePath("/")
    return { success: true }
}
