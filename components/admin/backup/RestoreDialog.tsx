'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RestoreDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    backup: {
        id: string;
        filename: string;
        totalRecords: number | null;
        createdAt: string;
        entityCounts: any;
    };
    onRestoreComplete?: () => void;
}

export function RestoreDialog({
    open,
    onOpenChange,
    backup,
    onRestoreComplete,
}: RestoreDialogProps) {
    const [confirmText, setConfirmText] = useState('');
    const [isRestoring, setIsRestoring] = useState(false);

    const handleRestore = async () => {
        if (confirmText !== 'RESTORE') {
            toast.error('Please type RESTORE to confirm');
            return;
        }

        setIsRestoring(true);
        try {
            const response = await fetch('/api/admin/backup/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: backup.filename }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to restore backup');
            }

            const data = await response.json();

            toast.success('Backup restored successfully', {
                description: `${data.restoredRecords} records restored`,
            });

            onOpenChange(false);
            setConfirmText('');
            onRestoreComplete?.();

            // Reload page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Restore error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to restore backup');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg" aria-describedby="restore-backup-description">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Restore Database Backup
                    </DialogTitle>
                    <DialogDescription id="restore-backup-description">
                        This action will replace ALL current data with the backup data.
                        This cannot be undone!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning */}
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <h4 className="font-semibold text-destructive mb-2">⚠️ Warning</h4>
                        <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                            <li>All current database data will be deleted</li>
                            <li>The backup data will be restored in its place</li>
                            <li>This operation cannot be reversed</li>
                            <li>Users will be logged out</li>
                        </ul>
                    </div>

                    {/* Backup Info */}
                    <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Filename:</span>
                            <span className="font-mono">{backup.filename}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{new Date(backup.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Records:</span>
                            <span className="font-semibold">
                                {backup.totalRecords?.toLocaleString() || 'N/A'}
                            </span>
                        </div>
                    </div>

                    {/* Entity Counts */}
                    {backup.entityCounts && (
                        <div className="border rounded-lg p-4">
                            <h4 className="text-sm font-semibold mb-2">Data to Restore:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {Object.entries(backup.entityCounts).map(([entity, count]) => (
                                    <div key={entity} className="flex justify-between">
                                        <span className="text-muted-foreground capitalize">
                                            {entity}:
                                        </span>
                                        <span className="font-medium">{count as number}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm">
                            Type <code className="px-2 py-1 bg-muted rounded text-sm">RESTORE</code> to confirm
                        </Label>
                        <Input
                            id="confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type RESTORE here"
                            disabled={isRestoring}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => {
                            onOpenChange(false);
                            setConfirmText('');
                        }}
                        disabled={isRestoring}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRestore}
                        disabled={confirmText !== 'RESTORE' || isRestoring}
                    >
                        {isRestoring ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                Restoring...
                            </>
                        ) : (
                            'Restore Backup'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
