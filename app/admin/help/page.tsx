"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    HelpCircle,
    Book,
    FileText,
    Mail,
    Phone,
    MessageCircle,
    Search,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface FAQ {
    question: string;
    answer: string;
}

const faqs: FAQ[] = [
    {
        question: "How do I add a new product?",
        answer: "Navigate to Products > Add Product, fill in all required fields including name, description, price, category, and images. You can also add saree-specific details like fabric type, weave, and colors.",
    },
    {
        question: "How do I process an order?",
        answer: "Go to Orders, click on the order you want to process, update the status (Confirmed, Packed, Shipped, Delivered), add tracking information if shipping, and optionally add internal notes.",
    },
    {
        question: "How do I manage stock levels?",
        answer: "Use the Inventory page to view all products, their current stock, and adjust quantities. You can add or remove stock with reasons for tracking purposes.",
    },
    {
        question: "How do I create a coupon?",
        answer: "Go to Coupons & Discounts > New Coupon. Choose the type (percentage, flat amount, or free shipping), set validity dates, usage limits, and any restrictions like minimum order value or applicable categories.",
    },
    {
        question: "How do I view sales reports?",
        answer: "Navigate to Reports & Analytics to see financial reports, GST collection, payment method breakdowns, and export data as CSV for further analysis.",
    },
    {
        question: "How do I handle refunds?",
        answer: "Go to Payments & Refunds > Refunds tab. You can view pending refund requests, approve/reject them, and track the refund status through the workflow.",
    },
    {
        question: "How do I manage customer accounts?",
        answer: "Visit Customers page to view all registered users, their order history, addresses, and add internal notes. You can also mark VIP customers or block accounts if needed.",
    },
    {
        question: "How do I configure shipping zones?",
        answer: "Go to Shipping to set up zones, delivery times, and rates. You can configure different rates for different pincodes and manage courier partners.",
    },
];

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<"getting-started" | "features" | "faq">("getting-started");

    const filteredFAQs = faqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">Help & Support</h2>
                    <p className="text-stone-600 mt-2">
                        Everything you need to manage your store effectively
                    </p>
                </div>
            </div>

            {/* Quick Links Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#1C1917] mb-1">Email Support</h3>
                                <p className="text-sm text-stone-600 mb-2">
                                    Get help via email
                                </p>
                                <a
                                    href="mailto:care@vastraverse.com"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    care@vastraverse.com
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                                <Phone className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#1C1917] mb-1">Phone Support</h3>
                                <p className="text-sm text-stone-600 mb-2">
                                    Call us during business hours
                                </p>
                                <a
                                    href="tel:+919999313366"
                                    className="text-sm text-green-600 hover:underline"
                                >
                                    +91 99993 13366
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[#1C1917] mb-1">WhatsApp</h3>
                                <p className="text-sm text-stone-600 mb-2">
                                    Quick replies on WhatsApp
                                </p>
                                <a
                                    href="https://wa.me/919999313366"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                    Chat Now
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Business Hours */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 text-sm text-stone-600">
                        <span className="font-medium text-[#1C1917]">Business Hours:</span>
                        <span>Monday - Saturday: 10:00 AM - 7:00 PM IST</span>
                        <span className="text-stone-400">|</span>
                        <span>Sunday: Closed</span>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-stone-200">
                <button
                    onClick={() => setActiveTab("getting-started")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "getting-started"
                        ? "border-[#1C1917] text-[#1C1917]"
                        : "border-transparent text-stone-600 hover:text-[#1C1917]"
                        }`}
                >
                    Getting Started
                </button>
                <button
                    onClick={() => setActiveTab("features")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "features"
                        ? "border-[#1C1917] text-[#1C1917]"
                        : "border-transparent text-stone-600 hover:text-[#1C1917]"
                        }`}
                >
                    Features
                </button>
                <button
                    onClick={() => setActiveTab("faq")}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "faq"
                        ? "border-[#1C1917] text-[#1C1917]"
                        : "border-transparent text-stone-600 hover:text-[#1C1917]"
                        }`}
                >
                    FAQs
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "getting-started" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Start Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-[#1C1917] mb-2">1. Dashboard Overview</h3>
                            <p className="text-sm text-stone-600">
                                The dashboard provides a quick overview of your store's performance with key metrics like total revenue, orders, customers, and recent activity.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#1C1917] mb-2">2. Adding Your First Product</h3>
                            <p className="text-sm text-stone-600 mb-2">
                                Navigate to Products → Add Product. Fill in the essential details:
                            </p>
                            <ul className="text-sm text-stone-600 list-disc list-inside space-y-1">
                                <li>Product name and description</li>
                                <li>Price and discount (if applicable)</li>
                                <li>Category selection</li>
                                <li>Upload high-quality images</li>
                                <li>Set stock levels and threshold</li>
                                <li>Add saree-specific details (fabric, weave, colors, etc.)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#1C1917] mb-2">3. Managing Orders</h3>
                            <p className="text-sm text-stone-600">
                                Orders appear automatically when customers complete checkout. Update order status as you fulfill them: Confirmed → Packed → Shipped → Delivered.
                            </p>
                        </div>

                        <div>
                            <h3 className="font-semibold text-[#1C1917] mb-2">4. Configuring Settings</h3>
                            <p className="text-sm text-stone-600">
                                Visit Settings to customize store information, tax settings, email configuration, and system preferences.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === "features" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Book className="w-5 h-5" />
                                Product Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-stone-600 space-y-2">
                                <li>• Create and edit products with detailed information</li>
                                <li>• Upload multiple images with drag-and-drop reordering</li>
                                <li>• Manage categories and collections</li>
                                <li>• Track inventory levels automatically</li>
                                <li>• Set low stock alerts</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Order Processing
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-stone-600 space-y-2">
                                <li>• View all orders with detailed information</li>
                                <li>• Update order status and tracking</li>
                                <li>• Add internal notes for reference</li>
                                <li>• Track order timeline automatically</li>
                                <li>• Handle cancellations and refunds</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Customer Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-stone-600 space-y-2">
                                <li>• View customer profiles and order history</li>
                                <li>• Add internal notes about customers</li>
                                <li>• Mark VIP customers for special treatment</li>
                                <li>• Export customer data for analysis</li>
                                <li>• Send bulk messages to customers</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Reports & Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-stone-600 space-y-2">
                                <li>• Financial reports with GST breakdown</li>
                                <li>• Payment method analysis</li>
                                <li>• COD vs Online payment tracking</li>
                                <li>• Failed payment monitoring</li>
                                <li>• Export reports as CSV</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === "faq" && (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <Input
                            placeholder="Search FAQs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* FAQs */}
                    <Card>
                        <CardContent className="p-0">
                            {filteredFAQs.map((faq, index) => (
                                <div key={index} className="border-b border-stone-200 last:border-0">
                                    <button
                                        onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
                                    >
                                        <span className="font-medium text-[#1C1917]">
                                            {faq.question}
                                        </span>
                                        {openFAQ === index ? (
                                            <ChevronUp className="w-5 h-5 text-stone-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-stone-400" />
                                        )}
                                    </button>
                                    {openFAQ === index && (
                                        <div className="px-6 pb-4 text-sm text-stone-600">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredFAQs.length === 0 && (
                                <div className="px-6 py-8 text-center text-stone-500">
                                    No FAQs found matching your search
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Useful Links */}
            <Card>
                <CardHeader>
                    <CardTitle>Useful Links</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/admin/settings">
                            <Button variant="outline" className="w-full justify-start">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                System Settings
                            </Button>
                        </Link>
                        <Link href="/admin/backup">
                            <Button variant="outline" className="w-full justify-start">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Backup & Restore
                            </Button>
                        </Link>
                        <Link href="/admin/activity-logs">
                            <Button variant="outline" className="w-full justify-start">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Activity Logs
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
