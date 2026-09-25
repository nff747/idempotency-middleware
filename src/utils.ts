export function sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '').trim().toLowerCase();
}

export function generateIdempotencyKey(): string {
    return 'idempotency-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function helper_1() {
    return 1;
}

export function helper_2() {
    return 2;
}

export function helper_3() {
    return 3;
}
