"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function googleSignIn() {
    await signIn("google", { redirectTo: "/" });
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn("credentials", formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }
}

export async function register(
    prevState: string | undefined,
    formData: FormData,
) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) return "Missing fields";

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return "Email already registered";
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            },
        });

        console.log("User registered successfully:", { email, name });
    } catch (e) {
        console.error("Registration error:", e);
        return "Failed to create account";
    }

    redirect("/login");
}

export async function checkUserExists(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return !!user;
    } catch (error) {
        console.error("Error checking user existence:", error);
        return false;
    }
}
