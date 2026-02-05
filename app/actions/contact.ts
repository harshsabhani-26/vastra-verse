"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export interface ContactFormData {
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
    country: string;
    city?: string;
    comment?: string;
    newsletter: boolean;
}

export async function submitContactForm(data: ContactFormData) {
    try {
        // Get metadata
        const headersList = await headers();
        const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";
        const referrer = headersList.get("referer") || null;

        // Create contact submission
        const submission = await prisma.contactSubmission.create({
            data: {
                fullName: data.fullName,
                email: data.email,
                countryCode: data.countryCode,
                phoneNumber: data.phoneNumber,
                country: data.country,
                city: data.city || null,
                comment: data.comment || null,
                newsletter: data.newsletter,
                status: "NEW",
                priority: "NORMAL",
                ipAddress,
                userAgent,
                referrer,
            },
        });

        revalidatePath("/admin/contacts");

        return {
            success: true,
            message: "Thank you for contacting us! We will get back to you soon.",
            id: submission.id,
        };
    } catch (error) {
        console.error("Failed to submit contact form:", error);
        return {
            success: false,
            message: "Something went wrong. Please try again later.",
        };
    }
}

export async function getContactSubmissions(filters?: {
    status?: string;
    search?: string;
    priority?: string;
}) {
    try {
        const where: any = {};

        if (filters?.status && filters.status !== "ALL") {
            where.status = filters.status;
        }

        if (filters?.priority && filters.priority !== "ALL") {
            where.priority = filters.priority;
        }

        if (filters?.search) {
            where.OR = [
                { fullName: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
                { phoneNumber: { contains: filters.search } },
            ];
        }

        const submissions = await prisma.contactSubmission.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
        });

        return {
            success: true,
            data: submissions,
        };
    } catch (error) {
        console.error("Failed to fetch contact submissions:", error);
        return {
            success: false,
            data: [],
            message: "Failed to fetch contact submissions",
        };
    }
}

export async function updateContactSubmission(
    id: string,
    data: {
        status?: string;
        priority?: string;
        adminNotes?: string;
        assignedTo?: string;
        resolvedBy?: string;
    }
) {
    try {
        const updateData: any = {
            ...data,
        };

        if (data.status === "RESOLVED" && !updateData.resolvedAt) {
            updateData.resolvedAt = new Date();
        }

        const submission = await prisma.contactSubmission.update({
            where: { id },
            data: updateData,
        });

        revalidatePath("/admin/contacts");

        return {
            success: true,
            data: submission,
            message: "Contact submission updated successfully",
        };
    } catch (error) {
        console.error("Failed to update contact submission:", error);
        return {
            success: false,
            message: "Failed to update contact submission",
        };
    }
}

export async function deleteContactSubmission(id: string) {
    try {
        await prisma.contactSubmission.delete({
            where: { id },
        });

        revalidatePath("/admin/contacts");

        return {
            success: true,
            message: "Contact submission deleted successfully",
        };
    } catch (error) {
        console.error("Failed to delete contact submission:", error);
        return {
            success: false,
            message: "Failed to delete contact submission",
        };
    }
}

export async function getContactStats() {
    try {
        const [total, newCount, inProgress, resolved] = await Promise.all([
            prisma.contactSubmission.count(),
            prisma.contactSubmission.count({ where: { status: "NEW" } }),
            prisma.contactSubmission.count({ where: { status: "IN_PROGRESS" } }),
            prisma.contactSubmission.count({ where: { status: "RESOLVED" } }),
        ]);

        return {
            success: true,
            data: {
                total,
                new: newCount,
                inProgress,
                resolved,
            },
        };
    } catch (error) {
        console.error("Failed to fetch contact stats:", error);
        return {
            success: false,
            data: {
                total: 0,
                new: 0,
                inProgress: 0,
                resolved: 0,
            },
        };
    }
}
