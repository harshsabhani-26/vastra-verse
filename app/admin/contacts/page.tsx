"use client";

import { useEffect, useState } from "react";
import { getContactSubmissions, updateContactSubmission, deleteContactSubmission, getContactStats } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";

type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
type ContactPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

interface ContactSubmission {
    id: string;
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
    country: string;
    city: string | null;
    comment: string | null;
    newsletter: boolean;
    status: ContactStatus;
    priority: ContactPriority;
    adminNotes: string | null;
    assignedTo: string | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    referrer: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Stats {
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
}

export default function AdminContactsPage() {
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, new: 0, inProgress: 0, resolved: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
    const [filters, setFilters] = useState({ status: "ALL", priority: "ALL", search: "" });

    const fetchData = async () => {
        setLoading(true);
        const [submissionsResult, statsResult] = await Promise.all([
            getContactSubmissions(filters.status === "ALL" && filters.priority === "ALL" && !filters.search ? {} : filters),
            getContactStats()
        ]);

        if (submissionsResult.success) {
            setSubmissions(submissionsResult.data as ContactSubmission[]);
        }

        if (statsResult.success) {
            setStats(statsResult.data as Stats);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleStatusChange = async (id: string, status: ContactStatus) => {
        const result = await updateContactSubmission(id, { status });
        if (result.success) {
            fetchData();
            if (selectedSubmission?.id === id) {
                setSelectedSubmission({ ...selectedSubmission, status });
            }
        }
    };

    const handlePriorityChange = async (id: string, priority: ContactPriority) => {
        const result = await updateContactSubmission(id, { priority });
        if (result.success) {
            fetchData();
            if (selectedSubmission?.id === id) {
                setSelectedSubmission({ ...selectedSubmission, priority });
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this submission?")) {
            const result = await deleteContactSubmission(id);
            if (result.success) {
                fetchData();
                if (selectedSubmission?.id === id) {
                    setSelectedSubmission(null);
                }
            }
        }
    };

    const handleSaveNotes = async (id: string, adminNotes: string) => {
        const result = await updateContactSubmission(id, { adminNotes });
        if (result.success) {
            fetchData();
        }
    };

    const getStatusColor = (status: ContactStatus) => {
        switch (status) {
            case "NEW": return "bg-blue-100 text-blue-800";
            case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
            case "RESOLVED": return "bg-green-100 text-green-800";
            case "SPAM": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: ContactPriority) => {
        switch (priority) {
            case "LOW": return "bg-gray-100 text-gray-800";
            case "NORMAL": return "bg-blue-100 text-blue-800";
            case "HIGH": return "bg-orange-100 text-orange-800";
            case "URGENT": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-stone-900">Contact Submissions</h1>
                <p className="text-stone-600 mt-2">View and manage customer inquiries</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-stone-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-600">Total</p>
                            <p className="text-2xl font-semibold text-stone-900 mt-1">{stats.total}</p>
                        </div>
                        <Mail className="text-stone-400" size={32} />
                    </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-600">New</p>
                            <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.new}</p>
                        </div>
                        <AlertCircle className="text-blue-400" size={32} />
                    </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-600">In Progress</p>
                            <p className="text-2xl font-semibold text-yellow-600 mt-1">{stats.inProgress}</p>
                        </div>
                        <Clock className="text-yellow-400" size={32} />
                    </div>
                </div>
                <div className="bg-white border border-stone-200 p-6 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-stone-600">Resolved</p>
                            <p className="text-2xl font-semibold text-green-600 mt-1">{stats.resolved}</p>
                        </div>
                        <CheckCircle className="text-green-400" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-stone-200 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name, email, phone..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="NEW">New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="SPAM">Spam</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">Priority</label>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="NORMAL">Normal</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Submissions Table */}
            <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-stone-600">Loading...</div>
                ) : submissions.length === 0 ? (
                    <div className="p-8 text-center text-stone-600">No contact submissions found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Contact</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Location</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Priority</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-stone-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {submissions.map((submission) => (
                                    <tr
                                        key={submission.id}
                                        className="hover:bg-stone-50 cursor-pointer"
                                        onClick={() => setSelectedSubmission(submission)}
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-stone-900">{submission.fullName}</div>
                                                <div className="text-sm text-stone-600">{submission.email}</div>
                                                <div className="text-sm text-stone-600">{submission.countryCode} {submission.phoneNumber}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-600">
                                            <div>{submission.country}</div>
                                            {submission.city && <div className="text-stone-500">{submission.city}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={submission.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(submission.id, e.target.value as ContactStatus);
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(submission.status)}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="NEW">New</option>
                                                <option value="IN_PROGRESS">In Progress</option>
                                                <option value="RESOLVED">Resolved</option>
                                                <option value="SPAM">Spam</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={submission.priority}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handlePriorityChange(submission.id, e.target.value as ContactPriority);
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(submission.priority)}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="NORMAL">Normal</option>
                                                <option value="HIGH">High</option>
                                                <option value="URGENT">Urgent</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-600">
                                            {new Date(submission.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(submission.id);
                                                }}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedSubmission && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedSubmission(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-stone-200">
                            <h2 className="text-2xl font-serif text-stone-900">Contact Details</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Full Name</label>
                                    <p className="text-stone-900 mt-1">{selectedSubmission.fullName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Email</label>
                                    <p className="text-stone-900 mt-1">{selectedSubmission.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Phone</label>
                                    <p className="text-stone-900 mt-1">{selectedSubmission.countryCode} {selectedSubmission.phoneNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Country</label>
                                    <p className="text-stone-900 mt-1">{selectedSubmission.country}</p>
                                </div>
                                {selectedSubmission.city && (
                                    <div>
                                        <label className="text-sm font-medium text-stone-700">City</label>
                                        <p className="text-stone-900 mt-1">{selectedSubmission.city}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Newsletter</label>
                                    <p className="text-stone-900 mt-1">{selectedSubmission.newsletter ? "Yes" : "No"}</p>
                                </div>
                            </div>

                            {/* Comment */}
                            {selectedSubmission.comment && (
                                <div>
                                    <label className="text-sm font-medium text-stone-700">Comment</label>
                                    <p className="text-stone-900 mt-1 bg-stone-50 p-4 rounded">{selectedSubmission.comment}</p>
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <label className="text-sm font-medium text-stone-700 block mb-2">Admin Notes</label>
                                <textarea
                                    defaultValue={selectedSubmission.adminNotes || ""}
                                    onBlur={(e) => handleSaveNotes(selectedSubmission.id, e.target.value)}
                                    rows={4}
                                    className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                                    placeholder="Add internal notes..."
                                />
                            </div>

                            {/* Metadata */}
                            <div className="border-t border-stone-200 pt-4">
                                <p className="text-sm text-stone-600">
                                    <strong>Created:</strong> {new Date(selectedSubmission.createdAt).toLocaleString()}
                                </p>
                                {selectedSubmission.ipAddress && (
                                    <p className="text-sm text-stone-600 mt-1">
                                        <strong>IP Address:</strong> {selectedSubmission.ipAddress}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-stone-200 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
