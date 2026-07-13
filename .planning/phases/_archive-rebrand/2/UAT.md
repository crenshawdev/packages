---
status: complete
phase: 2
sources: [CONTEXT.md, SUMMARY.md]
started: 2026-07-13
updated: 2026-07-13
---

## Items

### 1. OG card PNGs show the new identity
expected: Reading public/tempest-og.png shows `version: 2.11.0` and the JC / jcrenshaw.dev identity (IBM Plex Mono ledger, not a fallback font); public/og-image.png and public/weathervane-og.png show the JC identity with no vintagetechie mark; all three are committed under public/.
status: pass
source: verifier
evidence: Visual read of public/tempest-og.png (header `jcrenshaw.dev`, top-right `john · retired`, ledger `version: 2.11.0` in IBM Plex Mono, no vintagetechie); og-image.png shows "John Crenshaw"; weathervane-og.png shows `jcrenshaw.dev`. `git ls-files` lists all three PNGs as tracked. Template og/tempest-card.html:226 = `2.11.0`.

### 2. og-image.svg is identity-clean and intact
expected: `grep -n "blog.vintagetechie.com" public/og-image.svg` returns no match; the file still exists with its footer reading `jcrenshaw.dev` (left) and `john · retired` (right).
status: pass
source: verifier
evidence: `grep -n "blog.vintagetechie.com" public/og-image.svg` exit 1 (no match); file present; footer :50 = `jcrenshaw.dev`, :53 = `john · retired`.

### 3. Production build exits 0
expected: `npm run build` completes and exits 0 with no error output.
status: pass
source: verifier
evidence: `rm -rf dist && npm run build` → BUILD EXIT 0, "24 page(s) built ... Complete!".

### 4. No old-brand leakage in dist/
expected: `grep -rn "vintagetechie" dist/` matches ONLY dist/code/tempest/index.html (the D-05 install lines); no other file. `grep -rn "gitlab" dist/` (case-sensitive lowercase) returns zero matches.
status: pass
source: verifier
evidence: `grep -rl "vintagetechie" dist/` returns only dist/code/tempest/index.html (4 lines: com.vintagetechie.CosmicExtAppletTempest, vintagetechie.asc/.gpg/.list/.repo — the D-05 carve-out); `grep -rn "gitlab" dist/` exit 1 (zero matches).

### 5. Built internal links are extensionless and trailing-slash-free
expected: Internal hrefs in dist/index.html (e.g. /writing, /code, /about) carry no `.html` extension and no trailing slash.
status: pass
source: verifier
evidence: Internal hrefs in dist/index.html: /, /about, /code, /writing, /posts/the-last-default, /rss.xml — all extensionless (static asset files keep their real extensions) and none carry a trailing slash.

## Summary

total: 5
passed: 5
failed: 0
pending: 0
skipped: 0
blocked: 0
