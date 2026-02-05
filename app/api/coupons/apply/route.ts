import { NextRequest, NextResponse } from 'next/server';
import { applyCoupon } from '@/app/admin/coupons/actions';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, cart } = body;

        if (!code || !cart) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Apply the coupon using the server action
        const result = await applyCoupon(code, cart);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to apply coupon:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply coupon'
        }, { status: 500 });
    }
}
