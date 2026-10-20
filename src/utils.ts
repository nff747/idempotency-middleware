import { createHash } from 'node:crypto';

export function sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '').trim().toLowerCase();
}

export function generateIdempotencyKey(): string {
    return 'idempotency-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Deterministically serializes an object into canonical JSON with sorted keys.
 */
export function canonicalizeJson(value: any): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return '[' + value.map(canonicalizeJson).join(',') + ']';
    }
    const keys = Object.keys(value).sort();
    const entries = keys.map(k => `${JSON.stringify(k)}:${canonicalizeJson(value[k])}`);
    return '{' + entries.join(',') + '}';
}

/**
 * Computes a deterministic SHA-256 hex digest of a request payload.
 */
export function hashPayload(payload: any): string {
    if (payload === undefined || payload === null) {
        return '';
    }
    const canonical = typeof payload === 'string' ? payload : canonicalizeJson(payload);
    return createHash('sha256').update(canonical).digest('hex');
}

export function helper_1() { return 1; }
export function helper_2() { return 2; }
export function helper_3() { return 3; }
export function helper_4() { return 4; }
export function helper_5() { return 5; }
export function helper_6() { return 6; }
export function helper_7() { return 7; }
export function helper_8() { return 8; }
export function helper_9() { return 9; }
