# Product

## Register

brand

## Users

**Primary: prospective clients.** Business owners, founders, and technical
decision-makers weighing whether to hire John to consult, build software, or
integrate AI into what they already run. They arrive from a referral, a link he
shared, or a search, on desktop or phone, and they are sizing him up: is this
someone competent, credible, and honest enough to trust with a real decision?
The site's job is to answer yes.

**Secondary: readers and peers.** People who follow John's essays and his Rust
projects: the FOSS / Linux / COSMIC-desktop community, fellow developers and
tinkerers. They arrive from a blog link, Mastodon, a GitHub repo, or an
aggregator. They are not the buyer, but they are the proof, the public writing
and shipping code that make the trust legible to the first audience.

## Product Purpose

A consulting front door for John Crenshaw. It presents who he is, demonstrates
his judgment through public essays and working tools, and turns that credibility
into a conversation: consulting, custom software, and honest AI integration. The
essays and the code are the evidence; the trust they build is the product.
Success: a visitor understands what John does, believes he is credible and will
not oversell, and either reaches out or remembers exactly who to call when the
need arrives.

## Brand Personality

A talented professional who earns trust. Competent and credible, and genuinely
likable with it, not cold-corporate and not a contrarian performance. The gift
is *the eye*: John sees the gaps and opportunities in software that everyone
else walks past, and builds or writes the better version. He is plainspoken and
honest to a fault, which is the point in a market full of people selling more
than you need. He will tell you the right tool for the job, and tell you when
you do not need one at all, including where AI does not belong. His regulated,
high-stakes background (HIPAA, payments, carrier-scale telecom) is the
credibility behind the calm. The emotional goal is trust and respect: "this
person knows what they're doing, means it, and won't sell me something I don't
need." Three words: credible, precise, restrained.

## Anti-references

- **Corporate SaaS landing:** gradient hero, big-number metric template,
  identical feature-card grids, "empower / streamline / seamless" copy. The
  startup template.
- **AI hype-seller:** "AI-powered everything," manufactured urgency, the vendor
  who profits whether or not you needed the thing. John's credibility is the
  exact opposite, and the site must never sound like this.
- **AI-generated slop:** cream/sand backgrounds, tiny uppercase tracked eyebrows
  on every section, generic stock polish, the "a bot made this" tells.
- **Loud / neon / gamer maximalism:** RGB glow, aggressive motion, cyberpunk
  clutter.
- **Skeuomorphic kitsch:** cheesy fake-CRT scanlines and costume-y retro-computer
  gimmickry. The desktop metaphor must be tasteful and real, never a costume.

## Design Principles

1. **The metaphor must be earned, not worn.** The panel, dock, and window chrome
   reflect how John actually works (Arch, COSMIC, the terminal), and read as
   authentic identity, not theme-party costume. The too-cute pieces (the boot
   animation, the neofetch callsign card) were cut for exactly this reason: if a
   desktop element carries no real meaning, it goes.
2. **Restraint is the brand, and the argument.** Calm deep-slate stillness;
   motion and effects appear only when they clarify or purposefully delight.
   Minimalism is not just the look, it is the pitch: a site that is exactly as
   much site as it needs to be is the same judgment John sells.
3. **The work is the proof.** The front door exists to earn trust and open a
   conversation. The essays show how John thinks; the tools show it ships. Don't
   let chrome bury the evidence.
4. **Real, indexable, durable.** Every room is a real page with a shareable URL
   that works without JavaScript. Craft includes the parts users never see: SEO,
   no-JS fallback, reduced-motion, keyboard access.
5. **Principled and honest: practice what he preaches.** No trackers, no
   surveillance, no third-party slop on the front door; privacy respected (decoy
   location); self-reliant (self-hosted distribution, GitHub). The restraint and
   the honesty are not decoration, they are the sales argument.
6. **Say what you don't need.** The heart of the offer is honest scoping: the
   right tool for the right job, and telling a client where a thing earns its
   place and where it doesn't, AI included. The site models this by refusing to
   oversell itself.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 against deep-slate surfaces; large text
≥3:1. Full functionality with JavaScript disabled: the panel, dock, and
window-open motion are enhancements only, never gates on content.
`prefers-reduced-motion` disables the view transitions and grow/slide motion
(crossfade or instant instead). Mobile-first with touch-sized targets; the
desktop window metaphor becomes full-screen sheets on small screens. Keyboard
navigable: dock apps are real focusable links, windows and sheets are
dismissible via keyboard. No flashing or strobing motion.
