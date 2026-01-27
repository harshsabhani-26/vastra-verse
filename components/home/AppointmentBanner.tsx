import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppointmentBanner() {
    return (
        <section className="relative h-[400px] md:h-[500px] w-full bg-stone-400">
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-5xl font-serif text-white tracking-widest uppercase">
                    Schedule an Appointment
                </h2>
                <p className="text-white/90 text-lg md:text-xl font-light max-w-2xl tracking-wide">
                    Click below to book a virtual or in-store appointment for custom designs and orders
                </p>
                <Link href="/appointment">
                    <Button className="bg-white text-primary hover:bg-stone-100 text-lg px-8 py-6 rounded-none uppercase tracking-[0.2em] font-medium mt-4">
                        Book Now
                    </Button>
                </Link>
            </div>
        </section>
    );
}
