import { Suspense } from "react";
import { getCoupons } from "./actions";
import { getCouponPerformance } from "./analytics-actions";
import { CouponCard } from "@/components/admin/coupons/CouponCard";
import { CouponStats } from "@/components/admin/coupons/CouponStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Search, BarChart3 } from "lucide-react";
import Link from "next/link";

export default async function CouponsPage({
    searchParams,
}: {
    searchParams: { status?: string; type?: string; search?: string };
}) {
    const stats = await getCouponPerformance();

    // Build filters
    const filters: any = {};

    if (searchParams.status === "active") {
        filters.isActive = true;
    } else if (searchParams.status === "inactive") {
        filters.isActive = false;
    }

    if (searchParams.type) {
        filters.type = searchParams.type;
    }

    if (searchParams.search) {
        filters.search = searchParams.search;
    }

    const coupons = await getCoupons(filters);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">
                        Coupons & Discounts
                    </h2>
                    <p className="text-stone-600 mt-1">
                        Manage promotional codes and discount campaigns
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/admin/coupons/analytics">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/coupons/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Coupon
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <CouponStats stats={stats} />

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-stone-200">
                <form className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search coupons..."
                            defaultValue={searchParams.search}
                            className="pl-9"
                        />
                    </div>

                    <Select name="status" defaultValue={searchParams.status || "all"}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select name="type" defaultValue={searchParams.type || "all"}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                            <SelectItem value="FLAT_AMOUNT">Flat Amount</SelectItem>
                            <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button type="submit">Filter</Button>
                </form>
            </div>

            {/* Coupons Grid */}
            <Suspense fallback={<div>Loading coupons...</div>}>
                {coupons.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg border border-stone-200 text-center">
                        <div className="max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto">
                                <svg
                                    className="w-8 h-8 text-stone-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-stone-800">
                                No coupons found
                            </h3>
                            <p className="text-stone-600">
                                {searchParams.search || searchParams.status || searchParams.type
                                    ? "Try adjusting your filters"
                                    : "Get started by creating your first coupon"}
                            </p>
                            <Button asChild>
                                <Link href="/admin/coupons/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Coupon
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {coupons.map((coupon: any) => (
                            <CouponCard key={coupon.id} coupon={coupon} />
                        ))}
                    </div>
                )}
            </Suspense>
        </div>
    );
}
