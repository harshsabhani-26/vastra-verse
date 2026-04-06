import { AppointmentBanner } from "@/components/home/AppointmentBanner";
import { HeroWrapper } from "@/components/home/HeroWrapper";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BestSellers } from "@/components/home/BestSellers";
import { MidPageBanner } from "@/components/home/MidPageBanner";
import { getCategories } from "@/lib/data/categories";
import { getActiveHeroBanners, getActiveMidPageBanners, getActiveBottomPageBanners, getActiveWebHeroBanners, getActiveMobileHeroBanners } from "@/lib/data/banners";
import { TrendingStories } from "@/components/home/TrendingStories";
import { getActiveStories } from "@/app/admin/stories/actions";
import { SocialWall } from "@/components/home/SocialWall";
import { getActiveSocialImages, getActiveSocialVideos } from "@/app/admin/socials/actions";
import { SeoTextBlock } from "@/components/home/SeoTextBlock";
import prisma from "@/lib/prisma";

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

    return (
        <div className="flex flex-col min-h-screen">
            <HeroWrapper banners={heroBanners} webBanners={webHeroBanners} mobileBanners={mobileHeroBanners} heroBg={storeSettings?.heroBg} />
            <CategoryGrid categories={categories} />
            <NewArrivals />
            <MidPageBanner banners={midPageBanners} />
            <BestSellers />
            <TrendingStories stories={activeStories} />
            <SocialWall images={socialImages} videos={socialVideos} />
            <SeoTextBlock />
            <MidPageBanner banners={bottomPageBanners} />
        </div>
    );
}
