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
    RotateCcw,
    ChevronRight,
    Activity,
    Shield,
    Zap
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

export const dynamic = 'force-dynamic';

// ─── Navigation Structure ───────────────────────────────────────────────────

interface NavItem {
    href: string;
    icon: React.ReactNode;
    label: string;
    badge?: number;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: "Core Operations",
        items: [
            { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
            { href: "/admin/orders", icon: <Package size={18} />, label: "Orders" },
            { href: "/admin/orders/board", icon: <Package size={18} />, label: "Order Board" },
            { href: "/admin/shipping-hub", icon: <Truck size={18} />, label: "Shipments" },
            { href: "/admin/returns", icon: <RotateCcw size={18} />, label: "Returns" },
            { href: "/admin/returns/pipeline", icon: <RotateCcw size={18} />, label: "Return Pipeline" },
            { href: "/admin/payments", icon: <CreditCard size={18} />, label: "Payments & Refunds" },
        ],
    },
    {
        title: "Catalog",
        items: [
            { href: "/admin/products", icon: <ShoppingBag size={18} />, label: "Products" },
            { href: "/admin/categories", icon: <FolderOpen size={18} />, label: "Categories" },
            { href: "/admin/inventory", icon: <Archive size={18} />, label: "Inventory" },
        ],
    },
    {
        title: "Marketing",
        items: [
            { href: "/admin/coupons", icon: <Tag size={18} />, label: "Coupons & Discounts" },
            { href: "/admin/banners", icon: <Image size={18} />, label: "Hero Banners" },
        ],
    },
    {
        title: "Customers",
        items: [
            { href: "/admin/customer-management", icon: <Users size={18} />, label: "Customer Management" },
        ],
    },
    {
        title: "Analytics",
        items: [
            { href: "/admin/reports", icon: <BarChart3 size={18} />, label: "Reports & Analytics" },
        ],
    },
    {
        title: "System",
        items: [
            { href: "/admin/monitoring", icon: <Activity size={18} />, label: "Monitoring" },
            { href: "/admin/notifications", icon: <Bell size={18} />, label: "Notifications" },
            { href: "/admin/activity-logs", icon: <Activity size={18} />, label: "Activity Logs" },
            { href: "/admin/settings", icon: <Settings size={18} />, label: "Settings" },
            { href: "/admin/help", icon: <HelpCircle size={18} />, label: "Help & Support" },
        ],
    },
];

// ─── Layout Component ───────────────────────────────────────────────────────

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";

    // Skip auth check for login page
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const session = await auth();
    const adminEmail = process.env.ADMIN_EMAIL;
    const isAdminUser = session?.user?.role === "ADMIN" && session?.user?.email?.toLowerCase() === adminEmail?.toLowerCase();

    if (!session || !isAdminUser) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-[#F8F7F6] flex font-sans">
            {/* ─── Sidebar ─────────────────────────────────────────────────── */}
            <aside className="w-[260px] bg-[#0F0F0F] text-white flex flex-col fixed h-full z-30 shadow-2xl">
                {/* Logo */}
                <div className="px-5 py-5 border-b border-white/[0.06] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Zap size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-semibold tracking-tight text-white/95">Vastra Admin</h1>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Command Center</p>
                    </div>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold text-white/25">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <SidebarLink
                                        key={item.href}
                                        href={item.href}
                                        icon={item.icon}
                                        label={item.label}
                                        pathname={pathname}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.04] transition-all cursor-pointer group">
                        <LogOut size={17} className="group-hover:text-red-400 transition-colors" />
                        <SignOutButton />
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─────────────────────────────────────────────── */}
            <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
                {/* Top Header Bar */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-6 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-medium text-stone-500">Live</span>
                        </div>
                        <span className="text-stone-300">|</span>
                        <p className="text-sm text-stone-600">
                            {new Date().toLocaleDateString('en-IN', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <div className="w-px h-6 bg-stone-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {(session?.user?.name?.[0] || 'A').toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium text-stone-800 leading-tight">
                                    {session?.user?.name || 'Admin'}
                                </p>
                                <p className="text-[11px] text-stone-400 leading-tight flex items-center gap-1">
                                    <Shield size={10} /> Administrator
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

// ─── Sidebar Link Component ─────────────────────────────────────────────────

function SidebarLink({
    href,
    icon,
    label,
    pathname,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    pathname: string;
}) {
    const isActive = href === '/admin'
        ? pathname === '/admin' || pathname === ''
        : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
                ${isActive
                    ? 'bg-white/[0.08] text-white shadow-sm shadow-white/[0.02]'
                    : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                }
            `}
        >
            <span className={`transition-colors ${isActive ? 'text-amber-400' : 'text-white/30'}`}>
                {icon}
            </span>
            <span className="flex-1">{label}</span>
            {isActive && (
                <ChevronRight size={14} className="text-white/20" />
            )}
        </Link>
    );
}
