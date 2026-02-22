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
    Share2,
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
        {
            title: 'Social Media Links',
            description: 'Manage your Instagram, Facebook, YouTube, and WhatsApp profiles',
            icon: Share2,
            href: '/admin/settings/social-links',
            color: 'text-amber-600',
        },
    ];

    const bgColors: Record<string, string> = {
        'text-blue-600': 'bg-blue-50',
        'text-green-600': 'bg-green-50',
        'text-purple-600': 'bg-purple-50',
        'text-orange-600': 'bg-orange-50',
        'text-red-600': 'bg-red-50',
        'text-indigo-600': 'bg-indigo-50',
        'text-gray-600': 'bg-stone-100',
        'text-amber-600': 'bg-amber-50',
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">Settings</h1>
                <p className="text-sm text-stone-500 mt-1">
                    Configure your store settings, security, and system preferences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {settingsCategories.map((category) => {
                    const Icon = category.icon;
                    const bg = bgColors[category.color] || 'bg-stone-100';
                    return (
                        <Link key={category.href} href={category.href}>
                            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer h-full border-2 border-stone-100 hover:border-stone-200 rounded-xl">
                                <CardHeader className="p-5 pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2.5 rounded-lg ${bg}`}>
                                            <Icon className={`w-5 h-5 ${category.color}`} />
                                        </div>
                                    </div>
                                    <CardTitle className="mt-3 text-base">{category.title}</CardTitle>
                                    <CardDescription className="text-xs mt-1">{category.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="p-5 pt-3">
                                    <Button variant="ghost" className={`w-full h-8 px-2 text-sm font-medium ${category.color} hover:underline justify-start`}>
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
