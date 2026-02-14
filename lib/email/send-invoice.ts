/**
 * LAYER 3 — Invoice Email Service
 * 
 * Single responsibility: send email with PDF attachment.
 * Accepts PDF buffer + metadata. Never crashes the API on failure.
 * NO database calls. NO PDF generation.
 */

import nodemailer from "nodemailer";
import type { InvoiceData } from "@/lib/invoice-data-builder";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Transporter ─────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Prevent hanging on connection/auth failures
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 10000,     // 10 seconds
  });
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export async function sendInvoiceEmail(
  data: InvoiceData,
  pdfBuffer: Buffer
): Promise<InvoiceEmailResult> {
  try {
    // ── Validate ──
    if (!data.customer.email) {
      return { success: false, error: "Customer email not found" };
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("[Invoice Email] CONFIGURATION ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing");
      console.error("[Invoice Email] Please add these variables to your Railway project: https://railway.app");
      console.error("[Invoice Email] Required: EMAIL_USER=your-email@gmail.com, EMAIL_PASS=your-gmail-app-password");
      return {
        success: false,
        error: "Email service not configured. Please contact administrator to set up EMAIL_USER and EMAIL_PASS environment variables in Railway."
      };
    }

    const transporter = createTransporter();
    const brandColor = "#1a4d3a";
    const siteUrl = process.env.NEXTAUTH_URL || "https://vastraverse.in";

    const mailOptions = {
      from: `"${data.store.brandName}" <${process.env.EMAIL_USER}>`,
      to: data.customer.email,
      subject: `Your Invoice — ${data.store.brandName} (${data.invoiceNumber})`,
      html: buildEmailHTML({
        brandName: data.store.brandName,
        brandColor,
        siteUrl,
        customerName: data.customer.name,
        orderId: data.orderId,
        invoiceNumber: data.invoiceNumber,
        grandTotal: data.totals.grandTotal,
        paymentMethod: data.payment.method,
        supportEmail: data.store.supportEmail,
      }),
      attachments: [
        {
          filename: `${data.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Invoice Email] Sent to ${data.customer.email}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Invoice Email] Error:", error.message || error);

    // Provide specific guidance for common Gmail errors
    let userMessage = error.message || "Failed to send email";

    if (error.code === "EAUTH" || error.responseCode === 535) {
      console.error("[Invoice Email] AUTHENTICATION ERROR: Invalid Gmail credentials");
      console.error("[Invoice Email] If using Gmail, you MUST use an App Password, not your regular password");
      console.error("[Invoice Email] Create App Password: https://myaccount.google.com/apppasswords");
      userMessage = "Gmail authentication failed. Please verify EMAIL_PASS is a valid Gmail App Password (not regular password).";
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error("[Invoice Email] CONNECTION ERROR: Cannot reach Gmail SMTP server");
      userMessage = "Cannot connect to Gmail servers. Please check your internet connection or try again later.";
    }

    return { success: false, error: userMessage };
  }
}

// ─── Email HTML Template ─────────────────────────────────────────────────────

interface EmailTemplateProps {
  brandName: string;
  brandColor: string;
  siteUrl: string;
  customerName: string;
  orderId: string;
  invoiceNumber: string;
  grandTotal: number;
  paymentMethod: string;
  supportEmail: string;
}

function buildEmailHTML(p: EmailTemplateProps): string {
  const formattedTotal = `₹${p.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Invoice</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f1f2f4;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f1f2f4">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td bgcolor="${p.brandColor}" style="padding:24px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">${p.brandName}</h1>
                    <p style="color:#a8d4a0;margin:4px 0 0;font-size:12px;">Premium Indian Textiles</p>
                  </td>
                  <td align="right">
                    <span style="color:#fff;font-size:13px;background:rgba(255,255,255,0.15);padding:6px 14px;border-radius:20px;">Invoice</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="color:#333;font-size:15px;margin:0 0 16px;">
                Hi <strong>${p.customerName}</strong>,
              </p>
              <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                Thank you for shopping with ${p.brandName}! Your invoice is attached to this email.
              </p>

              <!-- Order Card -->
              <div style="background:#f8faf8;border:1px solid #e8ede8;border-radius:8px;padding:20px;margin-bottom:24px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:4px 0;">
                      <span style="color:#888;font-size:12px;">Invoice No.</span><br>
                      <strong style="color:#333;font-size:13px;">${p.invoiceNumber}</strong>
                    </td>
                    <td style="padding:4px 0;" align="right">
                      <span style="color:#888;font-size:12px;">Total Amount</span><br>
                      <strong style="color:${p.brandColor};font-size:16px;">${formattedTotal}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding-top:12px;">
                      <span style="color:#888;font-size:12px;">Payment Method</span><br>
                      <strong style="color:#333;font-size:13px;">${p.paymentMethod}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="color:#666;font-size:13px;line-height:1.5;margin:0 0 16px;">
                The invoice PDF is attached for your records. For prepaid orders, this serves as your official payment receipt.
              </p>

              <!-- CTA -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding:8px 0 16px;">
                    <a href="${p.siteUrl}/orders" style="display:inline-block;padding:12px 32px;background:${p.brandColor};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                      View Your Orders
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="border-top:1px solid #eee;padding:20px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%">
                    <p style="margin:0 0 4px;color:#333;font-size:12px;font-weight:600;">Need Help?</p>
                    <a href="mailto:${p.supportEmail}" style="color:${p.brandColor};text-decoration:none;font-size:12px;">Contact Support</a>
                  </td>
                  <td width="50%" align="right">
                    <p style="margin:0 0 4px;color:#333;font-size:12px;font-weight:600;">Visit Us</p>
                    <a href="${p.siteUrl}" style="color:${p.brandColor};text-decoration:none;font-size:12px;">${p.siteUrl.replace("https://", "")}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 32px;background:#fafafa;">
              <p style="color:#999;font-size:11px;margin:0;">
                This email was sent from a notification-only address. Please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
