"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function SeoTextBlock() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <section className="w-full bg-white py-[60px] md:py-[80px]">
            <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
                <div className="relative max-w-[1240px] mx-auto">
                    <div className={cn(
                        "text-[13px] md:text-[14px] font-sans text-[#555] leading-[26px] overflow-hidden transition-all duration-700 ease-in-out px-2",
                        isExpanded ? "max-h-[5000px]" : "max-h-[200px]"
                    )}>
                        <h2 className="text-[18px] md:text-[22px] font-medium text-[#111] mb-[20px]">
                            Buy Luxury Sarees &amp; Kurtis Online in India
                        </h2>
                        <p className="mb-[20px]">
                            At Vastraa Verse, we bring you a refined collection of sarees and kurtis designed for women who appreciate timeless elegance and modern luxury. Our brand is built on the philosophy of blending traditional craftsmanship with contemporary aesthetics, creating pieces that are both sophisticated and unique.
                        </p>
                        <p className="mb-[20px]">
                            Every design reflects attention to detail, premium quality fabrics, and a deep understanding of evolving fashion trends. With a focus on exclusivity and elegance, Vastraa Verse offers styles that help you express your individuality on every occasion—from intimate gatherings to grand celebrations.
                        </p>
                        <p className="mb-[20px]">
                            Our carefully curated range of sarees and kurtis is crafted to deliver comfort, grace, and effortless style, ensuring you always make a lasting impression.
                        </p>

                        <h3 className="text-[16px] md:text-[18px] font-medium text-[#111] mt-[30px] mb-[16px]">
                            ✨ Buy Designer Sarees Online in India
                        </h3>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">1. Embroidered Sarees</h4>
                        <p className="mb-[25px]">
                            Embroidered sarees at Vastraa Verse are a celebration of fine craftsmanship and luxury detailing. Designed with intricate threadwork, zari patterns, sequins, and delicate embellishments, these sarees are perfect for weddings, festive occasions, and special events. Crafted in premium fabrics like organza, georgette, satin, and crepe, each piece reflects elegance in every thread and is available in rich as well as subtle colour palettes.
                        </p>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">2. Handloom Sarees</h4>
                        <p className="mb-[25px]">
                            Our handloom sarees represent the beauty of heritage weaving combined with modern luxury. These sarees are thoughtfully designed using high-quality fabrics such as silk blends, tissue, linen, and tussar, offering both richness and comfort. Perfect for women who appreciate authenticity, handloom sarees from Vastraa Verse bring a timeless charm to your wardrobe.
                        </p>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">3. Printed Sarees</h4>
                        <p className="mb-[25px]">
                            Printed sarees are the perfect blend of simplicity and contemporary style. At Vastraa Verse, we offer a range of beautifully designed printed sarees featuring floral, abstract, and modern patterns. Made from lightweight and breathable fabrics like chiffon, crepe, linen, and organza, these sarees are ideal for everyday elegance as well as casual occasions.
                        </p>

                        <h3 className="text-[16px] md:text-[18px] font-medium text-[#111] mt-[30px] mb-[16px]">
                            👗 Shop Premium Kurtis Online in India
                        </h3>
                        <p className="mb-[20px]">
                            Vastraa Verse presents an exclusive collection of kurtis designed for the modern woman who values both comfort and sophistication. From minimal everyday styles to elegant festive wear, our kurtis are tailored with precision and crafted using premium fabrics.
                        </p>
                        <p className="mb-[25px]">
                            Whether you prefer subtle designs or statement pieces, our kurtis are versatile enough to complement every occasion while maintaining a luxurious appeal.
                        </p>

                        <h2 className="text-[18px] md:text-[22px] font-medium text-[#111] mt-[30px] mb-[20px]">
                            💎 Discover Luxury Ethnic Wear at Vastraa Verse
                        </h2>
                        <p className="mb-[15px]">
                            For women who seek elegance in every detail, Vastraa Verse offers a curated selection of sarees and kurtis that embody grace, quality, and style. Our collections are designed to suit a variety of occasions while maintaining a consistent focus on premium craftsmanship. With a seamless shopping experience, secure transactions, and reliable delivery, we ensure that your journey with Vastraa Verse is as refined as our designs.
                        </p>
                    </div>

                    {!isExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-white to-transparent pointer-events-none" />
                    )}

                    <div className="flex justify-end mt-[20px] pr-4">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[13px] md:text-[14px] font-semibold text-[#111] transition-transform hover:scale-105 active:scale-95"
                        >
                            {isExpanded ? "- Read Less" : "+ Read More"}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

