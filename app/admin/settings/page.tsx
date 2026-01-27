'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Store,
    CreditCard,
    Mail,
    Settings2,
    Shield,
    Users,
    FileText,
    AlertCircle,
} from 'lucide-react';

export default function SettingsPage() {
    const settingsCategories = [
        {
            title: 'Store Information',
            description: 'Manage your store name, logo, and contact details',
            icon: Store,
            href: '/admin/settings/store',
            color: 'text-blue-600',
        },
        {
            title: 'Tax & GST Settings',
            description: 'Configure GST rates, GSTIN, and tax exemptions',
            icon: CreditCard,
            href: '/admin/settings/tax',
            color: 'text-green-600',
        },
        {
            title: 'Email & Notifications',
            description: 'SMTP configuration and email template settings',
            icon: Mail,
            href: '/admin/settings/email',
            color: 'text-purple-600',
        },
        {
            title: 'System Settings',
            description: 'Maintenance mode, currency, timezone, and regional settings',
            icon: Settings2,
            href: '/admin/settings/system',
            color: 'text-orange-600',
        },
        {
            title: 'Security Settings',
            description: 'Password policies, 2FA, session timeout, and lockout settings',
            icon: Shield,
            href: '/admin/settings/security',
            color: 'text-red-600',
        },
        {
            title: 'Admin Users',
            description: 'Manage admin accounts, roles, and permissions',
            icon: Users,
            href: '/admin/users',
            color: 'text-indigo-600',
        },
        {
            title: 'Activity Logs',
            description: 'View audit trail and system activity history',
            icon: FileText,
            href: '/admin/activity-logs',
            color: 'text-gray-600',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure your store settings, security, and system preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsCategories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <Link key={category.href} href={category.href}>
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2 rounded-lg ${category.color} bg-opacity-10`}>
                                            <Icon className={`w-6 h-6 ${category.color}`} />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-4">{category.title}</CardTitle>
                                    <CardDescription>{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="w-full">
                                        Configure →
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <CardTitle className="text-yellow-900">Important Security Notes</CardTitle>
                            <CardDescription className="text-yellow-700">
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Enable 2FA for all admin accounts to enhance security</li>
                                    <li>Regularly review activity logs for suspicious actions</li>
                                    <li>Keep SMTP passwords and API keys secure</li>
                                    <li>Test maintenance mode before deploying updates</li>
                                </ul>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}
