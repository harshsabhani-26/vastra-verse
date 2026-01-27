'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, AlertTriangle, Power } from 'lucide-react';

export default function SystemSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        maintenanceMessage: '',
        currency: 'INR',
        currencySymbol: '₹',
        currencyPosition: 'before',
        decimalPlaces: 2,
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12',
        sessionTimeout: 30,
        passwordMinLength: 12,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings/system');
            if (response.ok) {
                const data = await response.json();
                setSettings({
                    ...data,
                    decimalPlaces: Number(data.decimalPlaces),
                    sessionTimeout: Number(data.sessionTimeout),
                    passwordMinLength: Number(data.passwordMinLength),
                    maxLoginAttempts: Number(data.maxLoginAttempts),
                    lockoutDuration: Number(data.lockoutDuration),
                });
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load system settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings/system', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'System settings saved successfully',
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save system settings',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleMaintenance = async () => {
        setToggling(true);
        try {
            const response = await fetch('/api/admin/settings/system/toggle-maintenance', {
                method: 'POST',
            });

            if (response.ok) {
                const data = await response.json();
                setSettings({ ...settings, maintenanceMode: data.maintenanceMode });
                toast({
                    title: data.maintenanceMode ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
                    description: data.message,
                });
            } else {
                throw new Error('Failed to toggle');
            }
        } catch (error) {
            console.error('Error toggling maintenance:', error);
            toast({
                title: 'Error',
                description: 'Failed to toggle maintenance mode',
                variant: 'destructive',
            });
        } finally {
            setToggling(false);
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
                <h1 className="text-3xl font-bold">System Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure system-wide preferences and security
                </p>
            </div>

            {/* Maintenance Mode */}
            <Card className={settings.maintenanceMode ? 'border-yellow-500' : ''}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className={`w-5 h-5 ${settings.maintenanceMode ? 'text-yellow-600' : 'text-gray-400'}`} />
                                Maintenance Mode
                            </CardTitle>
                            <CardDescription>
                                {settings.maintenanceMode
                                    ? 'Site is currently in maintenance mode'
                                    : 'Enable to show maintenance page to visitors'}
                            </CardDescription>
                        </div>
                        <Button
                            onClick={toggleMaintenance}
                            disabled={toggling}
                            variant={settings.maintenanceMode ? 'destructive' : 'default'}
                        >
                            {toggling ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Power className="w-4 h-4 mr-2" />
                                    {settings.maintenanceMode ? 'Disable' : 'Enable'}
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                        <Textarea
                            id="maintenanceMessage"
                            value={settings.maintenanceMessage || ''}
                            onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                            placeholder="We're currently performing scheduled maintenance. We'll be back soon!"
                            rows={3}
                        />
                    </div>

                    {settings.maintenanceMode && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-900">
                                <strong>Note:</strong> Admin users can still access the site. Regular users will see the maintenance page.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Currency & Localization */}
            <Card>
                <CardHeader>
                    <CardTitle>Currency & Localization</CardTitle>
                    <CardDescription>Regional and currency settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency Code</Label>
                            <Select value={settings.currency} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                    <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currencySymbol">Currency Symbol</Label>
                            <Input
                                id="currencySymbol"
                                value={settings.currencySymbol}
                                onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                                maxLength={3}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currencyPosition">Symbol Position</Label>
                            <Select value={settings.currencyPosition} onValueChange={(value) => setSettings({ ...settings, currencyPosition: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="before">Before (₹1,000)</SelectItem>
                                    <SelectItem value="after">After (1,000₹)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="decimalPlaces">Decimal Places</Label>
                            <Select value={settings.decimalPlaces.toString()} onValueChange={(value) => setSettings({ ...settings, decimalPlaces: parseInt(value) })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0 (₹1000)</SelectItem>
                                    <SelectItem value="2">2 (₹1000.00)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                                <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dateFormat">Date Format</Label>
                            <Select value={settings.dateFormat} onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="timeFormat">Time Format</Label>
                            <Select value={settings.timeFormat} onValueChange={(value) => setSettings({ ...settings, timeFormat: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="12">12-hour (3:00 PM)</SelectItem>
                                    <SelectItem value="24">24-hour (15:00)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Password policies and session management</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                            <Input
                                id="sessionTimeout"
                                type="number"
                                min="5"
                                max="480"
                                value={settings.sessionTimeout}
                                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 30 })}
                            />
                            <p className="text-xs text-gray-500">Auto-logout after period of inactivity</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="passwordMinLength">Min Password Length</Label>
                            <Input
                                id="passwordMinLength"
                                type="number"
                                min="8"
                                max="32"
                                value={settings.passwordMinLength}
                                onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) || 12 })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                            <Input
                                id="maxLoginAttempts"
                                type="number"
                                min="3"
                                max="10"
                                value={settings.maxLoginAttempts}
                                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                            />
                            <p className="text-xs text-gray-500">Lock account after failed attempts</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                            <Input
                                id="lockoutDuration"
                                type="number"
                                min="5"
                                max="1440"
                                value={settings.lockoutDuration}
                                onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) || 30 })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

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
