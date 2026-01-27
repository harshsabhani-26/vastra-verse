'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileUp, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ImportResult {
    success: boolean;
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: Array<{
        row: number;
        field: string;
        message: string;
    }>;
}

export function ProductBulkImport() {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                toast.error('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
            setResult(null);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await fetch('/api/admin/import/products?template=true');

            if (!response.ok) throw new Error('Failed to download template');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product-import-template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success('Template downloaded successfully');
        } catch (error) {
            console.error('Download template error:', error);
            toast.error('Failed to download template');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/import/products', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to import products');

            const data: ImportResult = await response.json();
            setResult(data);

            if (data.success && data.failureCount === 0) {
                toast.success('Products imported successfully', {
                    description: `${data.successCount} products imported`,
                });
            } else if (data.success && data.failureCount > 0) {
                toast.warning('Import completed with errors', {
                    description: `${data.successCount} imported, ${data.failureCount} failed`,
                });
            } else {
                toast.error('Import failed', {
                    description: 'Please check the error messages below',
                });
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import products');
        } finally {
            setImporting(false);
        }
    };

    const handleClear = () => {
        setFile(null);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {/* Template Download */}
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Need a template? Download it to see the required format.
                </p>
                <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                </Button>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-8">
                <div className="flex flex-col items-center gap-4">
                    {file ? (
                        <div className="text-center space-y-2">
                            <FileUp className="w-12 h-12 text-primary mx-auto" />
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(file.size / 1024).toFixed(2)} KB
                            </p>
                            <Button variant="ghost" size="sm" onClick={handleClear}>
                                Choose Different File
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-muted-foreground" />
                            <div className="text-center">
                                <p className="font-medium mb-1">Upload CSV File</p>
                                <p className="text-sm text-muted-foreground">
                                    Click to select or drag and drop
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Button variant="outline" asChild>
                                <label htmlFor="csv-upload" className="cursor-pointer">
                                    Select CSV File
                                </label>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Import Button */}
            {file && !result && (
                <Button
                    onClick={handleImport}
                    disabled={importing}
                    className="w-full"
                    size="lg"
                >
                    {importing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Importing Products...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" />
                            Import Products
                        </>
                    )}
                </Button>
            )}

            {/* Import Results */}
            {result && (
                <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        {result.success && result.failureCount === 0 ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : result.success && result.failureCount > 0 ? (
                            <AlertCircle className="w-6 h-6 text-yellow-500" />
                        ) : (
                            <XCircle className="w-6 h-6 text-red-500" />
                        )}
                        <h3 className="text-lg font-semibold">Import Results</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{result.totalRows}</p>
                            <p className="text-sm text-muted-foreground">Total Rows</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {result.successCount}
                            </p>
                            <p className="text-sm text-muted-foreground">Imported</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">
                                {result.failureCount}
                            </p>
                            <p className="text-sm text-muted-foreground">Failed</p>
                        </div>
                    </div>

                    {result.successCount > 0 && (
                        <Progress
                            value={(result.successCount / result.totalRows) * 100}
                            className="h-2"
                        />
                    )}

                    {/* Errors */}
                    {result.errors && result.errors.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-destructive">Errors:</h4>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {result.errors.slice(0, 20).map((error, index) => (
                                    <div
                                        key={index}
                                        className="bg-destructive/10 border border-destructive/20 rounded p-3 text-sm"
                                    >
                                        <div className="flex items-start gap-2">
                                            <Badge variant="destructive" className="mt-0.5">
                                                Row {error.row}
                                            </Badge>
                                            <div>
                                                <p className="font-medium">{error.field}</p>
                                                <p className="text-destructive/80">{error.message}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {result.errors.length > 20 && (
                                    <p className="text-sm text-muted-foreground text-center">
                                        ... and {result.errors.length - 20} more errors
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <Button variant="outline" onClick={handleClear} className="w-full">
                        Import Another File
                    </Button>
                </div>
            )}
        </div>
    );
}
