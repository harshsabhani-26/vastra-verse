"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getLiveShoppingBg(): Promise<string> {
    const settings = await prisma.storeSettings.findFirst()
    return (settings as any)?.liveShoppingBg || ""
}

export async function updateLiveShoppingBg(url: string) {
    const settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { liveShoppingBg: url } as any,
        })
    } else {
        await prisma.storeSettings.create({
            data: { liveShoppingBg: url } as any,
        })
    }
    revalidatePath("/admin/live-shopping")
    revalidatePath("/")
    return { success: true }
}
