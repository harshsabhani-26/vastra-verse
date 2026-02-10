/**
 * Runtime API safety helpers
 * 
 * Used to prevent crashes from undefined params, NaN pagination, and missing fields.
 */

/**
 * Parse integer with fallback — never returns NaN
 */
export function safeInt(value: string | null | undefined, fallback: number): number {
    if (value == null) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Coalesce string to fallback
 */
export function safeString(value: string | null | undefined, fallback: string): string {
    return value ?? fallback;
}

/**
 * Safe Decimal/number to string conversion with fallback
 */
export function safeDecimalStr(value: unknown, fallback: string = "0"): string {
    if (value == null) return fallback;
    const str = String(value);
    return str === "" || str === "undefined" || str === "null" ? fallback : str;
}

/**
 * Clamp a number to [min, max]
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Safe page size — clamp between 1 and max (default 100)
 */
export function safePageSize(value: string | null | undefined, fallback: number = 20, max: number = 100): number {
    return clamp(safeInt(value, fallback), 1, max);
}

/**
 * Safe page number — minimum 1
 */
export function safePage(value: string | null | undefined, fallback: number = 1): number {
    return Math.max(1, safeInt(value, fallback));
}
