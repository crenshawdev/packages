# jcrenshaw.dev — project notes

Astro 6 static site for jcrenshaw.dev (blog + project pages), deployed to GitLab Pages.

## Commands
- `npm run dev` — local dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — preview the build
- `node og/render-og.mjs [stem]` — regenerate OG cards (requires `npx playwright install chromium`)

## Architecture
- Posts are markdown in `./posts` (root, not `src/content/`), loaded via the glob loader in `src/content.config.ts`. Frontmatter is Ghost-export-shaped; `published_at` is the only required field.
- Pages in `src/pages/`: `index`, `writing`, `about`, `code`, plus `posts/[slug].astro` and per-project pages under `posts/` and `code/`.
- Shared chrome in `src/layouts/BaseLayout.astro` + `src/components/` (Dock, Panel); global CSS in `src/styles/global.css`; `src/lib/latestCode.ts` feeds the code page.
- OG link-preview cards live in `og/*.html`, rendered to `public/*.png` at 1200x630.

## Gotchas
- `trailingSlash: 'never'` with `build.format: 'directory'` — keep internal links extensionless and trailing-slash-free.
- CI (`.gitlab-ci.yml`) runs only on the default branch, does `npm ci && npm run build`, then `mv dist public`. It does NOT run `render-og.mjs`, so commit regenerated OG PNGs in `public/`.
