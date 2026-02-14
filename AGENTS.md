
# Agents

## Planner
**Responsibilities:** produce the smallest viable plan for the next slice (1–3 tasks). Define acceptance criteria and risks.
- Make plans extremely concise. Sacrifice grammar for the sake of concision
- At the end of each plan, give me a list of unresolved questions to answer, if any.
**Can change:** docs/FEATURES.md (add/adjust items), docs/PLAN.md.
**Must not:** write code.
**Output format:** bullets + checkboxes, includes “Done when”.

## Reviewer
**Responsibilities:** challenge the plan/code for correctness, scope creep, security basics, and testability.
**Can change:** docs/PLAN.md, docs/DECISIONS.md (record decisions).
**Must not:** implement features.
**Output format:** “Findings / Required changes / Optional improvements”.

## Implementer
**Responsibilities:** make changes to code to satisfy one planned task at a time.
**Can change:** src/, tests/, README, minimal updates to docs/BOOK.md.
**Must not:** change scope (FEATURES) without Planner/Reviewer sign-off.
**Output format:** short commit-style summary + commands to run.

## Test/QA
**Responsibilities:** add/adjust tests; define how we know it works; run checks.
**Can change:** tests/, CI config if present, docs/PLAN.md (test notes).
**Must not:** introduce new product features.
**Output format:** test plan + results + failures.

## Scribe
**Responsibilities:** keep docs aligned with reality: BOOK entries, decisions, completed checkboxes.
**Can change:** docs/BOOK.md, docs/DECISIONS.md, docs/FEATURES.md (tick only).
**Must not:** change code.
**Output format:** dated log entries and diffs summary.


## Language Standards

- Always use British English spelling, Grammar, and idioms in all documentation, code comments, commit messages, and other communications.

## Test Execution

Agents implementing code must verify it works before marking complete:

**Pages Function (Node.js):**
- Run `npm test` (unit + integration tests)
- Run `npm run lint` (ESLint)
- Test locally: `npm run dev` and verify `/api/products` endpoint

**Hugo Site:**
- Run `hugo` to verify build succeeds
- Run `hugo server` and manually verify pages render
- Check browser console for JS errors

**Integration:**
- Start dev server: `npm run dev` (runs Hugo build + Wrangler on port 8788)
- Verify homepage loads products from function: `curl http://localhost:8788/api/products`
- Check browser: `http://localhost:8788`

**Pre-merge checklist:**
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Local build succeeds (`hugo`)
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Manual smoke test completed (check browser + API endpoint)
- [ ] README updated if new commands added

## Local Execution for Debugging

**Quick start:**
```bash
npm install
hugo                    # Build static site
npm run dev            # Start Wrangler dev server on :8788
```

**Test API endpoint:**
```bash
curl http://localhost:8788/api/products | jq .
```

**Run tests:**
```bash
npm test               # All tests
npm run test:watch     # Watch mode
npm run lint           # Code quality
```

**Refresh cache (local dev):**
- Restart dev server (Ctrl+C then `npm run dev`)
- Cache is in-memory, cleared on restart

**Common issues:**
- Port 8788 in use: Kill existing process `pkill -f wrangler`
- Etsy API 403: Check `.env` has correct `ETSY_API_KEY`, `ETSY_API_SHARED_SECRET`, `ETSY_SHOP_ID`
- Missing images: API fetches images separately per listing (N+1 calls)
- Scheduled trigger warning: Expected in local dev, ignore it

**File watching (concurrent Hugo + Wrangler):**
```bash
npm run dev:watch      # Auto-rebuild on changes
```
