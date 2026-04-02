'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    Image,
    RotateCcw,
    ChevronRight,
    Activity,
    BookOpen,
    Share2,
    Video,
} from 'lucide-react';

// ─── Navigation Structure ────────────────────────────────────────────────────

interface NavItem {
    href: string;
    icon: React.ReactNode;
    label: string;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        title: 'Core Operations',
        items: [
            { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
            { href: '/admin/orders', icon: <Package size={18} />, label: 'Orders' },
            { href: '/admin/orders/board', icon: <Package size={18} />, label: 'Order Board' },
            { href: '/admin/shipping-hub', icon: <Truck size={18} />, label: 'Shipments' },
            { href: '/admin/returns', icon: <RotateCcw size={18} />, label: 'Returns' },
            { href: '/admin/returns/pipeline', icon: <RotateCcw size={18} />, label: 'Return Pipeline' },
            { href: '/admin/payments', icon: <CreditCard size={18} />, label: 'Payments & Refunds' },
        ],
    },
    {
        title: 'Catalog',
        items: [
            { href: '/admin/products', icon: <ShoppingBag size={18} />, label: 'Products' },
            { href: '/admin/categories', icon: <FolderOpen size={18} />, label: 'Categories' },
            { href: '/admin/inventory', icon: <Archive size={18} />, label: 'Inventory' },
            { href: '/admin/stories', icon: <BookOpen size={18} />, label: 'Stories' },
            { href: '/admin/socials', icon: <Share2 size={18} />, label: 'Socials' },
        ],
    },
    {
        title: 'Marketing',
        items: [
            { href: '/admin/coupons', icon: <Tag size={18} />, label: 'Coupons & Discounts' },
            { href: '/admin/banners', icon: <Image size={18} />, label: 'Hero Banners' },
            { href: '/admin/hero-footer-bg', icon: <Image size={18} />, label: 'Backgrounds & Logos' },
        ],
    },
    {
        title: 'Customers',
        items: [
            { href: '/admin/customer-management', icon: <Users size={18} />, label: 'Customer Management' },
            { href: '/admin/live-shopping', icon: <Video size={18} />, label: 'Live Video Shopping' },
        ],
    },
    {
        title: 'Analytics',
        items: [
            { href: '/admin/reports', icon: <BarChart3 size={18} />, label: 'Reports & Analytics' },
        ],
    },
    {
        title: 'System',
        items: [
            { href: '/admin/monitoring', icon: <Activity size={18} />, label: 'Monitoring' },
            { href: '/admin/notifications', icon: <Bell size={18} />, label: 'Notifications' },
            { href: '/admin/activity-logs', icon: <Activity size={18} />, label: 'Activity Logs' },
            { href: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
            { href: '/admin/help', icon: <HelpCircle size={18} />, label: 'Help & Support' },
        ],
    },
];

// ─── Sidebar Nav Component ───────────────────────────────────────────────────

export default function AdminSidebarNav() {
    const pathname = usePathname();

    return (
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {navGroups.map((group) => (
                <div key={group.title}>
                    <p className="px-3 mb-1.5 text-[12px] uppercase tracking-[0.12em] font-semibold text-white/25">
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
    );
}

// ─── Sidebar Link ────────────────────────────────────────────────────────────

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
    // Dashboard: exact match only
    // All others: exact match — prevents parent paths from lighting up children
    const isActive = href === '/admin'
        ? pathname === '/admin'
        : pathname === href;

    return (
        <Link
            href={href}
            className={`
                flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] md:text-[14px] font-medium transition-all duration-150
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
