# Process overview

## What I built

Orbit is a single-page browser instrument: a glowing "core" in a dark field
that a player clicks, drags, or steers with the keyboard to shape a live Web
Audio patch — angle picks a pentatonic pitch, distance shapes the filter's
brightness, and gesture speed drives loudness.

## The moments that mattered

1. **Playtesting found what green tests missed.** The first playable build
   ([`d64d46d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Astra-Erevos/commit/d64d46d))
   passed the crit-4 contract tests
   ([`3964a28`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Astra-Erevos/commit/3964a28)),
   but only playing it cold surfaced problems: a discoverability hint that
   vanished too fast, a tab order that focused Home before the instrument,
   and — most seriously — a continuous siren whenever an arrow/pitch-control
   key was held down. Diagnosis showed the browser's own `keydown`
   auto-repeat was silently re-triggering pitch changes, something the
   existing automated checks did not catch. A one-line `event.repeat` guard
   fixed it
   ([`77abf73`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Astra-Erevos/commit/77abf73)),
   confirmed by holding the key again and listening.

2. **Judgement through rejected audio experiments.** A similar siren
   appeared on fast mouse drags. Folding the angle mapping to remove a seam
   in the pitch math was numerically correct and kept every check green, but
   playtesting made ordinary drags sound worse everywhere else, so I
   rewound it, uncommitted. A second attempt, freezing pitch near the core,
   produced no clear improvement and was discarded. The change I kept,
   rate-limiting pitch updates to roughly once per 60ms
   ([`52f89f2`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-Astra-Erevos/commit/52f89f2)),
   wasn't a clear fix for the fast-drag sound, but it made scheduling more
   controlled without damaging click, normal drag, or overall playability. I
   stopped there rather than keep reshaping an already-playable instrument.

`pnpm check` stayed green throughout, but it only ever verified the
mechanically checkable parts of the spec; both moments above came from
playing the instrument and trusting what I heard over what a passing check
implied.
