import { AppointmentBanner } from "@/components/home/AppointmentBanner";
import { Newsletter } from "@/components/home/Newsletter";
import { HeroWrapper } from "@/components/home/HeroWrapper";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { NewArrivals } from "@/components/home/NewArrivals";
import { BestSellers } from "@/components/home/BestSellers";
import { MidPageBanner } from "@/components/home/MidPageBanner";
import { getCategories } from "@/app/actions/category";
import { getActiveBanners, getActiveMidPageBanners, getActiveBottomPageBanners } from "@/app/admin/banners/actions";

export default async function Home() {
    const [categories, heroBanners, midPageBanners, bottomPageBanners] = await Promise.all([
        getCategories(),
        getActiveBanners(),
        getActiveMidPageBanners(),
        getActiveBottomPageBanners()
    ]);

    return (
        <div className="flex flex-col min-h-screen">
            <HeroWrapper banners={heroBanners} />
            <CategoryGrid categories={categories} />
            <NewArrivals />
            <MidPageBanner banners={midPageBanners} />
            <BestSellers />
            <MidPageBanner banners={bottomPageBanners} />
            <AppointmentBanner />
            <Newsletter />
        </div>
    );
}
