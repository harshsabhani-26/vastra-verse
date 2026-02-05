import nodemailer from "nodemailer";

export const sendOrderShippedEmail = async (
    to: string,
    orderId: string,
    customerName: string,
    trackingNumber: string,
    transporterName: string,
    trackingLink?: string
) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const brandColor = "#1a4d3a";
        const trackingButtonHtml = trackingLink ? `
            <a href="${trackingLink}" style="display: inline-block; padding: 12px 24px; background-color: ${brandColor}; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">Track Your Order</a>
        ` : '';

        const mailOptions = {
            from: `"Vastra Verse" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Your Order #${orderId.slice(-6)} has been Shipped!`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f2f4;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f2f4">
                        <tr>
                            <td align="center">
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin-top: 20px; margin-bottom: 20px;">
                                    <tr>
                                        <td align="left" bgcolor="${brandColor}" style="padding: 15px 20px;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Vastra Verse</h1>
                                        </td>
                                        <td align="right" bgcolor="${brandColor}" style="padding: 15px 20px;">
                                            <span style="color: #ffffff; font-size: 14px;">Status: Shipped</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="padding: 30px 40px;">
                                            <p style="color: #333; font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
                                            <p style="color: #555; line-height: 1.5;">Great news! Your order has been shipped and is on its way to you.</p>
                                            
                                            <div style="background-color: #fafafa; border: 1px solid #eee; padding: 20px; margin: 20px 0; border-radius: 8px;">
                                                <p style="margin: 0 0 10px 0;"><strong>Courier:</strong> ${transporterName}</p>
                                                <p style="margin: 0 0 10px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
                                                ${trackingButtonHtml}
                                            </div>

                                            <p style="color: #555; font-size: 14px;">Please allow up to 24 hours for the tracking information to update.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending shipping email:", error);
        return false;
    }
};

export const sendInvoiceEmail = async (
    to: string,
    orderId: string,
    customerName: string,
    pdfBuffer: Buffer
) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // App Password
            },
        });

        // Brand Color: #1a4d3a (Deep Green to match Vastra Verse theme)
        const brandColor = "#1a4d3a";

        const mailOptions = {
            from: `"Vastra Verse" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: `Invoice Copy for Vastra Verse Order ${orderId}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Invoice Copy</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f1f2f4;">
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f2f4">
                        <tr>
                            <td align="center">
                                <!-- Main Container -->
                                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; margin-top: 20px; margin-bottom: 20px;">
                                    
                                    <!-- Header -->
                                    <tr>
                                        <td align="left" bgcolor="${brandColor}" style="padding: 15px 20px;">
                                            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Vastra Verse</h1>
                                        </td>
                                        <td align="right" bgcolor="${brandColor}" style="padding: 15px 20px;">
                                            <span style="color: #ffffff; font-size: 14px;">Order Status: Confirmed</span>
                                        </td>
                                    </tr>

                                    <!-- Body Content -->
                                    <tr>
                                        <td colspan="2" style="padding: 30px 40px;">
                                            <p style="color: #333333; font-size: 14px; margin-bottom: 20px;">
                                                Hi <strong>${customerName}</strong>,
                                            </p>
                                            
                                            <p style="color: #333333; font-size: 14px; margin-bottom: 20px;">
                                                Thank you for shopping with Vastra Verse.
                                            </p>
                                            
                                            <p style="color: #333333; font-size: 14px; margin-bottom: 20px;">
                                                We have attached the Invoice for Order ID <strong>${orderId}</strong> should you need it in the future.
                                            </p>

                                            <div style="background-color: #fff9fa; border: 1px solid #e1e1e1; padding: 15px; margin-bottom: 20px; font-size: 12px; color: #666;">
                                                Please note that for Cash/Card on Delivery orders, payment will be collected at the time of delivery. For prepaid orders, this constitutes your official receipt.
                                            </div>

                                            <p style="color: #333333; font-size: 14px; margin-top: 30px;">
                                                Thank you for shopping!<br/>
                                                <strong>Vastra Verse</strong>
                                            </p>
                                        </td>
                                    </tr>

                                    <!-- Footer Links (Mockup) -->
                                    <tr>
                                        <td colspan="2" style="border-top: 1px solid #eeeeee; padding: 20px 40px;">
                                            <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td width="50%" valign="top">
                                                        <h4 style="margin: 0 0 10px 0; color: #333;">What Next?</h4>
                                                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/orders" style="color: ${brandColor}; text-decoration: none; font-size: 13px;">View your order</a>
                                                    </td>
                                                    <td width="50%" valign="top">
                                                        <h4 style="margin: 0 0 10px 0; color: #333;">Any Questions?</h4>
                                                        <a href="mailto:yogitextile43@gmail.com" style="color: ${brandColor}; text-decoration: none; font-size: 13px;">Contact Customer Care</a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    
                                    <!-- Bottom Branding -->
                                    <tr>
                                        <td colspan="2" align="center" style="padding: 20px; background-color: #fafafa; color: #999; font-size: 11px;">
                                            This email was sent from a notification-only address that cannot accept incoming email. Please do not reply to this message.
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
                    filename: `Invoice_${orderId.slice(0, 8)}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};
