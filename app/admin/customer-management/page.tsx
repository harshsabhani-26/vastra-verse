import Link from "next/link";
import { Calendar, Mail, Users, UserCheck, Video } from "lucide-react";

export default function CustomerManagementPage() {
    const sections = [
        {
            title: "Appointments",
            description: "Manage store visit appointments and bookings",
            icon: Calendar,
            href: "/admin/appointments",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Live Video Shopping",
            description: "Manage video call appointments booked via the Live Shopping button",
            icon: Video,
            href: "/admin/live-shopping",
            color: "text-red-700",
            bgColor: "bg-red-50",
            badge: "LIVE"
        },
        {
            title: "Contacts",
            description: "View and respond to customer inquiries",
            icon: Mail,
            href: "/admin/contacts",
            color: "text-green-600",
            bgColor: "bg-green-50"
        },
        {
            title: "Customers",
            description: "Manage customer accounts, roles, and permissions",
            icon: Users,
            href: "/admin/customers",
            color: "text-purple-600",
            bgColor: "bg-purple-50"
        },
        {
            title: "Auth Tracking",
            description: "View audit trail and system activity history",
            icon: UserCheck,
            href: "/admin/users/auth",
            color: "text-orange-600",
            bgColor: "bg-orange-50"
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">Customer Management</h1>
                <p className="text-sm text-stone-500 mt-2">Manage appointments, contacts, customers, and authentication</p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group bg-white border-2 border-stone-100 rounded-xl p-5 hover:border-stone-200 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${section.bgColor} p-3 rounded-lg flex-shrink-0`}>
                                    <Icon className={`${section.color} w-6 h-6`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold tracking-tight text-stone-900 group-hover:text-stone-700 transition-colors">
                                            {section.title}
                                        </h3>
                                        {"badge" in section && section.badge && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white tracking-wider">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                                                {section.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-stone-500 mt-1.5">
                                        {section.description}
                                    </p>
                                    <div className={`mt-4 inline-flex items-center text-sm font-semibold ${section.color} group-hover:underline`}>
                                        Configure →
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
