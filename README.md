# Vaines Shop

Visit [shop.vaines.org](https://shop.vaines.org) to browse handcrafted goods and artisan products.

## Architecture

This shop is built using:
- **Frontend:** Hugo (static site generator)
- **Backend:** Cloudflare Pages Functions (Node.js)
- **Product Source:** Etsy API v3
- **Hosting:** Cloudflare Pages

The architecture consolidates the frontend and backend into a single Cloudflare Pages deployment with Functions for the product API.

## Prerequisites

- **Node.js** (v20 or later)
- **npm** (Node package manager)
- **Hugo** (v0.119 or later) – install via `brew install hugo` or visit [gohugo.io](https://gohugo.io/getting-started/installing/)
- **Wrangler CLI** (installed as dev dependency)

## Local Development

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/avaines/shop.vaines.org.git
cd shop.vaines.org
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
ETSY_API_KEY=your_api_key_here
ETSY_API_SHARED_SECRET=your_api_shared_secret_here
ETSY_SHOP_ID=your_shop_id_here
```

### 3. Run Development Server

Start both Hugo and Wrangler in parallel:

```bash
npm run dev
```

This runs:
- Hugo server (builds site to `public/`)
- Wrangler Pages dev server (serves `public/` + Functions on port 8788)

Visit **http://localhost:8788** to see the site.

### 4. Test the API Endpoint

The product API is available at:

```bash
curl http://localhost:8788/api/products
```

You should receive a JSON array of products.

## Building for Production

Build the Hugo site:

```bash
npm run build
```

This generates static files in `public/` ready for deployment.

## Running Tests

Run unit tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run local smoke tests (requires the local dev server to be running on `http://127.0.0.1:8788`):

```bash
npm run test:smoke
```

## Linting

Check code quality:

```bash
npm run lint
```

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `public`
   - **Functions directory:** auto-detected from `functions/` (no separate setting required)
3. Add environment variables in the Cloudflare dashboard:
   - `ETSY_API_KEY`
   - `ETSY_SHOP_ID`
   - `ETSY_API_SHARED_SECRET`
4. Scheduled sync is configured via Wrangler cron:
   - `0 0 * * *` (daily at 00:00 UTC)

Cloudflare Pages will automatically deploy on push to the main branch.

## Project Structure

```
.
├── functions/          # Cloudflare Pages Functions
│   └── api/
│       └── products.js # Product API endpoint
├── layouts/            # Hugo templates
│   └── index.html      # Homepage template
├── tests/              # Vitest test files
├── config.toml         # Hugo configuration
├── wrangler.toml       # Wrangler configuration
├── package.json        # Node.js dependencies and scripts
└── eslint.config.js    # ESLint configuration
```

## API Endpoints

### `GET /api/products`

Returns array of products.

**Response Schema:**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "images": ["string"],
    "available": boolean,
    "categories": ["string"],
    "etsyUrl": "string"
  }
]
```

### `GET /api/products?refresh=<SECRET>`

Manually triggers product sync (when Etsy integration is implemented).

## Licence

MIT
