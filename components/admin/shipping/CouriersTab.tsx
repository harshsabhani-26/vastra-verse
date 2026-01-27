'use client'

import { useState, useEffect } from 'react'
import { getCourierPartners, deleteCourierPartner, toggleCourierPartner } from '@/app/admin/shipping/couriers/actions'
import { Plus, Edit, Trash2, Package, Globe } from 'lucide-react'
import { CourierDialog } from './CourierDialog'

export function CouriersTab() {
    const [couriers, setCouriers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingCourier, setEditingCourier] = useState<any>(null)

    useEffect(() => {
        loadCouriers()
    }, [])

    const loadCouriers = async () => {
        setLoading(true)
        const result = await getCourierPartners()
        if (result.success) {
            setCouriers(result.partners || [])
        }
        setLoading(false)
    }

    const handleToggle = async (id: string) => {
        const result = await toggleCourierPartner(id)
        if (result.success) {
            loadCouriers()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this courier partner?')) return
        const result = await deleteCourierPartner(id)
        if (result.success) {
            loadCouriers()
        }
    }

    const handleEdit = (courier: any) => {
        setEditingCourier(courier)
        setDialogOpen(true)
    }

    const handleDialogClose = (refresh: boolean) => {
        setDialogOpen(false)
        setEditingCourier(null)
        if (refresh) {
            loadCouriers()
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading couriers...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-stone-800">Courier Partners</h3>
                <button
                    onClick={() => setDialogOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Plus size={20} />
                    Add Courier
                </button>
            </div>

            {couriers.length === 0 ? (
                <div className="bg-white p-12 rounded-lg border border-stone-200 text-center">
                    <TruckIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-stone-800 mb-2">No Courier Partners</h3>
                    <p className="text-stone-600 mb-4">Add your first courier partner to manage deliveries</p>
                    <button
                        onClick={() => setDialogOpen(true)}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus size={20} />
                        Add Courier
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-stone-700">Name</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-stone-700">Capabilities</th>
                                <th className="text-left px-6 py-3 text-sm font-semibold text-stone-700">Status</th>
                                <th className="text-right px-6 py-3 text-sm font-semibold text-stone-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-200">
                            {couriers.map((courier) => (
                                <tr key={courier.id} className="hover:bg-stone-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-stone-900">{courier.name}</div>
                                        {courier.trackingUrlTemplate && (
                                            <div className="text-xs text-stone-500 mt-1 truncate max-w-xs">
                                                {courier.trackingUrlTemplate}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {courier.supportsCOD && (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                    <Package size={12} />
                                                    COD
                                                </span>
                                            )}
                                            {courier.supportsInternational && (
                                                <span className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                                                    <Globe size={12} />
                                                    International
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggle(courier.id)}
                                            className={`px-3 py-1 text-xs rounded-full ${courier.isActive
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-stone-100 text-stone-600'
                                                }`}
                                        >
                                            {courier.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(courier)}
                                                className="p-2 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(courier.id)}
                                                className="p-2 text-stone-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CourierDialog
                open={dialogOpen}
                courier={editingCourier}
                onClose={handleDialogClose}
            />
        </div>
    )
}

function TruckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
    )
}
