import { PrismaClient } from "@prisma/client";
import AppointmentsListClient from "@/components/admin/appointments/AppointmentsListClient";

const prisma = new PrismaClient();

export default async function AppointmentsPage() {
    // Fetch all appointments
    const appointments = await prisma.appointment.findMany({
        orderBy: { createdAt: "desc" },
    });

    // Get stats
    const stats = await prisma.appointment.groupBy({
        by: ["status"],
        _count: true,
    });

    const total = appointments.length;
    const statusCounts = {
        total,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0,
    };

    stats.forEach((stat) => {
        const status = stat.status.toLowerCase() as keyof typeof statusCounts;
        if (status in statusCounts) {
            statusCounts[status] = stat._count;
        }
    });

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary">Appointments</h1>
                <p className="text-stone-600 mt-2">
                    Manage customer appointment bookings
                </p>
            </div>

            <AppointmentsListClient
                initialAppointments={appointments as any}
                initialStats={statusCounts}
            />
        </div>
    );
}
