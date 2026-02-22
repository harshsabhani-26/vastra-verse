"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ImageUploader, { ProductImageData } from "@/components/admin/ImageUploader";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    category: { name: string };
    images?: ProductImageData[];
    sku?: string;
    discount?: number;
    discountType?: string;
    finalPrice?: number;
    lowStockThreshold?: number;
    status: string;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    shortDescription?: string;
    fabricType?: string;
    weaveType?: string;
    borderDescription?: string;
    palluDescription?: string;
    hasBlousePiece?: boolean;
    blouseFabric?: string;
    sareeLength?: string;
    blouseLength?: string;
    colors?: string[];
    occasions?: string[];
    careInstructions?: string;
}

interface Category {
    id: string;
    name: string;
}

const FABRIC_TYPES = [
    "Banarasi Silk", "Kanjivaram Silk", "Mysore Silk", "Tussar Silk", "Mulberry Silk",
    "Chanderi Cotton", "Maheshwari Cotton", "Khadi Cotton", "Handloom Cotton",
    "Organza", "Georgette", "Chiffon", "Crepe", "Net", "Linen", "Mixed/Blend"
];

const WEAVE_TYPES = [
    "Handloom", "Jacquard", "Zari Work", "Embroidery", "Block Print",
    "Digital Print", "Bandhani", "Ikat", "Kalamkari"
];

const OCCASIONS = [
    "Wedding", "Festive", "Party", "Formal", "Casual", "Daily Wear"
];

const COLORS = [
    "Red", "Blue", "Green", "Yellow", "Orange", "Pink", "Purple",
    "White", "Black", "Gold", "Silver", "Maroon", "Navy", "Cream", "Beige"
];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [productId, setProductId] = useState<string>("");
    const [productImages, setProductImages] = useState<ProductImageData[]>([]);

    // Form state
    const [price, setPrice] = useState("");
    const [discount, setDiscount] = useState("");
    const [discountType, setDiscountType] = useState("PERCENTAGE");
    const [finalPrice, setFinalPrice] = useState(0);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
    const [hasBlousePiece, setHasBlousePiece] = useState(true);
    const [isNewArrival, setIsNewArrival] = useState(false);
    const [isBestSeller, setIsBestSeller] = useState(false);
    const [status, setStatus] = useState("DRAFT");

    useEffect(() => {
        // Fetch categories
        fetch("/api/categories")
            .then(res => res.json())
            .then(data => setCategories(data))
            .catch(err => console.error("Failed to fetch categories:", err));

        // Unwrap the async params and fetch product
        params.then(({ id }) => {
            setProductId(id);
            fetch(`/api/products/${id}`)
                .then(res => res.json())
                .then(data => {
                    setProduct(data);
                    // Load existing data
                    setPrice(data.price?.toString() || "");
                    setDiscount(data.discount?.toString() || "0");
                    setDiscountType(data.discountType || "PERCENTAGE");
                    setFinalPrice(data.finalPrice || data.price || 0);
                    setSelectedColors(data.colors || []);
                    setSelectedOccasions(data.occasions || []);
                    setHasBlousePiece(data.hasBlousePiece !== false);
                    setIsNewArrival(data.isNewArrival || false);
                    setIsBestSeller(data.isBestSeller || false);
                    setStatus(data.status || "DRAFT");

                    // Load existing images
                    if (data.images && Array.isArray(data.images)) {
                        setProductImages(data.images.map((img: any) => ({
                            id: img.id,
                            url: img.url,
                            type: img.type,
                            position: img.position,
                            width: img.width,
                            height: img.height,
                            fileSize: img.fileSize,
                            rotation: 0,
                        })));
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        });
    }, [params]);

    // Calculate final price when price or discount changes
    useEffect(() => {
        const priceNum = parseFloat(price) || 0;
        const discountNum = parseFloat(discount) || 0;

        if (discountType === "PERCENTAGE") {
            setFinalPrice(priceNum - (priceNum * discountNum / 100));
        } else {
            setFinalPrice(priceNum - discountNum);
        }
    }, [price, discount, discountType]);

    const toggleColor = (color: string) => {
        setSelectedColors(prev =>
            prev.includes(color)
                ? prev.filter(c => c !== color)
                : [...prev, color]
        );
    };

    const toggleOccasion = (occasion: string) => {
        setSelectedOccasions(prev =>
            prev.includes(occasion)
                ? prev.filter(o => o !== occasion)
                : [...prev, occasion]
        );
    };

    async function handleSubmit(saveAction: "DRAFT" | "PUBLISH") {
        setSaving(true);

        // Validate images
        if (productImages.length < 3) {
            alert("Please upload at least 3 images");
            setSaving(false);
            return;
        }

        // Get the form element
        const formElement = document.getElementById("product-form") as HTMLFormElement;
        if (!formElement) {
            alert("Form not found");
            setSaving(false);
            return;
        }

        const formData = new FormData(formElement);

        // Manual validation because type="button" bypasses HTML5 required attribute
        const categoryId = formData.get("categoryId") as string;
        if (!categoryId) {
            alert("Please select a category");
            setSaving(false);
            return;
        }

        const name = formData.get("name") as string;
        if (!name) {
            alert("Please enter a product name");
            setSaving(false);
            return;
        }

        const price = formData.get("price") as string;
        if (!price) {
            alert("Please enter a price");
            setSaving(false);
            return;
        }

        const stock = formData.get("stock") as string;
        if (!stock) {
            alert("Please enter stock quantity");
            setSaving(false);
            return;
        }
        formData.append("colors", JSON.stringify(selectedColors));
        formData.append("occasions", JSON.stringify(selectedOccasions));
        formData.append("finalPrice", finalPrice.toString());
        formData.append("isNewArrival", isNewArrival.toString());
        formData.append("isBestSeller", isBestSeller.toString());
        formData.append("status", saveAction === "DRAFT" ? "DRAFT" : "PUBLISHED");
        formData.append("images", JSON.stringify(productImages));

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                body: formData,
            });

            if (res.ok) {
                router.push("/admin/products");
                router.refresh();
            } else {
                const errorText = await res.text();
                alert(`Failed to update product: ${errorText}`);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update product");
        }

        setSaving(false);
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto py-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return <div className="max-w-4xl mx-auto py-8">Product not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Edit Saree</h1>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-700"}`}>
                        {status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                </div>
            </div>

            <form id="product-form" className="space-y-8">
                {/* SECTION 1: BASIC INFORMATION */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">Basic Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="name">Saree Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Royal Banarasi Silk Saree"
                                defaultValue={product.name}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="categoryId">Category *</Label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                className="w-full flex h-10 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                defaultValue={product.categoryId}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU / Product Code</Label>
                            <Input
                                id="sku"
                                name="sku"
                                placeholder="Auto-generated or manual"
                                defaultValue={product.sku}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (₹) *</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Discount</Label>
                            <div className="flex gap-2">
                                <select
                                    name="discountType"
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    className="w-24 h-10 rounded-md border border-stone-200 bg-white px-3 text-sm"
                                >
                                    <option value="PERCENTAGE">%</option>
                                    <option value="FIXED">₹</option>
                                </select>
                                <Input
                                    name="discount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Final Price (₹)</Label>
                            <div className="h-10 flex items-center px-3 bg-stone-50 border border-stone-200 rounded-md text-lg font-semibold text-primary">
                                ₹{finalPrice.toLocaleString()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock Quantity *</Label>
                            <Input
                                id="stock"
                                name="stock"
                                type="number"
                                placeholder="10"
                                defaultValue={product.stock}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                            <Input
                                id="lowStockThreshold"
                                name="lowStockThreshold"
                                type="number"
                                placeholder="3"
                                defaultValue={product.lowStockThreshold || 3}
                            />
                        </div>

                        <div className="flex items-center space-x-2 md:col-span-2 mt-4">
                            <Checkbox
                                id="isNewArrival"
                                checked={isNewArrival}
                                onCheckedChange={(checked) => setIsNewArrival(checked === true)}
                            />
                            <Label htmlFor="isNewArrival" className="font-medium cursor-pointer">
                                Mark as New Arrival
                            </Label>
                            <span className="text-xs text-stone-500 ml-2">
                                (Will appear in "New Arrivals" section regardless of date)
                            </span>
                        </div>

                        <div className="flex items-center space-x-2 md:col-span-2 mt-4">
                            <Checkbox
                                id="isBestSeller"
                                checked={isBestSeller}
                                onCheckedChange={(checked) => setIsBestSeller(checked === true)}
                            />
                            <Label htmlFor="isBestSeller" className="font-medium cursor-pointer">
                                Mark as Best Seller
                            </Label>
                            <span className="text-xs text-stone-500 ml-2">
                                (Will appear in "Best Sellers" section)
                            </span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: DESCRIPTIONS */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">Descriptions</h2>

                    <div className="space-y-2">
                        <Label htmlFor="shortDescription">Short Description</Label>
                        <Textarea
                            id="shortDescription"
                            name="shortDescription"
                            placeholder="Brief description for product listings (max 160 characters)"
                            maxLength={160}
                            rows={2}
                            defaultValue={product.shortDescription}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Detailed Description *</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Full product description with all details..."
                            rows={6}
                            defaultValue={product.description}
                            required
                        />
                    </div>
                </div>

                {/* SECTION 3: FABRIC & SAREE DETAILS */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">Fabric & Saree Details</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="fabricType">Fabric Type</Label>
                            <select
                                id="fabricType"
                                name="fabricType"
                                className="w-full h-10 rounded-md border border-stone-200 bg-white px-3 text-sm"
                                defaultValue={product.fabricType}
                            >
                                <option value="">Select Fabric</option>
                                {FABRIC_TYPES.map((fabric) => (
                                    <option key={fabric} value={fabric}>{fabric}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weaveType">Weave Type</Label>
                            <select
                                id="weaveType"
                                name="weaveType"
                                className="w-full h-10 rounded-md border border-stone-200 bg-white px-3 text-sm"
                                defaultValue={product.weaveType}
                            >
                                <option value="">Select Weave</option>
                                {WEAVE_TYPES.map((weave) => (
                                    <option key={weave} value={weave}>{weave}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="borderDescription">Border Description</Label>
                            <Textarea
                                id="borderDescription"
                                name="borderDescription"
                                placeholder="Describe the border design, width, and details..."
                                rows={2}
                                defaultValue={product.borderDescription}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="palluDescription">Pallu Description</Label>
                            <Textarea
                                id="palluDescription"
                                name="palluDescription"
                                placeholder="Describe the pallu design and details..."
                                rows={2}
                                defaultValue={product.palluDescription}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Blouse Piece Included</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="hasBlousePiece"
                                        value="true"
                                        checked={hasBlousePiece}
                                        onChange={() => setHasBlousePiece(true)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">Yes</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="hasBlousePiece"
                                        value="false"
                                        checked={!hasBlousePiece}
                                        onChange={() => setHasBlousePiece(false)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm">No</span>
                                </label>
                            </div>
                        </div>

                        {hasBlousePiece && (
                            <div className="space-y-2">
                                <Label htmlFor="blouseFabric">Blouse Fabric</Label>
                                <Input
                                    id="blouseFabric"
                                    name="blouseFabric"
                                    placeholder="e.g., Matching silk"
                                    defaultValue={product.blouseFabric}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="sareeLength">Saree Length</Label>
                            <Input
                                id="sareeLength"
                                name="sareeLength"
                                placeholder="5.5 meters"
                                defaultValue={product.sareeLength || "5.5 meters"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="blouseLength">Blouse Length</Label>
                            <Input
                                id="blouseLength"
                                name="blouseLength"
                                placeholder="0.8 meters"
                                defaultValue={product.blouseLength || "0.8 meters"}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label>Colors (Select all that apply)</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => toggleColor(color)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedColors.includes(color)
                                            ? "bg-primary text-white"
                                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label>Occasions (Select all that apply)</Label>
                            <div className="flex flex-wrap gap-2">
                                {OCCASIONS.map((occasion) => (
                                    <button
                                        key={occasion}
                                        type="button"
                                        onClick={() => toggleOccasion(occasion)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedOccasions.includes(occasion)
                                            ? "bg-primary text-white"
                                            : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                            }`}
                                    >
                                        {occasion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="careInstructions">Care Instructions</Label>
                            <Textarea
                                id="careInstructions"
                                name="careInstructions"
                                placeholder="e.g., Dry clean only. Do not wring. Iron on low heat."
                                rows={3}
                                defaultValue={product.careInstructions}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 4: IMAGES */}
                <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-4">
                    <h2 className="text-xl font-semibold text-stone-800 border-b pb-2">Product Images</h2>
                    <ImageUploader
                        images={productImages}
                        onChange={setProductImages}
                        minImages={3}
                        maxImages={8}
                    />
                </div>

                {/* SAVE OPTIONS */}
                <div className="sticky bottom-0 bg-white p-6 rounded-lg border-2 border-stone-300 shadow-lg">
                    <div className="flex flex-wrap gap-4">
                        <Button
                            type="button"
                            onClick={() => handleSubmit("DRAFT")}
                            variant="outline"
                            className="flex-1 md:flex-none min-w-[160px] border-stone-300 hover:bg-stone-50"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save as Draft
                        </Button>
                        <Button
                            type="button"
                            onClick={() => handleSubmit("PUBLISH")}
                            className="flex-1 md:flex-none min-w-[160px] bg-primary hover:bg-primary/90"
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                            Publish
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 md:flex-none min-w-[160px]"
                            onClick={() => router.back()}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
