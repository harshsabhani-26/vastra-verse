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
                            Buy Ethnic Wear for Women Online in India
                        </h2>
                        <p className="mb-[20px]">
                            With a wealth of experience creating elegant, luxury, traditional, and Indo-western clothing for men and women, Mysore Saree Udyog stands out by its distinctive and refreshing styles in various categories. Our signature designs and superior quality have garnered international recognition and a worldwide following.
                        </p>
                        <p className="mb-[20px]">
                            Mysore Saree Udyog's range of sarees, lehengas, salwar kameezes, kurtis, gowns, blouses, fabrics, menswear, and accessories is unmatched in its category. Every item we offer is custom-made to match your personal taste and style preferences, ensuring that you shine during the most significant occasions in your life.
                        </p>

                        <a href="#" className="text-[14px] md:text-[15px] font-medium text-[#A25F4B] underline underline-offset-4 decoration-[#A25F4B]/50 hover:decoration-[#A25F4B] transition-colors mb-[20px] inline-block">
                            Buy Designer Sarees Online in India
                        </a>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">1. Embroidered Sarees</h4>
                        <p className="mb-[25px]">
                            Women adore embroidery sarees for their intricate patterns, designs, and attention to detail. Our collection of embroidery sarees includes bridal hand embroidery, crystal work sarees, resham work sarees, faux designer embroidery sarees and much more. Buy embroidery sarees made from organza, georgette, crepe, satin, or tissue in the most beautiful colours, including pink, green, blue, beige, red and so on.
                        </p>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">2. Handloom Sarees</h4>
                        <p className="mb-[25px]">
                            Handloom sarees have been the favourites of women for centuries. MSU offers the widest collection of these sarees and some of them are Kanchipuram sarees, south silk sarees, blended banarasi silk saress, pashmina sarees, pochampally sarees, Mysore crepe sarees, and so on. Buy handloom sarees designed in materials like silk, tissue, linen, satin, tussar, and dupion in a variety of colours, including blue, green, pink, yellow and orange.
                        </p>

                        <h4 className="text-[14px] font-medium text-[#cfa89f] mb-[10px]">3. Printed Sarees</h4>
                        <p className="mb-[25px]">
                            Women across the world cherish the beauty of printed sarees, which blend tradition and modernity, making them the perfect choice for any occasion. The varieties of printed sarees that you can buy from MSU include printed silk sarees, printed crepe sarees, printed georgette sarees, printed chiffon sarees, printed linen sarees, printed organza sarees, and printed tussar sarees. Buy printed sarees in a variety of colours, including beige, brown, grey, red, green, and black.
                        </p>

                        <a href="#" className="text-[14px] md:text-[15px] font-medium text-[#A25F4B] underline underline-offset-4 decoration-[#A25F4B]/50 hover:decoration-[#A25F4B] transition-colors mt-[10px] mb-[20px] inline-block">
                            Buy Designer Lehenga Online in India
                        </a>
                        <p className="mb-[25px]">
                            Mysore Saree Udyog offers the widest collection of lehengas online. We offer you with most elegant bridal lehengas, banarasi lehengas,. MSU has put immense effort into making our every lehenga perfect and making them the most beautiful in it.
                        </p>

                        <h2 className="text-[18px] md:text-[22px] font-medium text-[#111] mt-[30px] mb-[20px]">
                            Shop for Luxury Clothes for Women, Men and Kids from Mysore Saree Udyog
                        </h2>
                        <p className="mb-[15px]">
                            For those who cherish the rich legacy and enduring charm of Indian ethnic wear, our carefully curated collection is the perfect solution. Mysore Saree Udyog boasts an extensive range of garments suitable for any event. Beyond apparel, we also have a wide selection of women's accessories that are expertly matched to your outfit. Our simple and secure shopping experience, duty-free offerings, comprehensive colour guides, and worldwide shipping underscore our commitment to authenticity for every customer.
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

