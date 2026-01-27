"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus, Search, Filter, Download, Trash2, Copy, Eye,
    ChevronDown, MoreHorizontal, Package, Calendar, CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    status: string;
    createdAt: Date;
    category: {
        id: string;
        name: string;
    };
    images: Array<{
        id: string;
        url: string;
    }>;
    lowStockThreshold: number | null;
}

export default function ProductsListClient({ initialProducts }: { initialProducts: Product[] }) {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("date-desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [showFilters, setShowFilters] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);

    // Get unique categories
    const categories = Array.from(new Set(products.map(p => p.category.name)));

    // Check if mobile view
    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Filter and sort products
    useEffect(() => {
        let filtered = [...products];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Category filter
        if (categoryFilter !== "all") {
            filtered = filtered.filter(p => p.category.name === categoryFilter);
        }

        // Sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "name-asc":
                    return a.name.localeCompare(b.name);
                case "name-desc":
                    return b.name.localeCompare(a.name);
                case "price-asc":
                    return a.price - b.price;
                case "price-desc":
                    return b.price - a.price;
                case "stock-asc":
                    return a.stock - b.stock;
                case "stock-desc":
                    return b.stock - a.stock;
                case "date-asc":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "date-desc":
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        setFilteredProducts(filtered);
        setCurrentPage(1);
    }, [products, searchQuery, statusFilter, categoryFilter, sortBy]);

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    // Select all toggle
    const toggleSelectAll = () => {
        if (selectedProducts.size === paginatedProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(paginatedProducts.map(p => p.id)));
        }
    };

    // Toggle individual product
    const toggleProduct = (id: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedProducts(newSelected);
    };

    // Bulk delete
    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedProducts.size} products?`)) return;

        try {
            await Promise.all(
                Array.from(selectedProducts).map(id =>
                    fetch(`/api/products/${id}`, { method: 'DELETE' })
                )
            );
            setProducts(products.filter(p => !selectedProducts.has(p.id)));
            setSelectedProducts(new Set());
            router.refresh();
        } catch (error) {
            alert("Failed to delete products");
        }
    };

    // Export CSV
    const exportCSV = () => {
        const headers = ["Name", "SKU", "Category", "Price", "Stock", "Status", "Date Added"];
        const rows = filteredProducts.map(p => [
            p.name,
            p.sku || "",
            p.category.name,
            p.price,
            p.stock,
            p.status,
            new Date(p.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Delete single product
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"?`)) return;

        try {
            await fetch(`/api/products/${id}`, { method: 'DELETE' });
            setProducts(products.filter(p => p.id !== id));
            router.refresh();
        } catch (error) {
            alert("Failed to delete product");
        }
    };

    // Duplicate product
    const handleDuplicate = async (id: string) => {
        try {
            const response = await fetch(`/api/products/${id}/duplicate`, { method: 'POST' });
            if (response.ok) {
                router.refresh();
                window.location.reload(); // Reload to show new product
            }
        } catch (error) {
            alert("Failed to duplicate product");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-[#1C1917]">Products</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                        {selectedProducts.size > 0 && ` • ${selectedProducts.size} selected`}
                    </p>
                </div>
                <Link href="/admin/products/add">
                    <Button className="bg-primary hover:bg-primary/90 w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </Link>
            </div>

            {/* Search, Filters & Actions */}
            <div className="bg-white p-4 rounded-lg border border-stone-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <Input
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full md:w-auto"
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </Button>

                    {/* Export */}
                    <Button variant="outline" onClick={exportCSV} className="w-full md:w-auto">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t">
                        <div>
                            <label className="text-xs text-stone-500 mb-1 block">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 rounded-md border border-stone-200 px-3 text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="PUBLISHED">Published</option>
                                <option value="DRAFT">Draft</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-stone-500 mb-1 block">Category</label>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full h-10 rounded-md border border-stone-200 px-3 text-sm"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-stone-500 mb-1 block">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full h-10 rounded-md border border-stone-200 px-3 text-sm"
                            >
                                <option value="date-desc">Newest First</option>
                                <option value="date-asc">Oldest First</option>
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="price-asc">Price (Low-High)</option>
                                <option value="price-desc">Price (High-Low)</option>
                                <option value="stock-asc">Stock (Low-High)</option>
                                <option value="stock-desc">Stock (High-Low)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Bulk Actions */}
                {selectedProducts.size > 0 && (
                    <div className="flex items-center gap-3 pt-3 border-t">
                        <span className="text-sm text-stone-600">
                            {selectedProducts.size} selected
                        </span>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Selected
                        </Button>
                    </div>
                )}
            </div>

            {/* Products List - Desktop Table View */}
            {!isMobileView && (
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="text-left p-4 w-12">
                                        <button onClick={toggleSelectAll}>
                                            {selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                                                <CheckSquare className="h-5 w-5 text-primary" />
                                            ) : (
                                                <Square className="h-5 w-5 text-stone-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Image</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Name</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">SKU</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Price</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Stock</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Date Added</th>
                                    <th className="text-right p-4 text-xs font-medium text-stone-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {paginatedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="text-center py-12">
                                            <Package className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                                            <p className="text-stone-500">No products found</p>
                                            <p className="text-sm text-stone-400 mt-1">Try adjusting your filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="p-4">
                                                <button onClick={() => toggleProduct(product.id)}>
                                                    {selectedProducts.has(product.id) ? (
                                                        <CheckSquare className="h-5 w-5 text-primary" />
                                                    ) : (
                                                        <Square className="h-5 w-5 text-stone-400" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="h-12 w-12 bg-stone-100 rounded-md overflow-hidden relative">
                                                    {product.images?.[0]?.url && (
                                                        <Image
                                                            src={product.images[0].url}
                                                            alt={product.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="48px"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium text-stone-900">{product.name}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-stone-600 font-mono">
                                                    {product.sku || "-"}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-stone-700">{product.category.name}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-medium text-stone-900">
                                                    ₹{product.price.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-sm font-medium ${product.stock === 0
                                                    ? 'text-red-600'
                                                    : product.stock <= (product.lowStockThreshold || 10)
                                                        ? 'text-amber-600'
                                                        : 'text-green-600'
                                                    }`}>
                                                    {product.stock}
                                                    {product.stock <= (product.lowStockThreshold || 10) && product.stock > 0 && (
                                                        <span className="ml-1 text-xs">⚠️</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.status === 'PUBLISHED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-stone-200 text-stone-700'
                                                    }`}>
                                                    {product.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-sm text-stone-600" suppressHydrationWarning>
                                                    <Calendar className="h-4 w-4 text-stone-400" />
                                                    {new Date(product.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/shop/${product.id}`} target="_blank">
                                                        <Button variant="ghost" size="sm" title="Preview">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/admin/products/edit/${product.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" title="Edit">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDuplicate(product.id)}
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Mobile Card View */}
            {isMobileView && (
                <div className="space-y-3">
                    {paginatedProducts.length === 0 ? (
                        <div className="bg-white rounded-lg border border-stone-200 p-12 text-center">
                            <Package className="h-12 w-12 text-stone-300 mx-auto mb-3" />
                            <p className="text-stone-500">No products found</p>
                        </div>
                    ) : (
                        paginatedProducts.map((product) => (
                            <div key={product.id} className="bg-white rounded-lg border border-stone-200 p-4">
                                <div className="flex gap-3">
                                    <button onClick={() => toggleProduct(product.id)} className="flex-shrink-0">
                                        {selectedProducts.has(product.id) ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5 text-stone-400" />
                                        )}
                                    </button>
                                    <div className="h-20 w-20 bg-stone-100 rounded-md overflow-hidden relative flex-shrink-0">
                                        {product.images?.[0]?.url && (
                                            <Image
                                                src={product.images[0].url}
                                                alt={product.name}
                                                fill
                                                className="object-cover"
                                                sizes="80px"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
                                        <p className="text-sm text-stone-500 mt-1">{product.category.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="font-medium text-stone-900">₹{product.price.toLocaleString()}</span>
                                            <span className="text-xs text-stone-400">•</span>
                                            <span className={`text-sm ${product.stock === 0 ? 'text-red-600' : product.stock <= (product.lowStockThreshold || 10) ? 'text-amber-600' : 'text-green-600'}`}>
                                                Stock: {product.stock}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-700'}`}>
                                                {product.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                            </span>
                                            {product.sku && (
                                                <span className="text-xs text-stone-500 font-mono">{product.sku}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3 pt-3 border-t">
                                    <Link href={`/shop/${product.id}`} target="_blank" className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Eye className="h-4 w-4 mr-2" /> Preview
                                        </Button>
                                    </Link>
                                    <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            Edit
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(product.id, product.name)}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-stone-200">
                    <p className="text-sm text-stone-600">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <Button
                                    key={i}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="hidden md:inline-flex"
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
