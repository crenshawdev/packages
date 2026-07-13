# Phase 1 — Adversarial Panel Review

Range: `c2b95d9..HEAD` (37f851b..072f826). Critics: Claude (general-purpose subagent) + Codex (gpt-5.5). Adjudicated by Opus against the on-disk code.

## Adjudication table

| # | Finding | Caught by | Verdict | Severity |
|---|---------|-----------|---------|----------|
| 1 | `index.astro` `latest = posts[0]` unguarded — empty published list throws a live 500 under SSR | Claude | CONFIRMED (latent, not reachable today) | 🟡 design-call |
| 2 | `getPostBySlug` exported but unused — dead API surface | Claude + Codex (convergence) | CONFIRMED, but intended forward API | ⚪ nit |
| 3 | `[slug].astro` blank/unstyled 404 (no `404.astro`) | Claude | CONFIRMED | ⚪ nit |
| 4 | Per-request recompute of `getPublishedPosts` — no SSR caching | Claude | CONFIRMED, inherent to SSR | ⚪ nit (Phase 4) |
| 5 | `[slug].astro` `return new Response(null,{status:404})` "may not be valid Astro pattern" | Codex | KILLED | — |
| 6 | `output:'server'` is deploy-risky, no start/deploy contract | Codex | DOWNGRADED — out of scope | — |

**Destructive-fs check (the gate's trigger):** both critics independently confirm **no destructive or risky operation is present in the committed diff**. The `rm -rf dist` was ephemeral build-clean during verification against a gitignored directory, never a landed change. Gate trigger is a confirmed false positive.

## Killed / downgraded

- **#5 (Codex, important) — KILLED.** Returning a `Response` from on-demand `.astro` frontmatter is a valid Astro SSR pattern, and cad-verifier already observed it empirically: `/posts/this-slug-does-not-exist-xyz` returned HTTP 404. "Needs proof" is satisfied by runtime evidence.
- **#6 (Codex, important) — DOWNGRADED to out-of-scope.** The static→server output change is intentional (SSR-01). The standalone adapter self-starts `dist/server/entry.mjs`; deploy wiring (Coolify) is Phase 4, and the stale `.gitlab-ci.yml mv dist public` is already tracked as a SUMMARY open item. Not a defect in this phase.

## Fix, ranked (all optional — no blockers)

1. 🟡 `src/pages/index.astro` — guard `posts[0]` for the empty-list case so an unpublish-to-zero state renders a graceful homepage instead of a 500. Latent only (18 posts published today); worth a one-line guard, not blocking.
2. ⚪ `getPostBySlug` — leave as-is; it is deliberate abstraction API for the Phase 3 Ghost cutover, not accidental dead code.
3. ⚪ Add a styled `src/pages/404.astro` at some point (currently a bare node 404, roughly parity with the old host).
4. ⚪ SSR edge/response caching — deferred to Phase 4 (already a flagged CONTEXT assumption).

## Meta

Convergence: 1 (dead-code nit, both critics). Diversity catches: Claude found the empty-list crash; Codex pushed on 404-validity and deploy contract (both adjudicated down). Nothing skipped. **Verdict: ship — no blockers, no destructive ops; one optional latent-crash hardening.**
