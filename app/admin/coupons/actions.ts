"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from "@prisma/client/runtime/library";
import { auth } from "@/auth";

// Helper to generate random coupon code
export async function generateCouponCode(): Promise<string> {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    // Generate random code
    do {
        code = "";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
    } while (await prisma.coupon.findUnique({ where: { code } }));

    return code;
}

// Get all coupons with filtering
export async function getCoupons(filters?: {
    isActive?: boolean;
    type?: string;
    search?: string;
}) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
        where.isActive = filters.isActive;
    }

    if (filters?.type) {
        where.type = filters.type;
    }

    if (filters?.search) {
        where.OR = [
            { code: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    const coupons = await prisma.coupon.findMany({
        where,
        include: {
            _count: {
                select: { usages: true },
            },
        },
        orderBy: [
            { isActive: "desc" },
            { priority: "desc" },
            { createdAt: "desc" },
        ],
    });

    return coupons.map((coupon) => ({
        ...coupon,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue?.toString(),
        totalRevenue: coupon.totalRevenue.toString(),
        totalDiscount: coupon.totalDiscount.toString(),
    }));
}

// Get single coupon with statistics
export async function getCoupon(id: string) {
    const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: {
            usages: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    order: {
                        select: {
                            id: true,
                            total: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 50,
            },
            _count: {
                select: { usages: true },
            },
        },
    });

    if (!coupon) {
        return null;
    }

    return {
        ...coupon,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue?.toString(),
        totalRevenue: coupon.totalRevenue.toString(),
        totalDiscount: coupon.totalDiscount.toString(),
        usages: coupon.usages.map((usage) => ({
            ...usage,
            discountAmount: usage.discountAmount.toString(),
            order: usage.order ? {
                ...usage.order,
                total: usage.order.total.toString(),
            } : null,
        })),
    };
}

// Create new coupon
export async function createCoupon(data: {
    code: string;
    description?: string;
    type: "PERCENTAGE" | "FLAT_AMOUNT" | "FREE_SHIPPING";
    value: number;
    startDate: Date;
    endDate: Date;
    isActive?: boolean;
    maxUses?: number;
    maxUsesPerUser?: number;
    minOrderValue?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
    newUsersOnly?: boolean;
    firstOrderOnly?: boolean;
    autoApply?: boolean;
    priority?: number;
}) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
        where: { code: data.code },
    });

    if (existing) {
        throw new Error("Coupon code already exists");
    }

    const coupon = await prisma.coupon.create({
        data: {
            code: data.code.toUpperCase(),
            description: data.description,
            type: data.type,
            value: new Decimal(data.value),
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            isActive: data.isActive ?? true,
            maxUses: data.maxUses,
            maxUsesPerUser: data.maxUsesPerUser,
            minOrderValue: data.minOrderValue ? new Decimal(data.minOrderValue) : null,
            applicableProducts: data.applicableProducts || undefined,
            applicableCategories: data.applicableCategories || undefined,
            newUsersOnly: data.newUsersOnly ?? false,
            firstOrderOnly: data.firstOrderOnly ?? false,
            autoApply: data.autoApply ?? false,
            priority: data.priority ?? 0,
        },
    });

    revalidatePath("/admin/coupons");

    return {
        ...coupon,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue?.toString(),
        totalRevenue: coupon.totalRevenue.toString(),
        totalDiscount: coupon.totalDiscount.toString(),
    };
}

// Update coupon
export async function updateCoupon(
    id: string,
    data: Partial<{
        code: string;
        description?: string;
        type: "PERCENTAGE" | "FLAT_AMOUNT" | "FREE_SHIPPING";
        value: number;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        maxUses?: number;
        maxUsesPerUser?: number;
        minOrderValue?: number;
        applicableProducts?: string[];
        applicableCategories?: string[];
        newUsersOnly: boolean;
        firstOrderOnly: boolean;
        autoApply: boolean;
        priority: number;
    }>
) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    // If code is being changed, check for duplicates
    if (data.code) {
        const existing = await prisma.coupon.findFirst({
            where: {
                code: data.code,
                NOT: { id },
            },
        });

        if (existing) {
            throw new Error("Coupon code already exists");
        }
    }

    const updateData: any = {};

    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = new Decimal(data.value);
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.minOrderValue !== undefined) {
        updateData.minOrderValue = data.minOrderValue ? new Decimal(data.minOrderValue) : null;
    }
    if (data.applicableProducts !== undefined) updateData.applicableProducts = data.applicableProducts || null;
    if (data.applicableCategories !== undefined) updateData.applicableCategories = data.applicableCategories || null;
    if (data.newUsersOnly !== undefined) updateData.newUsersOnly = data.newUsersOnly;
    if (data.firstOrderOnly !== undefined) updateData.firstOrderOnly = data.firstOrderOnly;
    if (data.autoApply !== undefined) updateData.autoApply = data.autoApply;
    if (data.priority !== undefined) updateData.priority = data.priority;

    const coupon = await prisma.coupon.update({
        where: { id },
        data: updateData,
    });

    revalidatePath("/admin/coupons");
    revalidatePath(`/admin/coupons/${id}`);

    return {
        ...coupon,
        value: coupon.value.toString(),
        minOrderValue: coupon.minOrderValue?.toString(),
        totalRevenue: coupon.totalRevenue.toString(),
        totalDiscount: coupon.totalDiscount.toString(),
    };
}

// Delete coupon
export async function deleteCoupon(id: string) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.coupon.delete({
        where: { id },
    });

    revalidatePath("/admin/coupons");

    return { success: true };
}

// Toggle coupon active status
export async function toggleCoupon(id: string) {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const coupon = await prisma.coupon.findUnique({
        where: { id },
        select: { isActive: true },
    });

    if (!coupon) {
        throw new Error("Coupon not found");
    }

    const updated = await prisma.coupon.update({
        where: { id },
        data: { isActive: !coupon.isActive },
    });

    revalidatePath("/admin/coupons");

    return {
        ...updated,
        value: updated.value.toString(),
        minOrderValue: updated.minOrderValue?.toString(),
        totalRevenue: updated.totalRevenue.toString(),
        totalDiscount: updated.totalDiscount.toString(),
    };
}

// Validate coupon
export async function validateCoupon(
    code: string,
    context: {
        userId: string;
        cartTotal: number;
        productIds?: string[];
        categoryIds?: string[];
    }
) {
    // Increment views
    await prisma.coupon.updateMany({
        where: { code: code.toUpperCase() },
        data: {
            views: {
                increment: 1,
            },
        },
    });

    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
        include: {
            usages: {
                where: {
                    userId: context.userId,
                },
            },
        },
    });

    if (!coupon) {
        return { valid: false, error: "Invalid coupon code" };
    }

    // Check if active
    if (!coupon.isActive) {
        return { valid: false, error: "Coupon is not active" };
    }

    // Check validity dates
    const now = new Date();
    if (now < coupon.startDate) {
        return { valid: false, error: "Coupon is not yet valid" };
    }
    if (now > coupon.endDate) {
        return { valid: false, error: "Coupon has expired" };
    }

    // Check total usage limit
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return { valid: false, error: "Coupon usage limit reached" };
    }

    // Check per-user usage limit
    if (coupon.maxUsesPerUser && coupon.usages.length >= coupon.maxUsesPerUser) {
        return { valid: false, error: "You have already used this coupon the maximum number of times" };
    }

    // Check minimum order value
    if (coupon.minOrderValue && new Decimal(context.cartTotal).lessThan(coupon.minOrderValue)) {
        return {
            valid: false,
            error: `Minimum order value of ₹${coupon.minOrderValue} required`,
        };
    }

    // Check new users only
    if (coupon.newUsersOnly) {
        const orderCount = await prisma.order.count({
            where: { userId: context.userId },
        });
        if (orderCount > 0) {
            return { valid: false, error: "This coupon is only valid for new users" };
        }
    }

    // Check first order only
    if (coupon.firstOrderOnly) {
        const orderCount = await prisma.order.count({
            where: { userId: context.userId },
        });
        if (orderCount > 0) {
            return { valid: false, error: "This coupon is only valid for first orders" };
        }
    }

    // Check product restrictions
    if (coupon.applicableProducts && Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0 && context.productIds) {
        const applicableProducts = coupon.applicableProducts as string[];
        const hasApplicableProduct = context.productIds.some((id) =>
            applicableProducts.includes(id)
        );
        if (!hasApplicableProduct) {
            return { valid: false, error: "This coupon is not applicable to items in your cart" };
        }
    }

    // Check category restrictions
    if (coupon.applicableCategories && Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0 && context.categoryIds) {
        const applicableCategories = coupon.applicableCategories as string[];
        const hasApplicableCategory = context.categoryIds.some((id) =>
            applicableCategories.includes(id)
        );
        if (!hasApplicableCategory) {
            return { valid: false, error: "This coupon is not applicable to items in your cart" };
        }
    }

    return {
        valid: true,
        coupon: {
            ...coupon,
            value: coupon.value.toString(),
            minOrderValue: coupon.minOrderValue?.toString(),
            totalRevenue: coupon.totalRevenue.toString(),
            totalDiscount: coupon.totalDiscount.toString(),
        },
    };
}

// Apply coupon to cart
export async function applyCoupon(
    code: string,
    cart: {
        userId: string;
        subtotal: number;
        shippingCharges: number;
        items: Array<{
            productId: string;
            categoryId: string;
            price: number;
            quantity: number;
        }>;
    }
) {
    // Validate coupon
    const validation = await validateCoupon(code, {
        userId: cart.userId,
        cartTotal: cart.subtotal,
        productIds: cart.items.map((item) => item.productId),
        categoryIds: cart.items.map((item) => item.categoryId),
    });

    if (!validation.valid || !validation.coupon) {
        return { success: false, error: validation.error };
    }

    const coupon = validation.coupon;
    let discountAmount = 0;

    // Calculate discount
    if (coupon.type === "PERCENTAGE") {
        discountAmount = (cart.subtotal * parseFloat(coupon.value)) / 100;
    } else if (coupon.type === "FLAT_AMOUNT") {
        discountAmount = Math.min(parseFloat(coupon.value), cart.subtotal);
    } else if (coupon.type === "FREE_SHIPPING") {
        discountAmount = cart.shippingCharges;
    }

    return {
        success: true,
        discount: discountAmount,
        couponId: coupon.id,
        couponCode: coupon.code,
        couponType: coupon.type,
    };
}

// Get auto-apply coupons
export async function getAutoApplyCoupons(cart: {
    userId: string;
    subtotal: number;
    shippingCharges: number;
    items: Array<{
        productId: string;
        categoryId: string;
        price: number;
        quantity: number;
    }>;
}) {
    const now = new Date();

    // Get all active auto-apply coupons
    const coupons = await prisma.coupon.findMany({
        where: {
            isActive: true,
            autoApply: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
        orderBy: {
            priority: "desc",
        },
        include: {
            usages: {
                where: {
                    userId: cart.userId,
                },
            },
        },
    });

    let bestCoupon = null;
    let bestDiscount = 0;

    for (const coupon of coupons) {
        // Validate coupon
        const validation = await validateCoupon(coupon.code, {
            userId: cart.userId,
            cartTotal: cart.subtotal,
            productIds: cart.items.map((item) => item.productId),
            categoryIds: cart.items.map((item) => item.categoryId),
        });

        if (!validation.valid) continue;

        // Calculate discount
        let discountAmount = 0;
        if (coupon.type === "PERCENTAGE") {
            discountAmount = (cart.subtotal * parseFloat(coupon.value.toString())) / 100;
        } else if (coupon.type === "FLAT_AMOUNT") {
            discountAmount = Math.min(parseFloat(coupon.value.toString()), cart.subtotal);
        } else if (coupon.type === "FREE_SHIPPING") {
            discountAmount = cart.shippingCharges;
        }

        // Track best coupon
        if (discountAmount > bestDiscount) {
            bestDiscount = discountAmount;
            bestCoupon = {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                discount: discountAmount,
            };
        }
    }

    return bestCoupon;
}

// Record coupon usage (called when order is placed)
export async function recordCouponUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountAmount: number
) {
    await prisma.$transaction([
        // Create usage record
        prisma.couponUsage.create({
            data: {
                couponId,
                userId,
                orderId,
                discountAmount: new Decimal(discountAmount),
            },
        }),
        // Increment usage count
        prisma.coupon.update({
            where: { id: couponId },
            data: {
                currentUses: {
                    increment: 1,
                },
                totalDiscount: {
                    increment: discountAmount,
                },
            },
        }),
    ]);

    return { success: true };
}
