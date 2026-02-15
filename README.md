# Vaines Shop

[![Tests](https://github.com/avaines/shop.vaines.org/actions/workflows/test.yml/badge.svg)](https://github.com/avaines/shop.vaines.org/actions/workflows/test.yml)

Visit [shop.vaines.org](https://shop.vaines.org) to browse handcrafted goods and artisan products.

## Architecture

This shop is built using:
- **Frontend:** Hugo (static site generator) in `pages/`
- **Backend:** Cloudflare Worker (Node.js) in `worker/`
- **Product Source:** Etsy API v3
- **Hosting:** Cloudflare Pages (frontend) + Cloudflare Workers (API)

The architecture separates frontend and backend into independent projects:
- **Pages project:** Hugo static site served via Cloudflare Pages
- **Worker project:** API endpoint with scheduled cache refresh

## Project Structure

```
.
├── pages/              # Hugo static site
│   ├── config.toml
│   ├── content/
│   ├── layouts/
│   ├── static/
│   ├── data/
│   ├── public/         # Build output
│   ├── tests/          # Layout tests
│   └── wrangler.toml   # Pages config
│
├── worker/             # Cloudflare Worker API
│   ├── index.js        # Worker entry point
│   ├── wrangler.toml   # Worker config + cron
│   ├── lib/            # etsy.js, cache.js, transform.js
│   └── tests/          # API tests
│
├── package.json        # Root npm scripts
├── vitest.config.js    # Test configuration
└── eslint.config.js    # Linter configuration
```

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

Start both projects in parallel:

```bash
npm run dev
```

This runs:
- Hugo server on **http://localhost:1313** (port 1313)
- Worker dev server on **http://localhost:8788** (port 8788)

Or run them individually:

```bash
npm run dev:pages   # Hugo only
npm run dev:worker  # Worker only
```

### 4. Test the API Endpoint

The Worker serves the product API:

```bash
curl http://localhost:8788/api/products
```

Update your frontend to call the Worker API endpoint.

## Building for Production

Build both projects:

```bash
npm run build
```

Or build individually:

```bash
npm run build:pages   # Hugo static site → pages/public/
npm run build:worker  # Worker validation (dry-run)
```

## Running Tests

Run all tests (Pages + Worker):

```bash
npm test
```

Run tests separately:

```bash
npm run test:pages   # Layout tests only
npm run test:worker  # API tests only
```

Run linter:

```bash
npm run lint
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Linting

Check code quality:

```bash
npm run lint
```

## Deployment

### Cloudflare Pages (Frontend)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Root directory:** `pages`
   - **Build command:** `hugo`
   - **Build output directory:** `public`
   - **Environment variable:** `HUGO_VERSION=0.143.1`
3. Deploy on push to main branch

### Cloudflare Worker (API)

1. Deploy from the worker directory:
   ```bash
   cd worker
   wrangler deploy
   ```

2. Set secrets:
   ```bash
   wrangler secret put ETSY_API_KEY
   wrangler secret put ETSY_API_SHARED_SECRET
   wrangler secret put ETSY_SHOP_ID
   ```

3. Scheduled cache refresh runs automatically daily at 00:00 UTC (configured in `worker/wrangler.toml`)

4. Note your Worker URL (e.g., `vaines-shop-api.your-subdomain.workers.dev`)

5. Update frontend to call Worker API:
   - In `pages/static/js/products.js`, update API endpoint to Worker URL
   - Or set up a custom route: `shop.vaines.org/api/* → Worker`

### Deployment Script

Deploy both projects:

```bash
npm run deploy
```

This runs:
- `npm run deploy:pages` (deploys Hugo site via Wrangler)
- `npm run deploy:worker` (deploys Worker)

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

Returns array of products (cached for 60 minutes).

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "images": ["string"],
    "available": "boolean",
    "categories": ["string"],
    "etsyUrl": "string"
  }
]
```

**Cache Refresh:**

Products are automatically refreshed daily at 00:00 UTC via the Worker's scheduled handler.

**Local development:** Restart the Worker dev server (`Ctrl+C` in the worker terminal, then `npm run dev:worker`) to clear the in-memory cache and fetch fresh data from Etsy.

**Production:** The scheduled handler runs automatically daily. You can also trigger it manually:
```bash
cd worker
wrangler tail  # Watch logs
# Wait for scheduled execution or trigger via Cloudflare dashboard
```
