import prisma from '@/lib/prisma';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { gzip, gunzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Backup configuration
const BACKUP_DIR = path.join(process.cwd(), 'backups');
const RETENTION_DAYS = 30; // Keep backups for 30 days

interface BackupData {
    version: string;
    timestamp: string;
    entities: {
        users: any[];
        products: any[];
        categories: any[];
        orders: any[];
        payments: any[];
        refunds: any[];
        coupons: any[];
        productImages: any[];
        addresses: any[];
        orderItems: any[];
    };
    metadata: {
        totalRecords: number;
        entityCounts: Record<string, number>;
    };
}

interface BackupResult {
    success: boolean;
    filename?: string;
    fileSize?: number;
    totalRecords?: number;
    error?: string;
}

interface RestoreResult {
    success: boolean;
    restoredRecords?: number;
    error?: string;
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

/**
 * Create a complete database backup
 */
export async function createBackup(
    backupType: 'MANUAL' | 'AUTOMATIC' = 'MANUAL',
    createdBy?: string
): Promise<BackupResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Create backup log entry
    const backupLog = await prisma.backupLog.create({
        data: {
            filename,
            fileSize: 0,
            backupType,
            status: 'IN_PROGRESS',
            createdBy,
        },
    });

    try {
        await ensureBackupDir();

        // Fetch all data from database
        const [
            users,
            products,
            categories,
            orders,
            payments,
            refunds,
            coupons,
            productImages,
            addresses,
            orderItems,
        ] = await Promise.all([
            prisma.user.findMany({
                include: {
                    accounts: true,
                    sessions: true,
                },
            }),
            prisma.product.findMany(),
            prisma.category.findMany(),
            prisma.order.findMany(),
            prisma.payment.findMany(),
            prisma.refund.findMany(),
            prisma.coupon.findMany(),
            prisma.productImage.findMany(),
            prisma.address.findMany(),
            prisma.orderItem.findMany(),
        ]);

        // Build backup data structure
        const backupData: BackupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            entities: {
                users,
                products,
                categories,
                orders,
                payments,
                refunds,
                coupons,
                productImages,
                addresses,
                orderItems,
            },
            metadata: {
                totalRecords: 0,
                entityCounts: {
                    users: users.length,
                    products: products.length,
                    categories: categories.length,
                    orders: orders.length,
                    payments: payments.length,
                    refunds: refunds.length,
                    coupons: coupons.length,
                    productImages: productImages.length,
                    addresses: addresses.length,
                    orderItems: orderItems.length,
                },
            },
        };

        // Calculate total records
        backupData.metadata.totalRecords = Object.values(
            backupData.metadata.entityCounts
        ).reduce((sum, count) => sum + count, 0);

        // Convert to JSON and compress
        const jsonData = JSON.stringify(backupData, null, 2);
        const compressed = await gzipAsync(Buffer.from(jsonData, 'utf-8'));

        // Write compressed backup to file
        await fs.writeFile(filepath, compressed);

        // Get file size
        const stats = await fs.stat(filepath);
        const fileSize = stats.size;

        // Update backup log
        await prisma.backupLog.update({
            where: { id: backupLog.id },
            data: {
                status: 'COMPLETED',
                fileSize,
                totalRecords: backupData.metadata.totalRecords,
                entityCounts: backupData.metadata.entityCounts,
                completedAt: new Date(),
            },
        });

        // Clean up old backups
        await cleanupOldBackups();

        const duration = Date.now() - startTime;
        console.log(`Backup completed in ${duration}ms: ${filename}`);

        return {
            success: true,
            filename,
            fileSize,
            totalRecords: backupData.metadata.totalRecords,
        };
    } catch (error) {
        console.error('Backup failed:', error);

        // Update backup log with error
        await prisma.backupLog.update({
            where: { id: backupLog.id },
            data: {
                status: 'FAILED',
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                completedAt: new Date(),
            },
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Restore database from backup file
 */
export async function restoreBackup(filename: string): Promise<RestoreResult> {
    const filepath = path.join(BACKUP_DIR, filename);

    try {
        // Read and decompress backup file
        const compressed = await fs.readFile(filepath);
        const decompressed = await gunzipAsync(compressed);
        const backupData: BackupData = JSON.parse(decompressed.toString('utf-8'));

        // Validate backup version
        if (backupData.version !== '1.0') {
            throw new Error(`Unsupported backup version: ${backupData.version}`);
        }

        // Use transaction to restore data
        await prisma.$transaction(async (tx) => {
            // Delete existing data in reverse order of dependencies
            await tx.orderItem.deleteMany();
            await tx.productImage.deleteMany();
            await tx.address.deleteMany();
            await tx.coupon.deleteMany();
            await tx.refund.deleteMany();
            await tx.payment.deleteMany();
            await tx.order.deleteMany();
            await tx.product.deleteMany();
            await tx.category.deleteMany();
            await tx.session.deleteMany();
            await tx.account.deleteMany();
            // Note: We'll preserve the current admin user

            // Restore data in order of dependencies
            if (backupData.entities.categories?.length > 0) {
                await tx.category.createMany({
                    data: backupData.entities.categories,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.products?.length > 0) {
                await tx.product.createMany({
                    data: backupData.entities.products,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.productImages?.length > 0) {
                await tx.productImage.createMany({
                    data: backupData.entities.productImages,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.users?.length > 0) {
                // Create users without nested relations
                const usersData = backupData.entities.users.map(
                    ({ accounts, sessions, ...user }) => user
                );
                await tx.user.createMany({
                    data: usersData,
                    skipDuplicates: true,
                });

                // Restore accounts
                const allAccounts = backupData.entities.users.flatMap(
                    (user) => user.accounts || []
                );
                if (allAccounts.length > 0) {
                    await tx.account.createMany({
                        data: allAccounts,
                        skipDuplicates: true,
                    });
                }

                // Restore sessions
                const allSessions = backupData.entities.users.flatMap(
                    (user) => user.sessions || []
                );
                if (allSessions.length > 0) {
                    await tx.session.createMany({
                        data: allSessions,
                        skipDuplicates: true,
                    });
                }
            }

            if (backupData.entities.addresses?.length > 0) {
                await tx.address.createMany({
                    data: backupData.entities.addresses,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.orders?.length > 0) {
                await tx.order.createMany({
                    data: backupData.entities.orders,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.orderItems?.length > 0) {
                await tx.orderItem.createMany({
                    data: backupData.entities.orderItems,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.payments?.length > 0) {
                await tx.payment.createMany({
                    data: backupData.entities.payments,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.refunds?.length > 0) {
                await tx.refund.createMany({
                    data: backupData.entities.refunds,
                    skipDuplicates: true,
                });
            }

            if (backupData.entities.coupons?.length > 0) {
                await tx.coupon.createMany({
                    data: backupData.entities.coupons,
                    skipDuplicates: true,
                });
            }
        });

        return {
            success: true,
            restoredRecords: backupData.metadata.totalRecords,
        };
    } catch (error) {
        console.error('Restore failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * List all available backups
 */
export async function listBackups() {
    try {
        await ensureBackupDir();

        // Get backups from database
        const backups = await prisma.backupLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 backups
        });

        return backups;
    } catch (error) {
        console.error('Failed to list backups:', error);
        return [];
    }
}

/**
 * Delete a backup file
 */
export async function deleteBackup(filename: string): Promise<boolean> {
    try {
        const filepath = path.join(BACKUP_DIR, filename);

        // Delete file
        await fs.unlink(filepath);

        // Delete from database
        await prisma.backupLog.delete({
            where: { filename },
        });

        return true;
    } catch (error) {
        console.error('Failed to delete backup:', error);
        return false;
    }
}

/**
 * Get backup file path
 */
export function getBackupPath(filename: string): string {
    return path.join(BACKUP_DIR, filename);
}

/**
 * Clean up old backups based on retention policy
 */
async function cleanupOldBackups() {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

        // Find old backups
        const oldBackups = await prisma.backupLog.findMany({
            where: {
                createdAt: {
                    lt: cutoffDate,
                },
                status: 'COMPLETED',
            },
        });

        // Delete old backup files and records
        for (const backup of oldBackups) {
            try {
                const filepath = path.join(BACKUP_DIR, backup.filename);
                await fs.unlink(filepath);
                await prisma.backupLog.delete({
                    where: { id: backup.id },
                });
                console.log(`Deleted old backup: ${backup.filename}`);
            } catch (error) {
                console.error(`Failed to delete backup ${backup.filename}:`, error);
            }
        }
    } catch (error) {
        console.error('Failed to cleanup old backups:', error);
    }
}
