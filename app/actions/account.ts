"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const mobile = formData.get("mobile") as string;
    const newsletter = formData.get("newsletter") === "on";

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: `${firstName} ${lastName}`.trim(),
                phone: mobile,
                newsletter: newsletter,
            },
        });
        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
}

export async function changePassword(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    if (!currentPassword || !newPassword) {
        return { error: "All fields are required" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user || !user.password) {
            return { error: "User not found" };
        }

        const passwordsMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordsMatch) {
            return { error: "Incorrect current password" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        return { error: "Failed to change password" };
    }
}

export async function addAddress(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const rawFormData = {
        title: formData.get("title") as string,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        address1: formData.get("address1") as string,
        address2: formData.get("address2") as string,
        country: formData.get("country") as string,
        state: formData.get("state") as string,
        city: formData.get("city") as string,
        zipCode: formData.get("zipCode") as string,
        phone: formData.get("phone") as string,
        type: formData.get("type") as string || "Shipping",
        isDefault: formData.get("isDefault") === "on",
    };

    try {
        if (rawFormData.isDefault) {
            // Unset other defaults
            await prisma.address.updateMany({
                where: { userId: session.user.id },
                data: { isDefault: false },
            });
        }

        await prisma.address.create({
            data: {
                userId: session.user.id,
                ...rawFormData,
            },
        });
        revalidatePath("/profile/address");
        return { success: true };
    } catch (error) {
        return { error: "Failed to add address" };
    }
}

export async function getAddresses() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.address.findMany({
        where: { userId: session.user.id },
        orderBy: { isDefault: 'desc' },
    });
}

export async function getWishlist() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const wishlistItems = await prisma.wishlist.findMany({
            where: { userId: session.user.id },
            select: {
                productId: true
            }
        });
        return wishlistItems;
    } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        return [];
    }
}


export async function removeFromWishlist(productId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    try {
        await prisma.wishlist.deleteMany({
            where: {
                userId: session.user.id,
                productId: productId
            }
        });
        revalidatePath("/wishlist");
        return { success: true };
    } catch (error) {
        return { error: "Failed to remove from wishlist" };
    }
}

export async function toggleWishlist(productId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated", authenticated: false };

    try {
        const existing = await prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId: productId
                }
            }
        });

        if (existing) {
            await prisma.wishlist.delete({
                where: {
                    userId_productId: {
                        userId: session.user.id,
                        productId: productId
                    }
                }
            });
            revalidatePath("/wishlist");
            revalidatePath("/shop");
            return { success: true, isWishlisted: false };
        } else {
            await prisma.wishlist.create({
                data: {
                    userId: session.user.id,
                    productId: productId
                }
            });
            revalidatePath("/wishlist");
            revalidatePath("/shop");
            return { success: true, isWishlisted: true };
        }
    } catch (error) {
        console.error("Wishlist Toggle Error:", error);
        return { error: "Failed to update wishlist. Please try logging out and back in." };
    }
}
