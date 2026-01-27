'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, HelpCircle } from 'lucide-react';

export default function TaxSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        gstEnabled: true,
        gstin: '',
        stateOfReg: '',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
        defaultHsnCode: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

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
            console.error('Error fetching settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load tax settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate GSTIN if enabled
        if (settings.gstEnabled && settings.gstin) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(settings.gstin)) {
                toast({
                    title: 'Invalid GSTIN',
                    description: 'GSTIN format should be: 22AAAAA0000A1Z5',
                    variant: 'destructive',
                });
                return;
            }
        }

        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings/tax', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Tax settings saved successfully',
                });
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save');
            }
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to save tax settings',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Tax & GST Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure GST rates and tax information
                </p>
            </div>

            {/* GST Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>GST Configuration</CardTitle>
                    <CardDescription>Enable and configure Goods and Services Tax</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="gstEnabled">Enable GST</Label>
                            <p className="text-sm text-gray-500">
                                Apply GST to all taxable products
                            </p>
                        </div>
                        <Switch
                            id="gstEnabled"
                            checked={settings.gstEnabled}
                            onCheckedChange={(checked: boolean) => setSettings({ ...settings, gstEnabled: checked })}
                        />
                    </div>

                    {settings.gstEnabled && (
                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="gstin">
                                    GSTIN (GST Identification Number)
                                    <span className="text-gray-500 ml-1 text-sm">Optional</span>
                                </Label>
                                <Input
                                    id="gstin"
                                    value={settings.gstin || ''}
                                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                                <p className="text-xs text-gray-500">
                                    Format: 2 digits + 10 alphanumeric + 3 alphanumeric (e.g., 22AAAAA0000A1Z5)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stateOfReg">State of Registration</Label>
                                <Input
                                    id="stateOfReg"
                                    value={settings.stateOfReg || ''}
                                    onChange={(e) => setSettings({ ...settings, stateOfReg: e.target.value })}
                                    placeholder="Maharashtra"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tax Rates */}
            {settings.gstEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tax Rates</CardTitle>
                        <CardDescription>Configure GST rate percentages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cgstRate" className="flex items-center gap-2">
                                    CGST Rate (%)
                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                </Label>
                                <Input
                                    id="cgstRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="50"
                                    value={settings.cgstRate}
                                    onChange={(e) => setSettings({ ...settings, cgstRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sgstRate" className="flex items-center gap-2">
                                    SGST Rate (%)
                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                </Label>
                                <Input
                                    id="sgstRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="50"
                                    value={settings.sgstRate}
                                    onChange={(e) => setSettings({ ...settings, sgstRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="igstRate" className="flex items-center gap-2">
                                    IGST Rate (%)
                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                </Label>
                                <Input
                                    id="igstRate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="50"
                                    value={settings.igstRate}
                                    onChange={(e) => setSettings({ ...settings, igstRate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> CGST + SGST = IGST. For intra-state sales (within same state),
                                CGST and SGST apply. For inter-state sales (different states), IGST applies.
                            </p>
                        </div>

                        <div className="bg-gray-50 border rounded-lg p-4">
                            <h4 className="font-medium mb-2">Tax Calculation Preview</h4>
                            <div className="text-sm space-y-1">
                                <p>Product Price: ₹1,000</p>
                                <p>CGST ({settings.cgstRate}%): ₹{(1000 * settings.cgstRate / 100).toFixed(2)}</p>
                                <p>SGST ({settings.sgstRate}%): ₹{(1000 * settings.sgstRate / 100).toFixed(2)}</p>
                                <p className="font-medium pt-2 border-t">
                                    Total (Intra-state): ₹{(1000 + (1000 * (settings.cgstRate + settings.sgstRate) / 100)).toFixed(2)}
                                </p>
                                <p className="pt-2">Or</p>
                                <p>IGST ({settings.igstRate}%): ₹{(1000 * settings.igstRate / 100).toFixed(2)}</p>
                                <p className="font-medium pt-2 border-t">
                                    Total (Inter-state): ₹{(1000 + (1000 * settings.igstRate / 100)).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* HSN Code */}
            {settings.gstEnabled && (
                <Card>
                    <CardHeader>
                        <CardTitle>HSN/SAC Codes</CardTitle>
                        <CardDescription>Harmonized System of Nomenclature codes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="defaultHsnCode">Default HSN Code</Label>
                            <Input
                                id="defaultHsnCode"
                                value={settings.defaultHsnCode || ''}
                                onChange={(e) => setSettings({ ...settings, defaultHsnCode: e.target.value })}
                                placeholder="5407"
                            />
                            <p className="text-xs text-gray-500">
                                Default code for textile products (5407 for woven fabrics)
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={fetchSettings}>
                    Reset
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
