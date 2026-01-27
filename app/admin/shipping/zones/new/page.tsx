'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createShippingZone, type ShippingZoneData, type ShippingZoneType } from '../actions'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewZonePage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<ShippingZoneData>({
        name: '',
        type: 'LOCAL' as ShippingZoneType,
        pincodes: [],
        minDeliveryDays: 2,
        maxDeliveryDays: 5,
        baseCharge: 0,
        perKgCharge: 0,
        isActive: true,
    })
    const [pincodesText, setPincodesText] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            // Parse pincodes from textarea
            const pincodes = pincodesText
                .split(',')
                .map(p => p.trim())
                .filter(p => p.length > 0)

            const result = await createShippingZone({
                ...formData,
                pincodes
            })

            if (result.success) {
                router.push('/admin/shipping')
            } else {
                alert(result.error)
            }
        } catch (error) {
            console.error('Failed to create zone:', error)
            alert('Failed to create shipping zone')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/shipping"
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h2 className="text-3xl font-serif text-[#1C1917]">Add Shipping Zone</h2>
                    <p className="text-stone-600 mt-1">Configure a new shipping zone with delivery rules and pricing</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-stone-200 max-w-3xl">
                <div className="space-y-6">
                    {/* Zone Name */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Zone Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., Mumbai Local, Delhi NCR"
                        />
                    </div>

                    {/* Zone Type */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Zone Type *
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as ShippingZoneType })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="LOCAL">Local</option>
                            <option value="METRO">Metro</option>
                            <option value="REST_OF_INDIA">Rest of India</option>
                            <option value="INTERNATIONAL">International</option>
                        </select>
                    </div>

                    {/* Pincodes */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Pincodes / Pincode Ranges *
                        </label>
                        <textarea
                            required
                            value={pincodesText}
                            onChange={(e) => setPincodesText(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                            rows={4}
                            placeholder="400001-400100, 421001, 110001-110099"
                        />
                        <p className="text-xs text-stone-500 mt-1">
                            Enter pincodes or ranges separated by commas. Format: "400001-400100" for ranges, "421001" for exact match
                        </p>
                    </div>

                    {/* Delivery Time */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Minimum Delivery Days *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.minDeliveryDays}
                                onChange={(e) => setFormData({ ...formData, minDeliveryDays: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Maximum Delivery Days *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.maxDeliveryDays}
                                onChange={(e) => setFormData({ ...formData, maxDeliveryDays: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Base Charge (₹) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.baseCharge}
                                onChange={(e) => setFormData({ ...formData, baseCharge: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Per Kg Charge (₹) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.perKgCharge}
                                onChange={(e) => setFormData({ ...formData, perKgCharge: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-stone-700">Active (zone is available for shipping)</span>
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-stone-200">
                        <Link
                            href="/admin/shipping"
                            className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-center"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Zone'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
