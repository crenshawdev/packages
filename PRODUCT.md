# Product

## Register

brand

## Users

Readers of John Crenshaw's essays; the FOSS / Linux / COSMIC-desktop community; fellow
developers and tinkerers who follow his Rust projects. They arrive from a blog link, Mastodon,
a GitLab repo, or an aggregator, on desktop or phone, usually to size up his thinking or track
what he's building. A second, not-yet-optimized-for audience: people who might later want to
hire him or support the work (kept open, not designed-for yet).

## Product Purpose

A personal "front door" for John Crenshaw (VintageTechie): a desktop-OS-styled hub that
presents who he is, surfaces his latest essay and latest code, and routes visitors out to the
writing and the repositories. It is identity plus distribution for his essays and FOSS work.
Success: a visitor immediately understands who he is and what he makes, gets into an essay or a
project, and remembers the site afterward.

## Brand Personality

A blend of two registers held in tension: **opinionated, precise, no-bullshit** in voice, and
**calm, understated, crafted** in presentation. Direct and principled, technically rigorous,
dryly funny, the retired-engineer-with-receipts who has earned his opinions, set against a
quiet deep-slate stillness where the design gets out of the way and the work speaks.
Confident without selling. The emotional goal is trust and respect: "this person knows what
they're doing and means it." Three words: principled, precise, restrained.

## Anti-references

- **Corporate SaaS landing** — gradient hero, big-number metric template, identical
  feature-card grids, "empower / streamline / seamless" copy. The startup template.
- **AI-generated slop** — cream/sand backgrounds, tiny uppercase tracked eyebrows on every
  section, generic stock polish, the "a bot made this" tells.
- **Loud / neon / gamer maximalism** — RGB glow, aggressive motion, cyberpunk clutter.
- **Skeuomorphic kitsch** — cheesy fake-CRT scanlines and costume-y retro-computer gimmickry.
  The terminal/desktop metaphor must be tasteful and real, never a costume.

## Design Principles

1. **The metaphor must be earned, not worn.** The boot/desktop conceit reflects how John
   actually works (Arch, zen kernel, COSMIC, the terminal), so it reads as authentic identity,
   not theme-party costume. If a desktop element carries no real meaning, cut it.
2. **Substance over flash; restraint is the brand.** Calm deep-slate stillness. Motion and
   effects appear only when they clarify or purposefully delight. Never overstimulate.
3. **The writing is the point.** The front door exists to get people into the essays and code.
   Identity sets the tone; the content is the payload. Don't let chrome bury the work.
4. **Real, indexable, durable.** Every room is a real page with a shareable URL that works
   without JavaScript. Craft includes the parts users never see: SEO, no-JS fallback,
   reduced-motion, keyboard access.
5. **Principled and honest — practice what he preaches.** No trackers, no surveillance, no
   third-party slop on the front door; privacy respected (decoy location); self-reliant
   (self-hosted distribution, GitLab). The site embodies the values the essays argue for.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 against deep-slate surfaces; large text ≥3:1. Full
functionality with JavaScript disabled — the boot sequence and window-open motion are
enhancements only, never gates on content. `prefers-reduced-motion` disables the boot and the
grow/slide transitions (crossfade or instant instead). Mobile-first with touch-sized targets;
the desktop window metaphor becomes full-screen sheets on small screens. Keyboard navigable:
dock apps are real focusable links, windows and sheets are dismissible via keyboard. No
flashing or strobing motion.
