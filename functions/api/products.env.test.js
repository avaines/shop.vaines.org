import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './products.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/api/products environment validation', () => {
  it('returns 500 when ETSY_API_KEY is missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('https://example.com/api/products');
    const response = await onRequest({
      request,
      env: {
        ETSY_SHOP_ID: 'shop-1',
        ETSY_API_SHARED_SECRET: 'secret-1',
      },
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('ETSY_API_KEY');
    expect(body.missing).toEqual(['ETSY_API_KEY']);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 500 and lists both missing variables', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('https://example.com/api/products');
    const response = await onRequest({
      request,
      env: {},
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain('ETSY_API_KEY');
    expect(body.error).toContain('ETSY_SHOP_ID');
    expect(body.missing).toEqual([
      'ETSY_API_KEY',
      'ETSY_SHOP_ID',
      'ETSY_API_SHARED_SECRET',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
