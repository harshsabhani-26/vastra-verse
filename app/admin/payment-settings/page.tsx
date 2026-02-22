"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Save, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface GatewaySettings {
    id: string;
    provider: string;
    isEnabled: boolean;
    isTestMode: boolean;
    apiKey: string | null;
    apiSecret: string | null;
    merchantId: string | null;
    webhookSecret: string | null;
    webhookUrl: string | null;
}

export default function PaymentSettingsPage() {
    const [razorpaySettings, setRazorpaySettings] = useState<GatewaySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Visibility toggles
    const [showApiSecret, setShowApiSecret] = useState(false);
    const [showWebhookSecret, setShowWebhookSecret] = useState(false);

    // Form states
    const [isEnabled, setIsEnabled] = useState(false);
    const [isTestMode, setIsTestMode] = useState(true);
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/payment-gateways/razorpay");

            if (response.ok) {
                const data = await response.json();
                const settings = data.gateway;
                setRazorpaySettings(settings);
                setIsEnabled(settings?.isEnabled || false);
                setIsTestMode(settings?.isTestMode ?? true);
                setApiKey(settings?.apiKey || "");
                // Don't fill masked secrets
            } else if (response.status === 404) {
                // No settings yet
                setRazorpaySettings(null);
            } else {
                toast.error("Failed to load settings");
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings() {
        try {
            setSaving(true);

            const body: any = {
                isEnabled,
                isTestMode,
                apiKey: apiKey.trim(),
            };

            // Only include secrets if they're not masked
            if (apiSecret && !apiSecret.startsWith("***")) {
                body.apiSecret = apiSecret.trim();
            }
            if (webhookSecret && !webhookSecret.startsWith("***")) {
                body.webhookSecret = webhookSecret.trim();
            }

            const webhookUrl = `${window.location.origin}/api/webhooks/razorpay`;
            body.webhookUrl = webhookUrl;

            const response = await fetch("/api/admin/payment-gateways/razorpay", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                toast.success("Settings saved successfully");
                fetchSettings();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Payment Gateway Settings</h2>
                <div className="text-center py-12 text-stone-500">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1C1917]">Payment Gateway Settings</h2>
            </div>

            {/* Razorpay Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Image
                            src="https://razorpay.com/favicon.png"
                            alt="Razorpay"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                        />
                        Razorpay Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                        <div>
                            <h4 className="font-medium text-stone-900">Enable Razorpay</h4>
                            <p className="text-sm text-stone-600">
                                Allow customers to pay using Razorpay
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => setIsEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Test Mode Toggle */}
                    <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <div>
                            <h4 className="font-medium text-amber-900">Test Mode</h4>
                            <p className="text-sm text-amber-700">
                                Use test API keys (no real transactions)
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isTestMode}
                                onChange={(e) => setIsTestMode(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                    </div>

                    {/* API Credentials */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                API Key ID
                            </label>
                            <Input
                                type="text"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="rzp_test_xxxxxxxxxxxx"
                                className="font-mono"
                            />
                            <p className="text-xs text-stone-500 mt-1">
                                Get this from your Razorpay dashboard
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                API Secret Key
                            </label>
                            <div className="relative">
                                <Input
                                    type={showApiSecret ? "text" : "password"}
                                    value={apiSecret}
                                    onChange={(e) => setApiSecret(e.target.value)}
                                    placeholder="Enter API secret..."
                                    className="font-mono pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiSecret(!showApiSecret)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                >
                                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                Keep this secret and never share it
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Webhook Secret
                            </label>
                            <div className="relative">
                                <Input
                                    type={showWebhookSecret ? "text" : "password"}
                                    value={webhookSecret}
                                    onChange={(e) => setWebhookSecret(e.target.value)}
                                    placeholder="Enter webhook secret..."
                                    className="font-mono pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-stone-400 hover:text-stone-600"
                                >
                                    {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                Used to verify webhook signatures
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Webhook URL
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/razorpay`}
                                    readOnly
                                    className="font-mono bg-stone-50"
                                />
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        navigator.clipboard.writeText(
                                            `${window.location.origin}/api/webhooks/razorpay`
                                        );
                                        toast.success("Webhook URL copied!");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                Configure this URL in your Razorpay webhook settings
                            </p>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={saveSettings} disabled={saving}>
                            {saving ? (
                                <>Saving...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Settings
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Setup Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Setup Instructions
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                            <li>Create a Razorpay account at razorpay.com</li>
                            <li>Navigate to Settings → API Keys in your Razorpay dashboard</li>
                            <li>Generate API keys (use test keys for testing)</li>
                            <li>Copy and paste the Key ID and Secret here</li>
                            <li>Set up webhooks in Razorpay dashboard with the webhook URL above</li>
                            <li>Enable the gateway and test with a small transaction</li>
                        </ol>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
