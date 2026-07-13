// Renders the OG link-preview cards in og/*.html to public/*.png at 1200x630.
// Usage:
//   node og/render-og.mjs            # render every card
//   node og/render-og.mjs tempest    # render one card (matched by output stem)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

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
  await page.goto('file://' + resolve(here, card.html), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  const out = resolve(here, '..', 'public', card.out);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await page.close();
  console.log('wrote', out);
}
await browser.close();
