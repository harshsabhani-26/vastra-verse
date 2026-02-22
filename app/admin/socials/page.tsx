import { getSocialImages, getSocialVideos } from "./actions";
import { SocialsManager } from "@/components/admin/SocialsManager";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SocialsPage() {
    const [socialImages, socialVideos, products] = await Promise.all([
        getSocialImages(),
        getSocialVideos(),
        prisma.product.findMany({
            select: { id: true, name: true, price: true, finalPrice: true, images: { take: 1, select: { url: true } } },
            orderBy: { createdAt: "desc" }
        }).then(res => res.map(p => ({
            ...p,
            price: p.price ? parseFloat(p.price.toString()) : 0,
            finalPrice: p.finalPrice ? parseFloat(p.finalPrice.toString()) : null
        })))
    ]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Socials</h1>
                    <p className="text-stone-600 mt-1">
                        Manage the Social Wall section shown on the homepage
                    </p>
                </div>
            </div>

            {/* Manager Component */}
            <SocialsManager
                initialImages={socialImages}
                initialVideos={socialVideos}
                products={products}
            />
        </div>
    );
}
