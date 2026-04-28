import { HeroWrapper } from "@/components/home/HeroWrapper";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BestSellers } from "@/components/home/BestSellers";
import { getActiveHeroBanners, getActiveMidPageBanners, getActiveBottomPageBanners, getActiveWebHeroBanners, getActiveMobileHeroBanners } from "@/lib/data/banners";
import { TrendingStories } from "@/components/home/TrendingStories";
import { getActiveStories } from "@/app/admin/stories/actions";
import { getActiveSocialImages, getActiveSocialVideos } from "@/app/admin/socials/actions";
import { SeoTextBlock } from "@/components/home/SeoTextBlock";
import prisma from "@/lib/prisma";
import { DynamicMidPageBanner } from "@/components/home/DynamicMidPageBanner";
import { DynamicSocialWall } from "@/components/home/DynamicSocialWall";
import { preload } from "react-dom";
import { getHeroBannerUrl } from "@/lib/cloudinary-client";

// force-dynamic prevents Turbopack SSR chunk caching across routes (fixes module-factory-not-available error)
export const dynamic = 'force-dynamic';

export default async function Home() {
    const [mainCategories, subCategories, heroBanners, webHeroBanners, mobileHeroBanners, midPageBanners, bottomPageBanners, activeStories, socialImages, socialVideos, storeSettings] = await Promise.all([
        prisma.mainCategory.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true, name: true, href: true, mobileImage: true },
        }).catch(() => []),
        prisma.category.findMany({
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
            take: 8,
            select: { id: true, name: true, image: true, slug: true },
        }).catch(() => []),
        getActiveHeroBanners().catch(() => []),
        getActiveWebHeroBanners().catch(() => []),
        getActiveMobileHeroBanners().catch(() => []),
        getActiveMidPageBanners().catch(() => []),
        getActiveBottomPageBanners().catch(() => []),
        getActiveStories().catch(() => []),
        getActiveSocialImages().catch(() => []),
        getActiveSocialVideos().catch(() => []),
        prisma.storeSettings.findFirst().catch(() => null),
    ]);

    // Priority 1 Fix: Preload hero image in document head
    if (heroBanners && heroBanners.length > 0) {
        const firstBanner = heroBanners[0];
        // Only preload if it's an image
        if (firstBanner.mediaType === "IMAGE") {
            const defaultImageUrl = getHeroBannerUrl(firstBanner.imageUrl);
            // @ts-ignore - mediaAsset is populated via actions.ts updated include
            const desktopUrl = firstBanner.mediaAsset?.desktopUrl || defaultImageUrl;
            // @ts-ignore
            const mobileUrl = firstBanner.mediaAsset?.mobileUrl || defaultImageUrl;

            preload(desktopUrl, { as: "image", fetchPriority: "high", media: "(min-width: 769px)" });
            preload(mobileUrl, { as: "image", fetchPriority: "high", media: "(max-width: 768px)" });
        }
    }

    // ── FIX 3: Organization JSON-LD (structured data) ────────────────────────
    // Build sameAs array from whatever social links are configured in storeSettings
    const sameAs: string[] = [];
    if ((storeSettings as any)?.instagram) sameAs.push((storeSettings as any).instagram);
    if ((storeSettings as any)?.facebook) sameAs.push((storeSettings as any).facebook);
    if ((storeSettings as any)?.youtube) sameAs.push((storeSettings as any).youtube);

    // Logo must be an absolute URL
    const logoUrl = storeSettings?.logo
        ? storeSettings.logo.startsWith("http")
            ? storeSettings.logo
            : `https://vastraaverse.in${storeSettings.logo}`
        : "https://vastraaverse.in/favicon.ico";

    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Vastraa Verse",
        url: "https://vastraaverse.in",
        logo: {
            "@type": "ImageObject",
            url: logoUrl,
        },
        description: "Experience the elegance of traditional Indian heritage with our curated collection of premium sarees.",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+91-8154949599",
            contactType: "customer service",
            availableLanguage: ["English", "Hindi"],
        },
        ...(sameAs.length > 0 ? { sameAs } : {}),
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* FIX 3: Organization structured data (JSON-LD) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />

            <HeroWrapper banners={heroBanners} webBanners={webHeroBanners} mobileBanners={mobileHeroBanners} heroBg={storeSettings?.heroBg} />
            <CategoryGrid
                categories={subCategories.map((cat) => ({
                    id: cat.id,
                    name: cat.name,
                    image: cat.image ?? null,
                    href: `/shop/${cat.slug}`,
                }))}
            />
            <NewArrivals />
            {/* FIX 9: MidPageBanner lazily loaded via Client wrapper — below fold */}
            <DynamicMidPageBanner banners={midPageBanners} />
            <BestSellers />
            <TrendingStories stories={activeStories} />
            {/* FIX 10: SocialWall lazily loaded via Client wrapper — bottom of page */}
            <DynamicSocialWall images={socialImages} videos={socialVideos} />
            <SeoTextBlock />
            {/* FIX 9: Bottom MidPageBanner also lazily loaded via Client wrapper */}
            <DynamicMidPageBanner banners={bottomPageBanners} />
        </div>
    );
}
