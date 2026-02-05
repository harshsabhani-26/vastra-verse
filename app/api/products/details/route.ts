import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json();

        if (!Array.isArray(productIds)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Fetch product details including category
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            },
            select: {
                id: true,
                categoryId: true
            }
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Failed to fetch product details:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
