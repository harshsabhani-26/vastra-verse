'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload } from 'lucide-react';

export default function StoreSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        storeName: '',
        tagline: '',
        logo: '',
        favicon: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        businessName: '',
        registrationNumber: '',
        panNumber: '',
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings/store');
            if (response.ok) {
                const data = await response.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to load store settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings/store', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Store settings saved successfully',
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast({
                title: 'Error',
                description: 'Failed to save store settings',
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
                <h1 className="text-3xl font-bold">Store Settings</h1>
                <p className="text-gray-600 mt-2">
                    Configure your store information and branding
                </p>
            </div>

            {/* Store Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Store Information</CardTitle>
                    <CardDescription>Basic information about your store</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Store Name *</Label>
                            <Input
                                id="storeName"
                                value={settings.storeName}
                                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                                placeholder="My Saree Store"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tagline">Tagline</Label>
                            <Input
                                id="tagline"
                                value={settings.tagline || ''}
                                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                                placeholder="Elegant sarees for every occasion"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="logo">Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="logo"
                                    value={settings.logo || ''}
                                    onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                />
                                <Button variant="outline" size="icon">
                                    <Upload className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="favicon">Favicon URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="favicon"
                                    value={settings.favicon || ''}
                                    onChange={(e) => setSettings({ ...settings, favicon: e.target.value })}
                                    placeholder="https://example.com/favicon.ico"
                                />
                                <Button variant="outline" size="icon">
                                    <Upload className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>How customers can reach you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={settings.email || ''}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                placeholder="info@store.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={settings.phone || ''}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={settings.address || ''}
                            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                            placeholder="123 Main Street"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={settings.city || ''}
                                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                                placeholder="Mumbai"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={settings.state || ''}
                                onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                                placeholder="Maharashtra"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={settings.country}
                                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zipCode">ZIP Code</Label>
                            <Input
                                id="zipCode"
                                value={settings.zipCode || ''}
                                onChange={(e) => setSettings({ ...settings, zipCode: e.target.value })}
                                placeholder="400001"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Registration */}
            <Card>
                <CardHeader>
                    <CardTitle>Business Registration</CardTitle>
                    <CardDescription>Legal business information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                            id="businessName"
                            value={settings.businessName || ''}
                            onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                            placeholder="ABC Textiles Pvt Ltd"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration Number</Label>
                            <Input
                                id="registrationNumber"
                                value={settings.registrationNumber || ''}
                                onChange={(e) => setSettings({ ...settings, registrationNumber: e.target.value })}
                                placeholder="CIN/LLPIN"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="panNumber">PAN Number</Label>
                            <Input
                                id="panNumber"
                                value={settings.panNumber || ''}
                                onChange={(e) => setSettings({ ...settings, panNumber: e.target.value })}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Social Media */}
            <Card>
                <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Connect your social media profiles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook</Label>
                            <Input
                                id="facebook"
                                value={settings.facebook || ''}
                                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                                placeholder="https://facebook.com/yourpage"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram</Label>
                            <Input
                                id="instagram"
                                value={settings.instagram || ''}
                                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                                placeholder="https://instagram.com/yourprofile"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter/X</Label>
                            <Input
                                id="twitter"
                                value={settings.twitter || ''}
                                onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                                placeholder="https://twitter.com/yourhandle"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube</Label>
                            <Input
                                id="youtube"
                                value={settings.youtube || ''}
                                onChange={(e) => setSettings({ ...settings, youtube: e.target.value })}
                                placeholder="https://youtube.com/yourchannel"
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
