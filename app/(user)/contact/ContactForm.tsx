"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { submitContactForm, type ContactFormData } from "@/app/actions/contact";

export default function ContactForm() {
    const [formData, setFormData] = useState<ContactFormData>({
        fullName: "",
        email: "",
        countryCode: "+91",
        phoneNumber: "",
        country: "",
        city: "",
        comment: "",
        newsletter: false,
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const result = await submitContactForm(formData);

        if (result.success) {
            setMessage({ type: "success", text: result.message });
            // Reset form
            setFormData({
                fullName: "",
                email: "",
                countryCode: "+91",
                phoneNumber: "",
                country: "",
                city: "",
                comment: "",
                newsletter: false,
            });
        } else {
            setMessage({ type: "error", text: result.message });
        }

        setLoading(false);
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-stone-200">
                <div className="container mx-auto px-4 py-8 md:py-12 text-center">
                    <h1 className="font-serif text-3xl md:text-5xl text-primary">Contact Us</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 max-w-6xl mx-auto">

                    {/* Left Column: Contact Information */}
                    <div className="space-y-8">
                        <div className="prose prose-stone max-w-none text-primary">
                            <p className="leading-relaxed">
                                If you have any queries related to our products or your order, kindly call or WhatsApp us on:{" "}
                                <span className="font-medium">+91 81549 49599</span> (Monday to Saturday – 9:30 am to 6:00 pm IST),
                                or email us at:{" "}
                                <a href="mailto:harshsabhani18@gmail.com" className="underline hover:text-[#AA8C2C]">harshsabhani18@gmail.com</a>
                            </p>

                            <p className="text-sm text-stone-500 italic mt-4">
                                (Kindly refrain from sending job or internship enquiring emails on this ID as they will not be processed further.
                                If you'd like to be a collaborator and innovator with us, please send in your resume and portfolio here:{" "}
                                <a href="mailto:harshsabhani18@gmail.com" className="not-italic hover:text-[#AA8C2C] underline">harshsabhani18@gmail.com</a>
                                and we will reach out to you.)
                            </p>
                        </div>

                        <div className="prose prose-stone max-w-none text-primary">
                            <p>
                                For any PR or media-related queries, write to us at:{" "}
                                <a href="mailto:harshsabhani18@gmail.com" className="underline hover:text-[#AA8C2C]">harshsabhani18@gmail.com</a>
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold tracking-widest text-primary mb-1">GENERAL QUERIES</p>
                                <p className="text-sm text-stone-600 mb-1">+91 8154949599</p>
                                <a href="mailto:harshsabhani18@gmail.com" className="text-sm text-stone-600 hover:text-primary underline">harshsabhani18@gmail.com</a>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-stone-200 space-y-4 text-sm text-stone-600">
                            <h3 className="font-serif text-lg text-primary">Vastraa Verse Private Limited</h3>
                            <p>
                                <span className="font-semibold block text-primary">CIN:</span> U17116MH1995PTC086449
                            </p>
                            <p>
                                <span className="font-semibold block text-primary">Registered Office Address:</span>
                                20/C Pali Village, Opp. SAISA Club, Off 16th Rd, Bandra (W)
                            </p>
                            <p>
                                <span className="font-semibold block text-primary">Corporate Office Address:</span>
                                Plot No R 847/1/1, TTC Ind. Area, MIDC, Rabale, Navi Mumbai, India – 400701
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Inquiry Form */}
                    <div className="bg-white p-6 md:p-8 border border-stone-200 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="fullName" className="text-xs uppercase tracking-widest text-stone-500">Full Name</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-xs uppercase tracking-widest text-stone-500">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="countryCode" className="text-xs uppercase tracking-widest text-stone-500">Country Code *</label>
                                    <select
                                        id="countryCode"
                                        name="countryCode"
                                        value={formData.countryCode}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent"
                                    >
                                        <option value="+91">+91 (India)</option>
                                        <option value="+1">+1 (USA)</option>
                                        <option value="+44">+44 (UK)</option>
                                        <option value="+971">+971 (UAE)</option>
                                        {/* Add more codes as needed */}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phoneNumber" className="text-xs uppercase tracking-widest text-stone-500">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300"
                                        placeholder="Enter phone number"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="country" className="text-xs uppercase tracking-widest text-stone-500">Country *</label>
                                    <input
                                        type="text"
                                        id="country"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300"
                                        placeholder="Enter country"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="city" className="text-xs uppercase tracking-widest text-stone-500">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300"
                                        placeholder="Enter city"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="comment" className="text-xs uppercase tracking-widest text-stone-500">Comment</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    value={formData.comment}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full border-b border-stone-300 py-2 text-primary focus:outline-none focus:border-[#1C1917] transition-colors bg-transparent placeholder:text-stone-300 resize-none"
                                    placeholder="Write your query here..."
                                />
                            </div>

                            <div className="flex items-start gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="newsletter"
                                    checked={formData.newsletter}
                                    onChange={(e) => setFormData(prev => ({ ...prev, newsletter: e.target.checked }))}
                                    className="mt-1 accent-[#1C1917]"
                                />
                                <label htmlFor="newsletter" className="text-sm text-stone-600">
                                    Sign up for our newsletters and stay up to date on the latest news, collections and events from Vastraa Verse.
                                </label>
                            </div>

                            <div className="space-y-4">
                                <p className="text-xs text-stone-400">
                                    I understand and agree that registration on or use of the site constitutes agreement to its <Link href="/privacy-policy" className="underline hover:text-primary">Privacy Policy</Link> and <Link href="/terms" className="underline hover:text-primary">Terms and Conditions</Link>.
                                </p>
                                <p className="text-xs text-stone-400">
                                    This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
                                </p>
                            </div>

                            {/* Success/Error Message */}
                            {message && (
                                <div
                                    className={`p-4 rounded ${message.type === "success"
                                        ? "bg-green-50 text-green-800 border border-green-200"
                                        : "bg-red-50 text-red-800 border border-red-200"
                                        }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#1C1917] hover:bg-[#333333] text-white rounded-none uppercase tracking-widest h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Submitting..." : "Submit"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
