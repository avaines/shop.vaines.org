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
