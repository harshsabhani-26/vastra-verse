import prisma from '@/lib/prisma';

export interface PasswordPolicy {
    minLength: number;
    requireUpper: boolean;
    requireLower: boolean;
    requireNumber: boolean;
    requireSymbol: boolean;
}

export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number; // 0-100
}

// Common weak passwords to block
const COMMON_PASSWORDS = [
    'password', 'Password1', '12345678', 'qwerty', 'abc123', 'password123',
    'admin', 'Admin123', 'letmein', 'welcome', 'monkey', '1234567890',
    'Password1!', 'Qwerty123', 'Welcome123'
];

export async function validatePassword(
    password: string,
    policy?: PasswordPolicy
): Promise<PasswordValidationResult> {
    const errors: string[] = [];
    let score = 0;

    // Get policy from database if not provided
    if (!policy) {
        const settings = await prisma.systemSettings.findFirst();
        policy = {
            minLength: settings?.passwordMinLength || 12,
            requireUpper: settings?.passwordRequireUpper ?? true,
            requireLower: settings?.passwordRequireLower ?? true,
            requireNumber: settings?.passwordRequireNumber ?? true,
            requireSymbol: settings?.passwordRequireSymbol ?? true,
        };
    }

    // Check length
    if (password.length < policy.minLength) {
        errors.push(`Password must be at least ${policy.minLength} characters long`);
    } else {
        score += Math.min(20, password.length * 2);
    }

    // Check uppercase
    if (policy.requireUpper && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
        score += 15;
    }

    // Check lowercase
    if (policy.requireLower && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
        score += 15;
    }

    // Check numbers
    if (policy.requireNumber && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    } else if (/[0-9]/.test(password)) {
        score += 15;
    }

    // Check symbols
    if (policy.requireSymbol && !/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    } else if (/[^A-Za-z0-9]/.test(password)) {
        score += 20;
    }

    // Check for common passwords
    if (COMMON_PASSWORDS.includes(password)) {
        errors.push('This password is too common. Please choose a more unique password');
        score = Math.min(score, 20);
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
        score -= 10;
    }

    // Check for sequential characters (abc, 123)
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i.test(password)) {
        score -= 10;
    }

    // Bonus for length
    if (password.length > 16) {
        score += 15;
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 40) {
        strength = 'weak';
    } else if (score < 60) {
        strength = 'medium';
    } else if (score < 80) {
        strength = 'strong';
    } else {
        strength = 'very-strong';
    }

    return {
        valid: errors.length === 0,
        errors,
        strength,
        score,
    };
}

export function getPasswordStrengthColor(strength: string): string {
    switch (strength) {
        case 'weak':
            return 'text-red-600';
        case 'medium':
            return 'text-yellow-600';
        case 'strong':
            return 'text-blue-600';
        case 'very-strong':
            return 'text-green-600';
        default:
            return 'text-gray-600';
    }
}

export function getPasswordStrengthText(strength: string): string {
    switch (strength) {
        case 'weak':
            return 'Weak';
        case 'medium':
            return 'Medium';
        case 'strong':
            return 'Strong';
        case 'very-strong':
            return 'Very Strong';
        default:
            return 'Unknown';
    }
}
