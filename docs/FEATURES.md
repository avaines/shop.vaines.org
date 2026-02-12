# Features & Backlog

## Current State
Legacy Hugo site with separate Cloudflare Worker fetching Square API data. Refactoring to unified Cloudflare Pages + Functions architecture using Etsy API.

---

## Core Features

### 1. Etsy Product Data Function
**Status:** Not Started  
**Priority:** P0 (Blocker)

- [ ] Pages Function at `/api/products` returns JSON product list
- [ ] Scheduled trigger: daily at midnight (00:00 UTC)
- [ ] Manual trigger: `GET /api/products?refresh=<SECRET>` forces immediate sync
- [ ] Returns product schema: `{ id, name, description, images[], available, categories[], etsyUrl }`
- [ ] Uses Etsy API v3 with credentials from environment variables
- [ ] Returns cached response if < 60 minutes old (no external KV needed)
- [ ] Handles Etsy API errors gracefully (returns last good data or empty array)

**Acceptance Criteria:**
- Function responds within 3 seconds for cached requests
- Successfully parses Etsy API response
- Images array contains direct Etsy CDN URLs
- Categories extracted from Etsy listing taxonomy
- Invalid refresh secret returns 403
- Missing Etsy credentials returns 500 with helpful error

---

### 2. Hugo Site Structure
**Status:** Not Started  
**Priority:** P0 (Blocker)

- [ ] Homepage displays product grid (4 columns desktop, 2 mobile)
- [ ] Individual product detail pages (`/products/<slug>`)
- [ ] Dynamic category pages (`/categories/<category-slug>`)
- [ ] About page (`/about`)
- [ ] Contact page (`/contact`) with Formspree form
- [ ] Responsive navigation header with category menu
- [ ] Footer with basic links

**Acceptance Criteria:**
- `config.toml` contains `productJsonUrl = "/api/products"`
- Products fetch data from Pages Function on page load
- Navigation auto-populates from product categories
- "Uncategorised" default category if product has no categories
- All pages mobile-responsive (viewport meta tag)
- Contact form posts to Formspree endpoint
- Site builds successfully with `hugo` command

---

### 3. Product Display & Interaction
**Status:** Not Started  
**Priority:** P0 (Blocker)

- [ ] Image carousel/slider for product images (prev/next buttons)
- [ ] "View on Etsy" button linking to `etsyUrl`
- [ ] Product availability badge (In Stock / Sold Out)
- [ ] Product description rendered as HTML (handle line breaks)
- [ ] Category filter UI on homepage
- [ ] Graceful fallback if API unavailable (show cached/static message)

**Acceptance Criteria:**
- Carousel navigable via keyboard (arrow keys)
- Images lazy-load for performance
- Sold out products visually distinct (greyed out/badge)
- Categories in nav are clickable, filter to category pages
- If `/api/products` fails, display user-friendly error

---

### 4. Local Development & Deployment
**Status:** Not Started  
**Priority:** P0 (Blocker)

- [ ] `README.md` with setup instructions
- [ ] `.env.example` file documenting required variables
- [ ] Hugo dev server runs locally (`hugo server`)
- [ ] Pages Function testable locally (`wrangler pages dev`)
- [ ] Single command to run both services concurrently
- [ ] Deployment via Cloudflare Pages dashboard (Git integration)
- [ ] Environment variables configured in CF dashboard

**Acceptance Criteria:**
- New developer can run locally in < 10 minutes following README
- `.env` file not committed (in `.gitignore`)
- Wrangler config (`wrangler.toml`) present for Pages Functions
- README includes deployment steps
- Local function endpoint proxied correctly by Hugo dev server

---

### 5. Quality Gates
**Status:** Not Started  
**Priority:** P1 (High)

- [ ] ESLint configured for Pages Function code
- [ ] Unit tests for Etsy API parsing logic (Vitest or Node test runner)
- [ ] Integration test: mock Etsy API, verify product JSON schema
- [ ] Build verification: Hugo builds without errors
- [ ] Linting passes before commit (optional pre-commit hook)

**Acceptance Criteria:**
- `npm test` runs all tests and passes
- `npm run lint` checks code style
- Test coverage >70% for function logic
- CI-ready (can add GitHub Actions later)
- README documents how to run tests

---

## Future Features
- Pagination for product lists (if >50 products)
- Search functionality
- Product sorting (price, date added, alphabetical)
- Cloudflare Analytics integration
- Image optimisation/caching via Cloudflare Images
- Admin dashboard for manual sync trigger (auth required)

---

## Out of Scope
- Shopping cart (handled by Etsy)
- Payment processing (handled by Etsy)
- Inventory management (Etsy source of truth)
- User accounts/authentication
- Product reviews (use Etsy's)
- Multi-language support
