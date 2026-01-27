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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, RotateCcw, Database } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RestoreDialog } from './RestoreDialog';

interface Backup {
    id: string;
    filename: string;
    fileSize: number;
    backupType: string;
    status: string;
    totalRecords: number | null;
    entityCounts: any;
    createdBy: string | null;
    createdAt: string;
    completedAt: string | null;
}

interface BackupHistoryTableProps {
    onBackupDeleted?: () => void;
}

export function BackupHistoryTable({ onBackupDeleted }: BackupHistoryTableProps) {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);

    useEffect(() => {
        fetchBackups();
    }, []);

    const fetchBackups = async () => {
        try {
            const response = await fetch('/api/admin/backup');
            if (!response.ok) throw new Error('Failed to fetch backups');

            const data = await response.json();
            setBackups(data.backups);
        } catch (error) {
            console.error('Error fetching backups:', error);
            toast.error('Failed to load backups');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await fetch(`/api/admin/backup/download?filename=${encodeURIComponent(filename)}`);

            if (!response.ok) throw new Error('Failed to download backup');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Backup downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download backup');
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/backup/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename }),
            });

            if (!response.ok) throw new Error('Failed to delete backup');

            toast.success('Backup deleted successfully');
            fetchBackups();
            onBackupDeleted?.();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete backup');
        }
    };

    const handleRestore = (backup: Backup) => {
        setSelectedBackup(backup);
        setRestoreDialogOpen(true);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (backups.length === 0) {
        return (
            <div className="border rounded-lg p-12 text-center">
                <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No backups found</h3>
                <p className="text-muted-foreground">
                    Create your first backup to get started
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Filename</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Records</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {backups.map((backup) => (
                            <TableRow key={backup.id}>
                                <TableCell className="font-mono text-sm">
                                    {backup.filename}
                                </TableCell>
                                <TableCell>
                                    {format(new Date(backup.createdAt), 'MMM d, yyyy HH:mm')}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={backup.backupType === 'AUTOMATIC' ? 'secondary' : 'default'}>
                                        {backup.backupType}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={
                                            backup.status === 'COMPLETED'
                                                ? 'success'
                                                : backup.status === 'FAILED'
                                                    ? 'destructive'
                                                    : 'secondary'
                                        }
                                    >
                                        {backup.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {backup.totalRecords?.toLocaleString() || '-'}
                                </TableCell>
                                <TableCell>{formatFileSize(backup.fileSize)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {backup.status === 'COMPLETED' && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDownload(backup.filename)}
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRestore(backup)}
                                                    title="Restore"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(backup.filename)}
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedBackup && (
                <RestoreDialog
                    open={restoreDialogOpen}
                    onOpenChange={setRestoreDialogOpen}
                    backup={selectedBackup}
                    onRestoreComplete={() => {
                        fetchBackups();
                        onBackupDeleted?.();
                    }}
                />
            )}
        </>
    );
}
