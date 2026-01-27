'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExportDialogProps {
    customerIds: string[];
    onClose: () => void;
}

export default function ExportDialog({ customerIds, onClose }: ExportDialogProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch('/api/admin/customers/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ customerIds }),
            });

            if (!response.ok) {
                throw new Error('Failed to export');
            }

            // Download the CSV file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Customers exported successfully');
            onClose();
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export customers');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#1C1917]">Export Customers</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-stone-600">
                        You are about to export <strong>{customerIds.length}</strong> customer
                        {customerIds.length !== 1 ? 's' : ''} to a CSV file.
                    </p>

                    <div className="bg-stone-50 border border-stone-200 rounded-lg p-4">
                        <p className="text-sm text-stone-600">
                            The export will include:
                        </p>
                        <ul className="mt-2 text-sm text-stone-700 list-disc list-inside space-y-1">
                            <li>Customer name and contact details</li>
                            <li>Total orders and spending</li>
                            <li>VIP and blocked status</li>
                            <li>Join date</li>
                        </ul>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="bg-emerald-700 hover:bg-emerald-800 gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {isExporting ? 'Exporting...' : 'Export CSV'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
