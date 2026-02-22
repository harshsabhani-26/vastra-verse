import { BannerForm } from "@/components/admin/BannerForm";

export default function NewBannerPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Add New Banner</h1>
                <p className="text-stone-600 mt-1">Create a new hero banner for your homepage slider</p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-stone-200 p-8">
                <BannerForm />
            </div>
        </div>
    );
}
