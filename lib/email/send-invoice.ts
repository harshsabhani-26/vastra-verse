/**
 * Invoice Email Service
 * Sends invoice PDF as email attachment to customer
 * Uses Nodemailer with Gmail SMTP
 */

import nodemailer from "nodemailer";

interface SendInvoiceEmailOptions {
    to: string;
    orderId: string;
    customerName: string;
    pdfBuffer: Buffer;
    orderTotal: string;
    paymentMethod: string;
}

/**
 * Create reusable transporter
 */
function createTransporter() {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

/**
 * Send invoice email to customer with PDF attachment
 */
export async function sendInvoiceEmailWithPDF(
    options: SendInvoiceEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { to, orderId, customerName, pdfBuffer, orderTotal, paymentMethod } = options;

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("Email credentials not configured (EMAIL_USER / EMAIL_PASS)");
        }

        const transporter = createTransporter();
        const brandColor = "#1a4d3a";
        const siteUrl = process.env.NEXTAUTH_URL || "https://vastraverse.in";

        const mailOptions = {
            from: `"Vastra Verse" <${process.env.EMAIL_USER}>`,
            to,
            subject: `Your Order Invoice — Vastra Verse (${orderId.slice(0, 8)})`,
            html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Invoice</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f2f4;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f2f4">
                <tr>
                    <td align="center" style="padding: 20px 0;">
                        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                            
                            <!-- Header -->
                            <tr>
                                <td bgcolor="${brandColor}" style="padding: 24px 32px;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td>
                                                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700;">Vastra Verse</h1>
                                                <p style="color: #a8d4a0; margin: 4px 0 0 0; font-size: 12px;">Premium Indian Textiles</p>
                                            </td>
                                            <td align="right">
                                                <span style="color: #ffffff; font-size: 13px; background: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 20px;">Invoice</span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 32px;">
                                    <p style="color: #333; font-size: 15px; margin: 0 0 16px 0;">
                                        Hi <strong>${customerName}</strong>,
                                    </p>
                                    
                                    <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                                        Thank you for shopping with Vastra Verse! Please find your invoice attached to this email.
                                    </p>

                                    <!-- Order Summary Card -->
                                    <div style="background-color: #f8faf8; border: 1px solid #e8ede8; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="padding: 4px 0;">
                                                    <span style="color: #888; font-size: 12px;">Order ID</span><br>
                                                    <strong style="color: #333; font-size: 13px;">${orderId}</strong>
                                                </td>
                                                <td style="padding: 4px 0;" align="right">
                                                    <span style="color: #888; font-size: 12px;">Total Amount</span><br>
                                                    <strong style="color: ${brandColor}; font-size: 16px;">₹${orderTotal}</strong>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colspan="2" style="padding-top: 12px;">
                                                    <span style="color: #888; font-size: 12px;">Payment Method</span><br>
                                                    <strong style="color: #333; font-size: 13px;">${paymentMethod}</strong>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>

                                    <p style="color: #666; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
                                        The invoice PDF is attached to this email for your records. For prepaid orders, this serves as your official payment receipt.
                                    </p>

                                    <!-- CTA Button -->
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="padding: 8px 0 16px 0;">
                                                <a href="${siteUrl}/orders" style="display: inline-block; padding: 12px 32px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                                    View Your Orders
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Support Section -->
                            <tr>
                                <td style="border-top: 1px solid #eee; padding: 20px 32px;">
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="50%">
                                                <p style="margin: 0 0 4px 0; color: #333; font-size: 12px; font-weight: 600;">Need Help?</p>
                                                <a href="mailto:harshsabhani18@gmail.com" style="color: ${brandColor}; text-decoration: none; font-size: 12px;">Contact Support</a>
                                            </td>
                                            <td width="50%" align="right">
                                                <p style="margin: 0 0 4px 0; color: #333; font-size: 12px; font-weight: 600;">Visit Us</p>
                                                <a href="${siteUrl}" style="color: ${brandColor}; text-decoration: none; font-size: 12px;">vastraverse.in</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td align="center" style="padding: 16px 32px; background-color: #fafafa;">
                                    <p style="color: #999; font-size: 11px; margin: 0;">
                                        This email was sent from a notification-only address. Please do not reply to this message.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
            attachments: [
                {
                    filename: `invoice-${orderId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Invoice Email] Sent to ${to}, messageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error("[Invoice Email] Error:", error.message || error);
        return { success: false, error: error.message || "Failed to send email" };
    }
}
