"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, X, Loader2 } from "lucide-react";

interface InvoiceEmailModalProps {
    open: boolean;
    onClose: () => void;
    orderId: string;
    customerEmail: string;
}

export default function InvoiceEmailModal({
    open,
    onClose,
    orderId,
    customerEmail,
}: InvoiceEmailModalProps) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSendEmail = async () => {
        setSending(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/admin/orders/${orderId}/invoice?mode=email`,
                { method: "POST" }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setSent(true);
            } else {
                setError(data.error || "Failed to send email");
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setSent(false);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md" aria-describedby="invoice-email-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {sent ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Email Sent!
                            </>
                        ) : (
                            <>
                                <Mail className="h-5 w-5 text-blue-600" />
                                Send Invoice
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div id="invoice-email-description" className="py-4">
                    {sent ? (
                        <div className="text-center py-4">
                            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-sm text-stone-700 font-medium">
                                Invoice sent successfully!
                            </p>
                            <p className="text-xs text-stone-500 mt-1">
                                Sent to: {customerEmail}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800 font-medium">
                                    ✅ Invoice downloaded successfully.
                                </p>
                            </div>
                            <p className="text-sm text-stone-600">
                                Would you like to send the invoice to the customer?
                            </p>
                            <div className="bg-stone-50 rounded-lg px-4 py-3 border border-stone-200">
                                <p className="text-xs text-stone-500">Customer Email</p>
                                <p className="text-sm font-medium text-stone-800">
                                    {customerEmail || "No email available"}
                                </p>
                            </div>
                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {sent ? (
                        <Button onClick={handleClose} className="w-full sm:w-auto">
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={sending}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSendEmail}
                                disabled={sending || !customerEmail}
                                className="bg-[#1a4d3a] hover:bg-[#15402f]"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending Email...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Send Email
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
