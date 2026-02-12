import { describe, expect, it } from 'vitest';
import { transformListing } from './transform.js';

describe('transformListing', () => {
  it('maps Etsy listing fields to the product schema', () => {
    const listing = {
      listing_id: 1234567890,
      title: 'Handmade Mug',
      description: 'Stoneware mug',
      state: 'active',
      taxonomy_path: ['Home & Living', 'Kitchen & Dining', 'Drinkware'],
      images: [
        { url_fullxfull: 'https://i.etsystatic.com/full.jpg' },
        { url_570xN: 'https://i.etsystatic.com/570.jpg' },
        'https://i.etsystatic.com/direct.jpg',
      ],
    };

    const result = transformListing(listing);

    expect(result).toEqual({
      id: '1234567890',
      name: 'Handmade Mug',
      description: 'Stoneware mug',
      images: [
        'https://i.etsystatic.com/full.jpg',
        'https://i.etsystatic.com/570.jpg',
        'https://i.etsystatic.com/direct.jpg',
      ],
      available: true,
      categories: ['Home & Living', 'Kitchen & Dining', 'Drinkware'],
      etsyUrl: 'https://www.etsy.com/listing/1234567890',
    });
  });

  it('filters invalid image/category values and marks non-active listings unavailable', () => {
    const listing = {
      listing_id: 42,
      title: 'Archived Item',
      description: 'No longer sold',
      state: 'sold_out',
      taxonomy_path: ['Art', '', null, 7],
      images: [
        { url: 'https://i.etsystatic.com/fallback.jpg' },
        { url_170x135: 'https://i.etsystatic.com/thumb.jpg' },
        {},
        null,
        99,
      ],
    };

    const result = transformListing(listing);

    expect(result.images).toEqual([
      'https://i.etsystatic.com/fallback.jpg',
      'https://i.etsystatic.com/thumb.jpg',
    ]);
    expect(result.categories).toEqual(['Art']);
    expect(result.available).toBe(false);
    expect(result.etsyUrl).toBe('https://www.etsy.com/listing/42');
  });

  it('returns safe defaults when listing data is missing', () => {
    const result = transformListing({});

    expect(result).toEqual({
      id: '',
      name: '',
      description: '',
      images: [],
      available: false,
      categories: ['Uncategorised'],
      etsyUrl: 'https://www.etsy.com/listing/',
    });
  });

  it('defaults categories to Uncategorised when taxonomy has no valid values', () => {
    const result = transformListing({
      listing_id: 7,
      taxonomy_path: ['', null, 0],
    });

    expect(result.categories).toEqual(['Uncategorised']);
  });
});
