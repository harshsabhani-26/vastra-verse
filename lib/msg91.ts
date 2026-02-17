export const MSG91_CONFIG = {
    authKey: process.env.MSG91_AUTH_KEY || '',
    senderId: process.env.MSG91_SENDER_ID || 'TXTIND',
    templateId: process.env.MSG91_TEMPLATE_ID || '',
    dltTeId: process.env.MSG91_DLT_TE_ID || '',
    baseUrl: 'https://control.msg91.com/api/v5',
};

interface SendSMSParams {
    phone: string;
    otp: string;
    templateId?: string;
}

interface MSG91Response {
    type: string;
    message: string;
}

/**
 * Validate Indian phone number format
 * Accepts 10-digit numbers or with +91 prefix
 */
export function validatePhoneNumber(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid 10-digit Indian number
    if (cleaned.length === 10) {
        return /^[6-9]\d{9}$/.test(cleaned);
    }

    // Check if it's with country code (91 + 10 digits)
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return /^91[6-9]\d{9}$/.test(cleaned);
    }

    return false;
}

/**
 * Normalize phone number to E.164 format (+91XXXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+${cleaned}`;
    }

    return phone; // Return as-is if invalid
}

/**
 * Send SMS OTP via MSG91
 */
export async function sendSMSOTP(params: SendSMSParams): Promise<{ success: boolean; message: string }> {
    const { phone, otp, templateId } = params;

    // Validate phone number
    if (!validatePhoneNumber(phone)) {
        return {
            success: false,
            message: 'Invalid phone number format. Please use 10-digit Indian mobile number.',
        };
    }

    // Check if MSG91 is configured
    if (!MSG91_CONFIG.authKey) {
        console.warn('MSG91_AUTH_KEY not configured. OTP will only be logged.');

        // In development, log the OTP
        if (process.env.NODE_ENV === 'development') {
            console.log(`\n📱 SMS OTP for ${phone}: ${otp}\n`);
        }

        return {
            success: true,
            message: 'OTP logged (MSG91 not configured)',
        };
    }

    const normalizedPhone = normalizePhoneNumber(phone);

    try {
        // MSG91 SMS API v5
        const url = `${MSG91_CONFIG.baseUrl}/flow/`;

        const payload = {
            flow_id: templateId || MSG91_CONFIG.templateId,
            sender: MSG91_CONFIG.senderId,
            mobiles: normalizedPhone.replace('+', ''), // MSG91 expects without +
            OTP: otp, // Template variable
            VAR1: otp, // Fallback variable
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authkey': MSG91_CONFIG.authKey,
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000), // 10-second timeout
        });

        const data: MSG91Response = await response.json();

        if (response.ok && data.type === 'success') {
            console.log(`✅ SMS sent successfully to ${normalizedPhone}`);
            return {
                success: true,
                message: 'OTP sent successfully',
            };
        } else {
            console.error('MSG91 error:', data);
            return {
                success: false,
                message: data.message || 'Failed to send SMS',
            };
        }
    } catch (error) {
        console.error('Error sending SMS via MSG91:', error);
        return {
            success: false,
            message: 'Failed to send SMS. Please try again.',
        };
    }
}

/**
 * Format phone number for display (e.g., +91 98765 43210)
 */
export function formatPhoneDisplay(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }

    if (cleaned.length === 12 && cleaned.startsWith('91')) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }

    return phone;
}
