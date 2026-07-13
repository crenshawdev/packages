# Desktop Front-Door Redesign — Design Spec

**Date:** 2026-06-08
**Project:** jcrenshaw.dev (vintagetechie-dev.gitlab.io)
**Status:** Design locked in brainstorm; ready for implementation (`impeccable`)
**Branch:** redesign-jcrenshaw

---

## 1. Intent

Rebuild the personal site as a **desktop-OS "front door"** — a landing experience that
boots like a Linux machine and resolves into a desktop "Entry" hub, styled in a calm
deep-slate / terminal aesthetic ("cosmic look and feel" kept professional, not gimmicky).

The site is a personal hub for John Crenshaw (VintageTechie): it surfaces who he is, his
latest essay, and his latest code, and routes visitors out to the writing and the code.
All prior redesign attempts are discarded.

**Primary visitors:** readers of the essays, the FOSS/Linux community, and — kept open but
not designed-for yet — people who might later hire him or support his work.

---

## 2. Constraints & Tech Baseline

- **Astro `^6.2.2`**, static output, deployed to **GitLab Pages**. No backend, no server-side
  request handling at runtime.
- `astro.config.mjs`: `site: 'https://jcrenshaw.dev'`, `trailingSlash: 'never'`,
  `build.format: 'directory'`.
- Existing content collection `posts` (`./posts/*.md`) with `type: post | page`,
  `published_at`, `tags`, optional `slug`. 15 essays + one `page-about.md` (slug `about`).
- Existing routes today: `/` (renders About), `/writing` (list), `/posts/[slug]` (essay).
- **Must keep working with JavaScript off** and must be **mobile-viewable**. JS is for
  enhancement (boot animation, window-open motion), never a hard dependency for content.

---

## 3. Information Architecture

A shared **shell** wraps every route:

- **Top panel** — `jcrenshaw.dev` + a clock/tray (static, decorative).
- **Deep-slate desktop background.**
- **Bottom dock** — four apps: About · Code · Writing · Contact.

Routes (every one is a real, indexable page — see §6):

| Route          | Role                              | Render                                  |
|----------------|-----------------------------------|-----------------------------------------|
| `/`            | Front Door → **Entry** hub        | Boot (first visit) → desktop with cards |
| `/about`       | About room                        | Window/sheet holding `page-about.md`    |
| `/code`        | Code room                         | Window/sheet: project list + latest code|
| `/writing`     | Writing room                      | Window/sheet: essay index               |
| `/posts/[slug]`| A single essay                    | Window/sheet holding the essay          |
| (Contact)      | `mailto:` — **not a route**       | Dock click fires mail client            |

**Entry (`/`)** is the special case: instead of a window, the desktop shows content directly —
a left **callsign** card and right-column **Latest essay** + **Latest code** cards.

---

## 4. Boot Sequence (first visit only)

On first visit to `/`, an overlay plays a simulated Linux boot, then animates away to reveal
the Entry desktop beneath it.

- Uses John's real kernel string (`7.0.11-zen1-1-zen`) and systemd-style `[ OK ]` lines that
  reframe site sections as services: `about.service`, `writing.service — the blog`,
  `code.service — projects & repos`, `contact.service`, plus flavor lines (network →
  gitlab.com/vintagetechie, fonts, Deep Slate theme, "Verified flatpak trust — single GPG
  root"), ending at **"Reached target Front Door"** → `jcrenshaw login: john` →
  **"Welcome back, John."**
- **Timing (locked):** ~20 lines at a quick cadence (~0.085s/line) so the log scrolls past
  fast; hold a beat on "Welcome back," then pop to the desktop (`bootOut` ~0.45s,
  `deskPop` grow ~0.62s). Net feel: *longer log, faster display.*
- **Behavior:** plays **first visit only** (persist a flag, e.g. `localStorage`); click/key
  to skip; **fully skipped** under `prefers-reduced-motion`. Direct loads of sub-routes
  (`/about`, an essay, etc.) never boot.
- The boot is a **JS-only overlay**; the Entry content sits in the DOM beneath it, so search
  engines and no-JS visitors get the real page immediately.

---

## 5. Entry Screen & Callsign

**Left — neofetch callsign** (locked direction): a `jc` logo mark to the left of a
neofetch-style readout (logo-left / info-right, as real neofetch renders):

```
jc   john@jcrenshaw
     ───────────
     host    Chicago
     uptime  since 1981
     os      arch · zen
     shell   rust · c
     status  retired
     wm      cosmic
     ▪ ▪ ▪ ▪          (palette swatches)
```

**Right column:**

- **Latest essay** card — title, date, read-time, excerpt, "Read essay →".
- **Latest code** card — repo name, `Rust` / version / "pushed" badges, a green **live** dot,
  short blurb, "View on GitLab ↗".

**Dock** (bottom center): About · Code · Writing · Contact.

---

## 6. Window / Sheet Behavior (locked)

Clicking a dock app opens that section. **The windows are real routed pages**, not JS-only
overlays — this is the key architectural decision.

- **Desktop:** the target route renders as a **centered window** (title bar + close control)
  over the dimmed desktop. Navigating from the Entry **grows the window from the dock** as a
  **view transition**. One window at a time. **No dragging, no resizing, no stacking.** Close
  (button or click-outside) returns to `/`.
- **Mobile:** the same content opens as a **full-screen sheet that slides up** from the
  bottom (grabber + ✕). The dock becomes a bottom bar. No floating windows on small screens.
- **Contact is special:** it does **not** open a window — it fires
  `mailto:john@vintagetechie.com` (a brief toast acknowledges it).
- **Direct load / no-JS / SEO:** because each window is a real page, loading `/about` or an
  essay URL directly renders the full content inside the shell (panel + dock + window chrome)
  with no animation required. Shareable URLs and indexing are preserved.
- Motion (grow / slide) is **skipped under `prefers-reduced-motion`**; navigation still works.

> **Implementation note:** Astro's view-transition API/component naming has changed across
> recent versions. Confirm the current Astro 6 syntax against official docs at build time
> rather than assuming. If view transitions prove awkward for the "grow from dock" effect,
> fall back to a CSS-only open animation on page enter.

---

## 7. Room Contents

- **About** — renders `page-about.md`. **The About copy is to be reworded during the build**
  (see §13.4) — draft in John's voice (technical/long-form style guide), then get his sign-off
  before it ships. Location stays Chicago.
- **Code** — three featured projects, headed by **Latest code** with the live indicator:
  - **Tempest** (`cosmic-ext-applet-tempest`) — Rust weather applet for COSMIC, self-distributed
    Flatpak (flagship; drives the live "Latest code" data).
  - **Weathervane** — Rust (blurb to be taken from the repo at build).
  - **Powercurve** — Rust power-management daemon with proper fan curves for Linux desktops.
  - Each links to GitLab. Tempest is live-at-build (§9); the others curated unless their repo
    data is trivially available.
- **Writing** — the existing `/writing` index (year-grouped entries, count + word total),
  restyled to sit in the window/sheet shell. Entries link to `/posts/[slug]`.

---

## 8. Contact

`mailto:john@vintagetechie.com`. No form, no backend, no third-party form service, no GitLab
Service Desk. Chosen deliberately for simplicity and to avoid external dependencies on the
front door. (Monetization paths — donations/contracts — are explicitly **out of scope** for
this pass; see §11.)

---

## 9. Data Sourcing (live-at-build, curated fallback)

- **Latest essay** — derived from the `posts` collection at build (most recent
  `published_at`, `type: post`). Trivial, already available. Always live.
- **Latest code** — fetched from the **GitLab API at build time** for the flagship repo
  (latest tag/release version + last-pushed timestamp). If the fetch fails or is unavailable,
  fall back to a **curated** version string so the build never breaks. The "live" dot
  represents build-time freshness, not a runtime connection.

---

## 10. Visual System

- **Palette — "Deep Slate":** bg `#0e1218`, deeper `#0b0e13`, surface `#161b23`,
  text `#c6ccd6`, muted `#6b7382` / `#5f6776`.
- **Accents:** blue `#5b8cff` / `#6aa0ff` (primary), green `#3ecf8e` (live / [ OK ]).
- **Type:** IBM Plex Mono (terminal/callsign/labels) + IBM Plex Sans (prose/headings).
- Soft surfaces lifted off the background (not pure black), subtle borders
  (`rgba(255,255,255,.07)`), generous radii, restrained shadows.
- The existing `src/styles/global.css` slate theme is the starting point; tokens above are
  the target. Reconcile/extend rather than rewrite wholesale where practical.

---

## 11. Non-Goals (YAGNI)

- **No floating window manager** — no draggable/resizable/multi-window desktop.
- **No contact form / form backend / Service Desk** this pass.
- **No monetization funnel** — no donations rail, no "hire me"/work surface, no CRM. Kept
  *open for later* (don't foreclose), but not built now. The `status: retired` callsign line
  stays as-is.
- No heavy client-side state; JS stays light and optional.

---

## 12. Accessibility & Performance

- Content works fully with **JS disabled**; boot and window motion are enhancements only.
- **`prefers-reduced-motion`** disables boot and grow/slide.
- Mobile-first: dock as bottom bar, full-screen sheets, tap targets sized for touch.
- Keyboard: dock apps are real links (focusable, Enter-activatable); windows/sheets are
  dismissible via keyboard.
- Lean payload — static HTML/CSS first, minimal JS.

---

## 13. Open Items / Decisions

1. **Location privacy — RESOLVED.** All location references set to **Chicago** (decoy
   hometown). Changed: `posts/page-about.md` ("Based in Chicago with Ben") and the callsign
   `based` row in `src/layouts/BaseLayout.astro`. No essay prose altered.
2. **Code room projects — RESOLVED.** Feature **Tempest, Weathervane, Powercurve** (§7).
3. **Astro view-transition feasibility** for "grow from dock" — confirm against Astro 6 docs
   during implementation; CSS-only fallback acceptable (§6). *(Remaining.)*
4. **Reword the About page** — planned during the build. Draft in John's voice
   (technical/long-form style guide), keep Chicago, get his sign-off before shipping.
   Direction TBD by John at that point. *(Remaining.)*

---

## 14. Handoff

Next phase: **`impeccable`** drives the actual design + build against this spec. Note
`impeccable` expects a `PRODUCT.md` via its init flow — run that init first when transitioning.
The throwaway brainstorm prototypes live at
`.superpowers/brainstorm/346628-1780957693/content/` (`boot-entry-v3.html`,
`window-open-proto.html`) and are reference only, not implementation.
