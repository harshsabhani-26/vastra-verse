import Link from "next/link";
import { RefreshCcw, ShieldCheck, Clock, CheckCircle } from "lucide-react";

export default function ReturnsPolicyPage() {
    return (
        <div className="bg-background min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-primary mb-4">Returns & Exchange Policy</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto"></div>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-12">

                    {/* Intro */}
                    <p className="text-stone-600 text-center leading-relaxed text-lg italic">
                        "At Vastraa Verse, we are committed to delivering the exact product you ordered in perfect condition. Returns are accepted only for wrong or defective products."
                    </p>

                    {/* Return Window */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Clock size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">7-Day Return Window</h2>
                            <p className="text-stone-600 leading-relaxed">
                                You can raise a return request within <span className="font-semibold text-stone-800">7 days</span> of receiving your order if you receive a wrong or defective product. Requests raised after this period will not be accepted.
                            </p>
                        </div>
                    </div>

                    {/* Eligibility */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <ShieldCheck size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">Returns Accepted Only For</h2>
                            <ul className="space-y-3 text-stone-600 leading-relaxed ml-2">
                                <li className="flex gap-3">
                                    <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                    <span><strong>Wrong Product Delivered:</strong> If you received a different product than what you ordered.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                    <span><strong>Defective Product:</strong> If the product has manufacturing defects or quality issues.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                                    <span><strong>Damaged in Transit:</strong> If the product was damaged during shipping.</span>
                                </li>
                            </ul>
                            <p className="text-stone-600 leading-relaxed mt-4 text-sm">
                                <strong className="text-stone-800">Please Note:</strong> We do not accept returns for change of mind, size issues, color preferences, or any reason other than those listed above.
                            </p>
                        </div>
                    </div>

                    {/* Process */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <RefreshCcw size={24} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-primary mb-3">Exchange & Refund Process</h2>
                            <div className="space-y-4 text-stone-600 leading-relaxed">
                                <p>
                                    <strong className="text-stone-800 block mb-1">Pick-up Service:</strong> We provide a hassle-free reverse pick-up service for most pincodes.
                                </p>
                                <p>
                                    <strong className="text-stone-800 block mb-1">Refunds:</strong> Once the quality check is finished at our warehouse, the refund will be initiated to your original payment source within 5-7 working days.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact CTA */}
                    <div className="pt-8 border-t border-stone-100 text-center">
                        <h3 className="text-lg font-serif text-primary mb-2">Need to raise a request?</h3>
                        <p className="text-stone-600 mb-6">Contact our support team to initiate a return or exchange.</p>
                        <Link href="/contact">
                            <button className="px-8 py-3 border border-[#1a4d3a] text-[#1a4d3a] hover:bg-[#1a4d3a] hover:text-white transition-colors uppercase tracking-widest text-sm font-medium rounded-sm">
                                Contact Support
                            </button>
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
