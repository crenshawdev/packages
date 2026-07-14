import { defineConfig, envField, fontProviders } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://jcrenshaw.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  // Ghost Content API access for the render layer. Declared here so the
  // Phase-3 markdown->Ghost cutover has a typed env home; optional for now so
  // the build stays green before the vars are provisioned in the deploy env.
  env: {
    schema: {
      GHOST_URL: envField.string({ context: 'server', access: 'public', optional: true }),
      GHOST_CONTENT_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Sans',
      cssVariable: '--font-ibm-plex-sans',
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-ibm-plex-mono',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
    },
  ],
});
