import prisma from "@/lib/prisma";
import { getLiveShoppingBg } from "./actions";
import { LiveShoppingBgUpload } from "@/components/admin/live-shopping/LiveShoppingBgUpload";
import { Video, Calendar, Clock, Mail, Phone, MessageSquare, CheckCircle, XCircle, RefreshCcw } from "lucide-react";

export const dynamic = "force-dynamic";

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    PENDING:     { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
    CONFIRMED:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
    COMPLETED:   { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500" },
    CANCELLED:   { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-400" },
    RESCHEDULED: { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-400" },
};

export default async function LiveShoppingAdminPage() {
    // Fetch background setting + appointments in parallel
    const [liveShoppingBg, appointments] = await Promise.all([
        getLiveShoppingBg(),
        prisma.appointment.findMany({
            where: { appointmentType: "VIDEO_CALL" },
            orderBy: { createdAt: "desc" },
        }),
    ]);


    // Stats
    const total = appointments.length;
    const pending   = appointments.filter(a => a.status === "PENDING").length;
    const confirmed = appointments.filter(a => a.status === "CONFIRMED").length;
    const completed = appointments.filter(a => a.status === "COMPLETED").length;
    const cancelled = appointments.filter(a => a.status === "CANCELLED").length;

    return (
        <div className="space-y-8">
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <Video className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Live Video Shopping</h1>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
                                <span className="text-xs font-semibold text-green-600 tracking-wider uppercase">Live</span>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-stone-500 ml-[52px]">
                        Video shopping appointments booked through the LIVE Shopping button
                    </p>
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                    { label: "Total", value: total,     bg: "bg-stone-50",  text: "text-stone-900" },
                    { label: "Pending",   value: pending,   bg: "bg-amber-50",  text: "text-amber-700" },
                    { label: "Confirmed", value: confirmed, bg: "bg-blue-50",   text: "text-blue-700" },
                    { label: "Completed", value: completed, bg: "bg-green-50",  text: "text-green-700" },
                    { label: "Cancelled", value: cancelled, bg: "bg-red-50",    text: "text-red-700" },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} border border-stone-200/70 rounded-xl p-4`}>
                        <div className={`text-3xl font-bold ${stat.text}`}>{stat.value}</div>
                        <div className="text-xs uppercase tracking-widest text-stone-500 mt-1 font-medium">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Modal Background Setting ─────────────────────────── */}
            <LiveShoppingBgUpload initialBg={liveShoppingBg} />

            {/* ── Appointments List ────────────────────────────────── */}
            {appointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-stone-100">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <Video className="w-8 h-8 text-red-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-700">No video appointments yet</h3>
                    <p className="text-sm text-stone-400 mt-1 max-w-xs">
                        Customers who book through the LIVE Shopping button will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {appointments.map((appt) => {
                        const colors = statusColors[appt.status] ?? statusColors.PENDING;
                        return (
                            <div
                                key={appt.id}
                                className="bg-white border border-stone-200/80 rounded-2xl p-5 hover:shadow-md transition-shadow"
                            >
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-lg font-bold text-red-700 uppercase flex-shrink-0">
                                            {appt.customerName?.[0] ?? "?"}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-stone-900 text-[15px]">{appt.customerName}</h3>
                                            <p className="text-[11px] text-stone-400">
                                                Booked {new Date(appt.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${colors.bg} ${colors.text} border border-current/10`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                        {appt.status}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-2 text-sm text-stone-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                        <span className="truncate">{appt.customerEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                        <span>{appt.customerPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                        <span>
                                            {new Date(appt.appointmentDate).toLocaleDateString("en-IN", {
                                                weekday: "long", day: "numeric", month: "long", year: "numeric"
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                                        <span>{appt.preferredTime}</span>
                                    </div>
                                    {appt.message && (
                                        <div className="flex items-start gap-2 pt-2 border-t border-stone-100 mt-1">
                                            <MessageSquare className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-stone-500 italic leading-relaxed">{appt.message}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <VideoAppointmentActions id={appt.id} status={appt.status} phone={appt.customerPhone} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Inline Action Buttons Component ─────────────────────────────────────────
function VideoAppointmentActions({ id, status, phone }: { id: string; status: string; phone: string }) {
    const waLink = `https://wa.me/${phone.replace(/\D/g, "")}?text=Hi%2C%20your%20video%20shopping%20appointment%20is%20confirmed!%20We%27ll%20connect%20with%20you%20shortly.`;

    return (
        <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-2">
            {/* WhatsApp Quick Action */}
            <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#25D366] text-white hover:bg-[#1fba5a] transition-colors"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                WhatsApp
            </a>

            {status === "PENDING" && (
                <form action={`/api/admin/appointments/${id}`} method="post" className="contents">
                    <button
                        formAction={`/api/admin/appointments/${id}`}
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        title="Go to Appointments to confirm"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = `/admin/appointments`;
                        }}
                    >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Confirm
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                        onClick={() => window.location.href = `/admin/appointments`}
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                    </button>
                </form>
            )}
            {status === "CONFIRMED" && (
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                    onClick={() => window.location.href = `/admin/appointments`}
                >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Mark Complete
                </button>
            )}
            <a
                href="/admin/appointments"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
            >
                <RefreshCcw className="w-3.5 h-3.5" />
                Full Details
            </a>
        </div>
    );
}
