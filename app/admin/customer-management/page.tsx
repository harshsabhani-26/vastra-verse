import Link from "next/link";
import { Calendar, Mail, Users, UserCheck } from "lucide-react";

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
                <h1 className="text-3xl font-serif text-stone-900">Customer Management</h1>
                <p className="text-stone-600 mt-2">Manage appointments, contacts, customers, and authentication</p>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`${section.bgColor} p-3 rounded-lg`}>
                                    <Icon className={`${section.color} w-6 h-6`} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-stone-900 group-hover:text-stone-700 transition-colors">
                                        {section.title}
                                    </h3>
                                    <p className="text-sm text-stone-600 mt-1">
                                        {section.description}
                                    </p>
                                    <div className="mt-4 inline-flex items-center text-sm font-medium text-stone-900 group-hover:text-stone-700">
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
