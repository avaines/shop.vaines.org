# Features & Backlog

## Current State
Legacy Hugo site with separate Cloudflare Worker fetching Square API data. Refactoring to unified Cloudflare Pages + Functions architecture using Etsy API.

---

## Core Features

### 1. Etsy Product Data Function
**Status:** In Progress (Stub Implementation Complete)  
**Priority:** P0 (Blocker)

- [x] Pages Function at `/api/products` returns JSON product list
- [x] Scheduled trigger: daily at midnight (00:00 UTC)
- [x] Manual trigger: `GET /api/products?refresh=<SECRET>` forces immediate sync
- [x] Returns product schema: `{ id, name, description, images[], available, categories[], etsyUrl }`
- [x] Uses Etsy API v3 with credentials from environment variables
- [x] Returns cached response if < 60 minutes old (no external KV needed)
- [x] Handles Etsy API errors gracefully (returns last good data or empty array)

**Acceptance Criteria:**
- Function responds within 3 seconds for cached requests
- Successfully parses Etsy API response
- Images array contains direct Etsy CDN URLs
- Categories extracted from Etsy listing taxonomy
- Invalid refresh secret returns 403
- [x] Missing Etsy credentials returns 500 with helpful error

---

### 2. Hugo Site Structure
**Status:** In Progress (Basic Homepage Complete)  
**Priority:** P0 (Blocker)

- [x] Homepage displays product grid (4 columns desktop, 2 mobile)
- [ ] Individual product detail pages (`/products/<slug>`)
- [x] Dynamic category pages (`/categories/<category-slug>`)
- [x] About page (`/about`)
- [x] Contact page (`/contact`) with Formspree form
- [x] Responsive navigation header with category menu
- [x] Footer with basic links

**Acceptance Criteria:**
- [ ] `config.toml` contains `productJsonUrl = "/api/products"`
- [x] Products fetch data from Pages Function on page load
- [x] Navigation auto-populates from product categories
- [x] "Uncategorised" default category if product has no categories
- [x] All pages mobile-responsive (viewport meta tag)
- [x] Contact form posts to Formspree endpoint
- [x] Site builds successfully with `hugo` command

---

### 3. Product Display & Interaction
**Status:** In Progress (Basic Display Complete)  
**Priority:** P0 (Blocker)

- [x] Image carousel/slider for product images (prev/next buttons)
- [x] "View on Etsy" button linking to `etsyUrl`
- [x] Product availability badge (In Stock / Sold Out)
- [x] Product description rendered as HTML (handle line breaks)
- [ ] Category filter UI on homepage
- [x] Graceful fallback if API unavailable (show cached/static message)

**Acceptance Criteria:**
- [x] Carousel navigable via keyboard (arrow keys)
- [x] Images lazy-load for performance
- [x] Sold out products visually distinct (greyed out/badge)
- [x] Categories in nav are clickable, filter to category pages
- If `/api/products` fails, display user-friendly error

---

### 4. Local Development & Deployment
**Status:** Complete (Local Dev Ready)  
**Priority:** P0 (Blocker)

- [x] `README.md` with setup instructions
- [x] `.env.example` file documenting required variables
- [ ] Hugo dev server runs locally (`hugo server`)
- [x] Pages Function testable locally (`wrangler pages dev`)
- [x] Single command to run both services concurrently
- [ ] Deployment via Cloudflare Pages dashboard (Git integration)
- [ ] Environment variables configured in CF dashboard

**Acceptance Criteria:**
- [x] New developer can run locally in < 10 minutes following README
- [x] `.env` file not committed (in `.gitignore`)
- [x] Wrangler config (`wrangler.toml`) present for Pages Functions
- [x] README includes deployment steps
- [x] Local function endpoint proxied correctly by Hugo dev server

---

### 5. Quality Gates
**Status:** Complete (Tooling Configured)  
**Priority:** P1 (High)

- [x] ESLint configured for Pages Function code
- [x] Unit tests for Etsy API parsing logic (Vitest or Node test runner)
- [x] Integration test: mock Etsy API, verify product JSON schema
- [x] Build verification: Hugo builds without errors
- [ ] Linting passes before commit (optional pre-commit hook)

**Acceptance Criteria:**
- [x] `npm test` runs all tests and passes
- [x] `npm run lint` checks code style
- [ ] Test coverage >70% for function logic
- [ ] CI-ready (can add GitHub Actions later)
- [x] README documents how to run tests

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
