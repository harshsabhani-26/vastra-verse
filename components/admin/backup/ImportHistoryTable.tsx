'use client';

import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ImportLog {
    id: string;
    filename: string;
    entityType: string;
    totalRows: number;
    successCount: number;
    failureCount: number;
    status: string;
    errors: any;
    importedBy: string;
    createdAt: string;
    completedAt: string | null;
}

export function ImportHistoryTable() {
    const [imports, setImports] = useState<ImportLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchImportHistory();
    }, []);

    const fetchImportHistory = async () => {
        try {
            // Note: You'll need to create this API endpoint
            const response = await fetch('/api/admin/import/history');
            if (response.ok) {
                const data = await response.json();
                setImports(data.imports || []);
            }
        } catch (error) {
            console.error('Error fetching import history:', error);
            // Don't show error toast as this feature might not be implemented yet
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (imports.length === 0) {
        return (
            <div className="border rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No import history</h3>
                <p className="text-muted-foreground">
                    Import data will appear here once you perform an import
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Success</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {imports.map((importLog) => (
                        <>
                            <TableRow key={importLog.id}>
                                <TableCell className="font-mono text-sm">
                                    {importLog.filename}
                                </TableCell>
                                <TableCell className="capitalize">{importLog.entityType}</TableCell>
                                <TableCell>
                                    {format(new Date(importLog.createdAt), 'MMM d, yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            importLog.status === 'COMPLETED'
                                                ? 'success'
                                                : importLog.status === 'COMPLETED_WITH_ERRORS'
                                                    ? 'secondary'
                                                    : importLog.status === 'FAILED'
                                                        ? 'destructive'
                                                        : 'default'
                                        }
                                    >
                                        {importLog.status.replace(/_/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-green-600 font-semibold">
                                        {importLog.successCount}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={
                                            importLog.failureCount > 0
                                                ? 'text-red-600 font-semibold'
                                                : 'text-muted-foreground'
                                        }
                                    >
                                        {importLog.failureCount}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {importLog.errors && importLog.failureCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setExpandedId(
                                                    expandedId === importLog.id ? null : importLog.id
                                                )
                                            }
                                        >
                                            {expandedId === importLog.id ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )}
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {expandedId === importLog.id && importLog.errors && (
                                <TableRow>
                                    <TableCell colSpan={7} className="bg-muted/50">
                                        <div className="p-4 space-y-2">
                                            <h4 className="font-semibold text-sm mb-2">
                                                Error Details ({importLog.errors.length} errors):
                                            </h4>
                                            <div className="max-h-60 overflow-y-auto space-y-2">
                                                {importLog.errors.slice(0, 10).map((error: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        className="bg-background border rounded p-2 text-sm"
                                                    >
                                                        <span className="font-medium">Row {error.row}:</span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {error.field}
                                                        </span>{' '}
                                                        - {error.message}
                                                    </div>
                                                ))}
                                                {importLog.errors.length > 10 && (
                                                    <p className="text-sm text-muted-foreground text-center">
                                                        ... and {importLog.errors.length - 10} more errors
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
