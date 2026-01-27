'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Star, Ban, CheckCircle, User } from 'lucide-react';
import { toggleVIP, toggleBlock } from '@/app/admin/customers/actions';
import { toast } from 'react-hot-toast';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    phoneVerified: boolean;
    isVIP: boolean;
    isBlocked: boolean;
    blockedReason: string | null;
    blockedAt: Date | null;
    createdAt: Date;
}

export default function CustomerDetailsCard({ customer }: { customer: Customer }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [blockReason, setBlockReason] = useState('');

    const handleToggleVIP = async () => {
        startTransition(async () => {
            const result = await toggleVIP(customer.id);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`Customer ${result.isVIP ? 'marked as' : 'removed from'} VIP`);
                router.refresh();
            }
        });
    };

    const handleBlock = async () => {
        startTransition(async () => {
            const result = await toggleBlock(customer.id, blockReason);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(
                    `Customer ${result.isBlocked ? 'blocked' : 'unblocked'} successfully`
                );
                setShowBlockDialog(false);
                setBlockReason('');
                router.refresh();
            }
        });
    };

    return (
        <>
            <div className="bg-white border border-stone-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-8 w-8 text-emerald-700" />
                        </div>

                        {/* Customer Info */}
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-semibold text-[#1C1917]">
                                    {customer.name}
                                </h2>
                                {customer.isVIP && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                                        <Star className="h-3 w-3 fill-yellow-500" />
                                        VIP
                                    </span>
                                )}
                                {customer.isBlocked && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                                        <Ban className="h-3 w-3" />
                                        Blocked
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 space-y-1 text-stone-600">
                                <p className="flex items-center gap-2">
                                    <span className="font-medium">Email:</span> {customer.email}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-medium">Phone:</span> {customer.phone || 'N/A'}
                                    {customer.phoneVerified && (
                                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    )}
                                </p>
                                <p className="flex items-center gap-2">
                                    <span className="font-medium">Joined:</span>{' '}
                                    {new Date(customer.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            {customer.isBlocked && customer.blockedReason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm font-medium text-red-900">Blocked Reason:</p>
                                    <p className="text-sm text-red-700 mt-1">{customer.blockedReason}</p>
                                    {customer.blockedAt && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Blocked on: {new Date(customer.blockedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleToggleVIP}
                            disabled={isPending}
                            className={`gap-2 ${customer.isVIP
                                    ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'
                                    : ''
                                }`}
                        >
                            <Star
                                className={`h-4 w-4 ${customer.isVIP ? 'fill-yellow-500' : ''}`}
                            />
                            {customer.isVIP ? 'Remove VIP' : 'Make VIP'}
                        </Button>
                        <Button
                            variant={customer.isBlocked ? 'outline' : 'destructive'}
                            onClick={() =>
                                customer.isBlocked ? handleBlock() : setShowBlockDialog(true)
                            }
                            disabled={isPending}
                            className="gap-2"
                        >
                            <Ban className="h-4 w-4" />
                            {customer.isBlocked ? 'Unblock' : 'Block Customer'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Block Dialog */}
            {showBlockDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 className="text-xl font-semibold text-[#1C1917] mb-4">
                            Block Customer
                        </h3>
                        <p className="text-stone-600 mb-4">
                            Are you sure you want to block <strong>{customer.name}</strong>?
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Reason (optional)
                            </label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Enter reason for blocking..."
                                rows={3}
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setShowBlockDialog(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleBlock}
                                disabled={isPending}
                            >
                                Block Customer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
