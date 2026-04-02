"use client";

import { useState, useEffect, useTransition } from "react";
import { useCartStore, useHeaderStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { toggleWishlist as toggleWishlistAction } from "@/app/actions/account";
import { toast } from "react-hot-toast";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

// Color mapping
const COLOR_MAP: Record<string, string> = {
    Beige: "bg-[#F5F5DC]",
    Black: "bg-black",
    Blue: "bg-blue-600",
    Brown: "bg-[#8B4513]",
    Green: "bg-green-600",
    Orange: "bg-orange-500",
    Pink: "bg-pink-400",
    Red: "bg-red-600",
    White: "bg-white border border-stone-200",
    Yellow: "bg-yellow-400",
    Maroon: "bg-[#800000]",
    Gold: "bg-[#FFD700]",
    Cream: "bg-[#FFFDD0]",
    Navy: "bg-[#000080]",
    Silver: "bg-[#C0C0C0]",
    Purple: "bg-purple-600",
};

interface ProductDetailsProps {
    product: any;
    initialIsWishlisted?: boolean;
}

const TABS = [
    { id: "details", label: "More About The Product" },
    { id: "shipping", label: "Shipping And Returns" },
    { id: "care", label: "Care Instructions" },
    { id: "disclaimer", label: "Disclaimer" },
];



function SpecRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
        <div className="spec-row">
            <span className="spec-label">{label}</span>
            <span className="spec-value">{value}</span>
        </div>
    );
}

export function ProductDetails({
    product,
    initialIsWishlisted = false,
}: ProductDetailsProps) {
    const { addItem, openCart, items } = useCartStore();
    const setProductName = useHeaderStore(state => state.setProductName);

    useEffect(() => {
        if (product?.name) {
            setProductName(product.name);
        }
    }, [product?.name, setProductName]);

    const [selectedColor, setSelectedColor] = useState<string>(
        product.colors?.[0] || ""
    );
    const [loading, setLoading] = useState(false);
    const { addItem: addToWishlistStore, removeItem: removeFromWishlistStore, isInWishlist } = useWishlistStore();
    const { status: sessionStatus } = useSession();
    const [, startTransition] = useTransition();
    const [stock, setStock] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState("details");

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const { getRealTimeStock } = await import("@/actions/stock");
                const currentStock = await getRealTimeStock(product.id);
                setStock(currentStock);
            } catch {
                setStock(product.stock);
            }
        };
        fetchStock();
    }, [product.id, product.stock]);

    const cartItem = items.find((item) => item.id === product.id);
    const cartQuantity = cartItem?.quantity || 0;
    const currentStock = stock !== null ? stock : product.stock;
    const availableToAdd = Math.max(0, currentStock - cartQuantity);
    const isOutOfStock = currentStock <= 0;
    const isLimitReached = availableToAdd <= 0;

    const handleAddToCart = () => {
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            toast.error("Please select a color");
            return;
        }
        if (isLimitReached) {
            toast.error(
                `Only ${currentStock} units available (you have ${cartQuantity} in cart)`
            );
            return;
        }
        setLoading(true);
        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.finalPrice || product.price),
            image: product.images?.[0]?.url || "/images/placeholder.jpg",
            quantity: 1,
            color: selectedColor || "Default",
            stock: currentStock,
        })
            .then(() => {
                toast.success("Added to Bag!");
            })
            .catch((err: any) => {
                toast.error(err?.message || "Failed to add to cart");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const isWishlisted = isInWishlist(product.id);

    const handleWishlistToggle = () => {
        if (sessionStatus !== "authenticated") {
            toast.error("Please log in to save items to your wishlist");
            return;
        }

        const nowWishlisted = !isWishlisted;
        // Optimistic update
        if (nowWishlisted) {
            addToWishlistStore(product.id);
            toast.success("Added to wishlist");
        } else {
            removeFromWishlistStore(product.id);
            toast.success("Removed from wishlist");
        }

        startTransition(async () => {
            const result = await toggleWishlistAction(product.id);
            if (result.error) {
                // Revert on error
                if (nowWishlisted) {
                    removeFromWishlistStore(product.id);
                } else {
                    addToWishlistStore(product.id);
                }
                toast.error("Something went wrong. Please try again.");
            }
        });
    };

    const skuDisplay = product.sku || product.id?.slice(0, 8).toUpperCase();

    return (
        <>
            <style>{`
                .pd-wrapper {
                    font-family: 'Inter', sans-serif;
                    color: #1a1a1a;
                }

                /* Ready to ship badge */
                .pd-ready-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 14px;
                    border: 1.5px solid #22c55e;
                    border-radius: 999px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #16a34a;
                    letter-spacing: 0.02em;
                    background: #f0fdf4;
                    margin-bottom: 14px;
                }
                .pd-ready-dot {
                    width: 7px;
                    height: 7px;
                    background: #22c55e;
                    border-radius: 50%;
                    animation: pulse-dot 1.5s infinite;
                }
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.3); }
                }

                /* Product name */
                .pd-title {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1a3c34;
                    line-height: 1.25;
                    margin-bottom: 18px;
                    letter-spacing: -0.01em;
                }

                /* Short description */
                .pd-short-desc {
                    font-size: 13.5px;
                    color: #4b5563;
                    line-height: 1.75;
                    font-style: italic;
                    margin-bottom: 18px;
                    border-left: 3px solid #d1d5db;
                    padding-left: 12px;
                }

                /* Spec table */
                .pd-spec-table {
                    border-top: 1px solid #e5e7eb;
                    padding-top: 14px;
                    margin-bottom: 18px;
                }
                .pd-spec-inline {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                .pd-spec-inline-item {
                    display: flex;
                    gap: 24px;
                    align-items: baseline;
                    padding: 8px 0;
                    border-bottom: 1px solid #f3f4f6;
                }
                .pd-spec-inline-item:last-child {
                    border-bottom: none;
                }
                .pd-spec-inline-label {
                    font-size: 12.5px;
                    color: #6b7280;
                    min-width: 80px;
                    flex-shrink: 0;
                }
                .pd-spec-inline-value {
                    font-size: 13px;
                    font-weight: 600;
                    color: #111827;
                }

                /* Price */
                .pd-price-block {
                    margin-bottom: 20px;
                }
                .pd-price-main {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #111827;
                    letter-spacing: -0.02em;
                }
                .pd-price-sub {
                    font-size: 11px;
                    color: #9ca3af;
                    margin-top: 3px;
                }

                /* Stock badge */
                .pd-stock-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 3px 12px;
                    border-radius: 999px;
                    font-size: 11.5px;
                    font-weight: 600;
                    margin-top: 8px;
                    border: 1px solid;
                }
                .pd-stock-badge.in-stock {
                    background: #f0fdf4;
                    color: #15803d;
                    border-color: #86efac;
                }
                .pd-stock-badge.out-stock {
                    background: #fef2f2;
                    color: #dc2626;
                    border-color: #fca5a5;
                }

                /* Action buttons */
                .pd-actions {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .pd-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.18s;
                    padding: 0 22px;
                    height: 48px;
                    border: none;
                    outline: none;
                }
                .pd-btn-outline {
                    background: #fff;
                    border: 2px solid #1a1a1a;
                    color: #1a1a1a;
                }
                .pd-btn-outline:hover {
                    background: #f3f4f6;
                }
                .pd-btn-primary {
                    background: #7c2d12;
                    color: #fff;
                }
                .pd-btn-primary:hover:not(:disabled) {
                    background: #9a3412;
                }
                .pd-btn-primary:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .pd-btn-dark {
                    background: #111827;
                    color: #fff;
                }
                .pd-btn-dark:hover {
                    background: #1f2937;
                }
                .pd-btn-icon {
                    width: 48px;
                    height: 48px;
                    padding: 0;
                    border-radius: 50%;
                    border: 1.5px solid #d1d5db;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.18s;
                    flex-shrink: 0;
                }
                .pd-btn-icon:hover {
                    border-color: #ef4444;
                    background: #fff0f0;
                }
                .pd-btn-icon.wishlisted {
                    border-color: #ef4444;
                    background: #fff0f0;
                }




                /* Color selector */
                .pd-color-section {
                    margin-bottom: 18px;
                }
                .pd-color-label {
                    font-size: 12.5px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 10px;
                }
                .pd-color-swatches {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .pd-color-swatch {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    cursor: pointer;
                    border: 2px solid transparent;
                    transition: all 0.15s;
                    outline: none;
                }
                .pd-color-swatch.selected {
                    box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1a3c34;
                    transform: scale(1.12);
                }
                .pd-color-swatch:hover:not(.selected) {
                    transform: scale(1.08);
                }

                /* Mobile Bottom Bar Add To Cart */
                .pd-mobile-bottom-bar {
                    display: none;
                }
                
                @media (max-width: 640px) {
                    .pd-mobile-bottom-bar {
                        display: flex;
                        position: fixed;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: #fff;
                        padding: 12px 16px;
                        border-top: 1px solid #e5e7eb;
                        z-index: 40;
                        gap: 12px;
                        align-items: center;
                    }
                    .pd-mobile-bottom-bar .pd-btn {
                        flex: 1;
                        height: 48px;
                    }
                    .pd-actions.desktop-only {
                        display: none;
                    }
                }

                /* Tabs */
                .pd-tabs {
                    border-top: 1px solid #1a1a1a;
                    margin-top: 8px;
                }
                .pd-tab-nav {
                    display: flex;
                    gap: 0;
                    border-bottom: 1px solid #e5e7eb;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .pd-tab-nav::-webkit-scrollbar { display: none; }
                .pd-tab-btn {
                    padding: 14px 16px;
                    font-size: 14.5px;
                    font-weight: 600;
                    color: #6b7280;
                    background: none;
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                    border-bottom: 2px solid transparent;
                    margin-bottom: -1px;
                    transition: all 0.15s;
                }
                .pd-tab-btn.active {
                    color: #1a1a1a;
                    border-bottom-color: #1a1a1a;
                }
                .pd-tab-btn:hover:not(.active) {
                    color: #374151;
                }
                .pd-tab-panel {
                    padding: 24px 0;
                }

                /* Spec grid inside tabs */
                .spec-wrapper {
                    padding-top: 5px;
                }
                .spec-title {
                    font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
                    font-size: 24px;
                    color: #042f2e;
                    margin-bottom: 16px;
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .spec-divider {
                    border: 0;
                    border-top: 1px solid #e5e7eb;
                    margin-bottom: 24px;
                }
                /* New 3-column card-style spec grid */
                .spec-card-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    border-top: 1px solid #e5e7eb;
                    border-left: 1px solid #e5e7eb;
                }
                .spec-card-cell {
                    padding: 16px 20px;
                    border-right: 1px solid #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .spec-card-label {
                    font-size: 12px;
                    color: #9ca3af;
                    font-weight: 400;
                    margin-bottom: 6px;
                    text-transform: capitalize;
                    letter-spacing: 0.01em;
                }
                .spec-card-value {
                    font-size: 14px;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.4;
                }
                @media (max-width: 640px) {
                    .spec-card-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                /* Shipping tab */
                .pd-shipping-content p {
                    font-size: 13.5px;
                    line-height: 1.75;
                    color: #374151;
                    margin-bottom: 10px;
                }
                .pd-shipping-content strong {
                    font-weight: 700;
                    color: #111827;
                }

                @media (max-width: 640px) {
                    .spec-grid {
                        grid-template-columns: auto 1fr;
                        column-gap: 16px;
                    }
                    .pd-title {
                        font-size: 1.3rem;
                    }
                    .pd-price-main {
                        font-size: 1.6rem;
                    }
                }
            `}</style>

            <div className="pd-wrapper">
                {/* Ready to Ship badge */}
                {currentStock > 0 && (
                    <div className="pd-ready-badge">
                        <span className="pd-ready-dot" />
                        Ready to Ship
                    </div>
                )}

                {/* Product Title */}
                <h1 className="pd-title">{product.name}</h1>

                {/* Short Description */}
                {product.shortDescription && (
                    <p className="pd-short-desc">{product.shortDescription}</p>
                )}

                {/* Spec inline table + Colour */}
                <div className="pd-spec-table">
                    <div className="pd-spec-inline">
                        {skuDisplay && (
                            <div className="pd-spec-inline-item">
                                <span className="pd-spec-inline-label">Style No</span>
                                <span className="pd-spec-inline-value">{skuDisplay}</span>
                            </div>
                        )}
                        {product.category?.name && (
                            <div className="pd-spec-inline-item">
                                <span className="pd-spec-inline-label">Category</span>
                                <span className="pd-spec-inline-value">{product.category.name}</span>
                            </div>
                        )}
                        {product.colors && product.colors.length > 0 && (
                            <div className="pd-spec-inline-item" style={{ borderBottom: "none" }}>
                                <span className="pd-spec-inline-label">Colour</span>
                                <span className="pd-spec-inline-value">{selectedColor}</span>
                            </div>
                        )}
                    </div>

                    {/* Swatches sit snugly below the Colour row */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="pd-color-swatches" style={{ paddingTop: 10, paddingBottom: 4 }}>
                            {product.colors.map((color: string) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={cn(
                                        "pd-color-swatch",
                                        COLOR_MAP[color] || "bg-stone-300",
                                        selectedColor === color && "selected"
                                    )}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                </div>


                {/* Price */}
                <div className="pd-price-block">
                    <div className="pd-price-main">
                        ₹{Number(product.finalPrice || product.price).toLocaleString("en-IN")}
                    </div>
                    <div className="pd-price-sub">MRP (Inclusive of all taxes)</div>
                    {stock !== null && (
                        <div
                            className={`pd-stock-badge ${currentStock > 0 ? "in-stock" : "out-stock"}`}
                        >
                            {currentStock > 0 ? (
                                <>
                                    <span
                                        style={{
                                            width: 7,
                                            height: 7,
                                            background: "#22c55e",
                                            borderRadius: "50%",
                                            display: "inline-block",
                                        }}
                                    />
                                    In Stock ({currentStock} pcs)
                                </>
                            ) : (
                                "Out of Stock"
                            )}
                        </div>
                    )}
                </div>



                {/* Action Buttons (Desktop) */}
                <div className="pd-actions desktop-only">
                    <button
                        className="pd-btn pd-btn-primary"
                        onClick={handleAddToCart}
                        disabled={loading || isOutOfStock || isLimitReached}
                    >
                        {loading
                            ? "Adding…"
                            : isOutOfStock
                                ? "Out of Stock"
                                : isLimitReached
                                    ? "Limit Reached"
                                    : "Add to Cart"}
                    </button>

                    <button
                        className={cn("pd-btn-icon", isWishlisted && "wishlisted")}
                        onClick={handleWishlistToggle}
                        aria-label="Wishlist"
                    >
                        <Heart
                            size={18}
                            className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}
                        />
                    </button>
                </div>

                {/* Fixed Bottom Action Bar (Mobile) */}
                <div className="pd-mobile-bottom-bar">
                    <button
                        className="pd-btn pd-btn-primary"
                        onClick={handleAddToCart}
                        disabled={loading || isOutOfStock || isLimitReached}
                    >
                        {loading
                            ? "Adding…"
                            : isOutOfStock
                                ? "Out of Stock"
                                : isLimitReached
                                    ? "Limit Reached"
                                    : "Add to Cart"}
                    </button>

                    <button
                        className={cn("pd-btn-icon", isWishlisted && "wishlisted")}
                        onClick={handleWishlistToggle}
                        aria-label="Wishlist"
                    >
                        <Heart
                            size={18}
                            className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-500"}
                        />
                    </button>
                </div>



                {/* Desktop Tabs Section */}
                <div className="pd-tabs hidden md:block mt-8">
                    <nav className="pd-tab-nav">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                className={cn("pd-tab-btn", activeTab === tab.id && "active")}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="pd-tab-panel">
                        {activeTab === "details" && (
                            <div className="spec-wrapper">
                                <div className="spec-card-grid">

                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Color</div>
                                        <div className="spec-card-value">
                                            {product.colors?.length > 0 ? product.colors.join(", ") : "—"}
                                        </div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Occasion</div>
                                        <div className="spec-card-value">
                                            {product.occasions?.length > 0 ? product.occasions.join(", ") : "—"}
                                        </div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Fabric Type</div>
                                        <div className="spec-card-value">
                                            {product.fabricType || "—"}
                                        </div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Weave Type</div>
                                        <div className="spec-card-value">
                                            {product.weaveType || "—"}
                                        </div>
                                    </div>

                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Purity</div>
                                        <div className="spec-card-value">pure</div>
                                    </div>
                                    {product.borderDescription && (
                                        <div className="spec-card-cell">
                                            <div className="spec-card-label">Embellishment</div>
                                            <div className="spec-card-value">{product.borderDescription}</div>
                                        </div>
                                    )}
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Product</div>
                                        <div className="spec-card-value">
                                            {product.hasBlousePiece ? "saree with blouse" : "saree"}
                                        </div>
                                    </div>

                                    {product.blouseLength && (
                                        <div className="spec-card-cell">
                                            <div className="spec-card-label">Blouse Dimension</div>
                                            <div className="spec-card-value">{product.blouseLength}</div>
                                        </div>
                                    )}
                                    {product.sareeLength && (
                                        <div className="spec-card-cell">
                                            <div className="spec-card-label">Saree Dimension</div>
                                            <div className="spec-card-value">{product.sareeLength}</div>
                                        </div>
                                    )}
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Package Contains</div>
                                        <div className="spec-card-value">
                                            {product.hasBlousePiece ? "1 saree with blouse piece" : "1 saree"}
                                        </div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Sold by</div>
                                        <div className="spec-card-value">Vastra Verse</div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Country of Origin</div>
                                        <div className="spec-card-value">India</div>
                                    </div>
                                    <div className="spec-card-cell">
                                        <div className="spec-card-label">Net Quantity</div>
                                        <div className="spec-card-value">1 N</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "shipping" && (
                            <div className="pd-shipping-content">
                                <p>
                                    <strong>India:</strong> 3–5 Business Days After Shipment
                                </p>
                                <p>
                                    <strong>Overseas:</strong> 5–7 Business Days After Shipment
                                </p>
                                <p>
                                    Free shipping on all orders above <strong>₹5,000</strong>{" "}
                                    within India. International shipping is calculated at checkout.
                                </p>
                                <p>
                                    <strong>Return Policy — No Returns / No Exchange</strong>
                                </p>
                                <p>
                                    We do <strong>not accept returns or exchanges</strong> on any orders once placed.
                                    All sales are final.
                                </p>
                                <p>
                                    <strong>Exception:</strong> A return will be accepted <strong>only</strong> in the following cases:
                                </p>
                                <p style={{ paddingLeft: "12px", borderLeft: "3px solid #d1d5db" }}>
                                    • The product received is <strong>defective</strong> (damaged, torn, or has manufacturing defects).<br />
                                    • A <strong>wrong product</strong> was delivered (different item than what was ordered).
                                </p>
                                <p>
                                    In such cases, please raise a return request within <strong>48 hours</strong> of delivery with
                                    unboxing video proof. Items must be unused and in original packaging.
                                </p>
                            </div>
                        )}

                        {activeTab === "care" && (
                            <div className="pd-shipping-content">
                                {product.careInstructions ? (
                                    <p>{product.careInstructions}</p>
                                ) : (
                                    <>
                                        <p>
                                            <strong>Dry Clean Only</strong> — Professional dry
                                            cleaning is recommended for all silk sarees.
                                        </p>
                                        <p>
                                            Store in a cool, dry place. Avoid direct sunlight for
                                            prolonged periods.
                                        </p>
                                        <p>
                                            Do not wring or twist. If wet, allow to air dry in shade.
                                        </p>
                                        <p>
                                            Iron on low heat using a cotton cloth between the iron and
                                            the saree.
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === "disclaimer" && (
                            <div className="pd-shipping-content">
                                <p>
                                    The colors you see on your screen may slightly vary from the
                                    actual product due to different screen calibrations and lighting
                                    conditions.
                                </p>
                                <p>
                                    Handwoven fabrics may have slight irregularities which are a
                                    natural characteristic of hand-crafted textiles and not a defect.
                                </p>
                                <p>
                                    All dimensions mentioned are approximate and may vary slightly
                                    due to the nature of the fabric.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Accordion section instead of tabs */}
                <div className="w-full mt-8 border-t border-gray-200 block md:hidden">
                    {TABS.map((tab) => (
                        <div key={tab.id} className="border-b border-gray-200">
                            <button
                                className="w-full py-4 flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-gray-50 bg-white"
                                onClick={() => setActiveTab(prev => prev === tab.id ? "" : tab.id)}
                            >
                                <span className={cn("text-[15px] sm:text-[16px] font-semibold", activeTab === tab.id ? "text-[#42120F]" : "text-[#1a1a1a]")} style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                                    {tab.label === "Care Instructions" ? "Customer Care" : tab.label}
                                </span>
                                {activeTab === tab.id ? (
                                    <ChevronUp className="w-5 h-5 text-black" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-black" />
                                )}
                            </button>

                            <div className={cn(
                                "overflow-hidden transition-all duration-300 ease-in-out",
                                activeTab === tab.id ? "max-h-[2000px] opacity-100 pb-5" : "max-h-0 opacity-0"
                            )}>
                                {tab.id === "details" && (
                                    <div className="spec-wrapper mt-2">
                                        <div className="spec-card-grid">

                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Color</div>
                                                <div className="spec-card-value">
                                                    {product.colors?.length > 0 ? product.colors.join(", ") : "—"}
                                                </div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Occasion</div>
                                                <div className="spec-card-value">
                                                    {product.occasions?.length > 0 ? product.occasions.join(", ") : "—"}
                                                </div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Fabric Type</div>
                                                <div className="spec-card-value">
                                                    {product.fabricType || "—"}
                                                </div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Weave Type</div>
                                                <div className="spec-card-value">
                                                    {product.weaveType || "—"}
                                                </div>
                                            </div>

                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Purity</div>
                                                <div className="spec-card-value">pure</div>
                                            </div>
                                            {product.borderDescription && (
                                                <div className="spec-card-cell">
                                                    <div className="spec-card-label">Embellishment</div>
                                                    <div className="spec-card-value">{product.borderDescription}</div>
                                                </div>
                                            )}
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Product</div>
                                                <div className="spec-card-value">
                                                    {product.hasBlousePiece ? "saree with blouse" : "saree"}
                                                </div>
                                            </div>

                                            {product.blouseLength && (
                                                <div className="spec-card-cell">
                                                    <div className="spec-card-label">Blouse Dimension</div>
                                                    <div className="spec-card-value">{product.blouseLength}</div>
                                                </div>
                                            )}
                                            {product.sareeLength && (
                                                <div className="spec-card-cell">
                                                    <div className="spec-card-label">Saree Dimension</div>
                                                    <div className="spec-card-value">{product.sareeLength}</div>
                                                </div>
                                            )}
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Package Contains</div>
                                                <div className="spec-card-value">
                                                    {product.hasBlousePiece ? "1 saree with blouse piece" : "1 saree"}
                                                </div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Sold by</div>
                                                <div className="spec-card-value">Vastra Verse</div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Country of Origin</div>
                                                <div className="spec-card-value">India</div>
                                            </div>
                                            <div className="spec-card-cell">
                                                <div className="spec-card-label">Net Quantity</div>
                                                <div className="spec-card-value">1 N</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {tab.id === "shipping" && (
                                    <div className="pd-shipping-content mt-2 text-[14px] leading-relaxed text-gray-700">
                                        <p>
                                            <strong>India:</strong> 3–5 Business Days After Shipment
                                        </p>
                                        <p>
                                            <strong>Overseas:</strong> 5–7 Business Days After Shipment
                                        </p>
                                        <p>
                                            Free shipping on all orders above <strong>₹5,000</strong>{" "}
                                            within India. International shipping is calculated at checkout.
                                        </p>
                                        <p>
                                            <strong>Return Policy — No Returns / No Exchange</strong>
                                        </p>
                                        <p>
                                            We do <strong>not accept returns or exchanges</strong> on any orders once placed.
                                            All sales are final.
                                        </p>
                                        <p>
                                            <strong>Exception:</strong> A return will be accepted <strong>only</strong> in the following cases:
                                        </p>
                                        <p style={{ paddingLeft: "12px", borderLeft: "3px solid #d1d5db" }}>
                                            • The product received is <strong>defective</strong> (damaged, torn, or has manufacturing defects).<br />
                                            • A <strong>wrong product</strong> was delivered (different item than what was ordered).
                                        </p>
                                        <p>
                                            In such cases, please raise a return request within <strong>48 hours</strong> of delivery with
                                            unboxing video proof. Items must be unused and in original packaging.
                                        </p>
                                    </div>
                                )}

                                {tab.id === "care" && (
                                    <div className="pd-shipping-content mt-2 text-[14px] leading-relaxed text-gray-700">
                                        {product.careInstructions ? (
                                            <p>{product.careInstructions}</p>
                                        ) : (
                                            <>
                                                <p>
                                                    <strong>Dry Clean Only</strong> — Professional dry
                                                    cleaning is recommended for all silk sarees.
                                                </p>
                                                <p>
                                                    Store in a cool, dry place. Avoid direct sunlight for
                                                    prolonged periods.
                                                </p>
                                                <p>
                                                    Do not wring or twist. If wet, allow to air dry in shade.
                                                </p>
                                                <p>
                                                    Iron on low heat using a cotton cloth between the iron and
                                                    the saree.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}

                                {tab.id === "disclaimer" && (
                                    <div className="pd-shipping-content mt-2 text-[14px] leading-relaxed text-gray-700">
                                        <p>
                                            The colors you see on your screen may slightly vary from the
                                            actual product due to different screen calibrations and lighting
                                            conditions.
                                        </p>
                                        <p>
                                            Handwoven fabrics may have slight irregularities which are a
                                            natural characteristic of hand-crafted textiles and not a defect.
                                        </p>
                                        <p>
                                            All dimensions mentioned are approximate and may vary slightly
                                            due to the nature of the fabric.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
