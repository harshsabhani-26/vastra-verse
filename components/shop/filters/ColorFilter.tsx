"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"
import { Check } from "lucide-react"

const colors = [
    { name: "Beige", class: "bg-[#F5F5DC]" },
    { name: "Black", class: "bg-black" },
    { name: "Blue", class: "bg-blue-600" },
    { name: "Brown", class: "bg-[#8B4513]" },
    { name: "Green", class: "bg-green-600" },
    { name: "Orange", class: "bg-orange-500" },
    { name: "Pink", class: "bg-pink-400" },
    { name: "Red", class: "bg-red-600" },
    { name: "White", class: "bg-white border border-stone-200" },
    { name: "Yellow", class: "bg-yellow-400" },
    { name: "Maroon", class: "bg-[#800000]" },
    { name: "Gold", class: "bg-[#FFD700]" },
]

import { useRouter, useSearchParams } from "next/navigation"

export function ColorFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Initialize state from URL
    const selectedColorsParam = searchParams.get('colors')
    const initialSelected = selectedColorsParam ? selectedColorsParam.split(',') : []

    const [selectedbase, setSelected] = useState<string[]>(initialSelected)

    const toggleColor = (name: string) => {
        let newSelected: string[]
        if (selectedbase.includes(name)) {
            newSelected = selectedbase.filter(c => c !== name)
        } else {
            newSelected = [...selectedbase, name]
        }

        setSelected(newSelected)

        const params = new URLSearchParams(searchParams.toString())
        if (newSelected.length > 0) {
            params.set('colors', newSelected.join(','))
        } else {
            params.delete('colors')
        }
        router.push(`/shop?${params.toString()}`)
    }

    return (
        <div className="w-80 p-2">
            <div className="grid grid-cols-2 gap-4">
                {colors.map((color) => (
                    <div
                        key={color.name}
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => toggleColor(color.name)}
                    >
                        <div className={cn(
                            "h-4 w-4 rounded-full relative",
                            color.class
                        )}>
                            {selectedbase.includes(color.name) && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={`h-1.5 w-1.5 rounded-full ${color.name === "White" || color.name === "Beige" || color.name === "Yellow" ? "bg-black" : "bg-white"}`} />
                                    {/* Design uses a simple dot or inner circle logic, or checking logic. 
                                        Actually usually it's a ring or inner check. 
                                        Let's stick to simple dot for now or maybe ring. 
                                    */}
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">
                            {color.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
