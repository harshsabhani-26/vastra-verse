import { Building2, MapPin, Mail, Phone, FileText, Store } from "lucide-react";

export default function CorporateInformationPage() {
    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-4">Corporate Information</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto mb-4"></div>
                    <p className="text-stone-600">Legal and Business Details</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-10">

                    {/* Company Information */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Building2 size={24} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-serif text-[#1C1917]">Company Details</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Business Name</h3>
                                    <p className="text-lg text-stone-800">M & H (Vayana Heritage)</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Legal Entity Type</h3>
                                    <p className="text-stone-800">Private Limited Company / Proprietorship / Partnership</p>
                                    <p className="text-sm text-stone-500 mt-1">(Update based on your business structure)</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Year of Establishment</h3>
                                    <p className="text-stone-800">2024</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">GSTIN</h3>
                                    <p className="text-stone-800 font-mono">XX XXXXX XXXXX X X XX</p>
                                    <p className="text-sm text-stone-500 mt-1">(Enter your GST number)</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">PAN Number</h3>
                                    <p className="text-stone-800 font-mono">XXXXX XXXX X</p>
                                    <p className="text-sm text-stone-500 mt-1">(Enter your PAN number)</p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">CIN (if applicable)</h3>
                                    <p className="text-stone-800 font-mono">U74999XXXXXXXXXXXX</p>
                                    <p className="text-sm text-stone-500 mt-1">(Corporate Identification Number)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Registered Address */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <MapPin size={24} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-serif text-[#1C1917]">Registered Office Address</h2>
                        </div>

                        <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                            <p className="text-stone-800 leading-relaxed">
                                M & H (Vayana Heritage)<br />
                                [Building Name/Number]<br />
                                [Street Address]<br />
                                [Locality/Area]<br />
                                [City] - [PIN Code]<br />
                                [State], India
                            </p>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Phone size={24} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-serif text-[#1C1917]">Contact Information</h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-[#1a4d3a] mt-1" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Email</h3>
                                        <a href="mailto:support@vayanaheritage.com" className="text-stone-800 hover:text-[#1a4d3a] transition-colors">
                                            support@vayanaheritage.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-[#1a4d3a] mt-1" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Customer Care</h3>
                                        <a href="tel:+919999999999" className="text-stone-800 hover:text-[#1a4d3a] transition-colors">
                                            +91 XXX XXX XXXX
                                        </a>
                                        <p className="text-sm text-stone-500 mt-1">
                                            Mon-Sat: 10:00 AM - 6:00 PM IST
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-[#1a4d3a] mt-1" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">WhatsApp</h3>
                                        <a href="https://wa.me/919999999999" className="text-stone-800 hover:text-[#1a4d3a] transition-colors">
                                            +91 XXX XXX XXXX
                                        </a>
                                        <p className="text-sm text-stone-500 mt-1">
                                            Quick support via WhatsApp
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Store className="w-5 h-5 text-[#1a4d3a] mt-1" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-1">Showroom/Store</h3>
                                        <p className="text-stone-800">[Store Address if applicable]</p>
                                        <p className="text-sm text-stone-500 mt-1">
                                            Visit by appointment only
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Operations */}
                    <div>
                        <h2 className="text-2xl font-serif text-[#1C1917] mb-6">Business Operations</h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-stone-800 mb-3">Nature of Business</h3>
                                <p className="text-stone-600 leading-relaxed">
                                    Online and offline retail of premium Indian ethnic wear, specializing in handwoven sarees, designer collections, and traditional textiles.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold text-stone-800 mb-3">Service Areas</h3>
                                <p className="text-stone-600 leading-relaxed">
                                    We deliver across India and to select international destinations. See our <a href="/policies/shipping" className="text-[#1a4d3a] hover:underline">Shipping Policy</a> for detailed coverage.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Grievance Officer */}
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
                        <div className="flex items-start gap-3 mb-4">
                            <FileText className="w-6 h-6 text-amber-700 mt-1" />
                            <div>
                                <h2 className="text-xl font-serif text-[#1C1917] mb-1">Grievance Officer</h2>
                                <p className="text-sm text-stone-600">
                                    For any complaints or grievances, please contact our designated officer:
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-amber-200 mt-4">
                            <p className="text-stone-800">
                                <span className="font-semibold">Name:</span> [Grievance Officer Name]<br />
                                <span className="font-semibold">Designation:</span> [Designation]<br />
                                <span className="font-semibold">Email:</span> <a href="mailto:grievance@vayanaheritage.com" className="text-[#1a4d3a] hover:underline">grievance@vayanaheritage.com</a><br />
                                <span className="font-semibold">Phone:</span> +91 XXX XXX XXXX<br />
                                <span className="font-semibold">Response Time:</span> Within 48 hours
                            </p>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h2 className="text-2xl font-serif text-[#1C1917] mb-6">Bank Account Details</h2>
                        <p className="text-sm text-stone-600 mb-4">For direct bank transfers and refunds:</p>

                        <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 space-y-2">
                            <p className="text-stone-800">
                                <span className="font-semibold">Account Name:</span> M & H (Vayana Heritage)
                            </p>
                            <p className="text-stone-800">
                                <span className="font-semibold">Bank Name:</span> [Your Bank Name]
                            </p>
                            <p className="text-stone-800">
                                <span className="font-semibold">Account Number:</span> <span className="font-mono">XXXX XXXX XXXX</span>
                            </p>
                            <p className="text-stone-800">
                                <span className="font-semibold">IFSC Code:</span> <span className="font-mono">XXXX0000XXX</span>
                            </p>
                            <p className="text-stone-800">
                                <span className="font-semibold">Branch:</span> [Branch Name, City]
                            </p>
                        </div>
                    </div>

                    {/* Compliance */}
                    <div>
                        <h2 className="text-2xl font-serif text-[#1C1917] mb-6">Compliance & Certifications</h2>

                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>M & H (Vayana Heritage) is committed to operating in full compliance with all applicable laws and regulations:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>GST Registration & Compliance</li>
                                <li>Consumer Protection Act, 2019</li>
                                <li>Information Technology Act, 2000</li>
                                <li>Indian Contract Act, 1872</li>
                                <li>Payment and Settlement Systems Act, 2007</li>
                            </ul>
                        </div>
                    </div>

                    {/* Social Responsibility */}
                    <div>
                        <h2 className="text-2xl font-serif text-[#1C1917] mb-6">Our Commitment</h2>
                        <p className="text-stone-600 leading-relaxed">
                            At Vayana Heritage, we are committed to preserving traditional Indian handloom and handicraft heritage. We work directly with artisan communities, ensuring fair wages and sustainable practices. Our goal is to bring the finest Indian textiles to you while supporting the livelihoods of skilled craftspeople.
                        </p>
                    </div>

                    {/* Footer Note */}
                    <div className="pt-8 border-t border-stone-200 text-center">
                        <p className="text-sm text-stone-500">
                            For any inquiries regarding our corporate information or business operations,<br />
                            please contact us at <a href="mailto:legal@vayanaheritage.com" className="text-[#1a4d3a] hover:underline">legal@vayanaheritage.com</a>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
