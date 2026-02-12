import { afterEach, describe, expect, it, vi } from 'vitest';

const baseEnv = {
  ETSY_SHOP_ID: 'shop-1',
  ETSY_API_KEY: 'api-key-1',
  ETSY_API_SHARED_SECRET: 'secret-123',
};

function makeEtsyResponse() {
  return {
    count: 1,
    results: [
      {
        listing_id: 987654321,
        title: 'Ceramic Plant Pot',
        description: 'Hand-thrown and glazed.',
        state: 'active',
        taxonomy_path: ['Home & Living', 'Home Decor', 'Planters & Pots'],
        images: [
          { url_fullxfull: 'https://i.etsystatic.com/full.jpg' },
          { url_570xN: 'https://i.etsystatic.com/570.jpg' },
        ],
      },
    ],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

async function loadOnRequest() {
  vi.resetModules();
  return (await import('./products.js')).onRequest;
}

describe('/api/products integration', () => {
  it('returns transformed product schema from mocked Etsy response', async () => {
    const onRequest = await loadOnRequest();

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeEtsyResponse(),
    });

    const response = await onRequest({
      request: new Request('https://example.com/api/products'),
      env: baseEnv,
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(1);

    const product = payload[0];
    expect(product).toEqual({
      id: '987654321',
      name: 'Ceramic Plant Pot',
      description: 'Hand-thrown and glazed.',
      images: [
        'https://i.etsystatic.com/full.jpg',
        'https://i.etsystatic.com/570.jpg',
      ],
      available: true,
      categories: ['Home & Living', 'Home Decor', 'Planters & Pots'],
      etsyUrl: 'https://www.etsy.com/listing/987654321',
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
