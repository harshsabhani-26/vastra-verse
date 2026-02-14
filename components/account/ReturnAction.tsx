
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import ReturnRequestModal from "./ReturnRequestModal";

interface ReturnActionProps {
    orderId: string;
}

export default function ReturnAction({ orderId }: ReturnActionProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="w-full justify-start text-amber-700 border-amber-700 hover:bg-amber-50"
            >
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Return
            </Button>

            <ReturnRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                orderId={orderId}
            />
        </>
    );
}
