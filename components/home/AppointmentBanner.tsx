import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function AppointmentBanner() {
    return (
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
            {/* Background Image */}
            {/*
              FIX 5: Removed `priority` (this section is below-fold — never competes with LCP).
              Added loading="lazy" so the browser only fetches when this section enters viewport.
              MANUAL ACTION 1: Convert showroom.png (837 KB) to showroom.webp (<100 KB)
              using squoosh.app, then update src to "/images/boutique/showroom.webp"
            */}
            <Image
                src="/images/boutique/showroom.png"
                alt="Luxury Boutique Showroom"
                fill
                className="object-cover"
                sizes="100vw"
                loading="lazy"
            />

            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-2xl mx-auto h-full space-y-8">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white tracking-wide drop-shadow-xl">
                    Schedule an Appointment
                </h2>
                <p className="text-white text-base md:text-lg font-light max-w-lg tracking-wide leading-relaxed drop-shadow-lg">
                    Book a virtual or in-store consultation for bespoke designs
                </p>
                <Link href="/appointment">
                    <Button className="bg-white text-primary hover:bg-surface hover:text-secondary px-10 h-14 text-sm uppercase tracking-[0.25em] font-medium rounded-sm transition-all duration-300 hover:scale-105 shadow-luxury">
                        Book Now
                    </Button>
                </Link>
            </div>
        </section>
    );
}
