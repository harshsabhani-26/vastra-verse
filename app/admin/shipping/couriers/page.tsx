import { getCourierPartners } from "./actions";
import CourierList from "@/components/admin/shipping/CourierList";

type CourierPartner = {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    trackingUrlTemplate: string | null;
    supportsCOD: boolean;
    supportsInternational: boolean;
    isActive: boolean;
    displayOrder: number;
};

export default async function CourierPartnersPage() {
    const result = await getCourierPartners();
    const partners: CourierPartner[] = (result.success && result.partners) ? result.partners : [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Courier Partners</h2>
                <p className="text-stone-600 mt-1">
                    Manage your shipping partners and their configurations
                </p>
            </div>

            <CourierList initialPartners={partners} />
        </div>
    );
}
