import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
    LogOut,
    Shield,
    Zap,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import AdminSidebarNav from "@/components/admin/AdminSidebarNav";

export const dynamic = 'force-dynamic';




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
            <aside className="w-[320px] bg-[#0F0F0F] text-white flex flex-col fixed h-full z-30 shadow-2xl">
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

                {/* Navigation Groups — Client Component uses usePathname() for accurate active state */}
                <AdminSidebarNav />

                {/* Footer */}
                <div className="px-3 py-3 border-t border-white/[0.06]">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/40 hover:text-white/90 hover:bg-white/[0.04] transition-all cursor-pointer group">
                        <LogOut size={17} className="group-hover:text-red-400 transition-colors" />
                        <SignOutButton />
                    </div>
                </div>
            </aside>

            {/* ─── Main Content ─────────────────────────────────────────────── */}
            <div className="flex-1 ml-[320px] flex flex-col min-h-screen">
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

