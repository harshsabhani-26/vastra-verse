"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Calendar } from "lucide-react";
import { generateCouponCode } from "@/app/admin/coupons/actions";

interface CouponFormProps {
    initialData?: {
        code: string;
        description?: string;
        type: "PERCENTAGE" | "FLAT_AMOUNT" | "FREE_SHIPPING";
        value: string;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
        maxUses?: number;
        maxUsesPerUser?: number;
        minOrderValue?: string;
        applicableProducts?: any;
        applicableCategories?: any;
        newUsersOnly: boolean;
        firstOrderOnly: boolean;
        autoApply: boolean;
        priority: number;
    };
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

export function CouponForm({ initialData, onSubmit, isLoading }: CouponFormProps) {
    const [formData, setFormData] = useState({
        code: initialData?.code || "",
        description: initialData?.description || "",
        type: initialData?.type || "PERCENTAGE",
        value: initialData?.value || "",
        startDate: initialData?.startDate
            ? new Date(initialData.startDate).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        endDate: initialData?.endDate
            ? new Date(initialData.endDate).toISOString().slice(0, 16)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
        isActive: initialData?.isActive ?? true,
        maxUses: initialData?.maxUses?.toString() || "",
        maxUsesPerUser: initialData?.maxUsesPerUser?.toString() || "",
        minOrderValue: initialData?.minOrderValue || "",
        applicableProducts: initialData?.applicableProducts || [],
        applicableCategories: initialData?.applicableCategories || [],
        newUsersOnly: initialData?.newUsersOnly || false,
        firstOrderOnly: initialData?.firstOrderOnly || false,
        autoApply: initialData?.autoApply || false,
        priority: initialData?.priority?.toString() || "0",
    });

    const [generatingCode, setGeneratingCode] = useState(false);

    const handleGenerateCode = async () => {
        setGeneratingCode(true);
        try {
            const code = await generateCouponCode();
            setFormData((prev) => ({ ...prev, code }));
        } catch (error) {
            console.error("Error generating code:", error);
        } finally {
            setGeneratingCode(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...formData,
            value: parseFloat(formData.value),
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
            maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
            maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : undefined,
            minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
            priority: parseInt(formData.priority),
        };

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                        Set up the basic details of your coupon
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">Coupon Code</Label>
                        <div className="flex gap-2">
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="WELCOME20"
                                required
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerateCode}
                                disabled={generatingCode}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Internal Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="For admin reference..."
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="type">Discount Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PERCENTAGE">Percentage Off</SelectItem>
                                    <SelectItem value="FLAT_AMOUNT">Flat Amount Off</SelectItem>
                                    <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value">
                                {formData.type === "PERCENTAGE" ? "Percentage (%)" :
                                    formData.type === "FLAT_AMOUNT" ? "Amount (₹)" : "Value"}
                            </Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder={formData.type === "PERCENTAGE" ? "20" : "100"}
                                required={formData.type !== "FREE_SHIPPING"}
                                disabled={formData.type === "FREE_SHIPPING"}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Validity */}
            <Card>
                <CardHeader>
                    <CardTitle>Validity Period</CardTitle>
                    <CardDescription>
                        Set when this coupon will be active
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date & Time</Label>
                            <div className="relative">
                                <Input
                                    id="startDate"
                                    type="datetime-local"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                />
                                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date & Time</Label>
                            <div className="relative">
                                <Input
                                    id="endDate"
                                    type="datetime-local"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                />
                                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="isActive">Active Status</Label>
                            <p className="text-sm text-muted-foreground">
                                Inactive coupons cannot be used
                            </p>
                        </div>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Usage Limits</CardTitle>
                    <CardDescription>
                        Control how many times this coupon can be used
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxUses">Total Usage Limit</Label>
                            <Input
                                id="maxUses"
                                type="number"
                                value={formData.maxUses}
                                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                placeholder="Unlimited"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty for unlimited uses
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="maxUsesPerUser">Per-User Limit</Label>
                            <Input
                                id="maxUsesPerUser"
                                type="number"
                                value={formData.maxUsesPerUser}
                                onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                                placeholder="Unlimited"
                            />
                            <p className="text-xs text-muted-foreground">
                                Max uses per customer
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="minOrderValue">Minimum Order Value (₹)</Label>
                        <Input
                            id="minOrderValue"
                            type="number"
                            step="0.01"
                            value={formData.minOrderValue}
                            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                            placeholder="No minimum"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Restrictions */}
            <Card>
                <CardHeader>
                    <CardTitle>Restrictions</CardTitle>
                    <CardDescription>
                        Limit who can use this coupon
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="newUsersOnly">New Users Only</Label>
                            <p className="text-sm text-muted-foreground">
                                Only customers without previous orders
                            </p>
                        </div>
                        <Switch
                            id="newUsersOnly"
                            checked={formData.newUsersOnly}
                            onCheckedChange={(checked) => setFormData({ ...formData, newUsersOnly: checked })}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="firstOrderOnly">First Order Only</Label>
                            <p className="text-sm text-muted-foreground">
                                Valid only on first purchase
                            </p>
                        </div>
                        <Switch
                            id="firstOrderOnly"
                            checked={formData.firstOrderOnly}
                            onCheckedChange={(checked) => setFormData({ ...formData, firstOrderOnly: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                        Auto-apply and priority configuration
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="autoApply">Auto-Apply</Label>
                            <p className="text-sm text-muted-foreground">
                                Automatically apply to eligible carts
                            </p>
                        </div>
                        <Switch
                            id="autoApply"
                            checked={formData.autoApply}
                            onCheckedChange={(checked) => setFormData({ ...formData, autoApply: checked })}
                        />
                    </div>

                    {formData.autoApply && (
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Input
                                id="priority"
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                placeholder="0"
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher numbers get priority when auto-applying
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : initialData ? "Update Coupon" : "Create Coupon"}
                </Button>
            </div>
        </form>
    );
}
