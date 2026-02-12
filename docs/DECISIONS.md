# Architectural Decision Records

## ADR-001: Tech Stack for Refactor
**Date:** 2026-02-12
**Status:** Accepted

### Context
Refactoring existing Hugo + Cloudflare Workers + Square API shop to use Etsy API. Need unified architecture for easier maintenance. Must remain cheap/free to host, fast to build, simple to develop locally.

### Decision
**Stack:**
- **Frontend:** Hugo (SSG)
- **Backend:** Cloudflare Pages Functions (Node.js)
- **Product Source:** Etsy API v3
- **Contact Form:** Formspree (external service)
- **Hosting:** Cloudflare Pages

**Key changes from current:**
- Consolidate Worker into Pages Function (no separate backend service)
- Remove Cloudflare KV caching (in-memory caching sufficient)
- Replace Square API with Etsy API

### Consequences
**Positive:**
- Hugo: Already familiar, fast builds, zero runtime overhead
- Pages Functions: Unified deployment, same repo as frontend, free tier generous
- Etsy: Direct integration with actual sales platform (single source of truth)
- Formspree: Avoid building email backend, reliable spam filtering
- Boring stack: Well-documented, stable, easy to hire for

**Negative:**
- Hugo templating slightly verbose compared to modern frameworks
- Pages Functions newer than standalone Workers (less mature tooling)
- Tied to Cloudflare ecosystem (but already committed)
- Formspree free tier limited to 50 submissions/month

**Mitigations:**
- Hugo partials keep templates DRY
- Wrangler CLI supports Pages Functions adequately for our needs
- Cloudflare lock-in acceptable given free tier and performance
- 50 contact forms/month sufficient for small shop; can upgrade if needed

---

## ADR-002: No External Caching Layer
**Date:** 2026-02-12  
**Status:** Accepted

### Context
Previous architecture cached Etsy data in Cloudflare KV. Pages Functions have limited execution time and memory. Etsy API has rate limits.

### Decision
Use in-memory caching within the Pages Function with 60-minute TTL. No KV namespace required.

### Consequences
**Positive:**
- Simpler architecture (one less service to configure)
- Faster response times (no KV network hop)
- Reduced dependency on external state

**Negative:**
- Cache lost on cold starts (function evicted from memory)
- Each edge location caches independently (more API calls)

**Mitigations:**
- Scheduled cron keeps function warm
- Etsy rate limits (10 requests/second) sufficient for our traffic
- Accept occasional cache misses on cold starts (site still functions)

---

## ADR-003: Preserve stale in-memory cache for Etsy error fallback
**Date:** 2026-02-12  
**Status:** Accepted

### Context
`/api/products` needs graceful failure handling. If Etsy is unavailable, we should return the last good payload when possible.

### Decision
Keep expired entries in in-memory cache and expose `getStale(key)` for error fallback paths. Normal `get(key)` still enforces TTL and returns `null` when expired.

### Consequences
**Positive:**
- Endpoint can return last-known-good product data on transient Etsy failures
- Maintains normal TTL behaviour for standard reads

**Negative:**
- Expired entries may remain in memory longer

**Mitigations:**
- Store only small product payloads
- Keys remain bounded (`products` cache key)

---

## ADR-004: Keep local smoke tests opt-in
**Date:** 2026-02-12  
**Status:** Accepted

### Context
Local smoke checks need a running Wrangler Pages dev server and network access on `127.0.0.1:8788`. Running them in every default unit-test execution would create avoidable failures when services are not started.

### Decision
Add a dedicated `npm run test:smoke` command and gate smoke specs behind `RUN_SMOKE_TESTS=1`.

### Consequences
**Positive:**
- `npm test` remains deterministic and fast for unit/integration coverage
- Smoke checks stay available for local verification before merge

**Negative:**
- Smoke tests are not executed unless explicitly invoked

**Mitigations:**
- Document `npm run test:smoke` in README
- Keep smoke test file in `tests/` so it remains visible in the test suite

---

<!-- Template:

## ADR-NNN: Title
**Date:** YYYY-MM-DD  
**Status:** Proposed

### Context


### Decision


### Consequences
**Positive:**
- 

**Negative:**
- 

**Mitigations:**
- 

-->
