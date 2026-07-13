# Plan: RSS feed + listmonk auto-campaign (writing tie-in)

Status: Part A DONE (RSS feed live). Part B = **by hand for now** (see below); the
polling-glue design in Part B is DEFERRED, not built. Written 2026-07-07, updated 2026-07-07.
Private planning doc — do not deploy. (`.planning/` is not in `.gitignore`; do not commit unless intended.)

## Chosen for Part B: manual (no glue)
Decision (2026-07-07): at 2–4 posts/month with a human already in the review-gate, an
automated poller would rot faster than it saves time. So distribution is a manual step;
the bash+curl+timer design in "Part B" below is kept only as the future-automation option.

Per-post routine (once General list + verified from-address exist in listmonk):
1. Push the post; confirm it is live at `https://jcrenshaw.dev/posts/<slug>`.
2. listmonk admin → Campaigns → New → subject = post title, list = **General**, content type = **HTML**.
3. Body = excerpt + link back (not the full article):
   ```html
   <p>{excerpt}</p>
   <p><a href="https://jcrenshaw.dev/posts/{slug}">Read it on jcrenshaw.dev →</a></p>
   ```
4. Save draft, eyeball, Send.

Graduate to the automated Part B only if cadence climbs enough that the manual step chafes.

## Context

The comms stack (`list.jcrenshaw.dev`, listmonk + Resend) is live and hardened. The
one remaining "writing tie-in" is: when John publishes a new essay, subscribers on the
**General** list get an email. Memory assumed "listmonk pulls the site's RSS" — that is
**wrong**. Verified against official listmonk docs (`/knadh/listmonk`, two queries):
listmonk has **no native RSS-to-campaign feature**. It exposes `POST /api/campaigns`
(creates a campaign, defaults to `status: draft`), CSV subscriber import, and Go-template
bodies over subscriber attributes — no feed polling anywhere.

So this is two independent pieces:
- **Part A** — the site must *emit* an RSS feed. It currently emits none (grep for
  rss/feed/@astrojs/rss across `src`, `public`, config → nothing).
- **Part B** — an external glue job we own reads that feed and calls the listmonk API.

Locked decisions: **review-gate** (glue creates a *draft* campaign; John sends it by
hand — there is no undo on a real blast) and **bash + curl** for the glue.

---

## Part A — RSS feed on the Astro site

Repo: `/data/code/vintagetechie-dev.gitlab.io` (Astro 6.2.2, GitLab Pages).
`astro.config.mjs` already sets `site: 'https://jcrenshaw.dev'`, so item links resolve absolute.
Posts are a real content collection `posts` (`src/content.config.ts`), 19 `*.md` files in `/posts`.

### A1. Add the RSS integration
```
npm install @astrojs/rss
```

### A2. Create the endpoint — `src/pages/rss.xml.ts`
Verified API (`@astrojs/rss` README): default `rss()` export + `GET(context)` + `context.site`.
Map the content collection manually and **reuse the exact published-post filter from
`src/pages/index.astro:9`** so the feed and homepage never disagree:

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts'))
    .filter((p) => p.data.type === 'post'
      && p.data.status !== 'draft'
      && p.data.visibility !== 'private')
    .sort((a, b) => b.data.published_at.valueOf() - a.data.published_at.valueOf());

  return rss({
    title: 'John Crenshaw — Writing',        // adjust copy
    description: 'Essays on Linux, Rust, privacy, and leaving rented software behind.',
    site: context.site,                       // = https://jcrenshaw.dev
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.published_at,           // schema: required date
      description: p.data.excerpt ?? p.data.meta_description ?? '',
      link: `/posts/${p.data.slug ?? p.id}`,  // mirrors index.astro:28 (minus BASE_URL)
    })),
  });
}
```
- If a non-root `BASE_URL` is ever configured, prepend it to `link` exactly as
  `index.astro` does (`const base = import.meta.env.BASE_URL.replace(/\/$/, '') || ''`).
  Apex domain today → `/posts/...` is correct.
- Feed path decision (open): `/rss.xml` (default here) vs `/feed.xml`. Trivial to rename.
- Feed content depth (open): currently excerpt-only. Fine for a notification-style feed;
  the campaign email (Part B) links back to the full post rather than reproducing it.

### A3. Discoverability (optional, recommend yes)
- Add to `<head>` in `BaseLayout.astro`:
  `<link rel="alternate" type="application/rss+xml" title="John Crenshaw — Writing" href="/rss.xml">`
- Optional: an RSS link in `src/components/Dock.astro` (it has About/Code/Writing/Contact today).

### A4. Verify Part A
- `npm run build` → confirm `dist/rss.xml` exists and lists the 19 posts newest-first.
- `npm run preview`, then `curl -s localhost:4321/rss.xml | head -40` → well-formed XML,
  absolute `<link>`s under `https://jcrenshaw.dev/posts/...`, `<pubDate>` present.
- Deploy via existing GitLab CI; confirm `https://jcrenshaw.dev/rss.xml` is live and
  validates (W3C Feed Validator).

---

## Part B — RSS → listmonk glue (bash + curl, review-gate)

Runs on the laptop that already hosts listmonk (docker-compose at `/home/john/listmonk/`,
admin `192.168.1.34:9000`). Talks to listmonk over the **LAN** — never needs the public URL,
never crosses Cloudflare Access.

### B0. Prerequisites (must exist before B works)
1. **General list** created in listmonk (per the list architecture in memory — General is
   the public blog/essays list). Note its numeric **list ID**.
2. A listmonk **API user + token** (Admin → Settings → Users/API). Store token in a file
   readable only by John (e.g. `~/.config/listmonk-rss/token`, `chmod 600`).
3. `curl` and an XML/entity tool available. Use `xmllint` (libxml2) for parsing — avoids
   brittle regex over XML.

### B1. Script — `~/.local/bin/rss-to-listmonk.sh`
State: a file of already-seen item GUIDs, e.g. `~/.config/listmonk-rss/seen.txt`.

Logic:
1. `curl -s https://jcrenshaw.dev/rss.xml` → parse items with `xmllint --xpath`.
2. For each `<item>` extract `guid` (or `link`), `title`, `link`, `description`, `pubDate`.
3. Skip any guid already in `seen.txt`.
4. For each new item, `POST /api/campaigns` to create a **draft**:
   ```sh
   curl -s -u "$API_USER:$API_TOKEN" \
     'http://192.168.1.34:9000/api/campaigns' \
     -X POST -H 'Content-Type: application/json' \
     --data "$(jq -n --arg subj "$TITLE" --arg body "$BODY_HTML" \
                 --argjson lists "[$GENERAL_LIST_ID]" \
       '{name:$subj, subject:$subj, lists:$lists, type:"regular",
         content_type:"html", body:$body, tags:["blog","rss"]}')"
   ```
   - `body` = simple HTML: title + excerpt + a button/link to `$LINK` (the full post on
     the site). Not the full article — keeps the email a clean "new post" notification.
   - Campaign lands as `status: draft` (listmonk default). **No send happens.**
5. On success (HTTP 200 + `data.id`), append the guid to `seen.txt`.
6. Log to a file; exit non-zero on API error so the timer surfaces failures.

Review-gate = the script stops at "draft created." John opens listmonk admin, eyeballs the
draft, and clicks send. Going full-auto later is a one-line addition (a second call to flip
campaign status to sending) — deferred by decision.

### B2. Schedule — systemd user timer (preferred over cron on this box)
- `rss-to-listmonk.service` (Type=oneshot, runs the script).
- `rss-to-listmonk.timer` (e.g. `OnCalendar=hourly`, `Persistent=true`).
- `systemctl --user enable --now rss-to-listmonk.timer`.
- Hourly is plenty for a blog; adjust freely.

### B3. Verify Part B
- **Dry run first:** run the script with the POST replaced by an echo → confirm it detects
  exactly the unseen items and builds valid JSON.
- **Seed `seen.txt`** with all current 19 guids on first real run so history doesn't
  generate 19 drafts. (Or accept one batch and delete the drafts.)
- Publish a test post (or temporarily unhide one) → run script → confirm **one draft
  campaign** appears in listmonk admin, correctly addressed to General, with a working
  link back to the post. Confirm `seen.txt` updated and a re-run creates nothing.
- Send the draft to a test subscriber; confirm delivery via Resend.

---

## Sequencing

1. Part A first (feed must exist and be public before the glue can read it).
2. Part B0 prerequisites (General list + API token) — can be done in parallel with A.
3. Part B script + timer, dry-run, seed state, live test.

## Open items / needs from John
- **Feed path** `/rss.xml` vs `/feed.xml`, and whether to list it in the Dock.
- **Feed copy**: feed `title`/`description` strings above are placeholders.
- **General list ID** and **API token** (B0) — created in listmonk, values fed to the script.
- Poll cadence (default hourly).

## Related memory
- `comms-stack-target` — full infra state (Cloudflare, Resend, listmonk, tunnels, list architecture).
- `listmonk-public-styling` — public-page CSS (same design system the campaign HTML should echo).
- `brand-jcrenshaw-dev` — identity.
