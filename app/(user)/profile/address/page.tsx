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
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-12 md:gap-24">
                    <AccountSidebar />
                    <div className="flex-1 max-w-4xl">
                        <h1 className="text-3xl font-serif text-primary mb-10 tracking-wide">Address Book</h1>
                        <div className="bg-white p-8 md:p-12 border border-stone-200">
                            <AddressManager addresses={addresses} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
