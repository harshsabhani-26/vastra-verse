"use client";

import { useState } from "react";
import { Upload, FileUp, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SettlementPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<any | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/admin/payments/settlement", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setResults(data.results);
                toast.success(`Processed ${data.results.success} orders`);
            } else {
                toast.error(data.error || "Upload failed");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Bulk Settlement</h2>
                    <p className="text-stone-600 mt-1">Upload courier csv/excel to mark COD orders as Paid</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload Settlement File</CardTitle>
                    <CardDescription>
                        Supported formats: .csv, .xlsx, .xls. Ensure columns include "Order ID" and "Amount".
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-stone-200 rounded-lg p-12 text-center hover:bg-stone-50 transition-colors">
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            id="file-upload"
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center cursor-pointer"
                        >
                            <FileUp className="w-12 h-12 text-stone-400 mb-4" />
                            <span className="text-stone-900 font-medium text-lg">
                                {file ? file.name : "Click to select file"}
                            </span>
                            <span className="text-stone-500 text-sm mt-1">
                                {file ? `${(file.size / 1024).toFixed(2)} KB` : "or drag and drop here"}
                            </span>
                        </label>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="bg-[#1C1917] text-white hover:bg-[#2c2825]"
                        >
                            {uploading ? "Processing..." : "Process Settlement"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {results && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-green-50 border-green-100">
                        <CardHeader>
                            <CardTitle className="text-green-800 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Success
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900">{results.success}</div>
                            <p className="text-green-700 text-sm">Orders updated to PAID</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-800 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                Failed/Skipped
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-900">{results.failed}</div>
                            <p className="text-red-700 text-sm">Rows with errors</p>
                        </CardContent>
                    </Card>

                    {results.errors.length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Error Log</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-stone-900 text-stone-300 p-4 rounded-md text-sm font-mono max-h-60 overflow-y-auto">
                                    {results.errors.map((err: any, idx: number) => (
                                        <div key={idx} className="mb-1 border-b border-stone-800 pb-1 last:border-0">
                                            <span className="text-stone-500">Row {err.row}:</span>{" "}
                                            {err.orderId && <span className="text-yellow-500">[{err.orderId}] </span>}
                                            {err.error && <span className="text-red-400">{err.error}</span>}
                                            {err.warning && <span className="text-orange-400">{err.warning}</span>}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
