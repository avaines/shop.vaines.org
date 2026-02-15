import { describe, expect, it, vi } from 'vitest';
import { fetchActiveListings } from './etsy.js';

describe('fetchActiveListings', () => {
  it('requests active listings with image includes and listing image fields', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });

    await fetchActiveListings('shop-123', 'api-key-123', 'shared-secret-456', fetchImpl);

    expect(fetchImpl).toHaveBeenCalled();
    const firstCall = fetchImpl.mock.calls[0];
    const [requestUrl, options] = firstCall;

    expect(requestUrl).toContain('/v3/application/shops/shop-123/listings/active');
    expect(options).toMatchObject({
      method: 'GET',
      headers: {
        'x-api-key': 'api-key-123:shared-secret-456',
      },
    });
  });

  it('returns an empty result set when Etsy returns an empty successful body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    const result = await fetchActiveListings('shop-123', 'api-key-123', 'shared-secret-456', fetchImpl);

    expect(result).toEqual({ results: [] });
  });

  it('throws a controlled error when Etsy returns invalid JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<html>nope</html>', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));

    await expect(fetchActiveListings('shop-123', 'api-key-123', 'shared-secret-456', fetchImpl)).rejects.toThrow(
      'Etsy API returned invalid JSON',
    );
  });
});
