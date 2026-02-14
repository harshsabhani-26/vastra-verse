import { AccountSidebar } from "@/components/account/AccountSidebar";
import { ProfileForm } from "@/components/account/ProfileForm";

export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Script from "next/script";

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
    });

    if (!user) {
        redirect("/login");
    }

    const userData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        newsletter: user.newsletter || false,
    };

    const msg91Config = {
        widgetId: process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || '',
        tokenAuth: process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || '',
    };

    return (
        <>
            {/* MSG91 OTP Widget Script */}
            <Script
                src="https://verify.msg91.com/otp-provider.js"
                strategy="afterInteractive"
            />

            <div className="bg-background min-h-screen py-16">
                <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                    <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                        <AccountSidebar />
                        <div className="flex-1 max-w-3xl">
                            <h1 className="text-3xl font-serif text-primary mb-8 tracking-tight">My Profile</h1>
                            <div className="bg-background p-0 md:p-8 animate-fade-in-up">
                                <ProfileForm user={userData} msg91Config={msg91Config} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
