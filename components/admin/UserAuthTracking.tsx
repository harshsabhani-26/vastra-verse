"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserCheck,
    Mail,
    Calendar,
    Search,
    Filter,
    Download,
    ChevronDown,
    ChevronUp,
    Shield,
    AlertCircle,
    Chrome,
    Key,
    Activity,
} from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AuthProvider {
    provider: string;
    createdAt: string;
}

interface Session {
    ipAddress: string | null;
    userAgent: string | null;
    lastActivityAt: string;
}

interface ActivityLog {
    action: string;
    description: string;
    status: string;
    createdAt: string;
    ipAddress: string | null;
}

interface User {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    phone: string | null;
    isVIP: boolean;
    isBlocked: boolean;
    twoFactorEnabled: boolean;
    createdAt: string;
    lastLoginAt: string | null;
    lastLoginIP: string | null;
    failedLoginAttempts: number;
    authProviders: AuthProvider[];
    hasPassword: boolean;
    latestSession: Session | null;
    recentLoginActivity: ActivityLog[];
    ordersCount: number;
}

interface Stats {
    totalUsers: number;
    googleUsers: number;
    credentialUsers: number;
    todayUsers: number;
    weekUsers: number;
}

export default function UserAuthTracking() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        googleUsers: 0,
        credentialUsers: 0,
        todayUsers: 0,
        weekUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [provider, setProvider] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: "50",
                search,
                provider,
                sortBy: "createdAt",
                sortOrder: "desc",
            });

            const response = await fetch(`/api/admin/users/auth?${queryParams}`);
            const data = await response.json();

            setUsers(data.users);
            setStats(data.stats);
            setTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, search, provider]);

    const exportToCSV = () => {
        const headers = [
            "Name",
            "Email",
            "Phone",
            "Auth Method",
            "Signup Date",
            "Last Login",
            "Last Login IP",
            "Orders Count",
            "VIP Status",
            "Blocked",
            "2FA Enabled",
        ];

        const rows = users.map((user) => {
            const authMethod = user.authProviders.length > 0
                ? user.authProviders.map((p) => p.provider).join(", ")
                : user.hasPassword
                    ? "Email/Password"
                    : "Unknown";

            return [
                user.name || "",
                user.email,
                user.phone || "",
                authMethod,
                new Date(user.createdAt).toLocaleDateString(),
                user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString()
                    : "Never",
                user.lastLoginIP || "",
                user.ordersCount.toString(),
                user.isVIP ? "Yes" : "No",
                user.isBlocked ? "Yes" : "No",
                user.twoFactorEnabled ? "Yes" : "No",
            ];
        });

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `user-auth-data-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getAuthBadge = (user: User) => {
        const hasGoogle = user.authProviders.some((p) => p.provider === "google");
        const hasPassword = user.hasPassword;

        if (hasGoogle && hasPassword) {
            return (
                <div className="flex gap-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        <Chrome className="w-3 h-3" />
                        Google
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        <Key className="w-3 h-3" />
                        Password
                    </span>
                </div>
            );
        } else if (hasGoogle) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    <Chrome className="w-3 h-3" />
                    Google
                </span>
            );
        } else if (hasPassword) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    <Key className="w-3 h-3" />
                    Email/Password
                </span>
            );
        }
        return <span className="text-xs text-stone-400">Unknown</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif text-[#1C1917]">
                    User Authentication Tracking
                </h1>
                <p className="text-stone-600 mt-1">
                    Monitor all user signups and login activity
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-stone-600">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-stone-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {stats.totalUsers}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-stone-600">
                            Google OAuth
                        </CardTitle>
                        <Chrome className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {stats.googleUsers}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            {stats.totalUsers > 0
                                ? Math.round((stats.googleUsers / stats.totalUsers) * 100)
                                : 0}
                            % of users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-stone-600">
                            Email/Password
                        </CardTitle>
                        <Mail className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {stats.credentialUsers}
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                            {stats.totalUsers > 0
                                ? Math.round(
                                    (stats.credentialUsers / stats.totalUsers) * 100
                                )
                                : 0}
                            % of users
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-stone-600">
                            New Today
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {stats.todayUsers}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-stone-600">
                            This Week
                        </CardTitle>
                        <UserCheck className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#1C1917]">
                            {stats.weekUsers}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="pl-10"
                            />
                        </div>
                        <Select
                            value={provider}
                            onValueChange={(value) => {
                                setProvider(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filter by provider" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="google">Google Only</SelectItem>
                                <SelectItem value="credentials">
                                    Email/Password Only
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={exportToCSV} variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="text-center py-12 text-stone-500">
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-stone-500">
                            No users found
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="border border-stone-200 rounded-lg overflow-hidden"
                                >
                                    {/* User Row */}
                                    <div className="grid grid-cols-12 gap-4 p-4 hover:bg-stone-50 transition-colors">
                                        <div className="col-span-3 flex items-center gap-3">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={user.name || "User"}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-primary" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm text-stone-800 truncate">
                                                    {user.name || "No name"}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex items-center">
                                            {getAuthBadge(user)}
                                        </div>

                                        <div className="col-span-2 flex items-center">
                                            <div>
                                                <p className="text-sm text-stone-800">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-stone-500">
                                                    {new Date(user.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex items-center">
                                            {user.lastLoginAt ? (
                                                <div>
                                                    <p className="text-sm text-stone-800">
                                                        {new Date(
                                                            user.lastLoginAt
                                                        ).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-stone-500">
                                                        {new Date(
                                                            user.lastLoginAt
                                                        ).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-stone-400">Never</p>
                                            )}
                                        </div>

                                        <div className="col-span-2 flex items-center gap-2">
                                            {user.isVIP && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                                                    VIP
                                                </span>
                                            )}
                                            {user.isBlocked && (
                                                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                                    Blocked
                                                </span>
                                            )}
                                            {user.twoFactorEnabled && (
                                                <Shield className="w-4 h-4 text-green-600" />
                                            )}
                                        </div>

                                        <div className="col-span-1 flex items-center justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setExpandedUser(
                                                        expandedUser === user.id ? null : user.id
                                                    )
                                                }
                                            >
                                                {expandedUser === user.id ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedUser === user.id && (
                                        <div className="border-t border-stone-200 bg-stone-50 p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* User Info */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-stone-800 mb-2">
                                                        User Information
                                                    </h4>
                                                    <div className="space-y-1 text-sm">
                                                        <p>
                                                            <span className="text-stone-600">
                                                                Phone:
                                                            </span>{" "}
                                                            {user.phone || "Not provided"}
                                                        </p>
                                                        <p>
                                                            <span className="text-stone-600">
                                                                Total Orders:
                                                            </span>{" "}
                                                            {user.ordersCount}
                                                        </p>
                                                        <p>
                                                            <span className="text-stone-600">
                                                                Failed Login Attempts:
                                                            </span>{" "}
                                                            {user.failedLoginAttempts}
                                                        </p>
                                                        <p>
                                                            <span className="text-stone-600">
                                                                Last Login IP:
                                                            </span>{" "}
                                                            {user.lastLoginIP || "Unknown"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Recent Login Activity */}
                                                <div>
                                                    <h4 className="text-sm font-semibold text-stone-800 mb-2 flex items-center gap-2">
                                                        <Activity className="w-4 h-4" />
                                                        Recent Login Activity
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {user.recentLoginActivity.length > 0 ? (
                                                            user.recentLoginActivity.map(
                                                                (log, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="text-xs p-2 bg-white rounded border border-stone-200"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <span
                                                                                className={`font-medium ${log.status === "SUCCESS"
                                                                                    ? "text-green-700"
                                                                                    : "text-red-700"
                                                                                    }`}
                                                                            >
                                                                                {log.description}
                                                                            </span>
                                                                            <span className="text-stone-500">
                                                                                {new Date(
                                                                                    log.createdAt
                                                                                ).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        {log.ipAddress && (
                                                                            <p className="text-stone-500 mt-1">
                                                                                IP: {log.ipAddress}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )
                                                            )
                                                        ) : (
                                                            <p className="text-stone-500 text-xs">
                                                                No login activity recorded
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-stone-200">
                            <p className="text-sm text-stone-600">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
