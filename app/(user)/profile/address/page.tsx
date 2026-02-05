import { AccountSidebar } from "@/components/account/AccountSidebar";
import AddressManager from "@/components/account/AddressManager";
import { auth } from "@/auth";
import { getAddresses } from "@/app/actions/account";
import { redirect } from "next/navigation";

export default async function AddressBookPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    const addresses = await getAddresses();

    return (
        <div className="bg-background min-h-screen py-16">
            <div className="container mx-auto px-4 md:px-8 max-w-7xl">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-3xl animate-fade-in-up">
                        <h1 className="text-3xl font-serif text-primary mb-8 tracking-tight">Address Book</h1>
                        <div className="bg-background">
                            <AddressManager addresses={addresses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
