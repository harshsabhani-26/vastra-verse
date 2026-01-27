"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

interface Appointment {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    storeLocation: string;
    appointmentDate: string;
    preferredTime: string;
    eventDate: string | null;
    message: string | null;
    status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
    adminNotes: string | null;
    allowPhoneContact: boolean;
    newsletterSignup: boolean;
    createdAt: string;
}

interface AppointmentsListClientProps {
    initialAppointments: Appointment[];
    initialStats: {
        total: number;
        pending: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        rescheduled: number;
    };
}

const statusColors = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
    COMPLETED: "bg-green-100 text-green-800 border-green-300",
    CANCELLED: "bg-red-100 text-red-800 border-red-300",
    RESCHEDULED: "bg-purple-100 text-purple-800 border-purple-300",
};

export default function AppointmentsListClient({
    initialAppointments,
    initialStats,
}: AppointmentsListClientProps) {
    const [appointments, setAppointments] = useState(initialAppointments);
    const [stats, setStats] = useState(initialStats);
    const [activeTab, setActiveTab] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchAppointments = async (status?: string) => {
        try {
            const params = new URLSearchParams();
            if (status && status !== "all") params.append("status", status);
            if (searchQuery) params.append("search", searchQuery);

            const res = await fetch(`/api/admin/appointments?${params}`);
            const data = await res.json();
            setAppointments(data.appointments);
            setStats(data.stats);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    useEffect(() => {
        fetchAppointments(activeTab);
    }, [activeTab, searchQuery]);

    const updateAppointmentStatus = async (id: string, newStatus: string, adminNotes?: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/admin/appointments/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, adminNotes }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || `Appointment ${newStatus.toLowerCase()} successfully!`);
                fetchAppointments(activeTab);
                setSelectedAppointment(null);
            } else {
                toast.error(data.error || "Failed to update appointment");
            }
        } catch (error) {
            console.error("Error updating appointment:", error);
            toast.error("An error occurred while updating the appointment");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 border border-stone-200 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-xs text-stone-600 uppercase tracking-wide">Total</div>
                </div>
                <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-800">{stats.pending}</div>
                    <div className="text-xs text-yellow-700 uppercase tracking-wide">Pending</div>
                </div>
                <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-800">{stats.confirmed}</div>
                    <div className="text-xs text-blue-700 uppercase tracking-wide">Confirmed</div>
                </div>
                <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
                    <div className="text-2xl font-bold text-green-800">{stats.completed}</div>
                    <div className="text-xs text-green-700 uppercase tracking-wide">Completed</div>
                </div>
                <div className="bg-purple-50 p-4 border border-purple-200 rounded-lg">
                    <div className="text-2xl font-bold text-purple-800">{stats.rescheduled}</div>
                    <div className="text-xs text-purple-700 uppercase tracking-wide">Rescheduled</div>
                </div>
                <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
                    <div className="text-2xl font-bold text-red-800">{stats.cancelled}</div>
                    <div className="text-xs text-red-700 uppercase tracking-wide">Cancelled</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["all", "pending", "confirmed", "completed", "rescheduled", "cancelled"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium uppercase tracking-wide rounded-md whitespace-nowrap ${activeTab === tab
                            ? "bg-primary text-white"
                            : "bg-white text-stone-600 border border-stone-300 hover:bg-stone-50"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:outline-none focus:border-primary"
            />

            {/* Appointments List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {appointments.map((appointment) => (
                    <div
                        key={appointment.id}
                        className="bg-white border border-stone-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-primary">
                                    {appointment.customerName}
                                </h3>
                                <p className="text-xs text-stone-500">
                                    Booked {new Date(appointment.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <Badge className={statusColors[appointment.status]}>
                                {appointment.status}
                            </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-stone-700">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-stone-400" />
                                <span>{appointment.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-stone-400" />
                                <span>{appointment.customerPhone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-stone-400" />
                                <span>{appointment.storeLocation}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-stone-400" />
                                <span>
                                    {new Date(appointment.appointmentDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-stone-400" />
                                <span>{appointment.preferredTime}</span>
                            </div>
                            {appointment.message && (
                                <div className="flex items-start gap-2 pt-2 border-t">
                                    <MessageSquare className="w-4 h-4 text-stone-400 mt-1" />
                                    <span className="text-xs italic">{appointment.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 flex gap-2">
                            {appointment.status === "PENDING" && (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            updateAppointmentStatus(appointment.id, "CONFIRMED")
                                        }
                                        disabled={isUpdating}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isUpdating ? "Updating..." : "Confirm"}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            updateAppointmentStatus(appointment.id, "CANCELLED")
                                        }
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? "Updating..." : "Cancel"}
                                    </Button>
                                </>
                            )}
                            {appointment.status === "CONFIRMED" && (
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        updateAppointmentStatus(appointment.id, "COMPLETED")
                                    }
                                    disabled={isUpdating}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {isUpdating ? "Updating..." : "Mark Complete"}
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {appointments.length === 0 && (
                <div className="text-center py-12 text-stone-500">
                    No appointments found
                </div>
            )}
        </div>
    );
}
