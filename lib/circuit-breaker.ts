/**
 * Circuit Breaker Pattern Implementation
 * 
 * Uses Opossum to protect external service calls:
 * - Razorpay: 10s timeout, 50% threshold, 30s reset
 * - Shiprocket: 15s timeout, 50% threshold, 60s reset
 * - MSG91: 10s timeout, 50% threshold, 30s reset
 * 
 * When circuit opens → returns fallback response
 * When circuit closes → resumes normal calls
 */

import CircuitBreaker from 'opossum';
import { logInfo, logError, logSecurityEvent } from '@/lib/logger';

// ============================================================
// Types
// ============================================================

interface CircuitBreakerOptions {
    timeout: number;
    errorThresholdPercentage: number;
    resetTimeout: number;
    volumeThreshold: number;
    name: string;
}

interface CircuitBreakerState {
    name: string;
    state: 'closed' | 'open' | 'half-open';
    stats: {
        successes: number;
        failures: number;
        timeouts: number;
        fallbacks: number;
    };
}

// ============================================================
// Circuit Breaker Configs
// ============================================================

const BREAKER_CONFIGS: Record<string, CircuitBreakerOptions> = {
    razorpay: {
        timeout: 10000,           // 10s timeout
        errorThresholdPercentage: 50,
        resetTimeout: 30000,      // 30s before half-open
        volumeThreshold: 5,       // Need 5 calls before tripping
        name: 'razorpay',
    },
    shiprocket: {
        timeout: 15000,           // 15s timeout
        errorThresholdPercentage: 50,
        resetTimeout: 60000,      // 60s before half-open
        volumeThreshold: 5,
        name: 'shiprocket',
    },
    msg91: {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 5,
        name: 'msg91',
    },
};

// ============================================================
// Circuit Breaker Registry
// ============================================================

const breakers: Map<string, CircuitBreaker> = new Map();

function logStateChange(name: string, state: string) {
    if (state === 'open') {
        logSecurityEvent('CIRCUIT_OPEN', {
            service: name,
            message: `Circuit breaker opened for ${name} — calls will receive fallback response`,
        });
    } else if (state === 'halfOpen') {
        logInfo('CIRCUIT_BREAKER', `Circuit half-open for ${name} — testing next call`, { service: name });
    } else if (state === 'close') {
        logInfo('CIRCUIT_BREAKER', `Circuit closed for ${name} — service recovered`, { service: name });
    }
}

/**
 * Create or retrieve a circuit breaker for a service
 */
export function getCircuitBreaker<TArgs extends any[] = any[], TResult = any>(
    serviceName: string,
    action: (...args: TArgs) => Promise<TResult>,
    fallback?: (...args: TArgs) => TResult
): CircuitBreaker<TArgs, TResult> {
    if (breakers.has(serviceName)) {
        return breakers.get(serviceName)! as CircuitBreaker<TArgs, TResult>;
    }

    const config = BREAKER_CONFIGS[serviceName] || {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
        volumeThreshold: 5,
        name: serviceName,
    };

    const breaker = new CircuitBreaker<TArgs, TResult>(action, {
        timeout: config.timeout,
        errorThresholdPercentage: config.errorThresholdPercentage,
        resetTimeout: config.resetTimeout,
        volumeThreshold: config.volumeThreshold,
        name: config.name,
    });

    // Event listeners for monitoring
    breaker.on('open', () => logStateChange(serviceName, 'open'));
    breaker.on('halfOpen', () => logStateChange(serviceName, 'halfOpen'));
    breaker.on('close', () => logStateChange(serviceName, 'close'));

    breaker.on('success', () => {
        logInfo('CIRCUIT_BREAKER', `Call succeeded: ${serviceName}`, { service: serviceName });
    });

    breaker.on('timeout', () => {
        logError('CIRCUIT_BREAKER', new Error(`Timeout on ${serviceName}`), { service: serviceName });
    });

    breaker.on('reject', () => {
        logSecurityEvent('CIRCUIT_REJECT', {
            service: serviceName,
            message: `Call rejected — circuit is open for ${serviceName}`,
        });
    });

    // Set fallback if provided
    if (fallback) {
        breaker.fallback(fallback);
    }

    breakers.set(serviceName, breaker as CircuitBreaker);
    return breaker;
}

// ============================================================
// Pre-built Service Wrappers
// ============================================================

/**
 * Execute a Razorpay API call through circuit breaker
 */
export async function withRazorpayBreaker<T>(
    action: () => Promise<T>,
    fallbackValue?: T
): Promise<T> {
    const breaker = getCircuitBreaker<[], T>(
        'razorpay',
        action,
        fallbackValue !== undefined ? (() => fallbackValue) : undefined
    );
    return breaker.fire();
}

/**
 * Execute a Shiprocket API call through circuit breaker
 */
export async function withShiprocketBreaker<T>(
    action: () => Promise<T>,
    fallbackValue?: T
): Promise<T> {
    const breaker = getCircuitBreaker<[], T>(
        'shiprocket',
        action,
        fallbackValue !== undefined ? (() => fallbackValue) : undefined
    );
    return breaker.fire();
}

/**
 * Execute an MSG91 API call through circuit breaker
 */
export async function withMSG91Breaker<T>(
    action: () => Promise<T>,
    fallbackValue?: T
): Promise<T> {
    const breaker = getCircuitBreaker<[], T>(
        'msg91',
        action,
        fallbackValue !== undefined ? (() => fallbackValue) : undefined
    );
    return breaker.fire();
}

// ============================================================
// Health & Monitoring
// ============================================================

/**
 * Get the state of all circuit breakers
 */
export function getCircuitBreakerStates(): CircuitBreakerState[] {
    const states: CircuitBreakerState[] = [];

    for (const [name, breaker] of breakers) {
        const stats = breaker.stats;
        let state: 'closed' | 'open' | 'half-open' = 'closed';
        if (breaker.opened) state = 'open';
        else if (breaker.halfOpen) state = 'half-open';

        states.push({
            name,
            state,
            stats: {
                successes: stats.successes,
                failures: stats.failures,
                timeouts: stats.timeouts,
                fallbacks: stats.fallbacks,
            },
        });
    }

    return states;
}

/**
 * Check if a specific service circuit breaker is healthy (closed)
 */
export function isServiceHealthy(serviceName: string): boolean {
    const breaker = breakers.get(serviceName);
    if (!breaker) return true; // No breaker = assumed healthy
    return !breaker.opened;
}

/**
 * Reset a specific circuit breaker (admin action)
 */
export function resetCircuitBreaker(serviceName: string): boolean {
    const breaker = breakers.get(serviceName);
    if (!breaker) return false;
    breaker.close();
    logInfo('CIRCUIT_BREAKER', `Circuit manually reset for ${serviceName}`, { service: serviceName });
    return true;
}
