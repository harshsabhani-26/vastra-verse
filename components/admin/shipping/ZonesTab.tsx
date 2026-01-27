'use client'

import { useState, useEffect } from 'react'
import { getShippingZones, deleteShippingZone, toggleShippingZone } from '@/app/admin/shipping/zones/actions'
import { Plus, Edit, Trash2, MapPin, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function ZonesTab() {
    const [zones, setZones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        loadZones()
    }, [])

    const loadZones = async () => {
        setLoading(true)
        const result = await getShippingZones()
        if (result.success) {
            setZones(result.zones || [])
        }
        setLoading(false)
    }

    const handleToggle = async (id: string) => {
        const result = await toggleShippingZone(id)
        if (result.success) {
            loadZones()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this shipping zone?')) return
        const result = await deleteShippingZone(id)
        if (result.success) {
            loadZones()
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading zones...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-stone-800">Shipping Zones</h3>
                <Link
                    href="/admin/shipping/zones/new"
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Zone
                </Link>
            </div>

            {zones.length === 0 ? (
                <div className="bg-white p-12 rounded-lg border border-stone-200 text-center">
                    <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-800 mb-2">No Shipping Zones</h3>
                    <p className="text-stone-600 mb-4">Create your first shipping zone to start managing deliveries</p>
                    <Link
                        href="/admin/shipping/zones/new"
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus size={20} />
                        Add Zone
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {zones.map((zone) => (
                        <ZoneCard
                            key={zone.id}
                            zone={zone}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function ZoneCard({ zone, onToggle, onDelete }: any) {
    const pincodes = zone.pincodes as string[]
    const router = useRouter()

    return (
        <div className="bg-white p-6 rounded-lg border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-stone-900">{zone.name}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${zone.type === 'LOCAL' ? 'bg-blue-100 text-blue-700' :
                                zone.type === 'METRO' ? 'bg-purple-100 text-purple-700' :
                                    zone.type === 'INTERNATIONAL' ? 'bg-amber-100 text-amber-700' :
                                        'bg-stone-100 text-stone-700'
                            }`}>
                            {zone.type.replace('_', ' ')}
                        </span>
                        <button
                            onClick={() => onToggle(zone.id)}
                            className={`px-3 py-1 text-xs rounded-full ${zone.isActive
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-stone-100 text-stone-600'
                                }`}
                        >
                            {zone.isActive ? 'Active' : 'Inactive'}
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={`/admin/shipping/zones/${zone.id}`}
                        className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                    >
                        <Edit size={18} />
                    </Link>
                    <button
                        onClick={() => onDelete(zone.id)}
                        className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-stone-400 mt-0.5" />
                    <div>
                        <p className="text-stone-500 mb-1">Pincodes</p>
                        <p className="text-stone-800 font-medium">
                            {pincodes.length} {pincodes.length === 1 ? 'range' : 'ranges'}
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <Clock size={16} className="text-stone-400 mt-0.5" />
                    <div>
                        <p className="text-stone-500 mb-1">Delivery Time</p>
                        <p className="text-stone-800 font-medium">
                            {zone.minDeliveryDays}-{zone.maxDeliveryDays} days
                        </p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <DollarSign size={16} className="text-stone-400 mt-0.5" />
                    <div>
                        <p className="text-stone-500 mb-1">Charges</p>
                        <p className="text-stone-800 font-medium">
                            ₹{Number(zone.baseCharge)} + ₹{Number(zone.perKgCharge)}/kg
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Package({ className, size }: { className?: string, size?: number }) {
    return (
        <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    )
}
