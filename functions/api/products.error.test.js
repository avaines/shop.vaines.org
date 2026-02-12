import { afterEach, describe, expect, it, vi } from 'vitest';

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

async function loadOnRequest() {
  vi.resetModules();
  return (await import('./products.js')).onRequest;
}

describe('/api/products Etsy error handling', () => {
  it('returns stale cached data when Etsy fetch fails', async () => {
    const onRequest = await loadOnRequest();
    const request = new Request('https://example.com/api/products');
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ results: [makeListing(1)] }),
      })
      .mockRejectedValueOnce(new Error('network failed'));

    const firstResponse = await onRequest({ request, env: baseEnv });
    const firstPayload = await firstResponse.json();

    const secondResponse = await onRequest({
      request: new Request('https://example.com/api/products?refresh=secret-123'),
      env: baseEnv,
    });
    const secondPayload = await secondResponse.json();

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstPayload).toEqual(secondPayload);
    expect(secondPayload[0].id).toBe('1');
    expect(logSpy).toHaveBeenCalledOnce();
  });

  it('returns an empty array when Etsy fetch fails and no cache exists', async () => {
    const onRequest = await loadOnRequest();
    const request = new Request(
      `https://example.com/api/products?refresh=${baseEnv.ETSY_API_SHARED_SECRET}`,
    );
    const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('api down'));

    const response = await onRequest({ request, env: baseEnv });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual([]);
    expect(logSpy).toHaveBeenCalledOnce();
  });
});
