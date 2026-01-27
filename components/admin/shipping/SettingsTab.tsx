'use client'

import { useState, useEffect } from 'react'
import { getShippingSettings, updateShippingSettings, type ShippingSettingsData } from '@/app/admin/shipping/settings/actions'
import { getCourierPartners } from '@/app/admin/shipping/couriers/actions'
import { Save } from 'lucide-react'

export function SettingsTab() {
    const [settings, setSettings] = useState<ShippingSettingsData>({
        freeShippingEnabled: false,
        freeShippingThreshold: 500,
        codEnabled: true,
        codMaxAmount: 10000,
        codExtraCharges: 40,
        giftWrapEnabled: true,
        giftWrapCharge: 50,
        giftWrapMessageMaxLength: 200,
        internationalEnabled: false,
        autoSendTrackingEmail: true,
        defaultCourierId: null,
    })
    const [couriers, setCouriers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [settingsRes, couriersRes] = await Promise.all([
            getShippingSettings(),
            getCourierPartners()
        ])

        if (settingsRes.success && settingsRes.settings) {
            setSettings({
                freeShippingEnabled: settingsRes.settings.freeShippingEnabled,
                freeShippingThreshold: Number(settingsRes.settings.freeShippingThreshold),
                codEnabled: settingsRes.settings.codEnabled,
                codMaxAmount: Number(settingsRes.settings.codMaxAmount),
                codExtraCharges: Number(settingsRes.settings.codExtraCharges),
                giftWrapEnabled: settingsRes.settings.giftWrapEnabled,
                giftWrapCharge: Number(settingsRes.settings.giftWrapCharge),
                giftWrapMessageMaxLength: settingsRes.settings.giftWrapMessageMaxLength,
                internationalEnabled: settingsRes.settings.internationalEnabled,
                autoSendTrackingEmail: settingsRes.settings.autoSendTrackingEmail,
                defaultCourierId: settingsRes.settings.defaultCourierId,
            })
        }

        if (couriersRes.success) {
            setCouriers(couriersRes.partners || [])
        }

        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const result = await updateShippingSettings(settings)
            if (result.success) {
                alert('Settings saved successfully!')
            } else {
                alert(result.error || 'Failed to save settings')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            alert('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading settings...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-stone-800">Shipping Settings</h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {/* Free Shipping */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">Free Shipping</h4>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.freeShippingEnabled}
                            onChange={(e) => setSettings({ ...settings, freeShippingEnabled: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-stone-700">Enable free shipping</span>
                    </label>

                    {settings.freeShippingEnabled && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Minimum Order Value for Free Shipping (₹)
                            </label>
                            <input
                                type="number"
                                value={settings.freeShippingThreshold}
                                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
                                className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                min="0"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* COD Settings */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">Cash on Delivery (COD)</h4>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.codEnabled}
                            onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-stone-700">Enable Cash on Delivery</span>
                    </label>

                    {settings.codEnabled && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Maximum COD Order Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.codMaxAmount}
                                    onChange={(e) => setSettings({ ...settings, codMaxAmount: Number(e.target.value) })}
                                    className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    COD Handling Charges (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.codExtraCharges}
                                    onChange={(e) => setSettings({ ...settings, codExtraCharges: Number(e.target.value) })}
                                    className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    min="0"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Gift Wrap */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">Gift Wrap Service</h4>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.giftWrapEnabled}
                            onChange={(e) => setSettings({ ...settings, giftWrapEnabled: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-stone-700">Enable gift wrap option</span>
                    </label>

                    {settings.giftWrapEnabled && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Gift Wrap Charge (₹)
                                </label>
                                <input
                                    type="number"
                                    value={settings.giftWrapCharge}
                                    onChange={(e) => setSettings({ ...settings, giftWrapCharge: Number(e.target.value) })}
                                    className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Maximum Message Length (characters)
                                </label>
                                <input
                                    type="number"
                                    value={settings.giftWrapMessageMaxLength}
                                    onChange={(e) => setSettings({ ...settings, giftWrapMessageMaxLength: Number(e.target.value) })}
                                    className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    min="50"
                                    max="500"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* International Shipping */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">International Shipping</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.internationalEnabled}
                        onChange={(e) => setSettings({ ...settings, internationalEnabled: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-stone-700">Enable international shipping</span>
                </label>
                {settings.internationalEnabled && (
                    <p className="text-xs text-stone-500 mt-2">
                        Make sure you have at least one courier partner with international shipping capability
                    </p>
                )}
            </div>

            {/* Tracking Preferences */}
            <div className="bg-white p-6 rounded-lg border border-stone-200">
                <h4 className="text-lg font-semibold text-stone-800 mb-4">Tracking Preferences</h4>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.autoSendTrackingEmail}
                            onChange={(e) => setSettings({ ...settings, autoSendTrackingEmail: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-stone-300 rounded focus:ring-emerald-500"
                        />
                        <span className="text-sm text-stone-700">Automatically send tracking emails to customers</span>
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Default Courier Partner
                        </label>
                        <select
                            value={settings.defaultCourierId || ''}
                            onChange={(e) => setSettings({ ...settings, defaultCourierId: e.target.value || null })}
                            className="w-full max-w-xs px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">Select default courier</option>
                            {couriers.filter(c => c.isActive).map((courier) => (
                                <option key={courier.id} value={courier.id}>
                                    {courier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save All Settings'}
                </button>
            </div>
        </div>
    )
}
