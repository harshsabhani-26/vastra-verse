import Link from "next/link";
import { Truck, Clock, Globe, AlertCircle } from "lucide-react";

export default function ShippingPolicyPage() {
    return (
        <div className="bg-background min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-primary mb-4">Orders & Shipment Policy</h1>
                    <div className="w-24 h-1 bg-primary mx-auto"></div>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-12">

                    {/* Dispatch Section */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Clock size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">Dispatch Time</h2>
                            <p className="text-stone-600 leading-relaxed">
                                We understand your excitement to receive your order! All ready-to-ship items are dispatched within <span className="font-semibold text-stone-800">24-48 hours</span> of placing the order. For made-to-order or customized items, the dispatch timeline may vary between 7-15 days, as specified on the product page.
                            </p>
                        </div>
                    </div>

                    {/* Delivery Section */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Truck size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">Delivery Timelines</h2>
                            <div className="space-y-3 text-stone-600 leading-relaxed">
                                <p>Once dispatched, you can expect your package to arrive within:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li><span className="font-medium text-stone-800">Metro Cities:</span> 2-4 working days</li>
                                    <li><span className="font-medium text-stone-800">Rest of India:</span> 5-7 working days</li>
                                    <li><span className="font-medium text-stone-800">Remote Areas:</span> 7-10 working days</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* International Section */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Globe size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">International Shipping</h2>
                            <p className="text-stone-600 leading-relaxed mb-4">
                                Yes, we ship globally! International shipping rates are calculated at checkout based on the weight of the package and the destination country. Delivery typically takes 10-15 working days.
                            </p>
                            <div className="bg-stone-50 p-4 rounded-lg flex gap-3 text-sm text-stone-700">
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                                <p>Please note: International orders may be subject to customs duties and taxes, which are levied once the shipment reaches your country. These charges are the responsibility of the customer.</p>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Section */}
                    <div className="pt-8 border-t border-stone-100 text-center">
                        <h3 className="text-lg font-serif text-primary mb-2">Track Your Order</h3>
                        <p className="text-stone-600 mb-6">Already placed an order? You can track its status using your order ID.</p>
                        <Link href="/track-order">
                            <button className="px-8 py-3 bg-primary text-white hover:bg-[#153e2e] transition-colors uppercase tracking-widest text-sm font-medium rounded-sm">
                                Track Shipment
                            </button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
