import { AccountSidebar } from "@/components/account/AccountSidebar";
import { PasswordForm } from "@/components/account/PasswordForm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PasswordPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    return (
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-3xl animate-fade-in-up">
                        <h1 className="text-3xl font-serif text-primary mb-8 tracking-tight">Change Password</h1>
                        <div className="bg-background">
                            <PasswordForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
