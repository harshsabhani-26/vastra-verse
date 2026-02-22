import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import CustomerDetailsCard from '@/components/admin/CustomerDetailsCard';
import CustomerNotesSection from '@/components/admin/CustomerNotesSection';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const customer = await prisma.user.findUnique({
        where: { id },
        include: {
            orders: {
                select: {
                    id: true,
                    total: true,
                    status: true,
                    paymentStatus: true,
                    createdAt: true,
                    items: {
                        select: {
                            quantity: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            },
            addresses: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
            customerNotes: {
                orderBy: {
                    createdAt: 'desc',
                },
            },
        },
    });

    if (!customer) {
        notFound();
    }

    // Calculate statistics
    const totalSpent = customer.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0
    );
    const averageOrderValue =
        customer.orders.length > 0 ? totalSpent / customer.orders.length : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Customer Details</h1>
                <Link
                    href="/admin/customers"
                    className="text-emerald-700 hover:text-emerald-800"
                >
                    ← Back to Customers
                </Link>
            </div>

            {/* Customer Overview */}
            <CustomerDetailsCard
                customer={{
                    id: customer.id,
                    name: customer.name || 'Guest',
                    email: customer.email,
                    phone: customer.phone,
                    phoneVerified: customer.phoneVerified,
                    isVIP: customer.isVIP,
                    isBlocked: customer.isBlocked,
                    blockedReason: customer.blockedReason,
                    blockedAt: customer.blockedAt,
                    createdAt: customer.createdAt,
                }}
            />

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <p className="text-sm text-stone-600 mb-1">Total Orders</p>
                    <p className="text-2xl font-bold text-[#1C1917]">
                        {customer.orders.length}
                    </p>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <p className="text-sm text-stone-600 mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-emerald-700">
                        ₹{totalSpent.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <p className="text-sm text-stone-600 mb-1">Average Order Value</p>
                    <p className="text-2xl font-bold text-[#1C1917]">
                        ₹{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg p-6">
                    <p className="text-sm text-stone-600 mb-1">Last Order</p>
                    <p className="text-lg font-semibold text-[#1C1917]">
                        {customer.orders[0]
                            ? new Date(customer.orders[0].createdAt).toLocaleDateString()
                            : 'Never'}
                    </p>
                </div>
            </div>

            {/* Order History */}
            <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#1C1917] mb-4">Order History</h2>
                {customer.orders.length === 0 ? (
                    <p className="text-stone-500 text-center py-8">No orders yet</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customer.orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-sm">
                                        #{order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(order.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ₹{Number(order.total).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs ${order.status === 'DELIVERED'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : order.status === 'CANCELLED'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-block px-2 py-1 rounded-full text-xs ${order.paymentStatus === 'PAID'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : order.paymentStatus === 'FAILED'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}
                                        >
                                            {order.paymentStatus}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="text-emerald-700 hover:text-emerald-800 text-sm"
                                        >
                                            View →
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Saved Addresses */}
            <div className="bg-white border border-stone-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-[#1C1917] mb-4">
                    Saved Addresses
                </h2>
                {customer.addresses.length === 0 ? (
                    <p className="text-stone-500 text-center py-8">No addresses saved</p>
                ) : (
                    <div className="grid gap-4">
                        {customer.addresses.map((address) => (
                            <div
                                key={address.id}
                                className="border border-stone-200 rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-[#1C1917]">{address.title}</p>
                                        <p className="text-stone-700 mt-1">
                                            {address.firstName} {address.lastName}
                                        </p>
                                        <p className="text-stone-600 mt-1">
                                            {address.address1}
                                            {address.address2 && `, ${address.address2}`}
                                        </p>
                                        <p className="text-stone-600">
                                            {address.city}, {address.state} {address.zipCode}
                                        </p>
                                        <p className="text-stone-600">{address.country}</p>
                                        <p className="text-stone-600 mt-1">Phone: {address.phone}</p>
                                    </div>
                                    {address.isDefault && (
                                        <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Admin Notes */}
            <CustomerNotesSection
                customerId={customer.id}
                initialNotes={customer.customerNotes}
            />
        </div>
    );
}
