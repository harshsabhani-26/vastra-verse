import * as crypto from 'crypto';

// Generate a random base32 secret for TOTP
export function generateTOTPSecret(): string {
    const buffer = crypto.randomBytes(20);
    return base32Encode(buffer);
}

// Base32 encoding (RFC 4648)
function base32Encode(buffer: Buffer): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += charset[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += charset[(value << (5 - bits)) & 31];
    }

    return output;
}

// Generate TOTP code
export function generateTOTP(secret: string, window = 0): string {
    const epoch = Math.floor(Date.now() / 1000);
    const time = Math.floor(epoch / 30) + window;

    const buffer = Buffer.alloc(8);
    buffer.writeBigInt64BE(BigInt(time));

    const secretBuffer = base32Decode(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = (
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff)
    );

    return (code % 1000000).toString().padStart(6, '0');
}

// Base32 decoding
function base32Decode(encoded: string): Buffer {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const output: number[] = [];

    for (let i = 0; i < encoded.length; i++) {
        const idx = charset.indexOf(encoded[i].toUpperCase());
        if (idx === -1) continue;

        value = (value << 5) | idx;
        bits += 5;

        if (bits >= 8) {
            output.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }

    return Buffer.from(output);
}

// Verify TOTP code (with time window for clock drift)
export function verifyTOTP(secret: string, token: string, window = 1): boolean {
    // Check current time window and adjacent windows
    for (let i = -window; i <= window; i++) {
        const expected = generateTOTP(secret, i);
        if (expected === token) {
            return true;
        }
    }
    return false;
}

// Generate QR code data URL for authenticator apps
export function generateQRCodeURL(
    secret: string,
    accountName: string,
    issuer = 'MyApp'
): string {
    const otpauthURL = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
        accountName
    )}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    return otpauthURL;
}

// Generate backup codes (8 codes, 8 characters each)
export function generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = crypto.randomBytes(4).toString('hex').toUpperCase();
        codes.push(code);
    }
    return codes;
}
