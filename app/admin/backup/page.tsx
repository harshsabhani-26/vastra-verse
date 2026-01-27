'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackupHistoryTable } from '@/components/admin/backup/BackupHistoryTable';
import { ExportButtons } from '@/components/admin/backup/ExportButtons';
import { ProductBulkImport } from '@/components/admin/backup/ProductBulkImport';
import { ImportHistoryTable } from '@/components/admin/backup/ImportHistoryTable';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupPage() {
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);
    const [refreshBackups, setRefreshBackups] = useState(0);

    const handleCreateBackup = async () => {
        setIsCreatingBackup(true);
        try {
            const response = await fetch('/api/admin/backup', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to create backup');
            }

            const data = await response.json();

            toast.success('Backup created successfully', {
                description: `${data.backup.totalRecords} records backed up`,
            });

            // Refresh the backup list
            setRefreshBackups((prev) => prev + 1);
        } catch (error) {
            console.error('Backup error:', error);
            toast.error('Failed to create backup');
        } finally {
            setIsCreatingBackup(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">Backup & Data Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage database backups and import/export data
                    </p>
                </div>
                <Button
                    onClick={handleCreateBackup}
                    disabled={isCreatingBackup}
                    size="lg"
                >
                    {isCreatingBackup ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Creating Backup...
                        </>
                    ) : (
                        <>
                            <Database className="w-4 h-4 mr-2" />
                            Create Manual Backup
                        </>
                    )}
                </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="backups" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="backups">
                        <Database className="w-4 h-4 mr-2" />
                        Backups
                    </TabsTrigger>
                    <TabsTrigger value="import-export">
                        <Upload className="w-4 h-4 mr-2" />
                        Import/Export
                    </TabsTrigger>
                </TabsList>

                {/* Backups Tab */}
                <TabsContent value="backups" className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            About Backups
                        </h3>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            Backups are stored as compressed JSON files containing all your data.
                            You can create manual backups anytime or set up automatic backups.
                            Restoring a backup will <strong>replace all current data</strong> -
                            use with caution!
                        </p>
                    </div>

                    <BackupHistoryTable
                        key={refreshBackups}
                        onBackupDeleted={() => setRefreshBackups((prev) => prev + 1)}
                    />
                </TabsContent>

                {/* Import/Export Tab */}
                <TabsContent value="import-export" className="space-y-6">
                    {/* Export Section */}
                    <div className="border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Download className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">Export Data</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Download your data as CSV files for backups or external analysis.
                        </p>
                        <ExportButtons />
                    </div>

                    {/* Import Section */}
                    <div className="border rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Upload className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">Import Products</h2>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Bulk import products from a CSV file. Download the template to see
                            the required format.
                        </p>
                        <ProductBulkImport />
                    </div>

                    {/* Import History */}
                    <div className="border rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Import History</h2>
                        <ImportHistoryTable />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
