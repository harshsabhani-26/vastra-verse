"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Copy,
    Edit,
    MoreVertical,
    Trash2,
    Eye,
    EyeOff,
    TrendingUp,
    Calendar,
    Users,
    Percent,
    DollarSign,
    Truck,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deleteCoupon, toggleCoupon } from "@/app/admin/coupons/actions";

interface CouponCardProps {
    coupon: {
        id: string;
        code: string;
        description?: string;
        type: "PERCENTAGE" | "FLAT_AMOUNT" | "FREE_SHIPPING";
        value: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        maxUses?: number;
        currentUses: number;
        totalRevenue: string;
        totalDiscount: string;
        minOrderValue?: string;
        autoApply: boolean;
        _count?: {
            usages: number;
        };
    };
}

export function CouponCard({ coupon }: CouponCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const handleCopyCode = () => {
        navigator.clipboard.writeText(coupon.code);
        toast.success("Coupon code copied to clipboard!");
    };

    const handleEdit = () => {
        router.push(`/admin/coupons/${coupon.id}`);
    };

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            await toggleCoupon(coupon.id);
            toast.success(`Coupon ${coupon.isActive ? "deactivated" : "activated"}`);
            router.refresh();
        } catch (error) {
            toast.error("Failed to toggle coupon status");
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;

        setIsDeleting(true);
        try {
            await deleteCoupon(coupon.id);
            toast.success("Coupon deleted successfully");
            router.refresh();
        } catch (error) {
            toast.error("Failed to delete coupon");
        } finally {
            setIsDeleting(false);
        }
    };

    const getTypeIcon = () => {
        switch (coupon.type) {
            case "PERCENTAGE":
                return <Percent className="h-4 w-4" />;
            case "FLAT_AMOUNT":
                return <DollarSign className="h-4 w-4" />;
            case "FREE_SHIPPING":
                return <Truck className="h-4 w-4" />;
        }
    };

    const getTypeLabel = () => {
        switch (coupon.type) {
            case "PERCENTAGE":
                return `${coupon.value}% Off`;
            case "FLAT_AMOUNT":
                return `₹${coupon.value} Off`;
            case "FREE_SHIPPING":
                return "Free Shipping";
        }
    };

    const isExpired = new Date(coupon.endDate) < new Date();
    const isUpcoming = new Date(coupon.startDate) > new Date();
    const usagePercentage = coupon.maxUses
        ? (coupon.currentUses / coupon.maxUses) * 100
        : 0;

    return (
        <Card className={!coupon.isActive || isExpired ? "opacity-60" : ""}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <code className="text-lg font-bold bg-muted px-2 py-1 rounded">
                                {coupon.code}
                            </code>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyCode}
                                className="h-8 w-8 p-0"
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                        {coupon.description && (
                            <p className="text-sm text-muted-foreground">{coupon.description}</p>
                        )}
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEdit}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleToggle} disabled={isToggling}>
                                {coupon.isActive ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Deactivate
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Activate
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Discount Badge */}
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                        {getTypeIcon()}
                        {getTypeLabel()}
                    </Badge>
                    {coupon.autoApply && (
                        <Badge variant="outline">Auto-apply</Badge>
                    )}
                    {!coupon.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                    )}
                    {isExpired && (
                        <Badge variant="destructive">Expired</Badge>
                    )}
                    {isUpcoming && (
                        <Badge variant="secondary">Upcoming</Badge>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>Uses</span>
                        </div>
                        <p className="font-semibold">
                            {coupon.currentUses}
                            {coupon.maxUses && ` / ${coupon.maxUses}`}
                        </p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3.5 w-3.5" />
                            <span>Revenue</span>
                        </div>
                        <p className="font-semibold">₹{parseFloat(coupon.totalRevenue).toFixed(0)}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Discount</span>
                        </div>
                        <p className="font-semibold">₹{parseFloat(coupon.totalDiscount).toFixed(0)}</p>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Ends</span>
                        </div>
                        <p className="font-semibold">
                            {new Date(coupon.endDate).toLocaleDateString('en-GB', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            })}
                        </p>
                    </div>
                </div>

                {/* Usage Progress */}
                {coupon.maxUses && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Usage Limit</span>
                            <span className="font-medium">{usagePercentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={usagePercentage} className="h-2" />
                    </div>
                )}

                {/* Additional Info */}
                {coupon.minOrderValue && (
                    <p className="text-xs text-muted-foreground">
                        Min. order: ₹{coupon.minOrderValue}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
