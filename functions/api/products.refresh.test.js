import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequest } from './products.js';

const baseEnv = {
  ETSY_SHOP_ID: 'shop-1',
  ETSY_API_KEY: 'api-key-1',
  ETSY_API_SHARED_SECRET: 'secret-123',
};

function makeListing(id) {
  return {
    listing_id: id,
    title: `Listing ${id}`,
    description: 'Description',
    state: 'active',
    taxonomy_path: ['Art'],
    images: [{ url_fullxfull: `https://i.etsystatic.com/${id}.jpg` }],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('/api/products refresh handling', () => {
  it('returns 403 for invalid refresh secret', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const request = new Request('https://example.com/api/products?refresh=wrong');

    const response = await onRequest({ request, env: baseEnv });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Forbidden: invalid refresh secret' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('bypasses cache when refresh secret is valid', async () => {
    let callCount = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({ results: [makeListing(callCount)] }),
      };
    });

    const firstRefreshRequest = new Request(
      'https://example.com/api/products?refresh=secret-123',
    );
    const refreshRequest = new Request(
      'https://example.com/api/products?refresh=secret-123',
    );

    const firstResponse = await onRequest({ request: firstRefreshRequest, env: baseEnv });
    const firstPayload = await firstResponse.json();

    const refreshResponse = await onRequest({ request: refreshRequest, env: baseEnv });
    const refreshPayload = await refreshResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(refreshResponse.status).toBe(200);
    expect(callCount).toBe(2);
    expect(firstPayload[0].id).toBe('1');
    expect(refreshPayload[0].id).toBe('2');
  });

  it('returns an empty array on refresh when Etsy responds with an empty body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const refreshRequest = new Request(
      'https://example.com/api/products?refresh=secret-123',
    );

    const refreshResponse = await onRequest({ request: refreshRequest, env: baseEnv });
    const refreshPayload = await refreshResponse.json();

    expect(refreshResponse.status).toBe(200);
    expect(refreshPayload).toEqual([]);
  });

  it('returns stale products on refresh when Etsy responds with invalid JSON', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [makeListing(1)] }),
    });

    const firstRefreshRequest = new Request(
      'https://example.com/api/products?refresh=secret-123',
    );
    const refreshRequest = new Request(
      'https://example.com/api/products?refresh=secret-123',
    );

    const firstResponse = await onRequest({ request: firstRefreshRequest, env: baseEnv });
    const firstPayload = await firstResponse.json();

    fetchSpy.mockResolvedValue(new Response('<html>not json</html>', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const refreshResponse = await onRequest({ request: refreshRequest, env: baseEnv });
    const refreshPayload = await refreshResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(refreshResponse.status).toBe(200);
    expect(firstPayload[0].id).toBe('1');
    expect(refreshPayload).toEqual(firstPayload);
  });
});
