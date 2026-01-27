import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Truck, Settings, BarChart3 } from 'lucide-react'
import { ZonesTab } from '@/components/admin/shipping/ZonesTab'
import { CouriersTab } from '@/components/admin/shipping/CouriersTab'
import { SettingsTab } from '@/components/admin/shipping/SettingsTab'
import { OverviewTab } from '@/components/admin/shipping/OverviewTab'

export default function ShippingPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">Shipping Management</h2>
                    <p className="text-stone-600 mt-1">Manage shipping zones, courier partners, and delivery settings</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border border-stone-200">
                    <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 size={16} />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="zones" className="gap-2">
                        <Package size={16} />
                        Shipping Zones
                    </TabsTrigger>
                    <TabsTrigger value="couriers" className="gap-2">
                        <Truck size={16} />
                        Courier Partners
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="gap-2">
                        <Settings size={16} />
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab />
                </TabsContent>

                <TabsContent value="zones">
                    <ZonesTab />
                </TabsContent>

                <TabsContent value="couriers">
                    <CouriersTab />
                </TabsContent>

                <TabsContent value="settings">
                    <SettingsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
