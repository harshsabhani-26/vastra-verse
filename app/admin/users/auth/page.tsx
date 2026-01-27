import UserAuthTracking from "@/components/admin/UserAuthTracking";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = {
    title: "User Authentication Tracking | Admin",
    description: "Monitor user signups and login activity",
};

export default async function UserAuthPage() {
    const session = await auth();

    if (!session || session.user?.role !== "ADMIN") {
        redirect("/admin/login");
    }

    return <UserAuthTracking />;
}
