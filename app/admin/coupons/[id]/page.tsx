"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CouponForm } from "@/components/admin/coupons/CouponForm";
import { getCoupon, updateCoupon } from "@/app/admin/coupons/actions";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function EditCouponPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [coupon, setCoupon] = useState<any>(null);
    const [isLoadingCoupon, setIsLoadingCoupon] = useState(true);

    useEffect(() => {
        const loadCoupon = async () => {
            try {
                const data = await getCoupon(params.id);
                if (!data) {
                    toast.error("Coupon not found");
                    router.push("/admin/coupons");
                    return;
                }
                setCoupon(data);
            } catch (error) {
                toast.error("Failed to load coupon");
                router.push("/admin/coupons");
            } finally {
                setIsLoadingCoupon(false);
            }
        };

        loadCoupon();
    }, [params.id, router]);

    const handleSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await updateCoupon(params.id, data);
            toast.success("Coupon updated successfully!");
            router.push("/admin/coupons");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to update coupon");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingCoupon) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!coupon) {
        return null;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/coupons">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h2 className="text-3xl font-serif text-[#1C1917]">Edit Coupon</h2>
                    <p className="text-stone-600 mt-1">
                        Update coupon settings and configuration
                    </p>
                </div>
            </div>

            {/* Usage Statistics */}
            {coupon._count && coupon._count.usages > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Uses</p>
                                <p className="text-2xl font-bold">{coupon.currentUses}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Revenue</p>
                                <p className="text-2xl font-bold">
                                    ₹{parseFloat(coupon.totalRevenue).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Discount</p>
                                <p className="text-2xl font-bold">
                                    ₹{parseFloat(coupon.totalDiscount).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Unique Users</p>
                                <p className="text-2xl font-bold">{coupon._count.usages}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Form */}
            <div className="max-w-4xl">
                <CouponForm
                    initialData={coupon}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </div>

            {/* Recent Usage */}
            {coupon.usages && coupon.usages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {coupon.usages.slice(0, 10).map((usage: any) => (
                                <div
                                    key={usage.id}
                                    className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{usage.user.name || usage.user.email}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(usage.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">₹{usage.discountAmount}</p>
                                        {usage.order && (
                                            <p className="text-sm text-muted-foreground">
                                                Order: ₹{usage.order.total}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
