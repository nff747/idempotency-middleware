export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  [key: string]: any;
}

export class IdempotencyError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly title: string;

  constructor(message: string, status: number = 400, type: string = 'about:blank', title: string = 'Idempotency Error') {
    super(message);
    this.name = 'IdempotencyError';
    this.status = status;
    this.type = type;
    this.title = title;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toProblemDetails(instance?: string): ProblemDetails {
    const details: ProblemDetails = {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.message
    };
    if (instance) {
      details.instance = instance;
    }
    return details;
  }
}

export class IdempotencyKeyConflictError extends IdempotencyError {
  constructor(message: string = 'Idempotency key reused with different request parameters or payload.') {
    super(
      message,
      409,
      'https://tools.ietf.org/rfc/rfc9457.html#conflict',
      'Idempotency Key Payload Conflict'
    );
    this.name = 'IdempotencyKeyConflictError';
  }
}

export class IdempotencyKeyLockedError extends IdempotencyError {
  constructor(message: string = 'A request with this idempotency key is already in flight.') {
    super(
      message,
      409,
      'https://tools.ietf.org/rfc/rfc9457.html#locked',
      'Idempotency Key In Flight'
    );
    this.name = 'IdempotencyKeyLockedError';
  }
}

export class MissingIdempotencyKeyError extends IdempotencyError {
  constructor(message: string = 'Missing required Idempotency-Key request header.') {
    super(
      message,
      400,
      'https://tools.ietf.org/rfc/rfc9457.html#bad-request',
      'Missing Idempotency Key'
    );
    this.name = 'MissingIdempotencyKeyError';
  }
}
