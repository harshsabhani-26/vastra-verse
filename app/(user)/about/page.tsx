import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

// FIX 5 — Canonical + meta description for About page
export const metadata: Metadata = {
    title: "About Us | Vastraa Verse — 20 Years of Indian Saree Excellence",
    description: "Since 2005, Vastraa Verse has crafted premium Indian sarees with 20 years of embroidery expertise, 7 years of Jacquard weaving, and modern position printing techniques.",
    alternates: {
        canonical: "https://vastraaverse.in/about",
    },
};

export default function AboutPage() {
    return (
        <div className="bg-background">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <span className="inline-block py-1 px-3 rounded-full bg-secondary/20 text-secondary text-xs font-bold tracking-[0.2em] uppercase">
                            Since 2005
                        </span>
                        <h1 className="font-serif text-5xl md:text-6xl font-bold text-primary">
                            Our Story
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Two decades of weaving stories, preserving traditions, and creating masterpieces
                        </p>
                    </div>
                </div>
            </section>

            {/* Main Story Content */}
            <section className="py-16">
                <div className="container mx-auto px-4 md:px-8">
                    <div className="max-w-4xl mx-auto space-y-16">
                        {/* The Beginning */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
                                    The Beginning — 2005
                                </h2>
                                <div className="w-20 h-1 bg-secondary"></div>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                In 2005, our journey began with a single vision: to preserve and elevate the timeless art of textile embroidery. What started as a passionate pursuit of availability in embroidery quickly became the foundation of our expertise. Stitch by stitch, pattern by pattern, we immersed ourselves in the intricate world of hand and machine embroidery, mastering techniques passed down through generations while embracing modern innovations.
                            </p>
                        </div>

                        {/* Expertise Timeline */}
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-4 hover:shadow-md transition-shadow">
                                <div className="font-serif text-5xl font-bold text-primary">20</div>
                                <h3 className="font-serif text-xl font-semibold">Years of Embroidery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Mastering traditional hand embroidery techniques including Zari, Zardozi, and thread work. Creating intricate patterns that tell stories and celebrate culture.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-4 hover:shadow-md transition-shadow">
                                <div className="font-serif text-5xl font-bold text-primary">7</div>
                                <h3 className="font-serif text-xl font-semibold">Years of Jacquard</h3>
                                <p className="text-sm text-muted-foreground">
                                    Creating sophisticated woven patterns with depth and texture. Producing luxurious silk sarees with elaborate motifs that are woven into the fabric's essence.
                                </p>
                            </div>
                            <div className="bg-white p-8 rounded-lg shadow-sm border border-stone-200 space-y-4 hover:shadow-md transition-shadow">
                                <div className="font-serif text-5xl font-bold text-secondary">1</div>
                                <h3 className="font-serif text-xl font-semibold">Year of Position Printing</h3>
                                <p className="text-sm text-muted-foreground">
                                    Bringing precision and vibrancy through modern printing techniques. Creating unique placement prints that enhance traditional designs.
                                </p>
                            </div>
                        </div>

                        {/* The Embroidery Era */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
                                    The Embroidery Era
                                </h2>
                                <p className="text-sm text-secondary font-semibold tracking-wider uppercase">2005 - Present</p>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                For <strong>20 years</strong>, embroidery has been the heart and soul of our craft. We've mastered traditional hand embroidery techniques including Zari, Zardozi, and thread work, perfected machine embroidery for intricate patterns and contemporary designs, and collaborated with skilled artisans across India to preserve heritage techniques.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Our embroidery expertise isn't just about decorating fabric—it's about telling stories, celebrating culture, and creating heirlooms that transcend time. We've created thousands of unique embroidered masterpieces for discerning customers who appreciate authentic craftsmanship.
                            </p>
                        </div>

                        {/* The Jacquard Revolution */}
                        <div className="space-y-6 bg-secondary/5 p-8 md:p-12 rounded-lg">
                            <div className="space-y-4">
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
                                    The Jacquard Revolution
                                </h2>
                                <p className="text-sm text-secondary font-semibold tracking-wider uppercase">2018 - Present</p>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                In 2018, we expanded our capabilities into the sophisticated world of Jacquard weaving. For the past <strong>7 years</strong>, we've been creating intricate woven patterns that bring depth, texture, and dimension to our textiles.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Jacquard technology allowed us to weave complex patterns directly into the fabric structure, create luxurious silk sarees with elaborate motifs, combine traditional designs with modern weaving techniques, and produce fabrics that are both beautiful and durable. This addition transformed our offerings, allowing us to create textiles where the design is woven into the very essence of the fabric itself.
                            </p>
                        </div>

                        {/* Innovation Continues */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
                                    Innovation Continues
                                </h2>
                                <p className="text-sm text-secondary font-semibold tracking-wider uppercase">2024 - Present</p>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Most recently, we've embraced the art of <strong>position printing</strong>—a technique that brings precision and vibrancy to our textile designs. Over the past year, we've been exploring how this modern printing method complements our traditional crafts, creating unique placement prints that enhance saree borders and pallus, and offering customization options that were previously impossible.
                            </p>
                        </div>

                        {/* Our Promise */}
                        <div className="bg-primary text-secondary-foreground p-8 md:p-12 rounded-lg space-y-6">
                            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
                                Our Promise
                            </h2>
                            <p className="text-lg leading-relaxed opacity-90 text-white">
                                Every saree that leaves our workshop carries within it:
                            </p>
                            <ul className="space-y-3 text-lg text-white">
                                <li className="flex items-start gap-3">
                                    <span className="text-secondary text-2xl">•</span>
                                    <span>Two decades of refined craftsmanship</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-secondary text-2xl">•</span>
                                    <span>Multiple specialized techniques perfected over years</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-secondary text-2xl">•</span>
                                    <span>The dedication of skilled artisans</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-secondary text-2xl">•</span>
                                    <span>A commitment to preserving heritage while embracing innovation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-secondary text-2xl">•</span>
                                    <span>The promise of quality that only experience can deliver</span>
                                </li>
                            </ul>
                        </div>

                        {/* Looking Forward */}
                        <div className="text-center space-y-8">
                            <div className="space-y-4 max-w-3xl mx-auto">
                                <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">
                                    Looking Forward
                                </h2>
                                <p className="text-lg text-muted-foreground leading-relaxed italic">
                                    "From the first embroidered stitch in 2005 to the latest position-printed design in 2025, our story is one of passion, precision, and perpetual excellence."
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link href="/shop">
                                    <Button size="lg" className="bg-accent text-primary-dark hover:bg-accent-light">
                                        Explore Our Collection
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                                        Get in Touch
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
