'use client'

import { useState } from "react"
import { trackOrder } from "./actions"
import { Search, Package, Calendar, Clock, AlertCircle } from "lucide-react"
import { TrackingTimeline } from "@/components/order/TrackingTimeline"

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState("")

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!orderId.trim()) return

        setLoading(true)
        setError("")
        setResult(null)

        try {
            const data = await trackOrder(orderId)
            if (data.success) {
                setResult(data.order)
            } else {
                setError(data.error as string)
            }
        } catch (err) {
            setError("Failed to track order")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[#FAF9F6] min-h-screen py-12">
            <div className="container mx-auto px-4 md:px-8 max-w-2xl">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-serif text-[#1C1917] mb-4">Track Your Order</h1>
                    <div className="w-24 h-1 bg-[#1a4d3a] mx-auto mb-6"></div>
                    <p className="text-stone-600">Enter your order ID to get real-time status updates.</p>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-xl border border-stone-200 shadow-sm">
                    <form onSubmit={handleTrack} className="flex gap-3 mb-8">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="Enter Order ID (e.g., ord_123...)"
                                className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4d3a] focus:border-transparent"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 h-5 w-5" />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#1a4d3a] text-white px-6 py-3 rounded-lg hover:bg-[#153e2e] transition-colors disabled:opacity-70 font-medium tracking-wide whitespace-nowrap"
                        >
                            {loading ? "Tracking..." : "Track Order"}
                        </button>
                    </form>

                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-lg mb-6">
                            <AlertCircle size={20} />
                            <p>{error}</p>
                        </div>
                    )}

                    {result && (
                        <div className="border border-stone-200 rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-stone-50 p-4 border-b border-stone-200 flex justify-between items-center">
                                <span className="font-serif font-medium text-lg">Order Details</span>
                                <span className="text-sm text-stone-500">ID: {result.id}</span>
                            </div>
                            <div className="p-6 space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#1a4d3a]">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">Status</p>
                                            <p className="font-medium text-lg capitalize text-[#1a4d3a]">{result.status.toLowerCase()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-stone-500 uppercase tracking-wider">Order Date</p>
                                            <p className="font-medium text-stone-800">{result.date}</p>
                                        </div>
                                    </div>
                                </div>

                                {result.timeline && result.timeline.length > 0 ? (
                                    <div className="border-t border-stone-100 pt-8">
                                        <h3 className="font-serif font-medium text-lg mb-6 text-[#1C1917]">Detailed Status</h3>
                                        <TrackingTimeline events={result.timeline} />
                                    </div>
                                ) : (
                                    <div className="mt-6 pt-6 border-t border-stone-100">
                                        <div className="flex gap-3 text-sm text-stone-600 bg-stone-50 p-3 rounded">
                                            <Clock size={16} className="mt-0.5 shrink-0" />
                                            <p>Standard delivery typically takes 5-7 business days from the dispatch date.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
