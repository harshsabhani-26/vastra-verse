'use client'

import { useState, useEffect } from 'react'
import { createCourierPartner, updateCourierPartner, type CourierPartnerData } from '@/app/admin/shipping/couriers/actions'
import { X } from 'lucide-react'

interface CourierDialogProps {
    open: boolean
    courier?: any
    onClose: (refresh: boolean) => void
}

export function CourierDialog({ open, courier, onClose }: CourierDialogProps) {
    const [formData, setFormData] = useState<CourierPartnerData>({
        name: '',
        trackingUrlTemplate: '',
        supportsCOD: false,
        supportsInternational: false,
        isActive: true,
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (courier) {
            setFormData({
                name: courier.name,
                trackingUrlTemplate: courier.trackingUrlTemplate || '',
                supportsCOD: courier.supportsCOD,
                supportsInternational: courier.supportsInternational,
                isActive: courier.isActive,
            })
        } else {
            setFormData({
                name: '',
                trackingUrlTemplate: '',
                supportsCOD: false,
                supportsInternational: false,
                isActive: true,
            })
        }
    }, [courier, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const result = courier
                ? await updateCourierPartner(courier.id, formData)
                : await createCourierPartner(formData)

            if (result.success) {
                onClose(true)
            } else {
                alert(result.error)
            }
        } catch (error) {
            console.error('Failed to save courier:', error)
            alert('Failed to save courier partner')
        } finally {
            setSubmitting(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-stone-200">
                    <h3 className="text-xl font-semibold text-stone-900">
                        {courier ? 'Edit Courier Partner' : 'Add Courier Partner'}
                    </h3>
                    <button
                        onClick={() => onClose(false)}
                        className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Courier Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="e.g., BlueDart, DHL, FedEx"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Tracking URL Template
                        </label>
                        <input
                            type="text"
                            value={formData.trackingUrlTemplate}
                            onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="https://track.example.com/{TRACKING_NUMBER}"
                        />
                        <p className="text-xs text-stone-500 mt-1">
                            Use {'{TRACKING_NUMBER}'} as placeholder for the tracking number
                        </p>
                    </div>

                    <div className="space-y-3 border-t border-stone-200 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.supportsCOD}
                                onChange={(e) => setFormData({ ...formData, supportsCOD: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-stone-700">Supports Cash on Delivery (COD)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.supportsInternational}
                                onChange={(e) => setFormData({ ...formData, supportsInternational: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-stone-700">Supports International Shipping</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                            />
                            <span className="text-sm text-stone-700">Active</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="flex-1 px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : courier ? 'Update' : 'Add'} Courier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
