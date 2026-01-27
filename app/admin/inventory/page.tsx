"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Package,
    AlertTriangle,
    XCircle,
    TrendingUp,
    Search,
    Download,
    Plus,
    Minus,
} from "lucide-react";
import toast from "react-hot-toast";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    lowStockThreshold: number | null;
    price: number;
    category: {
        name: string;
    };
}

interface StockStats {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<StockStats>({
        totalProducts: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [showAdjustModal, setShowAdjustModal] = useState(false);

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, statusFilter, products]);

    async function fetchInventory() {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/products");
            const data = await response.json();

            if (response.ok) {
                setProducts(data.products || []);
                calculateStats(data.products || []);
            } else {
                toast.error("Failed to load inventory");
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
            toast.error("Failed to load inventory");
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(products: Product[]) {
        const totalProducts = products.length;
        const lowStock = products.filter(
            (p) => p.stock > 0 && p.stock <= (p.lowStockThreshold || 10)
        ).length;
        const outOfStock = products.filter((p) => p.stock === 0).length;
        const totalValue = products.reduce(
            (sum, p) => sum + p.stock * Number(p.price),
            0
        );

        setStats({ totalProducts, lowStock, outOfStock, totalValue });
    }

    function filterProducts() {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => {
                if (statusFilter === "out-of-stock") return p.stock === 0;
                if (statusFilter === "low-stock")
                    return p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);
                if (statusFilter === "in-stock")
                    return p.stock > (p.lowStockThreshold || 10);
                return true;
            });
        }

        setFilteredProducts(filtered);
    }

    function getStockStatus(product: Product) {
        if (product.stock === 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50" };
        if (product.stock <= (product.lowStockThreshold || 10))
            return { label: "Low Stock", color: "text-amber-600 bg-amber-50" };
        return { label: "In Stock", color: "text-green-600 bg-green-50" };
    }

    function openAdjustModal(product: Product) {
        setSelectedProduct(product);
        setAdjustmentAmount("");
        setAdjustmentReason("");
        setShowAdjustModal(true);
    }

    async function handleStockAdjustment(type: "add" | "remove" | "set") {
        if (!selectedProduct) return;

        const amount = Number(adjustmentAmount);
        if (isNaN(amount) || amount < 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        let newStock = selectedProduct.stock;
        if (type === "add") newStock += amount;
        else if (type === "remove") newStock -= amount;
        else newStock = amount;

        if (newStock < 0) {
            toast.error("Stock cannot be negative");
            return;
        }

        try {
            const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ stock: newStock }),
            });

            if (response.ok) {
                toast.success("Stock updated successfully");
                setShowAdjustModal(false);
                fetchInventory();
            } else {
                toast.error("Failed to update stock");
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            toast.error("Failed to update stock");
        }
    }

    function exportToCSV() {
        const csv = [
            ["SKU", "Product Name", "Category", "Stock", "Threshold", "Status", "Value"],
            ...filteredProducts.map((p) => [
                p.sku || p.id,
                p.name,
                p.category.name,
                p.stock,
                p.lowStockThreshold || 10,
                getStockStatus(p).label,
                `₹${(p.stock * Number(p.price)).toFixed(2)}`,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Inventory exported successfully");
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-serif text-[#1C1917]">Inventory Management</h2>
                <div className="text-center py-12 text-stone-500">Loading inventory...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif text-[#1C1917]">Inventory Management</h2>
                <Button onClick={exportToCSV} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Total Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-500" />
                            <div className="text-2xl font-bold text-[#1C1917]">
                                {stats.totalProducts}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Low Stock Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <div className="text-2xl font-bold text-amber-600">
                                {stats.lowStock}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Out of Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <div className="text-2xl font-bold text-red-600">
                                {stats.outOfStock}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-stone-600">
                            Total Stock Value
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <div className="text-2xl font-bold text-green-600">
                                ₹{stats.totalValue.toLocaleString("en-IN")}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                                placeholder="Search by name or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={statusFilter === "all" ? "default" : "outline"}
                                onClick={() => setStatusFilter("all")}
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === "in-stock" ? "default" : "outline"}
                                onClick={() => setStatusFilter("in-stock")}
                            >
                                In Stock
                            </Button>
                            <Button
                                variant={statusFilter === "low-stock" ? "default" : "outline"}
                                onClick={() => setStatusFilter("low-stock")}
                            >
                                Low Stock
                            </Button>
                            <Button
                                variant={statusFilter === "out-of-stock" ? "default" : "outline"}
                                onClick={() => setStatusFilter("out-of-stock")}
                            >
                                Out of Stock
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-stone-200 bg-stone-50">
                                <tr>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">
                                        SKU
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">
                                        Product
                                    </th>
                                    <th className="text-left p-4 text-sm font-medium text-stone-600">
                                        Category
                                    </th>
                                    <th className="text-center p-4 text-sm font-medium text-stone-600">
                                        Stock
                                    </th>
                                    <th className="text-center p-4 text-sm font-medium text-stone-600">
                                        Threshold
                                    </th>
                                    <th className="text-center p-4 text-sm font-medium text-stone-600">
                                        Status
                                    </th>
                                    <th className="text-right p-4 text-sm font-medium text-stone-600">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => {
                                    const status = getStockStatus(product);
                                    return (
                                        <tr key={product.id} className="border-b border-stone-100">
                                            <td className="p-4 text-sm text-stone-600">
                                                {product.sku || product.id.slice(0, 8).toUpperCase()}
                                            </td>
                                            <td className="p-4 text-sm font-medium text-stone-900">
                                                {product.name}
                                            </td>
                                            <td className="p-4 text-sm text-stone-600">
                                                {product.category.name}
                                            </td>
                                            <td className="p-4 text-center text-sm font-semibold text-stone-900">
                                                {product.stock}
                                            </td>
                                            <td className="p-4 text-center text-sm text-stone-600">
                                                {product.lowStockThreshold || 10}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${status.color}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openAdjustModal(product)}
                                                >
                                                    Adjust Stock
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 text-stone-500">
                                No products found
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stock Adjustment Modal */}
            {showAdjustModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader>
                            <CardTitle>Adjust Stock - {selectedProduct.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-stone-600 mb-2">
                                    Current Stock: <span className="font-bold">{selectedProduct.stock}</span>
                                </p>
                            </div>

                            <div>
                                <label className="text-sm text-stone-600 block mb-2">
                                    Adjustment Amount
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-stone-600 block mb-2">
                                    Reason (Optional)
                                </label>
                                <Input
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    placeholder="e.g., Restock, Damage, Correction"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStockAdjustment("add")}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={() => handleStockAdjustment("remove")}
                                >
                                    <Minus className="w-4 h-4 mr-2" />
                                    Remove
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={() => handleStockAdjustment("set")}
                                >
                                    Set
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setShowAdjustModal(false)}
                            >
                                Cancel
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
