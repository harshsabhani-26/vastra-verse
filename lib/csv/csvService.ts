import Papa from 'papaparse';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

interface ProductCSVRow {
    name: string;
    description: string;
    shortDescription?: string;
    sku?: string;
    price: string;
    discount?: string;
    discountType?: string;
    stock: string;
    lowStockThreshold?: string;
    categoryId: string;
    categoryName?: string;
    status?: string;
    isFeatured?: string;

    // Saree-specific fields
    fabricType?: string;
    weaveType?: string;
    borderDescription?: string;
    palluDescription?: string;
    hasBlousePiece?: string;
    blouseFabric?: string;
    sareeLength?: string;
    blouseLength?: string;
    colors?: string;
    occasions?: string;
    careInstructions?: string;

    // Images (comma-separated URLs)
    images?: string;
}

interface CustomerCSVRow {
    name: string;
    email: string;
    phone?: string;
    role: string;
    newsletter: string;
    isVIP: string;
    isBlocked: string;
    createdAt: string;
    totalOrders?: string;
    totalSpent?: string;
}

interface OrderCSVRow {
    orderId: string;
    customerEmail: string;
    customerName: string;
    status: string;
    paymentStatus: string;
    paymentMethod?: string;
    total: string;
    subtotal?: string;
    shippingCharges?: string;
    discount?: string;
    cgst?: string;
    sgst?: string;
    igst?: string;
    trackingNumber?: string;
    courierName?: string;
    createdAt: string;
    items?: string; // JSON string of items
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

interface ImportResult {
    success: boolean;
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: ValidationError[];
}

/**
 * Export products to CSV
 */
export async function exportProductsToCSV(): Promise<string> {
    const products = await prisma.product.findMany({
        include: {
            category: true,
            images: true,
        },
    });

    const csvData = products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        sku: product.sku || '',
        price: product.price.toString(),
        discount: product.discount?.toString() || '0',
        discountType: product.discountType || '',
        finalPrice: product.finalPrice?.toString() || '',
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold || 10,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        status: product.status,
        isFeatured: product.isFeatured ? 'Yes' : 'No',

        // Saree-specific fields
        fabricType: product.fabricType || '',
        weaveType: product.weaveType || '',
        borderDescription: product.borderDescription || '',
        palluDescription: product.palluDescription || '',
        hasBlousePiece: product.hasBlousePiece ? 'Yes' : 'No',
        blouseFabric: product.blouseFabric || '',
        sareeLength: product.sareeLength || '',
        blouseLength: product.blouseLength || '',
        colors: product.colors.join(', '),
        occasions: product.occasions.join(', '),
        careInstructions: product.careInstructions || '',

        // Images
        images: product.images.map((img: any) => img.url).join(', '),

        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
    }));

    const csv = Papa.unparse(csvData);
    return csv;
}

/**
 * Export customers to CSV
 */
export async function exportCustomersToCSV(): Promise<string> {
    const customers = await prisma.user.findMany({
        include: {
            orders: true,
        },
    });

    const csvData = await Promise.all(
        customers.map(async (customer: any) => {
            const totalOrders = customer.orders.length;
            const totalSpent = customer.orders.reduce(
                (sum: number, order: any) => sum + Number(order.total),
                0
            );

            return {
                id: customer.id,
                name: customer.name || '',
                email: customer.email,
                phone: customer.phone || '',
                role: customer.role,
                emailVerified: customer.emailVerified ? 'Yes' : 'No',
                phoneVerified: customer.phoneVerified ? 'Yes' : 'No',
                newsletter: customer.newsletter ? 'Yes' : 'No',
                isVIP: customer.isVIP ? 'Yes' : 'No',
                isBlocked: customer.isBlocked ? 'Yes' : 'No',
                blockedReason: customer.blockedReason || '',
                twoFactorEnabled: customer.twoFactorEnabled ? 'Yes' : 'No',
                lastLoginAt: customer.lastLoginAt?.toISOString() || '',
                createdAt: customer.createdAt.toISOString(),
                totalOrders,
                totalSpent: totalSpent.toFixed(2),
            };
        })
    );

    const csv = Papa.unparse(csvData);
    return csv;
}

/**
 * Export orders to CSV
 */
export async function exportOrdersToCSV(): Promise<string> {
    const orders = await prisma.order.findMany({
        include: {
            user: true,
            items: {
                include: {
                    product: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const csvData = orders.map((order: any) => ({
        orderId: order.id,
        customerName: order.customerName || order.user.name || '',
        customerEmail: order.user.email,
        customerPhone: order.customerPhone || order.user.phone || '',
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod || '',

        subtotal: order.subtotal?.toString() || '',
        cgst: order.cgst?.toString() || '0',
        sgst: order.sgst?.toString() || '0',
        igst: order.igst?.toString() || '0',
        shippingCharges: order.shippingCharges?.toString() || '0',
        discount: order.discount?.toString() || '0',
        total: order.total.toString(),

        shippingAddress: order.shippingAddress || '',
        shippingState: order.shippingState || '',
        trackingNumber: order.trackingNumber || '',
        courierName: order.courierName || '',

        giftWrapEnabled: order.giftWrapEnabled ? 'Yes' : 'No',
        giftWrapCharge: order.giftWrapCharge?.toString() || '0',

        refundStatus: order.refundStatus,
        cancellationReason: order.cancellationReason || '',

        itemCount: order.items.length,
        items: order.items
            .map(
                (item: any) =>
                    `${item.product.name} (Qty: ${item.quantity}, Price: ₹${item.price})`
            )
            .join(' | '),

        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    }));

    const csv = Papa.unparse(csvData);
    return csv;
}

/**
 * Validate a product row from CSV
 */
function validateProductRow(
    row: ProductCSVRow,
    rowIndex: number,
    categoryMap: Map<string, string>
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required fields
    if (!row.name || row.name.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'name',
            message: 'Product name is required',
        });
    }

    if (!row.description || row.description.trim() === '') {
        errors.push({
            row: rowIndex,
            field: 'description',
            message: 'Product description is required',
        });
    }

    if (!row.price || isNaN(parseFloat(row.price))) {
        errors.push({
            row: rowIndex,
            field: 'price',
            message: 'Valid price is required',
        });
    } else if (parseFloat(row.price) < 0) {
        errors.push({
            row: rowIndex,
            field: 'price',
            message: 'Price must be positive',
        });
    }

    if (!row.stock || isNaN(parseInt(row.stock))) {
        errors.push({
            row: rowIndex,
            field: 'stock',
            message: 'Valid stock quantity is required',
        });
    } else if (parseInt(row.stock) < 0) {
        errors.push({
            row: rowIndex,
            field: 'stock',
            message: 'Stock must be non-negative',
        });
    }

    // Category validation - either categoryId or categoryName must be provided
    if (!row.categoryId && !row.categoryName) {
        errors.push({
            row: rowIndex,
            field: 'category',
            message: 'Either categoryId or categoryName is required',
        });
    } else if (row.categoryName && !categoryMap.has(row.categoryName)) {
        errors.push({
            row: rowIndex,
            field: 'categoryName',
            message: `Category "${row.categoryName}" not found`,
        });
    }

    // Optional field validations
    if (row.discount && isNaN(parseFloat(row.discount))) {
        errors.push({
            row: rowIndex,
            field: 'discount',
            message: 'Discount must be a number',
        });
    }

    if (row.discountType && !['PERCENTAGE', 'FIXED'].includes(row.discountType)) {
        errors.push({
            row: rowIndex,
            field: 'discountType',
            message: 'Discount type must be PERCENTAGE or FIXED',
        });
    }

    if (row.status && !['DRAFT', 'PUBLISHED'].includes(row.status)) {
        errors.push({
            row: rowIndex,
            field: 'status',
            message: 'Status must be DRAFT or PUBLISHED',
        });
    }

    return errors;
}

/**
 * Import products from CSV
 */
export async function importProductsFromCSV(
    csvContent: string,
    importedBy: string
): Promise<ImportResult> {
    // Create import log
    const importLog = await prisma.dataImportLog.create({
        data: {
            filename: `products-import-${Date.now()}.csv`,
            entityType: 'products',
            importedBy,
            status: 'IN_PROGRESS',
        },
    });

    try {
        // Parse CSV
        const parseResult = Papa.parse<ProductCSVRow>(csvContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
        });

        const rows = parseResult.data;
        const totalRows = rows.length;

        // Build category map for validation
        const categories = await prisma.category.findMany();
        const categoryMap = new Map<string, string>();
        categories.forEach((cat: any) => {
            categoryMap.set(cat.name, cat.id);
            categoryMap.set(cat.id, cat.id);
        });

        // Validate all rows first
        const allErrors: ValidationError[] = [];
        rows.forEach((row, index) => {
            const rowErrors = validateProductRow(row, index + 2, categoryMap); // +2 for header and 0-index
            allErrors.push(...rowErrors);
        });

        // If there are validation errors, stop and return
        if (allErrors.length > 0) {
            await prisma.dataImportLog.update({
                where: { id: importLog.id },
                data: {
                    status: 'FAILED',
                    totalRows,
                    failureCount: allErrors.length,
                    errors: allErrors as any,
                    completedAt: new Date(),
                },
            });

            return {
                success: false,
                totalRows,
                successCount: 0,
                failureCount: allErrors.length,
                errors: allErrors,
            };
        }

        // Import products
        let successCount = 0;
        let failureCount = 0;
        const importErrors: ValidationError[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                // Determine category ID
                const categoryId =
                    row.categoryId ||
                    (row.categoryName ? categoryMap.get(row.categoryName) : undefined);

                if (!categoryId) {
                    throw new Error('Category not found');
                }

                // Calculate final price
                const price = parseFloat(row.price);
                const discount = row.discount ? parseFloat(row.discount) : 0;
                let finalPrice = price;

                if (discount > 0 && row.discountType === 'PERCENTAGE') {
                    finalPrice = price - (price * discount) / 100;
                } else if (discount > 0 && row.discountType === 'FIXED') {
                    finalPrice = price - discount;
                }

                // Parse arrays
                const colors = row.colors
                    ? row.colors.split(',').map((c) => c.trim())
                    : [];
                const occasions = row.occasions
                    ? row.occasions.split(',').map((o) => o.trim())
                    : [];
                const imageUrls = row.images
                    ? row.images.split(',').map((url) => url.trim())
                    : [];

                // Create or update product
                const productData = {
                    name: row.name.trim(),
                    description: row.description.trim(),
                    shortDescription: row.shortDescription?.trim() || null,
                    sku: row.sku?.trim() || null,
                    price: parseFloat(row.price),
                    discount: discount || null,
                    discountType: row.discountType || null,
                    finalPrice,
                    stock: parseInt(row.stock),
                    lowStockThreshold: row.lowStockThreshold
                        ? parseInt(row.lowStockThreshold)
                        : 10,
                    categoryId,
                    status: row.status || 'DRAFT',
                    isFeatured: row.isFeatured === 'Yes',

                    // Saree fields
                    fabricType: row.fabricType?.trim() || null,
                    weaveType: row.weaveType?.trim() || null,
                    borderDescription: row.borderDescription?.trim() || null,
                    palluDescription: row.palluDescription?.trim() || null,
                    hasBlousePiece: row.hasBlousePiece !== 'No',
                    blouseFabric: row.blouseFabric?.trim() || null,
                    sareeLength: row.sareeLength?.trim() || '5.5 meters',
                    blouseLength: row.blouseLength?.trim() || '0.8 meters',
                    colors,
                    occasions,
                    careInstructions: row.careInstructions?.trim() || null,
                };

                let product;
                if (row.sku) {
                    // Try to find existing product by SKU
                    const existing = await prisma.product.findUnique({
                        where: { sku: row.sku },
                    });

                    if (existing) {
                        // Update existing product
                        product = await prisma.product.update({
                            where: { id: existing.id },
                            data: productData,
                        });
                    } else {
                        // Create new product
                        product = await prisma.product.create({
                            data: productData,
                        });
                    }
                } else {
                    // Create new product without SKU
                    product = await prisma.product.create({
                        data: productData,
                    });
                }

                // Add images if provided
                if (imageUrls.length > 0) {
                    // Delete existing images
                    await prisma.productImage.deleteMany({
                        where: { productId: product.id },
                    });

                    // Create new images
                    await prisma.productImage.createMany({
                        data: imageUrls.map((url, index) => ({
                            productId: product.id,
                            url,
                            type: index === 0 ? 'MAIN' : 'FRONT_VIEW',
                            position: index,
                        })),
                    });
                }

                successCount++;
            } catch (error) {
                failureCount++;
                importErrors.push({
                    row: i + 2,
                    field: 'general',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        // Update import log
        await prisma.dataImportLog.update({
            where: { id: importLog.id },
            data: {
                status:
                    failureCount > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
                totalRows,
                successCount,
                failureCount,
                errors: importErrors as any,
                completedAt: new Date(),
            },
        });

        return {
            success: true,
            totalRows,
            successCount,
            failureCount,
            errors: importErrors,
        };
    } catch (error) {
        // Update import log with failure
        await prisma.dataImportLog.update({
            where: { id: importLog.id },
            data: {
                status: 'FAILED',
                errors: [
                    {
                        row: 0,
                        field: 'general',
                        message: error instanceof Error ? error.message : 'Unknown error',
                    },
                ] as any,
                completedAt: new Date(),
            },
        });

        return {
            success: false,
            totalRows: 0,
            successCount: 0,
            failureCount: 0,
            errors: [
                {
                    row: 0,
                    field: 'general',
                    message: error instanceof Error ? error.message : 'Unknown error',
                },
            ],
        };
    }
}

/**
 * Get import history
 */
export async function getImportHistory(limit = 50) {
    return await prisma.dataImportLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

/**
 * Generate product import template CSV
 */
export function generateProductImportTemplate(): string {
    const templateData = [
        {
            name: 'Example Silk Saree',
            description: 'Beautiful handwoven silk saree with traditional motifs',
            shortDescription: 'Elegant silk saree perfect for weddings',
            sku: 'SAREE001',
            price: '12500',
            discount: '10',
            discountType: 'PERCENTAGE',
            stock: '5',
            lowStockThreshold: '2',
            categoryId: '',
            categoryName: 'Silk Sarees',
            status: 'PUBLISHED',
            isFeatured: 'Yes',
            fabricType: 'Pure Silk',
            weaveType: 'Handloom',
            borderDescription: 'Golden zari border with peacock motifs',
            palluDescription: 'Rich pallu with intricate weaving',
            hasBlousePiece: 'Yes',
            blouseFabric: 'Matching silk',
            sareeLength: '5.5 meters',
            blouseLength: '0.8 meters',
            colors: 'Red, Gold',
            occasions: 'Wedding, Festival',
            careInstructions: 'Dry clean only',
            images: 'https://example.com/image1.jpg, https://example.com/image2.jpg',
        },
    ];

    return Papa.unparse(templateData);
}
