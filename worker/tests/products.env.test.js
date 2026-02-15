import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadWorker() {
  vi.resetModules();
  return (await import('../index.js')).default;
}

describe('/api/products environment validation', () => {
  it('returns 500 when ETSY_API_KEY is missing', async () => {
    const worker = await loadWorker();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('http://localhost:8788/api/products');
    const response = await worker.fetch(request, {
      ETSY_SHOP_ID: 'shop-1',
      ETSY_API_SHARED_SECRET: 'secret-1',
    }, {});
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Service configuration error');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 500 and lists both missing variables', async () => {
    const worker = await loadWorker();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('http://localhost:8788/api/products');
    const response = await worker.fetch(request, {}, {});
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Service configuration error');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
