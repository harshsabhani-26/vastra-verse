'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import { addCustomerNote, deleteCustomerNote } from '@/app/admin/customers/actions';
import { toast } from 'react-hot-toast';

interface CustomerNote {
    id: string;
    content: string;
    createdBy: string;
    createdAt: Date;
}

interface CustomerNotesSectionProps {
    customerId: string;
    initialNotes: CustomerNote[];
}

export default function CustomerNotesSection({
    customerId,
    initialNotes,
}: CustomerNotesSectionProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showAddNote, setShowAddNote] = useState(false);
    const [noteContent, setNoteContent] = useState('');

    const handleAddNote = async () => {
        if (!noteContent.trim()) {
            toast.error('Note content is required');
            return;
        }

        startTransition(async () => {
            const result = await addCustomerNote(customerId, noteContent);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Note added successfully');
                setNoteContent('');
                setShowAddNote(false);
                router.refresh();
            }
        });
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        startTransition(async () => {
            const result = await deleteCustomerNote(noteId);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Note deleted successfully');
                router.refresh();
            }
        });
    };

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1C1917]">Admin Notes</h2>
                <Button
                    onClick={() => setShowAddNote(!showAddNote)}
                    variant="outline"
                    className="gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Add Note
                </Button>
            </div>

            {/* Add Note Form */}
            {showAddNote && (
                <div className="mb-4 p-4 bg-stone-50 border border-stone-200 rounded-lg">
                    <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Enter your note..."
                        rows={4}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAddNote(false);
                                setNoteContent('');
                            }}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddNote}
                            disabled={isPending}
                            className="bg-emerald-700 hover:bg-emerald-800"
                        >
                            Save Note
                        </Button>
                    </div>
                </div>
            )}

            {/* Notes List */}
            {initialNotes.length === 0 ? (
                <p className="text-stone-500 text-center py-8">No notes yet</p>
            ) : (
                <div className="space-y-3">
                    {initialNotes.map((note) => (
                        <div
                            key={note.id}
                            className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-stone-700 whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                                        <span>{note.createdBy}</span>
                                        <span>•</span>
                                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNote(note.id)}
                                    disabled={isPending}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
