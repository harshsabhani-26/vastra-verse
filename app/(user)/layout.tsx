import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/data/categories";
import prisma from "@/lib/prisma";
import { WhatsAppButton, LiveShoppingButton } from "@/components/LazyWidgets";

export const revalidate = 3600; // 1 hour for layout-level global cache

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const categories = await getCategories();
    
    // Fallbacks for build step to avoid crashing when DB is inaccessible
    const settings = await prisma.storeSettings.findFirst().catch(() => null);
    const mainCategories = await prisma.mainCategory.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
    }).catch(() => []);

    return (
        <div className="flex min-h-screen flex-col">
            <Header logo={settings?.logo || null} mainCategories={mainCategories} />
            <main className="flex-1">{children}</main>
            <Footer
                categories={categories}
                footerBg={settings?.footerBg}
                footerLogo={(settings as any)?.footerLogo}
                instagram={(settings as any)?.instagram || null}
                youtube={(settings as any)?.youtube || null}
                facebook={(settings as any)?.facebook || null}
            />
            <LiveShoppingButton />
            <WhatsAppButton
                phoneNumber="918154949599"
                defaultMessage="Hello! I'm interested in your saree collection."
            />
        </div>
    );
}
