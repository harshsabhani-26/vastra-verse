import { AccountSidebar } from "@/components/account/AccountSidebar";
import { ProfileForm } from "@/components/account/ProfileForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

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
        newsletter: user.newsletter || false,
    };

    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-4xl">
                        <h1 className="text-3xl font-serif text-primary mb-10 tracking-wide">My Profile</h1>
                        <div className="bg-white p-8 md:p-12 border border-stone-200">
                            <ProfileForm user={userData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
