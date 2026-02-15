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
        price: {
          amount: 3800,
          divisor: 100,
          currency_code: 'GBP',
        },
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

async function loadWorker() {
  vi.resetModules();
  return (await import('../index.js')).default;
}

describe('/api/products integration', () => {
  it('returns transformed product schema from mocked Etsy response', async () => {
    const worker = await loadWorker();

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeEtsyResponse(),
    });

    const request = new Request('http://localhost:8788/api/products');
    const response = await worker.fetch(request, baseEnv, {});
    const result = await response.json();

    expect(response.status).toBe(200);
    const payload = result.products;
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
      price: {
        amount: 38,
        currency: 'GBP',
        display: '£38.00',
      },
      etsyUrl: 'https://www.etsy.com/listing/987654321',
    });

    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
