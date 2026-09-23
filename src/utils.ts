export function sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '').trim().toLowerCase();
}

export function generateIdempotencyKey(): string {
    return 'idempotency-' + Math.random().toString(36).substring(2);
}
