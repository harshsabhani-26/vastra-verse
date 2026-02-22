"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getBackgrounds() {
    const settings = await prisma.storeSettings.findFirst()
    return {
        heroBg: settings?.heroBg || "",
        footerBg: settings?.footerBg || "",
        logo: settings?.logo || "",
        footerLogo: (settings as any)?.footerLogo || ""
    }
}

export async function updateHeroBg(url: string) {
    let settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { heroBg: url }
        })
    } else {
        await prisma.storeSettings.create({
            data: { heroBg: url }
        })
    }
    revalidatePath("/")
    revalidatePath("/admin/hero-footer-bg")
    return { success: true }
}

export async function updateFooterBg(url: string) {
    let settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { footerBg: url }
        })
    } else {
        await prisma.storeSettings.create({
            data: { footerBg: url }
        })
    }
    revalidatePath("/")
    revalidatePath("/admin/hero-footer-bg")
    return { success: true }
}

export async function updateLogo(url: string) {
    let settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { logo: url }
        })
    } else {
        await prisma.storeSettings.create({
            data: { logo: url }
        })
    }
    revalidatePath("/")
    revalidatePath("/admin/hero-footer-bg")
    revalidatePath("/admin/settings/store")
    return { success: true }
}

export async function updateFooterLogo(url: string) {
    let settings = await prisma.storeSettings.findFirst()
    if (settings) {
        await prisma.storeSettings.update({
            where: { id: settings.id },
            data: { footerLogo: url } as any
        })
    } else {
        await prisma.storeSettings.create({
            data: { footerLogo: url } as any
        })
    }
    revalidatePath("/")
    revalidatePath("/admin/hero-footer-bg")
    return { success: true }
}
