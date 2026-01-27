import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/app/actions/category";

export default async function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const categories = await getCategories();

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer categories={categories} />
        </div>
    );
}
