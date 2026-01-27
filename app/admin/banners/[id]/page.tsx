import { notFound } from "next/navigation";
import { getBanner } from "../actions";
import { BannerForm } from "@/components/admin/BannerForm";

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const banner = await getBanner(id);

    if (!banner) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-serif text-[#1C1917]">Edit Banner</h1>
                <p className="text-stone-600 mt-1">Update hero banner details</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-stone-200 p-8">
                <BannerForm banner={banner} />
            </div>
        </div>
    );
}
