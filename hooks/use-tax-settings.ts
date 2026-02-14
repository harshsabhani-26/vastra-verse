"use client";

import { useState, useEffect } from "react";

export interface TaxSettings {
    gstEnabled: boolean;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    gstin?: string;
    stateOfReg?: string;
    defaultHsnCode?: string;
}

export function useTaxSettings() {
    const [settings, setSettings] = useState<TaxSettings>({
        gstEnabled: true,
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/admin/settings/tax');
                if (response.ok) {
                    const data = await response.json();
                    setSettings({
                        ...data,
                        cgstRate: Number(data.cgstRate),
                        sgstRate: Number(data.sgstRate),
                        igstRate: Number(data.igstRate),
                    });
                }
            } catch (error) {
                console.error('Failed to fetch tax settings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { settings, loading };
}
