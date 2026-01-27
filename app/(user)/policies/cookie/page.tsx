import { Cookie, Eye, Settings, BarChart, AlertCircle } from "lucide-react";

export default function CookiePolicyPage() {
    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-4">Cookie Policy</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto mb-4"></div>
                    <p className="text-stone-600">Last Updated: {new Date().toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-xl border border-stone-200 shadow-sm space-y-10">

                    {/* Introduction */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-[#1a4d3a]">
                                <Cookie size={20} strokeWidth={1.5} />
                            </div>
                            <h2 className="text-2xl font-serif text-[#1C1917]">What Are Cookies?</h2>
                        </div>
                        <p className="text-stone-600 leading-relaxed">
                            Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you visit our website. They help us provide you with a better browsing experience by remembering your preferences, analyzing how you use our site, and improving our services.
                        </p>
                    </div>

                    {/* Why We Use Cookies */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Why We Use Cookies</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>We use cookies for various purposes:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>To remember your login status and preferences</li>
                                <li>To keep items in your shopping cart</li>
                                <li>To analyze website traffic and user behavior</li>
                                <li>To personalize your shopping experience</li>
                                <li>To improve website functionality and performance</li>
                                <li>To display relevant advertisements</li>
                                <li>To ensure website security</li>
                            </ul>
                        </div>
                    </div>

                    {/* Types of Cookies */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Types of Cookies We Use</h2>

                        <div className="space-y-6">
                            {/* Essential Cookies */}
                            <div className="border-l-4 border-[#1a4d3a] pl-4">
                                <h3 className="font-semibold text-stone-800 mb-2">1. Essential Cookies (Required)</h3>
                                <p className="text-stone-600 leading-relaxed mb-2">
                                    These cookies are necessary for the website to function properly. They enable core functionality such as:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-stone-600">
                                    <li>User authentication and security</li>
                                    <li>Shopping cart functionality</li>
                                    <li>Session management</li>
                                    <li>Payment processing</li>
                                </ul>
                                <p className="text-sm text-stone-500 mt-2 italic">
                                    These cookies cannot be disabled as they are essential for website operation.
                                </p>
                            </div>

                            {/* Functional Cookies */}
                            <div className="border-l-4 border-emerald-600 pl-4">
                                <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                                    <Settings size={18} />
                                    2. Functional Cookies
                                </h3>
                                <p className="text-stone-600 leading-relaxed mb-2">
                                    These cookies enhance functionality and personalization:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-stone-600">
                                    <li>Remember your language preferences</li>
                                    <li>Store your viewing preferences (grid/list view)</li>
                                    <li>Remember your recently viewed products</li>
                                    <li>Save your location for shipping estimates</li>
                                </ul>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="border-l-4 border-blue-600 pl-4">
                                <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                                    <BarChart size={18} />
                                    3. Analytics Cookies
                                </h3>
                                <p className="text-stone-600 leading-relaxed mb-2">
                                    We use analytics cookies to understand how visitors use our website:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-stone-600">
                                    <li>Google Analytics: Track page views, visitor counts, and user behavior</li>
                                    <li>Measure website performance and loading times</li>
                                    <li>Identify popular products and pages</li>
                                    <li>Understand traffic sources and user demographics</li>
                                </ul>
                            </div>

                            {/* Marketing Cookies */}
                            <div className="border-l-4 border-purple-600 pl-4">
                                <h3 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                                    <Eye size={18} />
                                    4. Marketing/Advertising Cookies
                                </h3>
                                <p className="text-stone-600 leading-relaxed mb-2">
                                    These cookies help us deliver relevant advertisements:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-stone-600">
                                    <li>Track your browsing behavior for personalized ads</li>
                                    <li>Display products you've viewed</li>
                                    <li>Measure the effectiveness of our advertising campaigns</li>
                                    <li>Prevent showing the same ad repeatedly</li>
                                </ul>
                                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-3 flex gap-2 text-sm">
                                    <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                                    <p className="text-stone-700">
                                        These cookies may track you across different websites. You can opt-out at any time through your browser settings.
                                    </p>
                                </div>
                            </div>

                            {/* Third-Party Cookies */}
                            <div className="border-l-4 border-stone-600 pl-4">
                                <h3 className="font-semibold text-stone-800 mb-2">5. Third-Party Cookies</h3>
                                <p className="text-stone-600 leading-relaxed mb-2">
                                    Some cookies are placed by third-party services:
                                </p>
                                <ul className="list-disc list-inside space-y-1 ml-4 text-stone-600">
                                    <li><span className="font-medium">Google:</span> Analytics, Ads, and Maps integration</li>
                                    <li><span className="font-medium">Payment Gateways:</span> Razorpay, PayU for secure payments</li>
                                    <li><span className="font-medium">Social Media:</span> Facebook, Instagram pixels for retargeting</li>
                                    <li><span className="font-medium">WhatsApp:</span> For customer support integration</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Cookie Duration */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Cookie Duration</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p><span className="font-semibold text-stone-800">Session Cookies:</span> Temporary cookies that are deleted when you close your browser.</p>
                            <p><span className="font-semibold text-stone-800">Persistent Cookies:</span> Remain on your device for a set period (from a few days to several years) or until you manually delete them.</p>
                        </div>
                    </div>

                    {/* Managing Cookies */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">How to Manage Cookies</h2>
                        <div className="space-y-4 text-stone-600 leading-relaxed">
                            <p>You have the right to accept or reject cookies. Here's how you can manage them:</p>

                            <div>
                                <h3 className="font-semibold text-stone-800 mb-2">Browser Settings</h3>
                                <p className="mb-2">Most browsers allow you to:</p>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li>View what cookies are stored and delete them individually</li>
                                    <li>Block third-party cookies</li>
                                    <li>Block all cookies from specific websites</li>
                                    <li>Block all cookies entirely</li>
                                    <li>Delete all cookies when you close your browser</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-semibold text-stone-800 mb-2">Browser-Specific Instructions</h3>
                                <ul className="list-disc list-inside space-y-1 ml-4">
                                    <li><span className="font-medium">Chrome:</span> Settings → Privacy and Security → Cookies and other site data</li>
                                    <li><span className="font-medium">Firefox:</span> Options → Privacy & Security → Cookies and Site Data</li>
                                    <li><span className="font-medium">Safari:</span> Preferences → Privacy → Manage Website Data</li>
                                    <li><span className="font-medium">Edge:</span> Settings → Cookies and site permissions</li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                                <AlertCircle size={20} className="shrink-0 text-amber-600 mt-0.5" />
                                <div className="text-stone-700">
                                    <p className="font-semibold mb-1">Important Note:</p>
                                    <p className="text-sm">
                                        Blocking or deleting cookies may affect your user experience. Some features of our website may not function properly without cookies, such as keeping items in your cart or staying logged in.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Opt-Out Links */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Opt-Out of Targeted Advertising</h2>
                        <div className="space-y-3 text-stone-600 leading-relaxed">
                            <p>To opt-out of interest-based advertising:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Google Ads: <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-[#1a4d3a] hover:underline">Google Ads Settings</a></li>
                                <li>Facebook: <a href="https://www.facebook.com/ads/preferences" target="_blank" rel="noopener noreferrer" className="text-[#1a4d3a] hover:underline">Facebook Ad Preferences</a></li>
                                <li>Network Advertising Initiative: <a href="http://www.networkadvertising.org/choices/" target="_blank" rel="noopener noreferrer" className="text-[#1a4d3a] hover:underline">NAI Opt-Out</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Do Not Track */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Do Not Track (DNT) Signals</h2>
                        <p className="text-stone-600 leading-relaxed">
                            Some browsers have a "Do Not Track" feature that signals to websites that you do not want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. We do not currently respond to DNT signals, but we respect your privacy choices and you can manage cookies through your browser settings.
                        </p>
                    </div>

                    {/* Updates to Policy */}
                    <div>
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Updates to This Policy</h2>
                        <p className="text-stone-600 leading-relaxed">
                            We may update this Cookie Policy from time to time to reflect changes in technology, legislation, or our business operations. We will notify you of any material changes by updating the "Last Updated" date at the top of this page.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="pt-8 border-t border-stone-100">
                        <h2 className="text-xl font-serif text-[#1C1917] mb-4">Questions About Cookies?</h2>
                        <p className="text-stone-600 leading-relaxed mb-4">
                            If you have any questions about our use of cookies, please contact us:
                        </p>
                        <div className="bg-stone-50 p-6 rounded-lg text-stone-700 space-y-2">
                            <p><span className="font-semibold">Email:</span> privacy@vayanaheritage.com</p>
                            <p><span className="font-semibold">Phone:</span> +91 XXX XXX XXXX</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
