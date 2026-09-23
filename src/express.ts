import { Request, Response, NextFunction } from 'express';
import { IdempotencyManager } from './manager.js';
import { IdempotencyOptions, ICache } from './types.js';

export function expressIdempotency(options?: IdempotencyOptions & { cache?: ICache }) {
  const manager = new IdempotencyManager(options);

  return async (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}
