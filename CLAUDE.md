# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; this repo builds
with Astro, so the head lives in `src/layouts/Layout.astro` (shared by every
page through the `title`/`description` props), not in a per-page HTML file.
Replace the image and the description text passed to `Layout`. The card URL
resolves against the page that names it, like any link, and nothing in CI
checks that it resolves, so look at the deployed head when you add pages.

## The checks

`pnpm check` runs them (`pnpm check:evidence` is the extra gate before you
ship); CI runs the same plus links, secrets and the deploy. Read the failure.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook. As you learn what your prototype needs --- a
convention the work has to hold to, a sensor that keeps catching you out (a
linter, say), a fact about the stack that is easy to get wrong --- write it down
here and wire it into `check`. Growing this file is the work.

## Principles carried forward from earlier prototypes

- Treat the rendered page as ground truth at both 1920×1080 and 390×844.
  Automated viewport checks do not verify visual usability.
- Before claiming completion, run `pnpm check` and `pnpm check:evidence`,
  inspect the live GitHub Pages result, and verify relative links.
- Review the prototype from a first-time-user perspective: the scenario, task,
  primary action, and any reset/reversal must be understandable without prior
  subject-matter expertise. A prototype that quietly requires domain knowledge
  unrelated to its thesis is testing the wrong thing.
- When the intended experience depends on a comparison or progression, design
  the core interaction so every visitor encounters it directly, rather than
  depending on a particular choice path or on the visitor remembering earlier
  state. A choice space that a visitor can navigate around the point is not
  reliable enough to carry the thesis, however good the code behind it is.
- For any interaction built on a repeated or multi-step sequence, manually
  exercise the entire sequence — every stage, not just the first step or a
  single pass — before declaring it done. Passing typecheck/build/lint/tests
  and reading the initial markup does not surface bugs that are properties of
  the sequence across many repetitions (off-screen content, steps collapsing
  into one, dead ends).

## Project-specific rules learned from the first public CI run

- CI's `check` job only runs once the repo is public, so a check declared as
  "only runs in CI" (links, evidence, secrets) is genuinely unverified by
  `pnpm check` until the repo is shipped — the first `/comp4020:ship` run is
  the first time these have ever executed for real, not a formality after
  weeks of green runs.
- This repo's `astro.config.mjs` deliberately roots asset links at `base`
  (`/comp4020-crit4-Astra-Erevos`) rather than using relative URLs, so they're
  correct once deployed but read as 404s to a bare `linkinator ./dist` crawl,
  which serves `dist/` at `/` locally with no base prefix. The links-check
  step in `.github/workflows/checks.yml` now passes
  `--url-rewrite-search "/comp4020-crit4-Astra-Erevos/" --url-rewrite-replace "/"`
  to strip that prefix before crawling, so the check tests real reachability
  instead of the base-path mismatch. Run the same rewritten command locally,
  not the bare one, when checking links before a push.
