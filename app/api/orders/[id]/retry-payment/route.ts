import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { checkUserRateLimit } from '@/lib/rate-limit';
import { createRazorpayOrder, generateCheckoutOptions, rupeesToPaise, type RazorpayConfig } from '@/lib/payment-gateways/razorpay';

/**
 * POST /api/orders/[id]/retry-payment
 * 
 * Allows a user to retry a failed payment for their order.
 * Creates a new Razorpay order and returns checkout options.
 * 
 * Security:
 * - Validates user owns the order
 * - Checks order is in PAYMENT_FAILED or PENDING status
 * - Rate limited to prevent abuse
 * - Increments retry count
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Rate limit
        const rateLimitResult = await checkUserRateLimit(req, 'default');
        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult;
        }

        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: orderId } = await params;

        // Fetch order with payment info
        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                userId: session.user.id,
            },
            include: {
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                items: {
                    include: {
                        product: {
                            select: { name: true },
                        },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        // Validate the order can be retried
        const retryableStatuses = ['PENDING', 'PAYMENT_FAILED'];
        if (!retryableStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: `Order cannot be retried. Current status: ${order.status}` },
                { status: 400 }
            );
        }

        // Check if payment method is online (COD orders don't need retry)
        if (order.paymentMethod === 'COD') {
            return NextResponse.json(
                { error: 'COD orders do not require payment retry' },
                { status: 400 }
            );
        }

        // Get Razorpay config
        const razorpayConfig: RazorpayConfig = {
            keyId: process.env.RAZORPAY_KEY_ID || '',
            keySecret: process.env.RAZORPAY_KEY_SECRET || '',
            isTestMode: !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live'),
        };

        if (!razorpayConfig.keyId || !razorpayConfig.keySecret) {
            return NextResponse.json(
                { error: 'Payment gateway not configured' },
                { status: 500 }
            );
        }

        // Check if there's an existing Razorpay order that can be reused
        const latestPayment = order.payments[0];
        let razorpayOrderId = latestPayment?.gatewayOrderId;

        // Create a new Razorpay order if no existing one or previous failed
        if (!razorpayOrderId || latestPayment?.status === 'FAILED') {
            const amountInPaise = rupeesToPaise(Number(order.total));

            const razorpayOrder = await createRazorpayOrder(razorpayConfig, {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `retry_${order.id}_${Date.now()}`,
                notes: {
                    orderId: order.id,
                    retry: true,
                    retryCount: (latestPayment?.retryCount || 0) + 1,
                },
            });

            razorpayOrderId = razorpayOrder.id;

            // Create new payment record for this retry
            await prisma.payment.create({
                data: {
                    orderId: order.id,
                    amount: order.total,
                    currency: 'INR',
                    status: 'PENDING',
                    method: latestPayment?.method || 'UPI',
                    gatewayProvider: 'RAZORPAY',
                    gatewayOrderId: razorpayOrderId,
                    retryCount: (latestPayment?.retryCount || 0) + 1,
                    subtotal: order.subtotal,
                    cgst: order.cgst,
                    sgst: order.sgst,
                    igst: order.igst,
                    gstRate: order.gstRate,
                    metadata: {
                        isRetry: true,
                        originalPaymentId: latestPayment?.id,
                    },
                },
            });

            // Update order status back to PENDING
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'PENDING',
                    paymentStatus: 'PENDING',
                },
            });
        }

        // Generate checkout options for frontend
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, phone: true },
        });

        const checkoutOptions = generateCheckoutOptions({
            orderId: razorpayOrderId!,
            amount: rupeesToPaise(Number(order.total)),
            currency: 'INR',
            customerName: user?.name || undefined,
            customerEmail: user?.email || undefined,
            customerPhone: user?.phone || undefined,
        });

        return NextResponse.json({
            success: true,
            checkoutOptions,
            orderId: order.id,
            razorpayOrderId,
            amount: Number(order.total),
            retryCount: (latestPayment?.retryCount || 0) + 1,
        });
    } catch (error) {
        console.error('[Payment Retry] Error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate payment retry' },
            { status: 500 }
        );
    }
}
