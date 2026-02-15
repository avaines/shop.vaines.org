const DEFAULT_TTL_MS = 60 * 60 * 1000;

/**
 * Simple in-memory cache with TTL expiry.
 */
export class Cache {
  /**
   * @param {number} [ttlMs]
   * @param {() => number} [now]
   */
  constructor(ttlMs = DEFAULT_TTL_MS, now = () => Date.now()) {
    this.ttlMs = ttlMs;
    this.now = now;
    this.store = new Map();
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: this.now(),
    });
  }

  /**
   * @param {string} key
   * @returns {unknown | null}
   */
  get(key) {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    const ageMs = this.now() - entry.timestamp;

    if (ageMs > this.ttlMs) {
      return null;
    }

    return entry.value;
  }

  /**
   * Returns the cached value even if TTL has expired.
   * @param {string} key
   * @returns {unknown | null}
   */
  getStale(key) {
    const entry = this.store.get(key);
    return entry ? entry.value : null;
  }

  /**
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key);
  }
}

export { DEFAULT_TTL_MS };
