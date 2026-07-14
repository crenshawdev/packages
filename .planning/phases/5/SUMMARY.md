---
phase: 5
status: complete
completed: 2026-07-14
---

# Phase 5: Go live - Summary

jcrenshaw.dev is publicly live over HTTPS behind Cloudflare Pro, served by the
SSR droplet end to end: apex cut over to `137.184.184.60`, Full (Strict) TLS on a
Let's-Encrypt origin cert, deploy-on-push wired, a real Cloudflare cache-purge
Worker in place, and `www` 301-redirecting to the apex. The in-repo slice (Task 1,
Task 5 Worker) is committed; Tasks 2/3/4/6 were John's Cloudflare/Coolify/Ghost
console steps, each verified by live curl/dig.

## What shipped

- Stale deploy docs corrected to the SSR/Coolify/SFO3 reality - `CLAUDE.md`,
  `.planning/PROJECT.md`
- Apex `jcrenshaw.dev` live: A record -> `137.184.184.60`, proxied, Full (Strict)
  over a valid LE origin cert, apex HTML `cf-cache-status: DYNAMIC`
- Deploy-on-push: GitHub -> Coolify webhook auto-deploys `main` (verified by a real
  PR merge triggering a hands-off deploy)
- Authenticated Cloudflare cache-purge Worker (`workers/cache-purge/`) replacing the
  webhook.site placeholder; the three Ghost webhooks point at it
- `www` -> apex 301 redirect (Cloudflare wildcard Redirect Rule, path + query preserved)

## Commits

| Task | Commit | Description |
|---|---|---|
| 1 | dfe475b | docs(5-1): fix stale deploy docs for SSR/Coolify reality |
| 5 | 1d84d2b | feat(5-5): add Cloudflare cache-purge Worker for Ghost webhooks |
| 5 | 4f4aff7 | fix(5-5): harden purge Worker auth per security review |
| 5 | dd8b83d | chore(5-5): set jcrenshaw.dev zone id in purge Worker config |

Tasks 2, 3, 4, 6 are external-console changes with no repo commit (verified live).

## Deviations

- **Established `main` mid-phase (not in the plan).** The repo had no `main`; all work
  lived on `rebrand-to-jcrenshaw`, which had become the de-facto trunk (GitHub default
  + Coolify deploy branch). Per a standing user standard ("a repo must always have a
  main; branch only off main"), promoted `main` from the branch tip, repointed the
  GitHub default and Coolify's deploy branch to `main`, verified a green deploy from
  `main`, then retired `rebrand-to-jcrenshaw` (local + remote). See memory
  `branch-off-main-only`.
- **Task 1:** `doctl` unavailable in the sandbox, so the retired NYC1 box's
  unverifiable specs (2vCPU/80GB/$24/mo) were dropped rather than carried onto the SFO3
  droplet or invented. SFO3 / 8GB / 137.184.184.60 written on the D-05-confirmed basis.
- **Task 4:** first webhook attempts delivered (200) but did not deploy - two causes,
  fixed in order: GitHub webhook content-type was `form` (changed to `application/json`),
  then a secret mismatch (re-synced Coolify's GitHub webhook secret). Verified by a PR
  merge auto-triggering a Coolify deploy.
- **Task 5:** the Worker was version-controlled in the repo (`workers/cache-purge/`) and
  deployed via `wrangler`, rather than pasted into the dashboard, to keep it under the
  automated/IaC principle. A Codex adversarial security review produced two applied
  hardening fixes: exact `/purge/<secret>` route match, and hashing both sides before the
  constant-time compare (removes a secret-length timing leak). Auth verified live: wrong
  secret -> 401, wrong path -> 404, GET -> 405, correct secret -> 200 `{"success":true}`
  with a real zone purge.
- **Task 6:** a `www` DNS record already existed, so the rule was deployed "ignore and
  deploy anyway"; the record is proxied. Redirect verified 301 path-preserving after a
  brief propagation delay.

## Open items

- **PR #4 (`feat/cache-purge-worker`) pending merge to `main`.** The Worker is deployed
  and working; the repo files land on `main` when this PR merges.
- **Ghost test post "Test Pruge"** to be deleted after the T5 verify.
- **Cadence git-guard enhancement** (future): add a precondition that `main` exists and
  the working branch's base traces to `main`, alongside the protected-branch guard - the
  gap that let this repo drift into a no-main state.

## Goal check

The phase goal is met, each acceptance criterion confirmed by a live check:
`curl -sI https://jcrenshaw.dev` -> HTTP/2 200, `server: cloudflare`, no 525/526, apex
HTML `cf-cache-status: DYNAMIC`; the origin cert is Let's-Encrypt (CN=YR2) under Full
(Strict); a PR merge to `main` auto-deployed via Coolify with no manual click; the purge
Worker returns `{"success":true}` on an authenticated call and 401 otherwise;
`curl -sI https://www.jcrenshaw.dev/writing` -> 301 to `https://jcrenshaw.dev/writing`
(path preserved). DPLY-02 satisfied.
