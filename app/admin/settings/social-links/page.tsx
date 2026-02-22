'use client';

import { useState, useEffect } from 'react';
import { Instagram, Youtube, Facebook, Save, Loader2, ExternalLink, CheckCircle2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SocialData {
    instagram: string;
    youtube: string;
    facebook: string;
}

const platforms = [
    {
        key: 'instagram' as const,
        label: 'Instagram',
        placeholder: 'https://instagram.com/yourprofile',
        icon: Instagram,
        gradient: 'from-[#E1306C] to-[#833AB4]',
        bg: 'bg-gradient-to-br from-[#E1306C] to-[#833AB4]',
        tip: 'Paste your full Instagram profile URL',
    },
    {
        key: 'youtube' as const,
        label: 'YouTube',
        placeholder: 'https://youtube.com/@yourchannel',
        icon: Youtube,
        gradient: 'from-[#FF0000] to-[#CC0000]',
        bg: 'bg-gradient-to-br from-[#FF0000] to-[#CC0000]',
        tip: 'Paste your full YouTube channel URL',
    },
    {
        key: 'facebook' as const,
        label: 'Facebook',
        placeholder: 'https://facebook.com/yourpage',
        icon: Facebook,
        gradient: 'from-[#1877F2] to-[#0D5FBD]',
        bg: 'bg-gradient-to-br from-[#1877F2] to-[#0D5FBD]',
        tip: 'Paste your full Facebook page URL',
    },
];

export default function SocialLinksPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [data, setData] = useState<SocialData>({
        instagram: '',
        youtube: '',
        facebook: '',
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await fetch('/api/admin/settings/store');
            if (res.ok) {
                const settings = await res.json();
                setData({
                    instagram: settings.instagram || '',
                    youtube: settings.youtube || '',
                    facebook: settings.facebook || '',
                });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to load social links', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const res = await fetch('/api/admin/settings/store', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Save failed');
            setSaved(true);
            toast({ title: '✅ Saved!', description: 'Social media links updated successfully.' });
            setTimeout(() => setSaved(false), 3000);
        } catch {
            toast({ title: 'Error', description: 'Failed to save links', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Social Media Links</h1>
                <p className="text-stone-500 mt-1 text-sm">
                    Set your social profile URLs — they appear as clickable icons in the website footer.
                </p>
            </div>



            {/* Link Cards */}
            <div className="space-y-4">
                {platforms.map(({ key, label, placeholder, gradient, icon: Icon, tip }) => {
                    const value = data[key];
                    const isValid = value.startsWith('http://') || value.startsWith('https://') || value === '';
                    return (
                        <div
                            key={key}
                            className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    {/* Platform icon circle */}
                                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm shrink-0`}>
                                        <Icon size={20} />
                                    </div>

                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-stone-800">{label}</label>
                                            {value && (
                                                <a
                                                    href={value}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                                                >
                                                    <ExternalLink size={12} />
                                                    Preview
                                                </a>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="url"
                                                value={value}
                                                onChange={(e) => setData({ ...data, [key]: e.target.value })}
                                                placeholder={placeholder}
                                                className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border transition-colors outline-none
                                                    ${!isValid && value
                                                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                                                        : 'border-stone-200 bg-stone-50 focus:border-amber-400 focus:ring-2 focus:ring-amber-50'
                                                    }
                                                `}
                                            />
                                        </div>

                                        <p className="text-xs text-stone-400">{tip}</p>

                                        {!isValid && value && (
                                            <p className="text-xs text-red-500 font-medium">⚠ URL must start with https://</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2 pb-6">
                <button
                    onClick={fetchLinks}
                    className="text-sm text-stone-500 hover:text-stone-700 underline underline-offset-2 transition-colors"
                >
                    Reset to saved
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md
                        ${saved
                            ? 'bg-emerald-500 shadow-emerald-200'
                            : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                        }
                        disabled:opacity-60 disabled:cursor-not-allowed
                    `}
                >
                    {saving ? (
                        <><Loader2 size={16} className="animate-spin" /> Saving…</>
                    ) : saved ? (
                        <><CheckCircle2 size={16} /> Saved!</>
                    ) : (
                        <><Save size={16} /> Save Links</>
                    )}
                </button>
            </div>
        </div>
    );
}
