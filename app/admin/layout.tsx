import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import {
    LayoutDashboard,
    ShoppingBag,
    FolderOpen,
    Package,
    Users,
    UserCheck,
    Archive,
    CreditCard,
    Truck,
    Tag,
    BarChart3,
    Bell,
    Settings,
    HelpCircle,
    LogOut,
    Image,
    Calendar
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get current pathname
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";

    // Skip auth check for login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const session = await auth();

    // Strict admin verification: role AND email must match
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdminUser = session?.user?.role === "ADMIN" && session?.user?.email === adminEmail;

    // Redirect non-admin users to homepage (makes admin panel invisible)
    if (!session || !isAdminUser) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-stone-50 flex font-sans">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-[#1C1917] text-white flex flex-col fixed h-full">
                <div className="p-6 border-b border-stone-800">
                    <h1 className="text-xl font-serif tracking-wide text-amber-50">Vayana Admin</h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <AdminLink href="/admin" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <AdminLink href="/admin/products" icon={<ShoppingBag size={20} />} label="Products" />
                    <AdminLink href="/admin/categories" icon={<FolderOpen size={20} />} label="Categories" />
                    <AdminLink href="/admin/banners" icon={<Image size={20} />} label="Hero Banners" />
                    <AdminLink href="/admin/orders" icon={<Package size={20} />} label="Orders" />
                    <AdminLink href="/admin/appointments" icon={<Calendar size={20} />} label="Appointments" />
                    <AdminLink href="/admin/customers" icon={<Users size={20} />} label="Customers" />
                    <AdminLink href="/admin/users/auth" icon={<UserCheck size={20} />} label="Auth Tracking" />
                    <AdminLink href="/admin/inventory" icon={<Archive size={20} />} label="Inventory" />
                    <AdminLink href="/admin/payments" icon={<CreditCard size={20} />} label="Payments & Refunds" />
                    <AdminLink href="/admin/shipping" icon={<Truck size={20} />} label="Shipping" />
                    <AdminLink href="/admin/coupons" icon={<Tag size={20} />} label="Coupons & Discounts" />
                    <AdminLink href="/admin/reports" icon={<BarChart3 size={20} />} label="Reports & Analytics" />
                    <AdminLink href="/admin/notifications" icon={<Bell size={20} />} label="Notifications" />
                    <AdminLink href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
                    <AdminLink href="/admin/help" icon={<HelpCircle size={20} />} label="Help & Support" />
                </nav>

                <div className="p-4 border-t border-stone-800">
                    <div className="flex items-center gap-3 px-4 py-2 text-stone-400 hover:text-white transition-colors cursor-pointer">
                        <LogOut size={20} />
                        <SignOutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    );
}

function AdminLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-all"
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </Link>
    )
}
