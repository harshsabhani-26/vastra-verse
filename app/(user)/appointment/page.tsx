"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";

export default function AppointmentPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        storeLocation: "Vastraa Verse Surat",
        preferredTime: "Morning (10AM - 1PM)",
        appointmentDate: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        allowPhoneContact: "Yes",
        eventDate: "",
        message: "",
        newsletterSignup: false,
        termsAccepted: false,
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => ({ ...prev, [name]: checked }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.termsAccepted) {
            toast.error("Please accept the terms and conditions");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    customerEmail: formData.customerEmail,
                    customerPhone: formData.customerPhone,
                    storeLocation: formData.storeLocation,
                    appointmentDate: formData.appointmentDate,
                    preferredTime: formData.preferredTime,
                    eventDate: formData.eventDate || null,
                    message: formData.message || null,
                    allowPhoneContact: formData.allowPhoneContact === "Yes",
                    newsletterSignup: formData.newsletterSignup,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(
                    "Appointment request submitted! We'll contact you within 24 hours."
                );
                // Reset form
                setFormData({
                    storeLocation: "Vastraa Verse Surat",
                    preferredTime: "Morning (10AM - 1PM)",
                    appointmentDate: "",
                    customerName: "",
                    customerEmail: "",
                    customerPhone: "",
                    allowPhoneContact: "Yes",
                    eventDate: "",
                    message: "",
                    newsletterSignup: false,
                    termsAccepted: false,
                });
            } else {
                toast.error(data.error || "Failed to submit appointment request");
            }
        } catch (error) {
            console.error("Error submitting appointment:", error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] py-16">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-3xl md:text-4xl font-serif text-primary tracking-wide">
                        Schedule an Appointment
                    </h1>
                    <p className="text-stone-600 leading-relaxed max-w-2xl mx-auto">
                        To schedule a virtual or an in-store appointment for custom
                        designs and orders at one of our flagship stores, please fill
                        out your information and our team will contact you within 24
                        hours.
                    </p>
                </div>

                <div className="bg-white p-8 md:p-12 border border-stone-200 shadow-sm">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-stone-500">
                                Store Location *
                            </label>
                            <select
                                name="storeLocation"
                                value={formData.storeLocation}
                                onChange={handleChange}
                                required
                                className="w-full h-10 px-3 border border-stone-300 bg-white text-sm focus:outline-none focus:border-primary"
                            >
                                <option>Vastraa Verse Surat</option>
                                <option>Virtual Appointment</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Preferred Time *
                                </label>
                                <select
                                    name="preferredTime"
                                    value={formData.preferredTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-3 border border-stone-300 bg-white text-sm focus:outline-none focus:border-primary"
                                >
                                    <option>Morning (10AM - 1PM)</option>
                                    <option>Afternoon (1PM - 4PM)</option>
                                    <option>Evening (4PM - 7PM)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Appointment Date *
                                </label>
                                <Input
                                    type="date"
                                    name="appointmentDate"
                                    value={formData.appointmentDate}
                                    onChange={handleChange}
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                    className="rounded-none border-stone-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-stone-500">
                                Full Name *
                            </label>
                            <Input
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                required
                                className="rounded-none border-stone-300"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Email *
                                </label>
                                <Input
                                    type="email"
                                    name="customerEmail"
                                    value={formData.customerEmail}
                                    onChange={handleChange}
                                    required
                                    className="rounded-none border-stone-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Phone Number *
                                </label>
                                <Input
                                    type="tel"
                                    name="customerPhone"
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                    required
                                    className="rounded-none border-stone-300"
                                    placeholder="+91"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Contact on Phone Number
                                </label>
                                <select
                                    name="allowPhoneContact"
                                    value={formData.allowPhoneContact}
                                    onChange={handleChange}
                                    className="w-full h-10 px-3 border border-stone-300 bg-white text-sm focus:outline-none focus:border-primary"
                                >
                                    <option>Yes</option>
                                    <option>No, Email only</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-stone-500">
                                    Date of Event (Estimated)
                                </label>
                                <Input
                                    type="date"
                                    name="eventDate"
                                    value={formData.eventDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="rounded-none border-stone-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-stone-500">
                                Message to Our Consultants
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full min-h-[100px] p-3 border border-stone-300 text-sm focus:outline-none focus:border-primary resize-y"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-stone-100">
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="newsletterSignup"
                                    name="newsletterSignup"
                                    checked={formData.newsletterSignup}
                                    onChange={handleChange}
                                    className="mt-1"
                                />
                                <label
                                    htmlFor="newsletterSignup"
                                    className="text-sm text-stone-600"
                                >
                                    Sign up for our newsletters and stay up to date on
                                    the latest news, collections and events from Vastraa Verse.
                                </label>
                            </div>
                            <div className="flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="termsAccepted"
                                    name="termsAccepted"
                                    checked={formData.termsAccepted}
                                    onChange={handleChange}
                                    className="mt-1"
                                    required
                                />
                                <label
                                    htmlFor="termsAccepted"
                                    className="text-sm text-stone-600"
                                >
                                    I understand and agree that registration on or use of
                                    the site constitutes agreement to its Privacy Policy
                                    and Terms and Conditions.
                                </label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white hover:bg-primary-dark rounded-none h-12 uppercase tracking-widest disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

