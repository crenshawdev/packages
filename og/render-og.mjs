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
const TAGS_URL = 'https://api.github.com/repos/crenshawdev/tempest/tags?per_page=1';
const TEMPEST_FALLBACK = '2.11.0';

async function resolveTempestVersion() {
  try {
    const res = await fetch(TAGS_URL, {
      headers: {
        'User-Agent': 'jcrenshaw.dev build',
        Accept: 'application/vnd.github+json',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`GitHub tags ${res.status}`);
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
  const html = raw.replaceAll('{{TEMPEST_VERSION}}', tempestVersion);
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const out = resolve(here, '..', 'public', card.out);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
