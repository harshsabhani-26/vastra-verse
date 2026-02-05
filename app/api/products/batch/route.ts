import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 });
        }

        const products = await prisma.product.findMany({
            where: {
                id: { in: ids },
            },
            select: {
                id: true,
                name: true,
                price: true,
                images: true,
            },
        });

        // Map to simpler format
        const formattedProducts = products.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0] || '/placeholder.jpg',
        }));

        return NextResponse.json(formattedProducts);
    } catch (error) {
        console.error('Batch product fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
