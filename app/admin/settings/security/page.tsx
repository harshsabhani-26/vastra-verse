'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Save, Lock, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SecuritySettingsPage() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        twoFactor: false,
        passwordExpiry: '90',
        sessionTimeout: '30',
        maxLoginAttempts: '5',
    });

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: 'Security Settings Updated',
            description: 'Your security preferences have been saved.',
        });
        setSaving(false);
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Shield className="h-8 w-8 text-red-600" />
                    Security Settings
                </h1>
                <p className="text-gray-600 mt-2">
                    Manage authentication security and access controls
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* Authentication Policy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="h-5 w-5 text-gray-500" />
                            Authentication Policy
                        </CardTitle>
                        <CardDescription>Configure password and session rules</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Password Expiry</Label>
                                <p className="text-sm text-muted-foreground">Force password reset after days</p>
                            </div>
                            <Select
                                value={settings.passwordExpiry}
                                onValueChange={(val) => setSettings({ ...settings, passwordExpiry: val })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">Every 30 Days</SelectItem>
                                    <SelectItem value="60">Every 60 Days</SelectItem>
                                    <SelectItem value="90">Every 90 Days</SelectItem>
                                    <SelectItem value="never">Never</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Session Timeout</Label>
                                <p className="text-sm text-muted-foreground">Auto-logout inactive users (minutes)</p>
                            </div>
                            <Select
                                value={settings.sessionTimeout}
                                onValueChange={(val) => setSettings({ ...settings, sessionTimeout: val })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select timeout" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 Minutes</SelectItem>
                                    <SelectItem value="30">30 Minutes</SelectItem>
                                    <SelectItem value="60">1 Hour</SelectItem>
                                    <SelectItem value="120">2 Hours</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Two-Factor Auth */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-gray-500" />
                            Two-Factor Authentication
                        </CardTitle>
                        <CardDescription>Enhanced login security for admin accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Enforce 2FA</Label>
                                <p className="text-sm text-muted-foreground">Require all admins to use 2FA</p>
                            </div>
                            <Switch
                                checked={settings.twoFactor}
                                onCheckedChange={(checked) => setSettings({ ...settings, twoFactor: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
                    {saving ? 'Saving...' : 'Save Security Settings'}
                    {!saving && <Save className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
