import { defineConfig, fontProviders } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://jcrenshaw.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  trailingSlash: 'never',
  build: {
    format: 'directory',
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
