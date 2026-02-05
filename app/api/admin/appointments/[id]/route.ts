import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const appointment = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointment) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(appointment);
    } catch (error) {
        console.error("Error fetching appointment:", error);
        return NextResponse.json(
            { error: "Failed to fetch appointment" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { status, adminNotes } = body;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        // Get appointment details before updating
        const existingAppointment = await prisma.appointment.findUnique({
            where: { id },
        });

        if (!existingAppointment) {
            return NextResponse.json(
                { error: "Appointment not found" },
                { status: 404 }
            );
        }

        // Update appointment
        const appointment = await prisma.appointment.update({
            where: { id },
            data: updateData,
        });

        // Send WhatsApp message if status changed to CONFIRMED or CANCELLED
        if (status && (status === "CONFIRMED" || status === "CANCELLED")) {
            try {
                const twilio = require("twilio");
                const accountSid = process.env.TWILIO_ACCOUNT_SID;
                const authToken = process.env.TWILIO_AUTH_TOKEN;
                const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., "whatsapp:+14155238886"

                if (accountSid && authToken && whatsappFrom) {
                    const client = twilio(accountSid, authToken);

                    // Format phone number for WhatsApp
                    let customerPhone = appointment.customerPhone;
                    // Remove any non-digit characters
                    customerPhone = customerPhone.replace(/\D/g, "");
                    // Ensure it starts with country code (assuming India +91 if not present)
                    if (!customerPhone.startsWith("91") && customerPhone.length === 10) {
                        customerPhone = "91" + customerPhone;
                    }
                    const whatsappTo = `whatsapp:+${customerPhone}`;

                    // Prepare message based on status
                    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    });

                    let message = "";
                    if (status === "CONFIRMED") {
                        message = `✅ Dear ${appointment.customerName},\n\nYour appointment has been CONFIRMED!\n\n📅 Date: ${appointmentDate}\n⏰ Time: ${appointment.preferredTime}\n📍 Location: ${appointment.storeLocation}\n\nWe look forward to seeing you!\n\n- Vastra Verse Team`;
                    } else if (status === "CANCELLED") {
                        message = `❌ Dear ${appointment.customerName},\n\nYour appointment scheduled for ${appointmentDate} at ${appointment.preferredTime} has been CANCELLED.\n\nIf you have any questions, please contact us.\n\n- Vastra Verse Team`;
                    }

                    // Send WhatsApp message
                    await client.messages.create({
                        body: message,
                        from: whatsappFrom,
                        to: whatsappTo,
                    });

                    console.log(`WhatsApp message sent to ${customerPhone} for appointment ${status}`);
                }
            } catch (whatsappError) {
                console.error("Failed to send WhatsApp message:", whatsappError);
                // Continue even if WhatsApp fails - don't block the appointment update
            }
        }

        return NextResponse.json({
            success: true,
            appointment,
            message: status === "CONFIRMED"
                ? "Appointment confirmed and WhatsApp notification sent!"
                : status === "CANCELLED"
                    ? "Appointment cancelled and WhatsApp notification sent!"
                    : "Appointment updated successfully!",
        });
    } catch (error) {
        console.error("Error updating appointment:", error);
        return NextResponse.json(
            { error: "Failed to update appointment" },
            { status: 500 }
        );
    }
}
