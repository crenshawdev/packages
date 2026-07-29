// Renders the OG link-preview cards in og/*.html to public/*.png at 1200x630.
// Usage:
//   node og/render-og.mjs            # render every card
//   node og/render-og.mjs tempest    # render one card (matched by output stem)
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// Resolve the live Tempest release so the card version tracks the tag at render
// time. Falls back to a curated value so OG rendering still proceeds on failure.
const TAGS_URL =
  'https://git.jcrenshaw.dev/api/v1/repos/crenshawdev/tempest/tags?limit=1';
const TEMPEST_FALLBACK = '2.11.0';

async function resolveTempestVersion() {
  try {
    const res = await fetch(TAGS_URL, {
      headers: {
        'User-Agent': 'jcrenshaw.dev build',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Forgejo tags ${res.status}`);
    const tags = await res.json();
    const name = Array.isArray(tags) ? tags[0]?.name : null;
    if (!name) throw new Error('no tags returned');
    return String(name).replace(/^v/, '');
  } catch (err) {
    console.warn('[render-og] Tempest version fallback:', err.message);
    return TEMPEST_FALLBACK;
  }
}

const tempestVersion = await resolveTempestVersion();

// Resolve the live weathervane release from crates.io so the card version
// tracks the published crate at render time. Curated fallback on failure.
const CRATES_URL = 'https://crates.io/api/v1/crates/weathervane';
const WEATHERVANE_FALLBACK = '0.10.0';

async function resolveWeathervaneVersion() {
  try {
    const res = await fetch(CRATES_URL, {
      headers: { 'User-Agent': 'jcrenshaw.dev build', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`crates.io ${res.status}`);
    const data = await res.json();
    const version = data?.crate?.max_stable_version;
    if (!version) throw new Error('no version returned');
    return String(version);
  } catch (err) {
    console.warn('[render-og] weathervane version fallback:', err.message);
    return WEATHERVANE_FALLBACK;
  }
}

const weathervaneVersion = await resolveWeathervaneVersion();

// Inline the generated card art as a data URI so page.setContent (which has no
// base URL for relative paths) can render it. Falls back to an empty string so
// the body's background-color/gradient still yields a dark card if it is absent.
async function resolveCardBg() {
  try {
    const raw = await readFile(resolve(here, 'art', 'card-bg.png'));
    return `data:image/png;base64,${raw.toString('base64')}`;
  } catch (err) {
    console.warn('[render-og] card-bg fallback:', err.message);
    return '';
  }
}

const cardBg = await resolveCardBg();

// Each card is a self-contained HTML file rendered to an image under public/.
const CARDS = [
  { html: 'og-card.html', out: 'og-image.png' },
  { html: 'tempest-card.html', out: 'tempest-og.png' },
  { html: 'weathervane-card.html', out: 'weathervane-og.png' },
];

const only = process.argv[2];
const cards = only ? CARDS.filter((c) => c.out.startsWith(only)) : CARDS;
if (only && cards.length === 0) {
  console.error(`no card matching "${only}" — known: ${CARDS.map((c) => c.out).join(', ')}`);
  process.exit(1);
}

const browser = await chromium.launch();
for (const card of cards) {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1, // exact 1200x630 to match og:image:width/height meta
  });
  const raw = await readFile(resolve(here, card.html), 'utf8');
  const html = raw
    .replaceAll('{{TEMPEST_VERSION}}', tempestVersion)
    .replaceAll('{{WEATHERVANE_VERSION}}', weathervaneVersion)
    .replaceAll('{{CARD_BG}}', cardBg);
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const out = resolve(here, '..', 'public', card.out);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
