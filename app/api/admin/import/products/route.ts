import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { importProductsFromCSV, generateProductImportTemplate } from '@/lib/csv/csvService';

/**
 * POST /api/admin/import/products
 * Import products from CSV file
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Read file content
        const csvContent = await file.text();

        // Import products
        const result = await importProductsFromCSV(csvContent, session.user.id!);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to import products:', error);
        return NextResponse.json(
            { error: 'Failed to import products' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/admin/import/products?template=true
 * Download product import template
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const isTemplate = searchParams.get('template') === 'true';

        if (!isTemplate) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            );
        }

        const csv = generateProductImportTemplate();

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': 'attachment; filename="product-import-template.csv"',
            },
        });
    } catch (error) {
        console.error('Failed to generate template:', error);
        return NextResponse.json(
            { error: 'Failed to generate template' },
            { status: 500 }
        );
    }
}
