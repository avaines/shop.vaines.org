
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
- Test locally: `wrangler pages dev` and verify `/api/products` endpoint

**Hugo Site:**
- Run `hugo` to verify build succeeds
- Run `hugo server` and manually verify pages render
- Check browser console for JS errors

**Integration:**
- Start both services (Wrangler + Hugo)
- Verify homepage loads products from function
- Test manual refresh: `/api/products?refresh=<SECRET>`

**Pre-merge checklist:**
- [ ] Tests pass
- [ ] Linting passes
- [ ] Local build succeeds
- [ ] Manual smoke test completed
- [ ] README updated if new commands added
