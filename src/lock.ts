export class InFlightLock {
  private activeLocks = new Map<string, { timeoutId: NodeJS.Timeout; acquiredAt: number }>();

  /**
   * Attempts to acquire an in-flight lock for the given idempotency key.
   * If already locked, returns false. If acquired, sets an auto-release TTL.
   */
  public acquire(key: string, ttlMs: number = 30000): boolean {
    if (this.activeLocks.has(key)) {
      return false;
    }
    const timeoutId = setTimeout(() => {
      this.release(key);
    }, ttlMs);

    this.activeLocks.set(key, { timeoutId, acquiredAt: Date.now() });
    return true;
  }

  /**
   * Releases an in-flight lock for the given key.
   */
  public release(key: string): boolean {
    const lock = this.activeLocks.get(key);
    if (!lock) return false;
    clearTimeout(lock.timeoutId);
    return this.activeLocks.delete(key);
  }

  /**
   * Checks whether a lock is currently held for the key.
   */
  public isLocked(key: string): boolean {
    return this.activeLocks.has(key);
  }

  public activeCount(): number {
    return this.activeLocks.size;
  }

  public clear(): void {
    for (const lock of this.activeLocks.values()) {
      clearTimeout(lock.timeoutId);
    }
    this.activeLocks.clear();
  }
}
