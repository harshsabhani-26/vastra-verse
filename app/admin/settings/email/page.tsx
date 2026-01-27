'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmailSettingsPage() {
    const { toast } = useToast();
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',
        senderName: 'Vayana Heritage',
        senderEmail: 'noreply@vayanaheritage.com',
    });

    const handleSave = async () => {
        setSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        toast({
            title: 'Settings Saved',
            description: 'Email configuration has been updated successfully.',
        });
        setSaving(false);
    };

    return (
        <div className="p-6 space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="h-8 w-8 text-purple-600" />
                    Email & Notifications
                </h1>
                <p className="text-gray-600 mt-2">
                    Configure SMTP settings for system emails and notifications
                </p>
            </div>

            {/* SMTP Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Enter your email provider's SMTP details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtpHost">SMTP Host</Label>
                            <Input
                                id="smtpHost"
                                value={settings.smtpHost}
                                onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPort">SMTP Port</Label>
                            <Input
                                id="smtpPort"
                                value={settings.smtpPort}
                                onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                                placeholder="587"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="smtpUser">SMTP Username</Label>
                            <Input
                                id="smtpUser"
                                value={settings.smtpUser}
                                onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPassword">SMTP Password</Label>
                            <Input
                                id="smtpPassword"
                                type="password"
                                value={settings.smtpPassword}
                                onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sender Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Sender Information</CardTitle>
                    <CardDescription>Details that will appear in sent emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="senderName">Sender Name</Label>
                            <Input
                                id="senderName"
                                value={settings.senderName}
                                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                                placeholder="Your Store Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="senderEmail">Sender Email</Label>
                            <Input
                                id="senderEmail"
                                value={settings.senderEmail}
                                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                                placeholder="noreply@store.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                    {saving ? 'Saving...' : 'Save Configuration'}
                    {!saving && <Save className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
