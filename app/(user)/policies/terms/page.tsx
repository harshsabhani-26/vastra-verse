import { FileText, ShoppingBag, CreditCard, UserCheck, AlertCircle, Package } from "lucide-react";

export default function TermsConditionsPage() {
    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-4">Terms & Conditions</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto mb-4"></div>
                    <p className="text-stone-600">Last Updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-10">

                    {/* Introduction */}
                    <div>
                        <p className="text-stone-600 leading-relaxed">
                            Welcome to M & H (Vayana Heritage). By accessing and using our website, you agree to be bound by these Terms and Conditions. Please read them carefully before making any purchase or using our services. If you do not agree with any part of these terms, please refrain from using our website.
                        </p>
                    </div>

                    {/* General Terms */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">1. General Terms</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You must be at least 18 years old to make a purchase on our website</li>
                                <li>By placing an order, you warrant that you are legally capable of entering into binding contracts</li>
                                <li>We reserve the right to refuse service to anyone for any reason at any time</li>
                                <li>All prices are listed in Indian Rupees (INR) unless otherwise stated</li>
                                <li>We reserve the right to modify these terms at any time without prior notice</li>
                            </ul>
                        </div>
                    </div>

                    {/* Products and Availability */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <ShoppingBag size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif text-[#1C1917]">2. Products and Availability</h2>
                        </div>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>All products are subject to availability. We strive to keep our inventory updated, but items may sell out</li>
                                <li>Product images are for illustrative purposes. Actual colors may vary slightly due to screen settings and lighting</li>
                                <li>Each saree is unique, and minor variations in handwoven or handcrafted products are natural and not defects</li>
                                <li>We reserve the right to limit quantities or discontinue products without notice</li>
                                <li>In case of stock unavailability, we will notify you within 24-48 hours and offer a full refund or alternative product</li>
                            </ul>
                        </div>
                    </div>

                    {/* Ordering and Pricing */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">3. Ordering and Pricing</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>All orders are subject to acceptance and availability</li>
                                <li>Prices may change without notice, but the price at the time of order confirmation will apply</li>
                                <li>We reserve the right to cancel orders if pricing errors occur</li>
                                <li>Order confirmation email does not signify our acceptance of your order</li>
                                <li>GST and other applicable taxes will be charged as per government regulations</li>
                                <li>Shipping charges are calculated based on delivery location and weight</li>
                            </ul>
                        </div>
                    </div>

                    {/* Payment Terms */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <CreditCard size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif text-[#1C1917]">4. Payment Terms</h2>
                        </div>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>We accept payment via credit/debit cards, UPI, net banking, wallets, and Cash on Delivery (COD)</li>
                                <li>COD may have additional charges and is subject to order value limits</li>
                                <li>All payments are processed through secure payment gateways</li>
                                <li>We do not store your card details on our servers</li>
                                <li>Payment must be made in full before order dispatch (except for COD orders)</li>
                                <li>Failed transactions will be refunded to the source account within 5-7 business days</li>
                            </ul>
                        </div>
                    </div>

                    {/* Shipping and Delivery */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Package size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif text-[#1C1917]">5. Shipping and Delivery</h2>
                        </div>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Delivery timelines are estimates and not guaranteed</li>
                                <li>We are not responsible for delays caused by courier partners or unforeseen circumstances</li>
                                <li>Please ensure the shipping address is accurate - we cannot be held responsible for wrong deliveries due to incorrect addresses</li>
                                <li>Risk of loss and title for products pass to you upon delivery to the carrier</li>
                                <li>For complete shipping details, please refer to our <a href="/policies/shipping" className="text-[#1a4d3a] hover:underline font-medium">Shipping Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Returns and Refunds */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">6. Returns and Refunds</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>We accept returns within 7 days of delivery for manufacturing defects or incorrect items</li>
                                <li>Products must be unused, unwashed, and in original condition with all tags attached</li>
                                <li>Customized or made-to-order products are not eligible for return unless defective</li>
                                <li>Return shipping costs are borne by the customer unless the return is due to our error</li>
                                <li>Refunds will be processed within 7-10 business days after receiving the returned item</li>
                                <li>For complete return guidelines, please see our <a href="/policies/returns" className="text-[#1a4d3a] hover:underline font-medium">Return & Refund Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* User Account */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <UserCheck size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-xl font-serif text-[#1C1917]">7. User Account</h2>
                        </div>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                                <li>You are responsible for all activities under your account</li>
                                <li>You must notify us immediately of any unauthorized use of your account</li>
                                <li>We reserve the right to suspend or terminate accounts that violate our terms</li>
                                <li>You may not use another user's account without permission</li>
                            </ul>
                        </div>
                    </div>

                    {/* Intellectual Property */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">8. Intellectual Property Rights</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>All content on this website, including but not limited to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Text, graphics, logos, images, and product descriptions</li>
                                <li>Software, code, and website design</li>
                                <li>Trademarks and brand names</li>
                            </ul>
                            <p className="mt-3">
                                are the property of M & H (Vayana Heritage) and protected by Indian and international copyright laws. Unauthorized use, reproduction, or distribution is strictly prohibited.
                            </p>
                        </div>
                    </div>

                    {/* Limitation of Liability */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">9. Limitation of Liability</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>To the fullest extent permitted by law:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                                <li>Our total liability shall not exceed the amount you paid for the product</li>
                                <li>We do not warrant that our website will be uninterrupted or error-free</li>
                                <li>We are not responsible for damages to your device from using our website</li>
                            </ul>
                        </div>
                    </div>

                    {/* Prohibited Uses */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">10. Prohibited Uses</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>You may not use our website to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Violate any applicable laws or regulations</li>
                                <li>Transmit harmful code, viruses, or malicious software</li>
                                <li>Attempt unauthorized access to our systems</li>
                                <li>Engage in any fraudulent activity</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Collect user data without permission</li>
                            </ul>
                        </div>
                    </div>

                    {/* Governing Law */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">11. Governing Law and Jurisdiction</h2>
                        <p className="text-stone-600 leading-relaxed">
                            These Terms and Conditions are governed by the laws of India. Any disputes arising from these terms or your use of our website shall be subject to the exclusive jurisdiction of the courts in [Your City], India.
                        </p>
                    </div>

                    {/* Modifications */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">12. Modifications to Terms</h2>
                        <p className="text-stone-600 leading-relaxed">
                            We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Your continued use of the website after changes are posted constitutes acceptance of the modified terms.
                        </p>
                    </div>

                    {/* Severability */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">13. Severability</h2>
                        <p className="text-stone-600 leading-relaxed">
                            If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="pt-8 border-t border-stone-100">
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Contact Information</h2>
                        <p className="text-stone-600 leading-relaxed mb-4">
                            For questions about these Terms and Conditions, please contact us:
                        </p>
                        <div className="bg-stone-50 p-6 rounded-lg text-stone-700 space-y-2">
                            <p><span className="font-semibold">Email:</span> support@vayanaheritage.com</p>
                            <p><span className="font-semibold">Phone:</span> +91 XXX XXX XXXX</p>
                            <p><span className="font-semibold">Address:</span> M & H, [Your Business Address], India</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
