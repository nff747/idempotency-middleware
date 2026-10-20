import { describe, it, expect } from 'vitest';
import { canonicalizeJson, hashPayload, sanitizeKey, generateIdempotencyKey } from '../src/utils';

describe('Utility functions', () => {
  it('sanitizes idempotency keys by stripping non-alphanumeric chars', () => {
    expect(sanitizeKey('  Key_123-abc!@#$ ')).toBe('key_123-abc');
  });

  it('generates unique random idempotency keys with prefix', () => {
    const k1 = generateIdempotencyKey();
    const k2 = generateIdempotencyKey();
    expect(k1).toMatch(/^idempotency-/);
    expect(k1).not.toBe(k2);
  });

  it('produces identical canonical JSON strings regardless of key insertion order', () => {
    const objA = { z: 1, a: 2, m: { nestedB: true, nestedA: 'hello' } };
    const objB = { a: 2, m: { nestedA: 'hello', nestedB: true }, z: 1 };

    expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
    expect(canonicalizeJson(objA)).toBe('{"a":2,"m":{"nestedA":"hello","nestedB":true},"z":1}');
  });

  it('computes deterministic SHA-256 digests for payloads', () => {
    const payload1 = { amount: 500, currency: 'USD' };
    const payload2 = { currency: 'USD', amount: 500 };

    const hash1 = hashPayload(payload1);
    const hash2 = hashPayload(payload2);

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);

    expect(hashPayload(null)).toBe('');
    expect(hashPayload(undefined)).toBe('');
  });
});
