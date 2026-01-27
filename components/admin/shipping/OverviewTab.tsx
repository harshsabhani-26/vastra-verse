'use client'

import { useState, useEffect } from 'react'
import { getShippingZones, toggleShippingZone, deleteShippingZone } from '@/app/admin/shipping/zones/actions'
import { getCourierPartners } from '@/app/admin/shipping/couriers/actions'
import { getShippingSettings } from '@/app/admin/shipping/settings/actions'
import { Package, Truck, DollarSign, Globe } from 'lucide-react'

export function OverviewTab() {
    const [stats, setStats] = useState({
        totalZones: 0,
        activeZones: 0,
        totalCouriers: 0,
        activeCouriers: 0,
        freeShippingThreshold: 0,
        giftWrapCharge: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [zonesRes, couriersRes, settingsRes] = await Promise.all([
                getShippingZones(),
                getCourierPartners(),
                getShippingSettings()
            ])

            if (zonesRes.success && couriersRes.success && settingsRes.success) {
                const zones = zonesRes.zones || []
                const couriers = couriersRes.partners || []
                const settings = settingsRes.settings

                setStats({
                    totalZones: zones.length,
                    activeZones: zones.filter(z => z.isActive).length,
                    totalCouriers: couriers.length,
                    activeCouriers: couriers.filter(c => c.isActive).length,
                    freeShippingThreshold: Number(settings?.freeShippingThreshold || 0),
                    giftWrapCharge: Number(settings?.giftWrapCharge || 0),
                })
            }
        } catch (error) {
            console.error('Failed to load overview data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading...</div>
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={<Package className="text-emerald-600" size={24} />}
                    title="Shipping Zones"
                    value={stats.activeZones}
                    subtitle={`${stats.totalZones} total zones`}
                    color="emerald"
                />
                <StatCard
                    icon={<Truck className="text-blue-600" size={24} />}
                    title="Courier Partners"
                    value={stats.activeCouriers}
                    subtitle={`${stats.totalCouriers} total couriers`}
                    color="blue"
                />
                <StatCard
                    icon={<DollarSign className="text-amber-600" size={24} />}
                    title="Free Shipping"
                    value={`₹${stats.freeShippingThreshold}`}
                    subtitle="Minimum threshold"
                    color="amber"
                />
                <StatCard
                    icon={<Globe className="text-purple-600" size={24} />}
                    title="Gift Wrap"
                    value={`₹${stats.giftWrapCharge}`}
                    subtitle="Gift wrap charge"
                    color="purple"
                />
            </div>

            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h3 className="text-lg font-semibold text-stone-800 mb-4">Quick Guide</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-stone-600">
                    <div>
                        <h4 className="font-medium text-stone-800 mb-2">📦 Shipping Zones</h4>
                        <p>Configure delivery zones with pincode ranges, delivery times, and shipping charges based on location.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-stone-800 mb-2">🚚 Courier Partners</h4>
                        <p>Manage courier integrations with COD and international shipping capabilities.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-stone-800 mb-2">⚙️ Global Settings</h4>
                        <p>Set free shipping thresholds, COD rules, gift wrap options, and tracking preferences.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-stone-800 mb-2">🎁 Gift Wrap</h4>
                        <p>Enable gift wrapping service with custom charges and personalized message support.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ icon, title, value, subtitle, color }: {
    icon: React.ReactNode
    title: string
    value: string | number
    subtitle: string
    color: string
}) {
    return (
        <div className="bg-white p-6 rounded-lg border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${color}-50`}>
                    {icon}
                </div>
            </div>
            <h3 className="text-sm font-medium text-stone-600 mb-1">{title}</h3>
            <p className="text-2xl font-bold text-stone-900 mb-1">{value}</p>
            <p className="text-xs text-stone-500">{subtitle}</p>
        </div>
    )
}
