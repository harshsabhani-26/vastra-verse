import { AppointmentBanner } from "@/components/home/AppointmentBanner";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { BestSellers } from "@/components/home/BestSellers";
import { getCategories } from "@/app/actions/category";
import { getActiveBanners } from "@/app/admin/banners/actions";

export default async function Home() {
    const [categories, banners] = await Promise.all([
        getCategories(),
        getActiveBanners()
    ]);

    return (
        <div className="flex flex-col min-h-screen">
            <Hero banners={banners} />
            <CategoryGrid categories={categories} />
            <BestSellers />
            <AppointmentBanner />
        </div>
    );
}
