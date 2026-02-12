/**
 * Cloudflare Pages Function: Product API
 * Returns product data from Etsy API (stub implementation for now)
 */

export async function onRequest(_context) {
  // Stub product data matching expected schema
  const products = [
    {
      id: 'prod-001',
      name: 'Handcrafted Wooden Bowl',
      description: 'Beautiful hand-turned wooden bowl made from sustainably sourced oak. Perfect for fruit, salad, or as a decorative centrepiece.',
      images: [
        'https://placehold.co/600x600/6366f1/white?text=Bowl+1',
        'https://placehold.co/600x600/6366f1/white?text=Bowl+2',
      ],
      available: true,
      categories: ['Kitchen', 'Home Decor'],
      etsyUrl: 'https://www.etsy.com/listing/example-001',
    },
    {
      id: 'prod-002',
      name: 'Ceramic Mug Set',
      description: 'Set of 2 handmade ceramic mugs with unique glaze patterns. Microwave and dishwasher safe.',
      images: [
        'https://placehold.co/600x600/8b5cf6/white?text=Mug+Set',
      ],
      available: true,
      categories: ['Kitchen', 'Pottery'],
      etsyUrl: 'https://www.etsy.com/listing/example-002',
    },
    {
      id: 'prod-003',
      name: 'Woven Wall Hanging',
      description: 'Modern macramé wall hanging in natural cotton. Adds texture and warmth to any room.',
      images: [
        'https://placehold.co/600x600/ec4899/white?text=Wall+Hanging+1',
        'https://placehold.co/600x600/ec4899/white?text=Wall+Hanging+2',
        'https://placehold.co/600x600/ec4899/white?text=Wall+Hanging+3',
      ],
      available: false,
      categories: ['Home Decor', 'Textiles'],
      etsyUrl: 'https://www.etsy.com/listing/example-003',
    },
  ];

  return new Response(JSON.stringify(products, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
