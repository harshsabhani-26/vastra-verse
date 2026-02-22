import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/data/categories";
import prisma from "@/lib/prisma";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const categories = await getCategories();
    const settings = await prisma.storeSettings.findFirst();
    const mainCategories = await prisma.mainCategory.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
    });

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
        </div>
    );
}
