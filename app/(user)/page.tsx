import { AppointmentBanner } from "@/components/home/AppointmentBanner";
import { HeroWrapper } from "@/components/home/HeroWrapper";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BestSellers } from "@/components/home/BestSellers";
import { getCategories } from "@/lib/data/categories";
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

// Cache this page and revalidate every 5 minutes
export const revalidate = 300;

export default async function Home() {
    const [categories, heroBanners, webHeroBanners, mobileHeroBanners, midPageBanners, bottomPageBanners, activeStories, socialImages, socialVideos, storeSettings] = await Promise.all([
        getCategories().catch(() => []),
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

    return (
        <div className="flex flex-col min-h-screen">
            <HeroWrapper banners={heroBanners} webBanners={webHeroBanners} mobileBanners={mobileHeroBanners} heroBg={storeSettings?.heroBg} />
            <CategoryGrid categories={categories} />
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
            <AppointmentBanner />
        </div>
    );
}
