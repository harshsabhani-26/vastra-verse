'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export function ExportButtons() {
    const [exporting, setExporting] = useState<string | null>(null);

    const handleExport = async (type: 'products' | 'customers' | 'orders') => {
        setExporting(type);
        try {
            const response = await fetch(`/api/admin/export/${type}`);

            if (!response.ok) throw new Error(`Failed to export ${type}`);

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
        } catch (error) {
            console.error(`Export ${type} error:`, error);
            toast.error(`Failed to export ${type}`);
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleExport('products')}
                disabled={exporting !== null}
            >
                {exporting === 'products' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                ) : (
                    <>
                        <FileSpreadsheet className="w-8 h-8" />
                        <span className="font-semibold">Export Products</span>
                    </>
                )}
            </Button>

            <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleExport('customers')}
                disabled={exporting !== null}
            >
                {exporting === 'customers' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                ) : (
                    <>
                        <FileSpreadsheet className="w-8 h-8" />
                        <span className="font-semibold">Export Customers</span>
                    </>
                )}
            </Button>

            <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => handleExport('orders')}
                disabled={exporting !== null}
            >
                {exporting === 'orders' ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                ) : (
                    <>
                        <FileSpreadsheet className="w-8 h-8" />
                        <span className="font-semibold">Export Orders</span>
                    </>
                )}
            </Button>
        </div>
    );
}
