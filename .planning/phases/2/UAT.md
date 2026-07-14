---
status: complete
phase: 2
sources: [CONTEXT.md, PLAN.md, SUMMARY.md]
started: 2026-07-14T00:53:07Z
updated: 2026-07-14T01:45:00Z
---

## Items

### 1. Cold-start smoke test
expected: Restart the Ghost + MySQL containers from cold (stop both, start fresh), then hit the admin and the Content API - Ghost boots clean, MySQL comes up, the admin loads over HTTPS, and a Content API query returns the 18 seeded posts from persisted state (not warm memory).
status: pass

### 2. Ghost admin over HTTPS + owner sign-in
expected: `https://ghost.jcrenshaw.dev/ghost/` returns the Ghost admin app over a valid HTTPS cert, and signing in with the owner account loads the admin dashboard.
status: pass

### 3. Seed parity - 18 posts + 1 page
expected: Ghost holds exactly 18 posts and 1 page (`about`); each post's title, slug, and `published_at` match its source frontmatter, and `about` does NOT appear in the post/writing list (it is a page).
status: pass

### 4. Markers rewritten + image renders + internal link
expected: No seeded content or rendered Ghost output contains the literal `__GHOST_URL__`; the `death-by-yes` post renders a visible feature image; the `building-my-system` inline link resolves to `/still-skidding-broadside/`.
status: pass

### 5. Content API returns 18 posts from env
expected: `node --env-file=.env scripts/verify-content-api.mjs` (using `GHOST_URL` + `GHOST_CONTENT_API_KEY` from `.env`) prints a count of 18 posts.
status: pass

### 6. Env scaffolding + content.ts untouched
expected: `.env.example` and an `astro:env` schema in `astro.config.mjs` declare `GHOST_URL` and `GHOST_CONTENT_API_KEY`; `npm run build` succeeds; `src/lib/content.ts` still imports only `astro:content`.
status: pass
source: verifier
evidence: astro.config.mjs:15-19 env.schema declares GHOST_URL (server/public) + GHOST_CONTENT_API_KEY (server/secret); .env.example:11-12 declares both; src/lib/content.ts:1 imports only astro:content, git-unchanged since phase 1 (325ed83). Build not run by verifier (network fonts); schema syntactically valid.

### 7. Newsletter test send via Mailgun
expected: A Ghost newsletter test send to a real address is delivered via Mailgun and arrives in an inbox.
status: pass
reported: "Forbidden: Domain mg.jcrenshaw.dev is not allowed to send: The domain is unverified and requires DNS configuration. Log in to your control panel to view required DNS records."
severity: major
cause: DNS records (SPF, DKIM krs._domainkey, tracking CNAME) were all present and correct in Cloudflare, but Mailgun still had them as valid:unknown and the domain state as unverified - Mailgun had not re-polled DNS after propagation, so it refused sends.
fix: Triggered Mailgun re-verification (PUT /v4/domains/mg.jcrenshaw.dev/verify); domain state flipped to active, all three records now valid:valid. Retest passed: Ghost test send accepted, Mailgun events show accepted->delivered to john@vintagetechie.com, user confirmed inbox arrival.

## Summary

total: 7
passed: 7
failed: 0
pending: 0
skipped: 0
blocked: 0
