"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { useRouter, useSearchParams } from "next/navigation"

export function PriceFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize state from URL or default
    const initialMin = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 1890
    const initialMax = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 50000

    const [range, setRange] = useState([initialMin, initialMax])

    const handleValueCommit = (value: number[]) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('minPrice', value[0].toString())
        params.set('maxPrice', value[1].toString())
        router.push(`/shop?${params.toString()}`)
    }

    return (
        <div className="w-64 p-2 space-y-6">
            <div className="pt-2">
                <Slider
                    defaultValue={[initialMin, initialMax]}
                    max={50000}
                    min={0}
                    step={100}
                    value={range}
                    onValueChange={setRange}
                    onValueCommit={handleValueCommit}
                />
            </div>
            <div className="flex justify-between text-sm font-medium text-stone-900">
                <span>₹{range[0]}</span>
                <span>₹{range[1]}</span>
            </div>
        </div>
    )
}
