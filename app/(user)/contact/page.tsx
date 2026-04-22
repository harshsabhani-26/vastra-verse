import type { Metadata } from "next";
import ContactForm from "./ContactForm";

// FIX 5 — Canonical + meta description for Contact page
// This server component wraps the "use client" ContactForm component
// so that Next.js metadata API can add canonical tags to the <head>
export const metadata: Metadata = {
    title: "Contact Us | Vastraa Verse",
    description: "Get in touch with Vastraa Verse. Call or WhatsApp us at +91 81549 49599, Monday to Saturday 9:30 am – 6:00 pm IST, or email harshsabhani18@gmail.com.",
    alternates: {
        canonical: "https://vastraaverse.in/contact",
    },
};

export default function ContactPage() {
    return <ContactForm />;
}
