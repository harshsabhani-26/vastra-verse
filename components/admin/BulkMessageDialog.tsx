'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkMessageDialogProps {
    customerIds: string[];
    onClose: () => void;
}

export default function BulkMessageDialog({
    customerIds,
    onClose,
}: BulkMessageDialogProps) {
    const [channel, setChannel] = useState<'email' | 'sms'>('email');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim()) {
            toast.error('Message is required');
            return;
        }

        if (channel === 'email' && !subject.trim()) {
            toast.error('Subject is required for email');
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch('/api/admin/customers/bulk-message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    customerIds,
                    channel,
                    subject,
                    message,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to send message');
            }

            // Show info about email/SMS service integration
            if (result.note) {
                toast.success('Message prepared!', {
                    duration: 5000,
                });
                toast(result.note, {
                    icon: 'ℹ️',
                    duration: 7000,
                });
            } else {
                toast.success('Message sent successfully');
            }

            onClose();
        } catch (error: any) {
            console.error('Message error:', error);
            toast.error(error.message || 'Failed to send message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-[#1C1917]">
                        Send Bulk Message
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-stone-600">
                        Send a message to <strong>{customerIds.length}</strong> customer
                        {customerIds.length !== 1 ? 's' : ''}
                    </p>

                    {/* Channel Selection */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Channel
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="channel"
                                    value="email"
                                    checked={channel === 'email'}
                                    onChange={(e) => setChannel('email')}
                                    className="rounded"
                                />
                                <Mail className="h-4 w-4" />
                                <span>Email</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="channel"
                                    value="sms"
                                    checked={channel === 'sms'}
                                    onChange={(e) => setChannel('sms')}
                                    className="rounded"
                                />
                                <MessageSquare className="h-4 w-4" />
                                <span>SMS</span>
                            </label>
                        </div>
                    </div>

                    {/* Subject (Email only) */}
                    {channel === 'email' && (
                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-2">
                                Subject *
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter email subject..."
                                className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                            Message *
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={
                                channel === 'email'
                                    ? 'Compose your email message...'
                                    : 'Compose your SMS message... (Keep it concise)'
                            }
                            rows={channel === 'email' ? 8 : 4}
                            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                        />
                        {channel === 'sms' && (
                            <p className="mt-1 text-xs text-stone-500">
                                Character count: {message.length} / 160
                            </p>
                        )}
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> Email/SMS service integration is required to send
                            actual messages. This will prepare the message data for sending through
                            your configured service (e.g., SendGrid, Twilio).
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isSending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={isSending}
                            className="bg-emerald-700 hover:bg-emerald-800 gap-2"
                        >
                            {channel === 'email' ? (
                                <Mail className="h-4 w-4" />
                            ) : (
                                <MessageSquare className="h-4 w-4" />
                            )}
                            {isSending ? 'Preparing...' : 'Prepare Message'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
