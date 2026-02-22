"use client";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    BarChart3,
    Wallet,
    Package,
    Users,
    BrainCircuit,
    Tags
} from "lucide-react";
import FinanceReports from "@/components/admin/reports/FinanceReports";
import SalesAnalytics from "@/components/admin/reports/SalesAnalytics";
import ProductAnalytics from "@/components/admin/reports/ProductAnalytics";
import InventoryAnalytics from "@/components/admin/reports/InventoryAnalytics";
import CustomerAnalytics from "@/components/admin/reports/CustomerAnalytics";
import InsightsAnalytics from "@/components/admin/reports/InsightsAnalytics";

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Reports & Analytics</h2>

            <Tabs defaultValue="sales" className="space-y-6">
                <TabsList className="bg-stone-100 p-1.5 rounded-xl inline-flex flex-wrap h-auto gap-1.5 w-full justify-start overflow-x-auto">
                    <TabsTrigger value="sales" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <BarChart3 className="w-6 h-6 mr-2" />
                        Sales
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <Wallet className="w-6 h-6 mr-2" />
                        Finance
                    </TabsTrigger>
                    <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <Tags className="w-6 h-6 mr-2" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <Package className="w-6 h-6 mr-2" />
                        Inventory
                    </TabsTrigger>
                    <TabsTrigger value="customers" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <Users className="w-6 h-6 mr-2" />
                        Customers
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-stone-900 px-6 py-3 text-lg font-medium rounded-lg">
                        <BrainCircuit className="w-6 h-6 mr-2" />
                        AI Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="sales" className="space-y-6 animate-in fade-in-50">
                    <SalesAnalytics />
                </TabsContent>

                <TabsContent value="finance" className="space-y-6 animate-in fade-in-50">
                    <FinanceReports />
                </TabsContent>

                <TabsContent value="products" className="space-y-6 animate-in fade-in-50">
                    <ProductAnalytics />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6 animate-in fade-in-50">
                    <InventoryAnalytics />
                </TabsContent>

                <TabsContent value="customers" className="space-y-6 animate-in fade-in-50">
                    <CustomerAnalytics />
                </TabsContent>

                <TabsContent value="insights" className="space-y-6 animate-in fade-in-50">
                    <InsightsAnalytics />
                </TabsContent>
            </Tabs>
        </div>
    );
}
