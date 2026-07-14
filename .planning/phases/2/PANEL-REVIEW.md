# Phase 2 Panel Review — secrets surface (codex-risk-gate)

Reviewed: 2026-07-14
Scope: commits 7a9984d + 75fa6e0 — scripts/seed-ghost.mjs, scripts/verify-content-api.mjs,
.env.example, astro.config.mjs (env.schema), package.json.
Critics: Claude (general-purpose subagent) + Codex (gpt-5.5), adjudicated by Opus against the code.

## Verdict: SHIP — no blockers

No real secret is committed (placeholders only; `.env` + `.env.production` gitignored).
No secret is printed on any normal code path. The Admin `id:secret` key is never logged;
the Content key only rides in a URL logged host-only. Two theoretical leak paths, both in
dev-only ops tooling requiring an unhandled throw. Survivors are optional hardening.

## Findings (adjudicated)

| # | Finding | Caught by | Severity |
|---|---------|-----------|----------|
| 1 | verify-content-api.mjs:16 — Content key in `?key=` URL; a malformed GHOST_URL makes fetch throw a TypeError echoing the full URL+key to stderr. Handled `!res.ok` path logs only bare `url`. | Both | 🟡 design-call |
| 2 | seed-ghost.mjs:235 — no per-entry try/catch; unhandled Admin API rejection *might* print an error object with the bearer token. Speculative (@tryghost/admin-api normalizes errors, does not echo auth header); real effect is partial-state, recovered by idempotent re-run. | Both | ⚪ nit |
| 3 | verify-content-api.mjs:268 — no shape guard on `{ posts }` destructure; throwaway script. | Both | ⚪ nit |
| 4 | seed-ghost.mjs:192 — `filter: slug:${entry.slug}` unchecked; missing slug → `slug:undefined`. Latent; all current corpus files have slugs. | Claude | ⚪ nit |
| 5 | seed-ghost.mjs:182 — tmp Unsplash file never unlinked. | Claude | ⚪ nit |

## Killed / downgraded

- `.env.example:6,11` real host instead of placeholder (Claude) — **killed.** Public DNS, same
  for every clone, intentional convenience, not a secret.
- `seed-ghost.mjs:185` logs uploaded Ghost image URL (Codex) — **killed.** Ghost instance is
  public (ghost.jcrenshaw.dev); no private-path exposure.
- Codex #2 "important" (Admin token in SDK error object) — **downgraded to nit.** @tryghost/admin-api
  returns normalized errors, not raw axios errors with headers.

## Optional hardening (not required to ship; dev-only tooling)

- Wrap the seed loop body (seed-ghost.mjs:235) in try/catch that logs `entry.slug` + a
  sanitized message, so one bad entry doesn't abort mid-corpus with a raw stack.
- In verify-content-api.mjs, guard the fetch in try/catch and never surface `endpoint` — only
  the host — so a malformed URL can't spill `?key=`.

## Meta
Convergence: 2 (findings 1, 2). Diversity catches: 3 (Claude 4/5; Codex host-URL, key-in-URL).
Nothing skipped — full 247-line diff reviewed.
