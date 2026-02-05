import { Shield, AlertCircle, Eye, Cookie, Lock, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-background min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-primary mb-4">Privacy Policy</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto mb-4"></div>
                    <p className="text-stone-600">Last Updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-10">

                    {/* Introduction */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Shield size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-serif text-primary">Our Commitment to Your Privacy</h2>
                        </div>
                        <p className="text-stone-600 leading-relaxed">
                            At Vastra Verse, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you visit our website or make a purchase from us.
                        </p>
                    </div>

                    {/* Information We Collect */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Information We Collect</h3>
                        <div className="space-y-4 text-stone-600 leading-relaxed">
                            <div>
                                <h4 className="font-semibold text-stone-800 mb-2">Personal Information</h4>
                                <p className="mb-2">When you place an order or create an account, we collect:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Name and contact details (email address, phone number)</li>
                                    <li>Billing and shipping addresses</li>
                                    <li>Payment information (processed securely through payment gateways)</li>
                                    <li>Order history and preferences</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-stone-800 mb-2">Automatically Collected Information</h4>
                                <p className="mb-2">When you visit our website, we automatically collect:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>IP address and browser type</li>
                                    <li>Device information and operating system</li>
                                    <li>Pages visited and time spent on our website</li>
                                    <li>Referring website addresses</li>
                                    <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-semibold text-stone-800 mb-2">Google OAuth Information</h4>
                                <p className="mb-2">If you choose to sign in with Google, we collect:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>Your Google account email address</li>
                                    <li>Profile picture and display name</li>
                                    <li>Public profile information as permitted by Google</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* How We Use Information */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">How We Use Your Information</h3>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>We use the information we collect to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Process and fulfill your orders</li>
                                <li>Send order confirmations, shipping updates, and delivery notifications</li>
                                <li>Provide customer support and respond to your inquiries</li>
                                <li>Personalize your shopping experience</li>
                                <li>Send promotional emails (only if you've opted in)</li>
                                <li>Improve our website, products, and services</li>
                                <li>Detect and prevent fraud or unauthorized activities</li>
                                <li>Comply with legal obligations and enforce our terms</li>
                            </ul>
                        </div>
                    </div>

                    {/* Information Sharing */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">How We Share Your Information</h3>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>We do not sell or rent your personal information to third parties. We may share your information with:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><span className="font-semibold text-stone-800">Service Providers:</span> Payment processors, shipping carriers, and email service providers who help us operate our business</li>
                                <li><span className="font-semibold text-stone-800">Legal Requirements:</span> When required by law or to protect our rights and safety</li>
                                <li><span className="font-semibold text-stone-800">Business Transfers:</span> In the event of a merger, acquisition, or sale of assets</li>
                            </ul>
                        </div>
                    </div>

                    {/* Data Security */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Lock size={20} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-serif text-primary">Data Security</h3>
                        </div>
                        <p className="text-stone-600 leading-relaxed">
                            We implement industry-standard security measures to protect your personal information, including SSL encryption for data transmission, secure payment processing, and restricted access to personal data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </div>

                    {/* Your Rights */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Your Rights and Choices</h3>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>You have the right to:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Access, update, or delete your personal information</li>
                                <li>Opt-out of marketing communications at any time</li>
                                <li>Disable cookies through your browser settings</li>
                                <li>Request a copy of your data</li>
                                <li>Object to processing of your personal data</li>
                                <li>Request data portability</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, please contact us at <a href="mailto:privacy@vastraverse.com" className="text-[#1a4d3a] hover:underline font-medium">privacy@vastraverse.com</a>
                            </p>
                        </div>
                    </div>

                    {/* Cookies */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Cookie size={20} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-serif text-primary">Cookies and Tracking</h3>
                        </div>
                        <p className="text-stone-600 leading-relaxed">
                            We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. For detailed information about our cookie usage, please see our <a href="/policies/cookie" className="text-[#1a4d3a] hover:underline font-medium">Cookie Policy</a>.
                        </p>
                    </div>

                    {/* Third-Party Links */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Third-Party Links</h3>
                        <p className="text-stone-600 leading-relaxed">
                            Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies before providing any personal information.
                        </p>
                    </div>

                    {/* Children's Privacy */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Children's Privacy</h3>
                        <p className="text-stone-600 leading-relaxed">
                            Our services are not directed to children under 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                        </p>
                    </div>

                    {/* Data Retention */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Data Retention</h3>
                        <p className="text-stone-600 leading-relaxed">
                            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. You may request deletion of your account and associated data at any time.
                        </p>
                    </div>

                    {/* International Transfers */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">International Data Transfers</h3>
                        <p className="text-stone-600 leading-relaxed">
                            Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to such transfers.
                        </p>
                    </div>

                    {/* Changes to Policy */}
                    <div>
                        <h3 className="text-xl font-serif text-primary mb-4">Changes to This Policy</h3>
                        <p className="text-stone-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date. We encourage you to review this policy periodically.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="pt-8 border-t border-stone-100">
                        <h3 className="text-xl font-serif text-primary mb-4">Contact Us</h3>
                        <p className="text-stone-600 leading-relaxed mb-4">
                            If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
                        </p>
                        <div className="bg-stone-50 p-6 rounded-lg text-stone-700 space-y-2">
                            <p><span className="font-semibold">Email:</span> privacy@vastraverse.com</p>
                            <p><span className="font-semibold">Phone:</span> +91 XXX XXX XXXX</p>
                            <p><span className="font-semibold">Address:</span> M & H, [Your Business Address], India</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
