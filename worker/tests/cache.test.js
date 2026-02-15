import { describe, expect, it, vi } from 'vitest';
import { Cache } from '../lib/cache.js';

describe('Cache', () => {
  it('returns a value after set when still within TTL', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:00:00Z'));

    const cache = new Cache(60 * 1000);
    const value = { id: 'p1', name: 'Product 1' };

    cache.set('products', value);
    vi.advanceTimersByTime(30 * 1000);

    expect(cache.get('products')).toEqual(value);

    vi.useRealTimers();
  });

  it('returns null after TTL expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T10:00:00Z'));

    const cache = new Cache(60 * 1000);
    cache.set('products', ['a', 'b']);

    vi.advanceTimersByTime(60 * 1000 + 1);

    expect(cache.get('products')).toBeNull();

    vi.useRealTimers();
  });
});
