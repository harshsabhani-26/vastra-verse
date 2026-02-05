import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { productIds } = await request.json();

        if (!Array.isArray(productIds)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Query database to find which products still exist
        const existingProducts = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds
                }
            },
            select: {
                id: true
            }
        });

        // Extract just the IDs
        const validIds = existingProducts.map(p => p.id);

        return NextResponse.json({ validIds });
    } catch (error) {
        console.error('Failed to validate products:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
