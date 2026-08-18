import { defineConfig } from "astro/config";

// This repo deploys to GitHub Pages as a project site (see
// .github/workflows/checks.yml's `deploy` job, which uploads `dist/` via
// actions/upload-pages-artifact with no path rewriting), so it's served at
// https://<owner>.github.io/<repo>/, not the domain root. Astro's own asset
// links (the CSS/JS it injects into <head>) are emitted rooted at `base`, not
// as page-relative paths — so `base` has to match this repo's name exactly or
// those assets 404 once deployed, even though everything works locally.
export default defineConfig({
  site: "https://comp4020-agentic-coding-studio.github.io",
  base: "/comp4020-crit4-Astra-Erevos",
  // Astro's own injected <link rel="stylesheet"> for global.css is otherwise
  // rooted at `base` too, same as the page links above — inlining it removes
  // the only asset link with that problem instead of hand-rewriting how
  // Astro emits build assets.
  build: {
    inlineStylesheets: "always",
  },
});
