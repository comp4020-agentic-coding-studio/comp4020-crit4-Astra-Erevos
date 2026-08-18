# Crit 4 — reflection

**What was the breakthrough that moved the work forward?**

Green tests told me very little about whether Orbit was actually good to
play. They confirmed the mechanical requirements — live synthesis, a
focusable control, no gating dialog — but nothing about feel or sound. The
clearest proof was the drag "siren": folding the angle mapping to remove a
seam in the pitch math worked exactly as intended and kept every check
green, but playing it made ordinary drags sound worse everywhere else,
because the fix had quietly doubled how much a small movement changed
pitch. I threw that change away without ever committing it. The opposite
happened with a bug the existing automated checks didn't catch: holding an
arrow key down
produced a continuous sweep because the browser's own key-repeat was
silently re-triggering pitch changes. The existing tests didn't catch that;
only holding the
key myself and listening did, and the actual fix was one guard clause. Both
moments taught me the same thing from opposite directions: my ear and my
hands were the real harness here, not the test suite.

**What did this work change about who I want to be as a software developer?**

I don't want to be a developer who treats a green check as the end of the
job. Automated tests are the right tool for anything mechanically
checkable, and I kept relying on them for exactly that. But for feel,
sound, or discoverability, I had to form my own judgement and be willing to
override a change that looked correct on paper. I also had to accept the
opposite call: a later rate-limit change didn't clearly solve the remaining
fast-drag sound, but it didn't damage playability either, so I chose to
stop rather than keep over-engineering an already-playable instrument.
