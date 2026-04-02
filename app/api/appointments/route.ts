import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields
        const {
            customerName,
            customerEmail,
            customerPhone,
            storeLocation,
            appointmentDate,
            preferredTime,
            eventDate,
            message,
            allowPhoneContact,
            newsletterSignup,
            appointmentType,
        } = body;

        if (
            !customerName ||
            !customerEmail ||
            !customerPhone ||
            !appointmentDate ||
            !preferredTime
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const resolvedLocation =
            storeLocation || (appointmentType === "VIDEO_CALL" ? "Virtual" : "Main Store");

        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                customerName,
                customerEmail,
                customerPhone,
                storeLocation: resolvedLocation,
                appointmentDate: new Date(appointmentDate),
                preferredTime,
                eventDate: eventDate ? new Date(eventDate) : null,
                message: message || null,
                allowPhoneContact: allowPhoneContact ?? true,
                newsletterSignup: newsletterSignup ?? false,
                appointmentType: appointmentType || "STORE",
            },
        });

        // Create notification for admin
        try {
            await prisma.notification.create({
                data: {
                    type: "NEW_APPOINTMENT",
                    title: "New Appointment Booking",
                    message: `${customerName} has requested an appointment at ${storeLocation} on ${new Date(
                        appointmentDate
                    ).toLocaleDateString()}`,
                    priority: "NORMAL",
                    resourceType: "Appointment",
                    resourceId: appointment.id,
                    role: "ADMIN",
                    channels: ["IN_APP", "EMAIL"],
                    data: {
                        appointmentId: appointment.id,
                        customerName,
                        customerEmail,
                        storeLocation,
                        appointmentDate,
                    },
                },
            });
        } catch (notificationError) {
            console.error("Failed to create notification:", notificationError);
            // Continue even if notification fails
        }

        return NextResponse.json(
            {
                success: true,
                message: "Appointment request submitted successfully",
                appointmentId: appointment.id,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating appointment:", error);
        return NextResponse.json(
            { error: "Failed to create appointment" },
            { status: 500 }
        );
    }
}
