import { describe, it, expect } from 'vitest';
import {
  IdempotencyError,
  IdempotencyKeyConflictError,
  IdempotencyKeyLockedError,
  MissingIdempotencyKeyError
} from '../src/IdempotencyError';

describe('IdempotencyError & RFC 9457 Problem Details', () => {
  it('formats base IdempotencyError into standard problem details object', () => {
    const err = new IdempotencyError('Generic failure', 400);
    const problem = err.toProblemDetails('/api/v1/payments');

    expect(problem.status).toBe(400);
    expect(problem.title).toBe('Idempotency Error');
    expect(problem.detail).toBe('Generic failure');
    expect(problem.instance).toBe('/api/v1/payments');
  });

  it('instantiates IdempotencyKeyConflictError with 409 status and conflict URI', () => {
    const err = new IdempotencyKeyConflictError();
    expect(err).toBeInstanceOf(IdempotencyError);
    expect(err.status).toBe(409);
    expect(err.name).toBe('IdempotencyKeyConflictError');
    expect(err.toProblemDetails().title).toBe('Idempotency Key Payload Conflict');
  });

  it('instantiates IdempotencyKeyLockedError with 409 status and locked URI', () => {
    const err = new IdempotencyKeyLockedError();
    expect(err).toBeInstanceOf(IdempotencyError);
    expect(err.status).toBe(409);
    expect(err.name).toBe('IdempotencyKeyLockedError');
    expect(err.message).toContain('already in flight');
  });

  it('instantiates MissingIdempotencyKeyError with 400 status', () => {
    const err = new MissingIdempotencyKeyError();
    expect(err).toBeInstanceOf(IdempotencyError);
    expect(err.status).toBe(400);
    expect(err.name).toBe('MissingIdempotencyKeyError');
  });
});
