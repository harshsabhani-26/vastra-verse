"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Package, Truck, Mail, Save, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function GlobalSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        autoCourierSelection: true,
        autoPickupScheduling: false,
        autoTrackingEmail: true,
        defaultLength: "30",
        defaultBreadth: "20",
        defaultHeight: "10",
        defaultWeight: "0.5",
        pickupLocation: "default",
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Settings saved successfully");
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Global Shipping Settings</h2>
                <p className="text-stone-600 mt-1">
                    Configure automation rules and default shipping parameters
                </p>
            </div>

            {/* Automation Controls */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Automation Controls</h3>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label className="text-base font-medium">
                                Auto Courier Selection
                            </Label>
                            <p className="text-sm text-stone-600 mt-1">
                                Automatically select the best courier based on performance scores
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoCourierSelection}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoCourierSelection: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label className="text-base font-medium">
                                Auto Pickup Scheduling
                            </Label>
                            <p className="text-sm text-stone-600 mt-1">
                                Automatically schedule pickup when shipment is created
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoPickupScheduling}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoPickupScheduling: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <Label className="text-base font-medium">
                                Auto Tracking Emails
                            </Label>
                            <p className="text-sm text-stone-600 mt-1">
                                Send tracking updates to customers automatically
                            </p>
                        </div>
                        <Switch
                            checked={settings.autoTrackingEmail}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, autoTrackingEmail: checked })
                            }
                        />
                    </div>
                </div>
            </Card>

            {/* Default Package Dimensions */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Default Package Dimensions</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="length">Length (cm)</Label>
                        <Input
                            id="length"
                            type="number"
                            value={settings.defaultLength}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultLength: e.target.value })
                            }
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="breadth">Breadth (cm)</Label>
                        <Input
                            id="breadth"
                            type="number"
                            value={settings.defaultBreadth}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultBreadth: e.target.value })
                            }
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="height">Height (cm)</Label>
                        <Input
                            id="height"
                            type="number"
                            value={settings.defaultHeight}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultHeight: e.target.value })
                            }
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="weight">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={settings.defaultWeight}
                            onChange={(e) =>
                                setSettings({ ...settings, defaultWeight: e.target.value })
                            }
                            className="mt-1"
                        />
                    </div>
                </div>

                <p className="text-sm text-stone-600 mt-4">
                    These dimensions will be used when product dimensions are not specified
                </p>
            </Card>

            {/* Pickup Configuration */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Truck className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Pickup Configuration</h3>
                </div>

                <div>
                    <Label htmlFor="pickupLocation">Default Pickup Location</Label>
                    <Select
                        value={settings.pickupLocation}
                        onValueChange={(value) =>
                            setSettings({ ...settings, pickupLocation: value })
                        }
                    >
                        <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select pickup location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default Warehouse</SelectItem>
                            <SelectItem value="location2">Warehouse 2</SelectItem>
                            <SelectItem value="location3">Warehouse 3</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-stone-600 mt-2">
                        Configure pickup locations in Shiprocket dashboard
                    </p>
                </div>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
