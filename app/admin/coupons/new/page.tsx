"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CouponForm } from "@/components/admin/coupons/CouponForm";
import { createCoupon } from "../actions";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewCouponPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await createCoupon(data);
            toast.success("Coupon created successfully!");
            router.push("/admin/coupons");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to create coupon");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/coupons">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">Add New Coupon</h2>
                    <p className="text-stone-600 mt-1">
                        Create a new promotional code or discount campaign
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-4xl">
                <CouponForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>
        </div>
    );
}
