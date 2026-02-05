import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get SMTP transport using EmailSettings
 */
async function getTransporter() {
  const settings = await prisma.emailSettings.findFirst();

  if (!settings || !(settings as any).smtpEnabled) {
    throw new Error('Email not configured or disabled');
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure, // true for 465, false for other ports
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  } as any);

  return { transporter, fromEmail: settings.fromEmail, fromName: settings.fromName };
}

/**
 * Send email using configured SMTP
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const { transporter, fromEmail, fromName } = await getTransporter();

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<boolean> {
  const html = generateEmailTemplate({
    title,
    message,
    actionUrl,
    actionText,
  });

  const text = `${title}\n\n${message}${actionUrl ? `\n\nView: ${actionUrl}` : ''}`;

  return sendEmail({
    to,
    subject: title,
    html,
    text,
  });
}

/**
 * Generate HTML email template
 */
function generateEmailTemplate(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}): string {
  const { title, message, actionUrl, actionText } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px 20px;
    }
    .message {
      font-size: 16px;
      color: #555;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <div class="message">
        ${message.replace(/\n/g, '<br>')}
      </div>
      ${actionUrl && actionText ? `
        <div style="text-align: center;">
          <a href="${actionUrl}" class="button">${actionText}</a>
        </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderId: string,
  total: string,
  orderUrl: string
): Promise<boolean> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: #10b981; color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .order-info { background: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0; }
    .order-id { font-size: 18px; font-weight: 600; color: #10b981; }
    .total { font-size: 24px; font-weight: 700; color: #333; margin: 10px 0; }
    .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 14px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Thank you for your order. Your order has been confirmed and is being processed.</p>
      <div class="order-info">
        <div class="order-id">Order #${orderId}</div>
        <div class="total">₹${total}</div>
      </div>
      <p>We'll send you another email when your order ships.</p>
      <div style="text-align: center;">
        <a href="${orderUrl}" class="button">Track Order</a>
      </div>
    </div>
    <div class="footer">
      <p>Questions? Contact us at support@example.com</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({
    to,
    subject: `Order Confirmed - #${orderId}`,
    html,
    text: `Your order #${orderId} for ₹${total} has been confirmed. Track: ${orderUrl}`,
  });
}

/**
 * Send low stock alert email
 */
export async function sendLowStockEmail(
  to: string,
  productName: string,
  currentStock: number,
  productUrl: string
): Promise<boolean> {
  const html = generateEmailTemplate({
    title: '⚠️ Low Stock Alert',
    message: `${productName} is running low on stock. Only ${currentStock} units remaining.`,
    actionUrl: productUrl,
    actionText: 'Update Stock',
  });

  return sendEmail({
    to,
    subject: `Low Stock Alert: ${productName}`,
    html,
    text: `${productName} is running low. ${currentStock} units left. Update: ${productUrl}`,
  });
}
