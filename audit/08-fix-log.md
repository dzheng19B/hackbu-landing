# Fix log

Closure record for the findings raised in `audit/AUDIT.md`. The audit reports (`01-baseline.md`
… `07-live.md` and the consolidated `AUDIT.md`) are read-only history and are never edited to
reflect a fix; this file is where a finding is closed instead. One entry per finding ID, in the
phase that resolved it: the status (`FIXED`, `DOCUMENTED`, or `WONTFIX` with a reason), the
`file:line` the change landed at, and the command that proves it with the output it produced. An
entry with no `file:line` or no command is not a closure. Later phases append their own sections
below; nothing above a section line is rewritten. Commands were run from the repo root on Windows
(Git Bash), Node v24.18.0, at the end of the phase — after every change in it was in place, so
each output reflects the final tree, not the state at the moment that one edit was made.

## Phase 1 — tooling and build hygiene

Eight findings: P1-5, P6-12, P6-13, P6-15, P2-3, P6-16, P6-17, P6-14. Files touched:
`src/index.css`, `.oxlintrc.json`, `src/components/Wordmark.tsx`, `package.json`,
`tsconfig.app.json`, `tsconfig.node.json`, `.gitignore`, `README.md`.

### P1-5 · FIXED · `src/index.css:19`

`@import 'tailwindcss'` became `@import 'tailwindcss' source('.')`, with the reasoning in the
comment above it. `source(…)` resolves against the directory of the file that writes it, which is
`src/` for both stylesheet roots — `src/landing.css` imports this file and `src/sheet/main.tsx`
imports it directly — so one line scopes both builds. `src/landing.css:22`'s exclusion of the
sheet still narrows the landing build on top of it (verified below). Neither HTML entry carries a
`class` attribute (`grep -c 'class=' index.html components.html` → `0` and `0`), so neither needs
an explicit `@source` line; the comment says what to add if that changes.

```
$ grep -c 'grid-cols-5' dist/assets/index-*.css ; grep -c '\.isolate{' dist/assets/index-*.css
0
0
$ grep -c 'grid-cols-5' dist/assets/components-*.css
1
```

The landing stylesheet lost 31 selectors and 3,157 bytes (20,616 → 17,459) and gained none; the
sheet's lost 20 and 2,509 (23,247 → 20,738). Every dropped selector was checked against the
landing source set (`src/` minus `src/sheet/`, plus both HTML entries) for the bare class token as
a standalone word: two matched, `container` (prose in `src/index.css:36`) and `invisible` (prose
in `src/components/Hero.tsx:118`), and neither is used as a class anywhere — the rest matched
nothing at all. The variant forms that *are* used still build: the focus-visible outline rules,
the focus-only skip-link rules and the hover link colour are all present in
`dist/assets/index-*.css`. So nothing live was lost; what left the bundle was rules whose names
had been quoted in prose.

This file is itself the regression test. It writes the token `grid-cols-5` twice above, in an
unscanned directory, and the build after it was written still reports `0` for the landing
stylesheet — which is the whole of what P1-5 asked for.

### P6-12 · FIXED · `.oxlintrc.json:3`

`"plugins"` gained `"unicorn"`. Naming the field replaces oxlint's default plugin set rather than
extending it, so the 13 default-on unicorn rules had been silently dropped.

```
$ npx oxlint --print-config | grep -c '"unicorn/'
13
```

They raise nothing on the current tree: `npx oxlint --deny-warnings` exits 0 (see P6-15). The
`.mjs` under `scripts/` is linted — confirmed against a scratchpad probe file, which oxlint
flagged with `unicorn(no-empty-file)`, so the zero is a real zero and not an unscanned directory.

### P6-13 · FIXED · `.oxlintrc.json:3`, suppression at `src/components/Wordmark.tsx:56`

`"plugins"` gained `"jsx-a11y"`, adding 35 rules. It raised exactly one diagnostic, and that one
is not fixable as written:

```
$ npx oxlint            # before the suppression
src/components/Wordmark.tsx:47:7: warning jsx-a11y(prefer-tag-over-role): Prefer `img` over `role` attribute `img`.
```

`prefer-tag-over-role` wants an `<img>` element in place of `role="img"`. The lockup is two
mask-painted `<span>`s that must be announced as a single graphic — the case WAI-ARIA's `img`
role exists for — and there is no image file for an `<img>` to point at; producing one would mean
shipping a third, pre-coloured logo asset and giving up the single-token recolouring the
component is built around. **Rule disabled, not fixed**, as an inline
`// eslint-disable-next-line jsx-a11y/prefer-tag-over-role` on the attribute only, so it stays on
for the rest of the repo. Reason recorded in the component's doc comment
(`src/components/Wordmark.tsx:34–42`) and in README's Tooling section, because oxlint's JSON
config takes no comments.

```
$ npx oxlint ; echo "EXIT=$?"
EXIT=0
```

Caveat for anyone verifying the plugin is on by grep: oxlint normalises the plugin prefix in
`--print-config` output to an underscore, so the 35 rules print as `"jsx_a11y/alt-text"` and
similar, not `"jsx-a11y/…"`. The hyphenated spelling appears only in the `plugins` array it
echoes back. This is oxlint 1.79.0's serialisation, not a config choice:

```
$ npx oxlint --print-config | grep -c '"jsx_a11y/'
35
$ npx oxlint --print-config | grep -o '"jsx-a11y"'
"jsx-a11y"
```

Total effective rules went 131 → 179 (57 core, 33 react, 27 typescript, 14 oxc, 13 unicorn,
35 jsx-a11y).

### P6-15 · FIXED · `package.json:11`, `package.json:13`

`"lint"` is now `oxlint --deny-warnings` and `"build"` is `npm run lint && tsc -b && vite build`.
130 of the effective rules are warnings, so without `--deny-warnings` no diagnostic could fail
anything; and since `vercel.json` builds with `npm run build`, lint now gates the deploy too.
There is still no CI workflow in the repo — the build script is the only enforcement point.

```
$ npm run lint ; echo "EXIT=$?"
> oxlint --deny-warnings
EXIT=0
$ npm run build ; echo "EXIT=$?"
> npm run lint && tsc -b && vite build
✓ built in 394ms
EXIT=0
```

### P2-3 · FIXED · `tsconfig.app.json:37`, `tsconfig.node.json:19`

`"strict": true` is now declared in both project files rather than inherited from TypeScript 6's
default. The behaviour is unchanged today — Phase 6 confirmed the default resolves to `true` under
tsc 6.0.3 — but the setting now survives a compiler that decides otherwise.

```
$ grep -c '"strict": true' tsconfig.app.json tsconfig.node.json
tsconfig.app.json:1
tsconfig.node.json:1
$ npm run typecheck ; echo "EXIT=$?"
> tsc -b --noEmit
EXIT=0
```

### P6-16 · FIXED (one flag) + DOCUMENTED (the other) · `tsconfig.app.json:38`, `tsconfig.node.json:20`; rationale at `tsconfig.app.json:19–36`

`noUncheckedIndexedAccess` is **on** in both project files. It was trialled before being written
in, and the tree needed no narrowing at all — the codebase reaches into arrays through `map` and
`for…of` rather than raw subscripts, which is what Phase 6 predicted:

```
$ npx tsc -p tsconfig.app.json --noEmit --strict --noUncheckedIndexedAccess ; echo "EXIT=$?"
EXIT=0
$ npx tsc -p tsconfig.node.json --noEmit --strict --noUncheckedIndexedAccess ; echo "EXIT=$?"
EXIT=0
```

`exactOptionalPropertyTypes` stays **off**, and the reason is a dependency's types, not this
codebase: motion declares `viewport` on `MotionProps` as optional without `| undefined`, so
forwarding a possibly-absent viewport is an error at both of `src/components/Reveal.tsx`'s spread
sites. It could only be worked around at the call sites, for no type-safety gain.

```
$ npx tsc -p tsconfig.app.json --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes ; echo "EXIT=$?"
src/components/Reveal.tsx(67,9): error TS2375: Type '{} | { … viewport: ViewportOptions | undefined; … }' is not assignable to type 'MotionProps' with 'exactOptionalPropertyTypes: true'.
src/components/Reveal.tsx(98,9): error TS2375: Type '{} | { … viewport: ViewportOptions | undefined; … }' is not assignable to type 'MotionProps' with 'exactOptionalPropertyTypes: true'.
EXIT=2
```

Both decisions are written into `tsconfig.app.json`'s comment block, with `tsconfig.node.json:16–18`
pointing at it, so the next person reading the config finds the reasoning without finding this file.

### P6-17 · FIXED · `package.json:6–8`, documented at `README.md:35–37`

`"engines": { "node": ">=24" }` — the installed major (`node -v` → `v24.18.0`) and the floor the
toolchain implies (Vite 8, TypeScript 6, `@types/node` 24, `sharp`). Vercel reads the same field
to select a build runtime, which is what makes the deploy's Node version discoverable from the
repo at all. README's "Local setup" now leads with it.

```
$ grep -c '"engines"' package.json
1
$ node -e "console.log(require('./package.json').engines)"
{ node: '>=24' }
```

### P6-14 · FIXED · `.gitignore:9`

`.env*` narrowed to `.env*.local`, matching Vite's own convention (`.env` and `.env.example` are
committed, `*.local` files are not) and matching what the comment above it already claimed to
cover. Nothing currently tracked or untracked changed status — `git status --short` lists only the
files this phase edited.

```
$ git check-ignore -v .env.local
.gitignore:9:.env*.local	.env.local
$ git check-ignore -v .env.example ; echo "EXIT=$?"
EXIT=1
```

(`.env.local` was never read or printed; `git check-ignore` only resolves the path against the
ignore rules.)

### Note — README line numbers (not a finding)

`README.md` gained a Tooling subsection and three edited lines, so every README line citation in
`audit/AUDIT.md` and the phase reports (for example the design-system section the consolidated
report cites as `README.md:179–207`) is now offset by roughly 40 lines. The audit files are
history and were not touched; anyone following a README citation from them should search for the
heading rather than trust the number.

---

## Phase 2 — accessibility and interaction

Eight findings: P2-4 (+P7-2), P4-1, P4-2 (+P3-1), P4-3, P4-4, P4-5, P4-8. Files touched:
`src/App.tsx`, `src/components/Hero.tsx`, `src/components/HeroClouds.tsx`,
`src/components/ExternalLink.tsx`, `src/components/controls.ts` (new),
`src/components/SiteHeader.tsx`, `src/components/sections/GetInvolvedSection.tsx`,
`src/sheet/ComponentSheet.tsx`, `src/sheet/parts/PrimitivesPart.tsx`, `README.md`.

The live probes below were run against the dev server (`hackbu-dev`, port 5173) from headless
Edge 151.0.4129.101 over CDP, with `Emulation.setFocusEmulationEnabled` on so a headless window
still reports focus. Both were shut down at the end of the phase. The probe scripts live in the
session scratchpad, not the repo.

### P2-4 · FIXED · `src/App.tsx:67` (reasoning at `:50–66`) — and **P7-2** · FIXED · `src/components/Hero.tsx:204,202`

`<main id="main">` and the hero's `<section id="top">` both carry `tabIndex={-1}`, so activating
the skip link or the header logo link moves *focus*, not only the viewport — no longer relying on
the browser's sequential-focus-navigation starting point, which Safari does not move for a
non-focusable target unless Full Keyboard Access is on.

Both also carry `focus:outline-none`, and that turned out to be load-bearing rather than
precautionary: Chromium's `:focus-visible` heuristic **does** match a fragment-navigation focus
(`focusVisible: true` on both elements in the run below), so without it the UA's default ring
would be painted around the entire page content and around the 260dvh hero track. The
suppression is scoped to exactly these two elements — the probe enumerated every element on the
page whose computed `outline-style` is `none`, and the answer is those two and nothing else —
and neither carries any other focus treatment to lose. The skip link and a nav link were
re-checked in the same run and still draw the 2px pine ring.

```
$ grep -n 'tabIndex={-1}' src/App.tsx src/components/Hero.tsx
src/App.tsx:38:       * `tabIndex={-1}` so the skip link above actually moves focus.
src/App.tsx:54:      <main id="main" tabIndex={-1} className="focus:outline-none">
src/components/Hero.tsx:176:      tabIndex={-1}

$ node phase2-probe.mjs 9334      # 1280x800, Tab then Enter from a fresh load
after Tab 1, active = {"tag":"A",...,"text":"Skip to content","focusVisible":true,"outline":"rgb(60, 92, 72) solid 2px","tabIndex":0}
after Enter,  active = {"tag":"MAIN","id":"main","cls":"focus:outline-none","focusVisible":true,"outline":"rgb(17, 17, 17) none 1px","outlineStyle":"none","tabIndex":-1}
PASS(document.activeElement.id === "main") = true
after Tab 2 (next stop after the skip) = {"tag":"A",...,"text":"Join the Discord (opens in a new tab)","outline":"rgb(60, 92, 72) solid 2px"}

logo link focused = {"tag":"A",...,"outline":"rgb(60, 92, 72) solid 2px","tabIndex":0}
after Enter,  active = {"tag":"SECTION","id":"top","cls":"bg-sky relative w-full focus:outline-none h-[260dvh]","focusVisible":true,"outlineStyle":"none","tabIndex":-1}
PASS(document.activeElement.id === "top") = true
scrollY after = 0

outline-suppressing elements on the page = ["MAIN#main","SECTION#top"]
nav link focused  = {"tag":"A",...,"text":"Schedule","outline":"rgb(60, 92, 72) solid 2px"}
skip link focused = {"tag":"A",...,"text":"Skip to content","outline":"rgb(60, 92, 72) solid 2px"}
```

The second Tab after the skip lands on the intro CTA, confirming the starting point moved with
focus and that nothing in the hero is focusable — `#top` is `tabIndex={-1}`, which is not a tab
stop.

### P4-1 · FIXED · `src/components/ExternalLink.tsx:55,68–78,104–118`

`ExternalLink` now has two branches instead of one, chosen by `isSameSite(href)`:

- **hackbu.org (and any subdomain)** — rendered with no `target` and no notice, so the club's own
  pages navigate in place. 16 links: the eight footer `SITE_PAGES`, the three nav destinations
  twice over (desktop bar + compact panel), `RESOURCES_URL` and `MAILING_LIST_URL`.
- **everything else** — unchanged `target="_blank" rel="noopener noreferrer"`, plus a
  `<span class="sr-only"> (opens in a new tab)</span>` inside the anchor, which appends to the
  accessible name rather than replacing it (2.5.3 Label in Name stays satisfied). 9 links: the
  four Discord CTAs and the five socials.

The rule is a **hostname** test — `url.hostname === 'hackbu.org'` or `url.hostname` ends with
`.hackbu.org` — not a string prefix, so `https://hackbu.org.example.com/` is correctly external;
a relative href resolves against the site origin and is same-site by construction; anything
`new URL` cannot parse falls to the external branch, which is the branch that keeps the `rel`
hardening. The `{...rest}` spread stays first, so `href` / `target` / `rel` remain
non-overridable by a caller (commit fb392cf).

```
$ grep -rn 'target="_blank"' src/components/ExternalLink.tsx
 92: *   **everything else** — keeps `target="_blank"` with the `rel` hardening,
113:    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
$ grep -rn 'new tab' src/components/ | tail -1
src/components/ExternalLink.tsx:115:      <span className="sr-only"> (opens in a new tab)</span>
```

Live, walking every `<a href>` in the rendered page:

```
{"sameSiteWithTarget":[],"externalWithoutNotice":[],"externalWithoutRel":[],
 "counts":{"same":16,"ext":9,"mail":2,"total":29},
 "sampleExternalName":"Discord (opens in a new tab)"}
```

No same-site link carries a `target`; no external link is missing either the notice or the
`rel`. The two `mailto:` links go through `MailLink` and are untouched.

### P4-2 · FIXED · `src/components/controls.ts:39–41`, applied at `src/components/SiteHeader.tsx:78`, `src/sheet/ComponentSheet.tsx:109`, `src/sheet/parts/PrimitivesPart.tsx:510` — and **P3-1** · FIXED, same change

One new constant, `TOGGLE_ON_CLOUD`, is now the single definition of the outlined pill
`<button>` that had been written inline in three files:

```
export const TOGGLE_ON_CLOUD =
  'border border-pine text-pine hover:bg-pine hover:text-cloud ' +
  'focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2'
```

`pine` on `cloud` is **6.83:1**, so the boundary clears 1.4.11's 3:1 bar by a factor of two; it
replaces a `frost` border and `frost` hover fill that measured **1.19:1** — invisible in both
states. The hover now fills with `pine` and flips the glyph/label to `cloud` (6.83:1 for the
content inside the filled pill). `stone` was the audit's first suggestion and cannot be used: it
measures **1.81:1** on cloud, below the bar. `brick` clears it at 4.78:1 but is the page's single
accent and means "join the Discord", so `pine` — already the focus-ring colour and the button
hover fill — is the one that adds no new meaning. Shape and size stay at the call sites, exactly
as `LINK_ON_CLOUD` leaves typography out; the 42×42 hit box of the menu toggle is unchanged.
Documented in README's link-treatment section, which now says three treatments and names this one.

```
$ grep -rn 'hover:bg-frost' src/ ; echo "EXIT=$?"
EXIT=1
$ grep -rn 'TOGGLE_ON_CLOUD' src/ | wc -l
7
$ grep -rn 'TOGGLE_ON_CLOUD' src/
src/components/controls.ts:39:export const TOGGLE_ON_CLOUD =
src/components/SiteHeader.tsx:5:import { TOGGLE_ON_CLOUD } from './controls'
src/components/SiteHeader.tsx:78:          className={`${TOGGLE_ON_CLOUD} -mr-2 inline-flex items-center justify-center rounded-full p-2 md:hidden`}
src/sheet/ComponentSheet.tsx:4:import { TOGGLE_ON_CLOUD } from '../components/controls'
src/sheet/ComponentSheet.tsx:96:            className={`${TOGGLE_ON_CLOUD} text-caption shrink-0 rounded-full px-3 py-1.5`}
src/sheet/parts/PrimitivesPart.tsx:11:import { TOGGLE_ON_CLOUD } from '../../components/controls'
src/sheet/parts/PrimitivesPart.tsx:510:              className={`${TOGGLE_ON_CLOUD} text-caption rounded-full px-4 py-2`}
```

Live, at 375×812 — resting, then with a real `mouseMoved` over the toggle:

```
resting: {"background":"rgba(0, 0, 0, 0)","color":"rgb(60, 92, 72)","borderColor":"rgb(60, 92, 72)"}
hovered: {"background":"rgb(60, 92, 72)","color":"rgb(247, 245, 238)","borderColor":"rgb(60, 92, 72)"}
   rgb(60,92,72) = #3c5c48 = pine;  rgb(247,245,238) = #f7f5ee = cloud
   borderWidth 1px, rect 42x42
```

and all three call sites render it, on both routes, with no console error:

```
http://localhost:5173/
  console errors: 0  exceptions: 0
  toggles with a pine border: [{"t":"Open menu","border":"rgb(60, 92, 72)"}]
http://localhost:5173/components.html
  console errors: 0  exceptions: 0
  toggles with a pine border: [{"t":"Reveals: at rest",...},{"t":"Replay",...},{"t":"Open menu",...}]
```

### P4-3 · FIXED · `src/components/sections/GetInvolvedSection.tsx:40`

The conversion card's edge is `border-stone/60`, matching the hairline already used inside the
same card at `:61`, in place of a frost border on a frost fill (1.00:1 — a border that cannot
render). One treatment for the card's edge and its internal rule.

```
$ grep -rn 'border-frost' src/components/sections/GetInvolvedSection.tsx ; echo "EXIT=$?"
EXIT=1
$ grep -n 'border-stone/60 bg-frost' src/components/sections/GetInvolvedSection.tsx
40:        <div className="border-stone/60 bg-frost mt-12 rounded-3xl border p-8 sm:p-12">
```

Live: `{"borderColor":"oklab(0.783604 0.00410199 0.0371398 / 0.6)","background":"rgb(220, 227, 234)"}`
— `stone` at 60% over `frost` (1.28:1, a deliberate hairline) rather than frost on frost.

### P4-4 · FIXED · `src/components/HeroClouds.tsx:699–717` (`driftLoop`), `:767–772` (the switch), `:826`

Each cloud layer's drift now stops at that layer's own `fadeEnd` and starts again if the reader
scrolls back. The switch is a `useState` boolean driven by
`useMotionValueEvent(progress, 'change', …)` on the hero's existing `useScroll` value — **no
`scroll` event listener was added**; `src/` still has none. When the switch is false, `driftLoop`
returns `animate: { x: LOOP_START }` with `transition: { duration: 0 }`: no keyframes, no
`repeat`, nothing left running, rather than an animation that is merely invisible.

Per-layer thresholds rather than one shared threshold, because at `layer.fadeEnd` that layer's
opacity is *exactly* zero by the same arithmetic that drives the fade — so both the stop and the
restart (which snaps the track back to `LOOP_START`) land on a frame that paints nothing. A
single threshold at the largest `fadeEnd` (0.30, the far layer) would have paused the near layer,
whose fade ends at 0.22, while it was still faintly visible.

Reduced motion is untouched: that branch returns before any of this and renders `RestingCloudSet`
with no drift nodes at all.

What this does **not** claim: it is not an in-page pause control, which is 2.2.2's strictest
reading. The page's answer to that remains `prefers-reduced-motion`, an explicitly permitted
platform mechanism; this bounds the animation so it stops on its own instead of running for the
rest of the session behind content the reader has already scrolled past.

```
$ grep -rn "addEventListener('scroll'" src/
src/components/Hero.tsx:138:  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything
```

One hit, and it is the comment in `Hero.tsx` asserting that there are none — no call site.

Live at 1280×800 — `[data-cloud-drift]` computed transforms, and the parent layer's opacity:

```
scroll to hero progress 0.00: {"y":0,"max":1280}
t=0s   @progress 0.00 : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1266.44, 0)","layerOpacity":"0.5"},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1267.1, 0)","layerOpacity":"0.75"},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1268.01, 0)","layerOpacity":"1"}]
t=3.2s @progress 0.00 : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1288.07, 0)",...},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1298.63, 0)",...},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1313.2, 0)",...}]
  drift RUNNING at rest (transforms differ) = true

scroll past the hero track: {"y":2280}
t=0s   past track : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"}]
t=3.4s past track : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1265, 0)","layerOpacity":"0"}]
  drift STOPPED (transforms identical) = true

t=0s   back at 0  : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1267.86, 0)",...},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1269.17, 0)",...},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1270.97, 0)",...}]
t=3.2s back at 0  : [{"layer":"far","drift":"matrix(1, 0, 0, 1, -1289.39, 0)",...},{"layer":"mid","drift":"matrix(1, 0, 0, 1, -1300.55, 0)",...},{"layer":"near","drift":"matrix(1, 0, 0, 1, -1315.95, 0)",...}]
  drift RESUMED (transforms differ) = true
```

Every layer is at `opacity: 0` at the moment the drift is frozen, and all three freeze on the
same `-1265` (= `LOOP_START`), which is the snap described above happening where nothing paints.

Reduced motion, `Emulation.setEmulatedMedia prefers-reduced-motion: reduce`, reloaded:

```
{"driftNodes":0,"layerNodes":3,"heroTrackHeight":800,"viewportHeight":800,"campusTransform":"none"}
```

Zero `[data-cloud-drift]` nodes, three resting layers, the track collapsed to exactly one
viewport, and the campus at scale 1 — identical to the pre-change behaviour.

### P4-5 · DOCUMENTED (no code change needed) · `src/index.css:102` vs `src/components/SiteHeader.tsx:49`

`scroll-padding-top: 6rem` = **96px** at every breakpoint, against a measured header of **81px**
at 1280×800 (`h-20` + 1px border) and **65px** at 375×812 (`h-16` + 1px). The gutter already
exceeds the bar, so nothing was changed; what was missing was the behavioural half, which Phase 7
had not tested — a link already partly on screen under the header, where an anchor jump triggers
no scroll at all.

Probe: park a real link so its top half is behind the bar (`beforeFocus.halfHidden: true`), then
call `.focus()` on it and re-measure both rects.

```
1280x800  {"scrollPaddingTop":"96px","headerHeight":81,"clears":true}
  #get-involved a[href*="mailing-list"]  {"link":"Sign up for the mailing list","height":17,"headerBottom":81,"beforeFocus":{"top":72.4,"bottom":89.4,"halfHidden":true},"afterFocus":{"top":439.4,"bottom":456.4},"scrolledOnFocus":true,"entirelyHiddenAfterFocus":false,"fullyClearAfterFocus":true,"isFocused":true,"outline":"rgb(60, 92, 72) solid 2px"}
  #get-involved a[href*="discord"]       {"link":"Join the Discord (opens in a n","height":71.8,"headerBottom":81,"beforeFocus":{"top":44.8,"bottom":116.6,"halfHidden":true},"afterFocus":{"top":93.8,"bottom":165.6},"scrolledOnFocus":true,"entirelyHiddenAfterFocus":false,"fullyClearAfterFocus":true,"isFocused":true,"outline":"rgb(60, 92, 72) solid 2px"}
  main a[href*="resources"]              {"link":"Workshop resources","height":30,"headerBottom":81,"beforeFocus":{"top":66.4,"bottom":96.4,"halfHidden":true},"afterFocus":{"top":96.4,"bottom":126.4},"scrolledOnFocus":true,"entirelyHiddenAfterFocus":false,"fullyClearAfterFocus":true,"isFocused":true,"outline":"rgb(60, 92, 72) solid 2px"}
375x812   {"scrollPaddingTop":"96px","headerHeight":65,"clears":true}
  #get-involved a[href*="mailing-list"]  {...,"beforeFocus":{"top":56.3,"bottom":73.3,"halfHidden":true},"afterFocus":{"top":445.3,"bottom":462.3},"fullyClearAfterFocus":true,...}
  #get-involved a[href*="discord"]       {...,"beforeFocus":{"top":34.6,"bottom":94.5,"halfHidden":true},"afterFocus":{"top":421.6,"bottom":481.5},"fullyClearAfterFocus":true,...}
  main a[href*="resources"]              {...,"beforeFocus":{"top":52.8,"bottom":77.8,"halfHidden":true},"afterFocus":{"top":441.8,"bottom":466.8},"fullyClearAfterFocus":true,...}
```

Six cases, two viewports: focus scrolled the link out from under the bar every time
(`scrolledOnFocus: true`), `entirelyHiddenAfterFocus` was **false** everywhere, and
`fullyClearAfterFocus` — the stricter 2.4.11 (Enhanced, AAA) reading — was **true** everywhere.
The pine ring was drawn in every case. **2.4.11 Focus Not Obscured (Minimum) (AA) PASS**, now
measured rather than derived. The finding needs no code and closes as documented.

### P4-8 · DOCUMENTED (no code change needed) · `src/index.css:170,174,178` measured live

The WCAG 1.4.12 override was injected as a style element over the live page — `line-height: 1.5`,
`letter-spacing: 0.12em`, `word-spacing: 0.16em` on everything, `margin-bottom: 2em` on every
text block — at 1280×800 and 375×812. Checks, per element, over the 80 (resp. 77) visible
`h1,h2,h3,p,dt,dd,li,button,a` boxes: `scrollHeight > clientHeight + 1` or
`scrollWidth > clientWidth + 1` for clipping, pairwise rect intersection between elements that
are not each other's ancestors for overlap, and `documentElement.scrollWidth > innerWidth` for
horizontal overflow.

```
--- 1280x800 baseline (no override)
  {"docScrollWidth":1265,"innerWidth":1280,"horizontalOverflow":false,"elementCount":80,"clippedCount":5,"clipped":[{"el":"H1#intro-title …","overflow":"visible","sh":171,"ch":163},{"el":"H2#about-title …","sh":159,"ch":155},{"el":"H2#get-involved-title …","sh":107,"ch":104},{"el":"H2#questions-title …","sh":107,"ch":104},{"el":"H2#contact-title …","sh":55,"ch":52}],"overlapCount":0,"overlaps":[]}
--- 1280x800 WITH 1.4.12 override
  {"docScrollWidth":1265,"innerWidth":1280,"horizontalOverflow":false,"elementCount":80,"clippedCount":0,"clipped":[],"overlapCount":0,"overlaps":[]}
  display steps: [{"t":"Learn to build apps wi","fs":"80px","lh":"120px","h":360,"sh":360,"ch":360},{"t":"A community of people ","fs":"48px","lh":"72px","h":288},{"t":"Development workshops","fs":"24px","lh":"36px","h":36},{"t":"An annual hackathon","fs":"24px","lh":"36px","h":36},{"t":"No membership or commi","fs":"48px","lh":"72px","h":144},{"t":"Questions newcomers ac","fs":"48px","lh":"72px","h":144}]
--- 375x812 baseline (no override)
  {"docScrollWidth":375,"innerWidth":375,"horizontalOverflow":false,"elementCount":77,"clippedCount":2,"clipped":[{"el":"H1#intro-title …","sh":139,"ch":135},{"el":"H2#about-title …","sh":140,"ch":138}],"overlapCount":0,"overlaps":[]}
--- 375x812 WITH 1.4.12 override
  {"docScrollWidth":375,"innerWidth":375,"horizontalOverflow":false,"elementCount":77,"clippedCount":0,"clipped":[],"overlapCount":0,"overlaps":[]}
  display steps: [{"t":"Learn to build apps wi","fs":"44px","lh":"66px","h":264},{"t":"A community of people ","fs":"32px","lh":"48px","h":192},{"t":"Development workshops","fs":"20px","lh":"30px","h":60},{"t":"An annual hackathon","fs":"20px","lh":"30px","h":30},{"t":"No membership or commi","fs":"32px","lh":"48px","h":144},{"t":"Questions newcomers ac","fs":"32px","lh":"48px","h":144}]
```

**Zero clipped elements, zero overlaps and no horizontal overflow under the override, at both
viewports.** No `min-height` or `overflow` adjustment was needed and none was made — the display
steps have no fixed heights, so they simply grow: the `h1` goes 163px → 360px at 1280 and
135px → 264px at 375, and the section below it moves down. The three `text-balance` headlines
rebalanced without breaking.

Worth recording because it is counter-intuitive: the **only** rows the clipping check flags are
in the *baseline*, not under the override — five at 1280 and two at 375, each 3–8px of
`scrollHeight` over `clientHeight` on a display heading. That is the sub-1.5 authored
line-heights (1.02 / 1.08) letting a descender sit a few pixels past the line box on an
`overflow: visible` element, which paints fine and clips nothing. Raising line-height to 1.5
removes them. So the audit's premise is confirmed from the opposite direction: the tight display
line-heights are an authored choice with no 1.4.12 consequence, and the override 1.4.12 tests is
exactly the case where they stop being tight at all.

### Phase-wide verification

```
$ npm run typecheck ; echo "EXIT=$?"
> tsc -b --noEmit
EXIT=0

$ npm run lint ; echo "EXIT=$?"
> oxlint --deny-warnings
EXIT=0

$ npm run build ; echo "EXIT=$?"
> npm run lint && tsc -b && vite build
✓ 451 modules transformed.
dist/assets/index-CxjLmj0A.css     17.59 kB │ gzip:  4.49 kB
dist/assets/index-KjEM9hHe.js      14.89 kB │ gzip:  5.73 kB
dist/assets/components-DP4er_qM.js 53.59 kB │ gzip: 16.40 kB
✓ built in 358ms
EXIT=0
```

**Design system (Phase 3 command C1), landing subset.** The only new rows are the five in
`src/components/controls.ts` — `border-pine`, `text-pine`, `bg-pine`, `text-cloud`, `outline-pine`
— all nine-token, none off-palette. The four rows that were at `SiteHeader.tsx:77`
(`bg-frost`, `border-frost`, `text-pine`, `outline-pine`) are gone with the inline string.
`fern` still appears only at `Wordmark.tsx:62,66` (the two brand marks) and in `index.css`'s own
comment; `haze` still appears nowhere in the landing page.

```
$ grep -rnoE '(text|bg|border|fill|stroke|ring|outline|shadow|from|via|to|decoration|accent|caret|placeholder|divide)-(sky|horizon|cloud|frost|brick|stone|pine|haze|fern)(/[0-9]+)?' src index.html components.html | grep -v '^src/sheet/' | grep -E 'controls\.ts|fern|haze'
src/components/controls.ts:40:border-pine
src/components/controls.ts:40:text-pine
src/components/controls.ts:40:bg-pine
src/components/controls.ts:40:text-cloud
src/components/controls.ts:41:outline-pine
src/components/Wordmark.tsx:62:bg-fern
src/components/Wordmark.tsx:66:bg-fern
src/index.css:135:bg-fern
```

**`src/sheet/` is still out of the landing bundle** (the Phase 1 §6 string probe, over the two
chunks `dist/index.html` references and the sheet's own chunk):

```
$ grep -o 'assets/[A-Za-z0-9._-]*\.js' dist/index.html | sort -u
assets/SiteFooter-Chc-VP1O.js
assets/index-KjEM9hHe.js
$ for s in "Primitives in isolation" "buy scroll distance" "HeroScroll.progress"; do for f in dist/assets/*.js; do grep -ac "$s" "$f"; done; done
STRING: Primitives in isolation
  SiteFooter-Chc-VP1O.js : 0
  components-DP4er_qM.js : 1
  index-KjEM9hHe.js : 0
STRING: buy scroll distance
  SiteFooter-Chc-VP1O.js : 0
  components-DP4er_qM.js : 1
  index-KjEM9hHe.js : 0
STRING: HeroScroll.progress
  SiteFooter-Chc-VP1O.js : 0
  components-DP4er_qM.js : 1
  index-KjEM9hHe.js : 0
```

`src/components/controls.ts` is imported by both entries, so it lands in the shared chunk — which
is the right side of the boundary: the sheet may import from `src/components/`, never the reverse.

**Hero invariants held.** `PAN_START_SCALE = 3` (`src/components/Hero.tsx:74`), the campus
`object-[52%_0%]` and `origin-top` (`:217`), and the single `useScroll` subscription are all
unchanged; the only edits to `Hero.tsx` are `tabIndex={-1}`, `focus:outline-none` and the comment
explaining them. Reduced motion measured identical to before (track = one viewport, campus
transform `none`, no drift nodes).

---

## Phase 3 — routing and metadata

Four findings: P5-4 (+P7-1), P2-2, P5-12, P3-6. Files touched: `vercel.json`,
`public/404.html` (new), `index.html`, `components.html`, `vite.config.ts`, `README.md`.

**What this phase cannot observe.** Everything about the deployed routing is derived from
`vercel.json` by reading the rewrite set, exactly as Phase 5 §7 did. There is no Vercel deployment
reachable from this environment and none was created, so no row below that begins "on Vercel" was
executed — the walk-throughs are static reasoning over two literal `source` strings, and the live
readout at the end is the **dev server**, which routes differently on purpose (that is P7-1).

### P5-4 · FIXED · `vercel.json:6–9`, `public/404.html` (new), `README.md:134–153` — and **P7-1** · DOCUMENTED, same change (`README.md:150–153`)

**The choice: an honest 404.** The catch-all `{ "source": "/((?!components).*)", "destination":
"/index.html" }` is gone. It was the whole of the finding: it made `/nonexistent` a 200 landing
page (a soft 404, indexable as a duplicate of the home page) while `/componentsfoo` fell through
the `(?!components)` lookahead to a platform 404 — two outcomes for two equally nonexistent URLs.
The fallback existed to support client-side routes and there are none: `package.json` has no
routing dependency and `src/App.tsx` renders one page with in-page anchors. Removing it is
therefore a pure subtraction, not a trade.

```
$ cat vercel.json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/components", "destination": "/components.html" },
    { "source": "/components/", "destination": "/components.html" }
  ]
}
```

Both survivors are literal, exact-match strings — no parameters, no wildcards, no lookaheads — so
their reach can be checked with regexes written out by hand rather than derived from the `source`
string (a derived regex could inherit an escaping bug and prove nothing):

```
$ node rewrite-check.mjs
rule count = 2
"/components" -> "/components.html" | matches: ["/components"]
"/components/" -> "/components.html" | matches: ["/components/"]
matched by some rewrite   = ["/components","/components/"]
matched by no rewrite     = ["/","/components.html","/componentsfoo","/components/foo","/nonexistent","/favicon.ico","/assets/index-KjEM9hHe.js"]
```

**The two walk-throughs the finding turns on**, by the same two-phase model Phase 5 §7 used
(filesystem first, then rewrites, then platform 404). Derived, not observed:

| Request | Filesystem phase | Rewrite phase | **Resolves to** |
| --- | --- | --- | --- |
| `/nonexistent` | no `dist/nonexistent` | rule 1 no (not the exact string), rule 2 no | **404**, body `dist/404.html` |
| `/componentsfoo` | no `dist/componentsfoo` | rule 1 no — `/components` is an exact match and `/componentsfoo` is a different string; rule 2 no | **404**, body `dist/404.html` |

That is the point of the change: the two now agree, and they agree on the honest answer. The rows
that must **not** move are unchanged — `/` still resolves through directory-index resolution to
`dist/index.html` (Phase 5 §7.3 row 1 records that the catch-all was never what served `/`);
`/components` and `/components/` still hit their rewrites; `/components.html`, `/assets/*`,
`/artwork/*` and `/brand/*` are still filesystem hits, which Vercel resolves before it consults
`rewrites` at all.

**`public/404.html`** is the new body. `public/` is copied verbatim into `dist/`, so it ships as
`dist/404.html`, which is the filename Vercel's static handler looks for. It is deliberately inert:

```
$ ls -l public/404.html dist/404.html && cmp public/404.html dist/404.html && echo IDENTICAL
-rw-r--r-- 1 danz3 197609 3307 Aug 22 12:18 dist/404.html
-rw-r--r-- 1 danz3 197609 3307 Aug 22 12:18 public/404.html
IDENTICAL
$ grep -c 'assets/.*\.js' dist/404.html
0
$ grep -c '<script' dist/404.html
0
```

No script, no bundle, no stylesheet link, no webfont. Two constraints forced choices worth
recording, and both are written into the file's own comment (`public/404.html:14–38`):

- **Literal hexes.** The file is outside `src/`, cannot import the stylesheet and gets no Tailwind
  pass, so the no-hex-outside-`@theme` rule does not reach it. The three colours it writes
  (`public/404.html:41–43`) are copies of `@theme` values and nothing else: `cloud` `#f7f5ee` as
  the ground, `pine` `#3c5c48` for all text, `brick` `#a2593a` for the link. Measured against
  cloud: pine **6.83:1**, brick **4.78:1** — both over WCAG AA's 4.5:1 for normal text. Six of the
  nine tokens are unused here; the three that cannot legibly carry text on cloud (`stone` 1.81:1,
  `haze` 2.72:1, `fern` 3.27:1 — and fern is logo-only besides) were never candidates.
- **No webfonts.** Fraunces and Inter ship as content-hashed woff2 under `/assets/`, and the hash
  changes every build, so a hand-written file cannot name one — any URL written here would 404 on
  the next deploy. The families are declared with honest system fallbacks instead
  (`public/404.html:57,63`): `Fraunces, Georgia, serif` and `Inter, system-ui, sans-serif`. A
  visitor who already loaded the site gets the real faces from cache; everyone else gets the
  fallback, which is the correct behaviour for a page that must render on its first byte.

Content is a heading, one sentence and a link back to `/` (`public/404.html:85–87`), plus the
`theme-color` from P3-6 and `noindex`. 3,307 bytes, most of it that comment.

**`README.md:134–153`** now reconciles row-for-row with the file above — five rows where there
were three, and the false row is gone. Previously line 90 read "anything else | the catch-all
rewrite to `/index.html`", which Phase 5 §7.4 marked incorrect for every path beginning
`components`; there is no catch-all now, so the row states the 404 and names the page that renders
it. Two rows are new: `/` (served by directory-index resolution, not by any rule) and
`/components.html` (a filesystem hit, hence a second URL for the sheet — the point Phase 5 §7.4
flagged as unstated, benign because `components.html:17` is `noindex, nofollow`).

**P7-1 closes as DOCUMENTED in the same edit** (`README.md:150–153`). The divergence it names is
inherent — Vite's dev server applies an unconditional `index.html` fallback with no `/components*`
exclusion and no notion of `dist/404.html` — so it is not fixable, only stated, and the README now
states it in a sentence: unknown paths render the landing page with a 200 locally, and 404
behaviour can only be checked against a real deployment. Measured, this phase, from the dev server
that is now stopped:

```
$ for p in "/" "/components" "/components.html" "/nonexistent" "/componentsfoo" "/404.html"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173$p")
    title=$(curl -s "http://localhost:5173$p" | grep -o "<title>[^<]*</title>" | head -1)
    echo "$p -> $code  $title"; done
/ -> 200  <title>HackBU</title>
/components -> 200  <title>HackBU component sheet</title>
/components.html -> 200  <title>HackBU component sheet</title>
/nonexistent -> 200  <title>HackBU</title>
/componentsfoo -> 200  <title>HackBU</title>
/404.html -> 200  <title>Page not found — HackBU</title>
```

The first five rows are identical to Phase 7's §1 table, which is the confirmation that removing
the catch-all changed nothing locally — the dev server never reads `vercel.json`. `/componentsfoo`
still returns the landing page here and is derived to 404 on Vercel; that gap is the finding, and
it is now written down rather than merely true.

### P2-2 · FIXED · `index.html:83–86`

The three absent basic-metadata properties are declared next to the existing `og:image` block:

```
$ grep -c 'property="og:title"\|property="og:type"\|property="og:url"' index.html
3
$ grep -n 'og:title\|og:type\|og:url\|og:image"\|<title>' index.html
81:    <meta property="og:title" content="HackBU" />
82:    <meta property="og:type" content="website" />
83:    <meta property="og:url" content="%SITE_ORIGIN%/" />
84:    <meta property="og:image" content="%SITE_ORIGIN%/brand/og-image.png" />
98:    <title>HackBU</title>
```

`og:title` is `HackBU`, byte-for-byte the `<title>` text at `:98`. The audit noted that a bare
wordmark is a weak card headline; a card headline that disagrees with the page title is worse, and
rewriting the site's title is not this phase's call. `og:type` is `website` (ogp.me's default, and
correct for a landing page rather than `article`). `og:url` is the origin root, the canonical URL
of the one page this document is. `og:description` is deliberately still absent: scrapers fall
back to `<meta name="description">`, which is present and accurate, so declaring it twice would
create two strings to keep in step. All four values appear in the live readout below.

### P5-12 · FIXED · `vite.config.ts:6–45,183`, applied at `index.html:85–86`, documented at `README.md:117–122`

The hardcoded `https://hackbu-landing.vercel.app` is gone from the HTML. Both absolute URLs are
written as a percent-delimited placeholder and substituted at build time by a 15-line plugin:

```ts
const SITE_ORIGIN_FALLBACK = 'https://hackbu-landing.vercel.app'

function siteOrigin(): Plugin {
  const host = process.env['VERCEL_PROJECT_PRODUCTION_URL']
  const origin = host ? `https://${host}` : SITE_ORIGIN_FALLBACK
  return {
    name: 'hackbu-site-origin',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%SITE_ORIGIN%', origin),
    },
  }
}
```

**Vite's built-in `%KEY%` interpolation was checked first and does not cover this**, so the plugin
is necessary rather than duplicative. `htmlEnvHook`
(`node_modules/vite/dist/node/chunks/node.js:24879`, Vite 8.2.2) substitutes only keys present in
`config.env` — `loadEnv` output filtered by `envPrefix`, default `VITE_`, plus the
`import.meta.env` built-ins — and returns any other `%KEY%` untouched, warning only when the key
starts with the prefix:

```js
	return (html, ctx) => {
		return html.replace(pattern, (text, key) => {
			if (key in env) return env[key];
```

A bare `process.env` name is not in `env`, so a `%VERCEL_PROJECT_PRODUCTION_URL%` written into the
HTML would have shipped to production verbatim. Widening `envPrefix` to reach it would expose every
other matching variable to client code, which is the thing the prefix exists to prevent. Reading
`process.env` for one key by name avoids both: **no `loadEnv` call, so no `.env.local` is parsed**
and nothing else can reach the page.

Both branches were run. With the variable absent — which is this environment, and what `dist/`
now reflects:

```
$ npm run build ; echo "EXIT=$?"
✓ built in 512ms
EXIT=0
$ grep -c 'hackbu-landing.vercel.app' dist/index.html
2
$ grep -n 'hackbu-landing.vercel.app' dist/index.html
78:    <meta property="og:url" content="https://hackbu-landing.vercel.app/" />
79:    <meta property="og:image" content="https://hackbu-landing.vercel.app/brand/og-image.png" />
$ grep -o '%[A-Za-z_][A-Za-z0-9_]*%' dist/index.html dist/components.html
        (no output — no placeholder survives the build, in either entry)
```

With it set, standing in for the custom domain:

```
$ VERCEL_PROJECT_PRODUCTION_URL=hackbu.org npx vite build ; grep -n 'og:url\|og:image"' dist/index.html
78:    <meta property="og:url" content="https://hackbu.org/" />
79:    <meta property="og:image" content="https://hackbu.org/brand/og-image.png" />
```

(`dist/` was rebuilt without the variable immediately afterwards, so the tree carries the fallback.)

One thing the first build got wrong, recorded because the failure mode is non-obvious: the
substitution is a plain string replace over the whole document, so the first draft of the
explanatory comment — which quoted the placeholder by name — was itself rewritten, and
`dist/index.html` shipped a comment reading "the origin is `https://hackbu-landing.vercel.app`,
replaced at build time" directly above the two tags that had just been replaced. The comment
(`index.html:57–80`) no longer spells the placeholder out, and says why. That is also why the grep
count above is exactly 2 rather than 3.

`README.md:110–121` is the domain-move checklist item, under its own **"When the custom domain
lands"** heading in the deploy section: nothing in the repo needs editing, because
`VERCEL_PROJECT_PRODUCTION_URL` follows the custom domain automatically once one is attached; if
the site ever moves somewhere without that variable, change the fallback constant in
`vite.config.ts` and not the HTML. The section's opening line no longer claims "No environment
variables" — the build now reads one.

### P3-6 · FIXED · `index.html:98`, `components.html:30`

```
$ grep -c 'name="theme-color"' index.html components.html
index.html:1
components.html:1
```

Both `#f7f5ee` — `cloud`, confirmed as `--color-cloud` at `src/index.css:54`, and the page ground
on both entries rather than a colour picked for the address bar. `sky` (`#4a96d2`) was the audit's
other suggestion and is the hero band, not the page; tinting the chrome to it would disagree with
the ground everywhere below the fold. No `color-scheme` and no `dark:` variants were added: there
is no dark palette to switch to, and declaring one would be a claim the stylesheet cannot honour.
`public/404.html:12` carries the same tag, for the same reason.

### Live readout (raw)

Dev server `hackbu-dev` on port 5173; headless Edge 151.0.4129.101 over CDP on port 9336,
1280x800, 3s settle per route. The probe script lives in the session scratchpad, not the repo.
**Both were shut down at the end of the phase** (`preview_stop`; `taskkill /PID 42364 /T /F`, then
CDP on 9336 and the dev server on 5173 both confirmed unreachable).

```
$ node phase3-probe.mjs 9336
Edge: Edg/151.0.4129.101

##### 1. Route load: console + network (3s settle), 1280x800
ROUTE /  docStatus=200  title="HackBU"  hero=true  docHeight=7236
  theme-color="#f7f5ee"
  og: ["og:title=HackBU","og:type=website","og:url=https://hackbu-landing.vercel.app/","og:image=https://hackbu-landing.vercel.app/brand/og-image.png","og:image:width=732","og:image:height=732","og:image:alt=The HackBU bearcat logo"]
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0
ROUTE /components  docStatus=200  title="HackBU component sheet"  hero=false  docHeight=28261
  theme-color="#f7f5ee"
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0
ROUTE /components.html  docStatus=200  title="HackBU component sheet"  hero=false  docHeight=28261
  theme-color="#f7f5ee"
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0
ROUTE /nonexistent  docStatus=200  title="HackBU"  hero=true  docHeight=7236
  theme-color="#f7f5ee"
  og: ["og:title=HackBU","og:type=website","og:url=https://hackbu-landing.vercel.app/","og:image=https://hackbu-landing.vercel.app/brand/og-image.png","og:image:width=732","og:image:height=732","og:image:alt=The HackBU bearcat logo"]
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0
ROUTE /componentsfoo  docStatus=200  title="HackBU"  hero=true  docHeight=7236
  theme-color="#f7f5ee"
  og: ["og:title=HackBU","og:type=website","og:url=https://hackbu-landing.vercel.app/","og:image=https://hackbu-landing.vercel.app/brand/og-image.png","og:image:width=732","og:image:height=732","og:image:alt=The HackBU bearcat logo"]
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0

##### 2. The new static 404 page, served by the dev server from public/
  docStatus=200
  {
    "title": "Page not found — HackBU",
    "h1": "Page not found",
    "p": [
      "There is nothing at this address — it was probably mistyped, or the page has moved.",
      "Back to the HackBU home page"
    ],
    "linkHref": "/",
    "scripts": 0,
    "styleSheets": 1,
    "externalCss": [],
    "themeColor": "#f7f5ee",
    "body":    { "color": "rgb(60, 92, 72)",  "background": "rgb(247, 245, 238)", "font": "Inter, system-ui, sans-serif" },
    "heading": { "color": "rgb(60, 92, 72)",  "background": "rgba(0, 0, 0, 0)",   "font": "Fraunces, Georgia, serif" },
    "link":    { "color": "rgb(162, 89, 58)", "background": "rgba(0, 0, 0, 0)",   "font": "Inter, system-ui, sans-serif" },
    "docHeight": 800
  }
  console errors: 0  exceptions: 0  failed requests: 0  >=400 responses: 0
```

Three things this pins down. **Zero console errors and zero failed requests on all three required
routes** (`/`, `/components`, `/components.html`), and on the two 404-class paths besides. **The
metadata is live, not merely in the file**: `theme-color` resolves on every route including the
sheet, and all four basic og properties are present on the landing page with the fallback origin
already substituted — the dev server runs `transformIndexHtml` too, so no placeholder is visible in
development either. **The 404 page renders as specified**: `scripts: 0`, `externalCss: []`, one
stylesheet (its own inline block), and the computed colours are `rgb(60,92,72)` = `#3c5c48` pine
and `rgb(162,89,58)` = `#a2593a` brick on `rgb(247,245,238)` = `#f7f5ee` cloud — the 6.83:1 and
4.78:1 above, confirmed as what the browser actually paints rather than as what the file says.

`/404.html` returning 200 from the dev server contradicts nothing: `public/` is served at the root
in development, so that is the static file fetched by name, which is exactly how the render was
checked. Vercel serves the same bytes as the **body of a 404 response**; that status is the one
part no test available here can reach.

### Phase-wide verification

```
$ npm run typecheck ; echo "EXIT=$?"
> tsc -b --noEmit
EXIT=0

$ npm run lint ; echo "EXIT=$?"
> oxlint --deny-warnings
EXIT=0

$ npm run build ; echo "EXIT=$?"
> npm run lint && tsc -b && vite build
✓ 451 modules transformed.
dist/components.html                1.60 kB │ gzip:  0.77 kB
dist/index.html                     4.76 kB │ gzip:  2.12 kB
dist/assets/index-CxjLmj0A.css     17.59 kB │ gzip:  4.49 kB
dist/assets/index-KjEM9hHe.js      14.89 kB │ gzip:  5.73 kB
dist/assets/components-DP4er_qM.js 53.59 kB │ gzip: 16.40 kB
✓ built in 512ms
EXIT=0
```

`dist/components.html` still exists, and the landing chunk hashes (`index-CxjLmj0A.css`,
`index-KjEM9hHe.js`) are unchanged from Phase 2 — nothing in this phase touched `src/`, so no
component, no stylesheet and no bundle boundary moved. The only build outputs that changed shape
are the two HTML entries and the new `dist/404.html`.

`public/` is byte-identical to its previous state apart from the one new file, which was the
standing constraint:

```
$ git status --short -- public/
?? public/404.html
```

Nothing modified, nothing deleted; `artwork/` and `brand-source/` were not opened.

## Phase 4 — delivery and performance

Seven findings: P5-1 (the audit's only `medium`), P5-5, P5-3, P5-8, P5-13, P5-2, P5-6. Files
touched: `src/entry-server.tsx` (new), `scripts/prerender.mjs` (new), `package.json`,
`vite.config.ts`, `src/index.css`, `src/main.tsx`, `src/sheet/main.tsx`, `src/lib/motion.ts`,
`src/App.tsx`, `src/sheet/ComponentSheet.tsx`, `src/components/Hero.tsx`,
`src/components/HeroClouds.tsx`, `src/components/Reveal.tsx`, `src/components/SiteFooter.tsx`,
`vercel.json`, `README.md`.

**What this phase cannot observe.** The `Cache-Control` policy in P5-3 is declared, not measured:
there is no Vercel deployment reachable from this environment and none was created, so no header
below was read off a response. Everything else in this section was run.

**The before/after listing**, both from `npm run build` on this machine — the "before" is a clean
build of `f820e62` (the branch tip this phase started from), the "after" is the tree as it stands
at the end of the phase:

```
$ ls -l dist/assets/          # BEFORE (f820e62)
-rw-r--r-- 1 danz3 197609 329229 SiteFooter-Chc-VP1O.js
-rw-r--r-- 1 danz3 197609    655 SiteFooter-DgSLZxXM.css
-rw-r--r-- 1 danz3 197609  20872 components-C1eEHGgJ.css
-rw-r--r-- 1 danz3 197609  53598 components-DP4er_qM.js
-rw-r--r-- 1 danz3 197609  18096 fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r-- 1 danz3 197609  22512 fraunces-latin-600-normal-DL5QCzvS.woff
-rw-r--r-- 1 danz3 197609  17593 index-CxjLmj0A.css
-rw-r--r-- 1 danz3 197609  14890 index-KjEM9hHe.js
-rw-r--r-- 1 danz3 197609  23664 inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r-- 1 danz3 197609  30696 inter-latin-400-normal-CyCys3Eg.woff
-rw-r--r-- 1 danz3 197609  31284 inter-latin-500-normal-BL9OpVg8.woff
-rw-r--r-- 1 danz3 197609  24272 inter-latin-500-normal-Cerq10X2.woff2
# 12 files, 587,361 B

$ ls -l dist/assets/          # AFTER
-rw-r--r-- 1 danz3 197609 283048 SiteFooter-VOpZu2sT.js
-rw-r--r-- 1 danz3 197609  53659 components-CDGg4yHc.js
-rw-r--r-- 1 danz3 197609  21331 components-xZOInl1b.css
-rw-r--r-- 1 danz3 197609  18096 fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r-- 1 danz3 197609  16013 index-HiSFlvET.js
-rw-r--r-- 1 danz3 197609  18052 index-JaSjmbl1.css
-rw-r--r-- 1 danz3 197609  23664 inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r-- 1 danz3 197609  24272 inter-latin-500-normal-Cerq10X2.woff2
# 8 files, 458,135 B   (-129,226 B: -46,181 shared chunk, -84,492 three .woff, -655 font CSS,
#                       +2,102 of CSS and entry-chunk churn)

$ ls -l dist/*.html
-rw-r--r-- 1 danz3 197609   3307 dist/404.html          # byte-identical to public/404.html
-rw-r--r-- 1 danz3 197609 111186 dist/components.html   # gz 20,009
-rw-r--r-- 1 danz3 197609  47927 dist/index.html        # gz  7,612  (was 5,013 / gz 2,232)
```

Every gate the build runs, at the end of the phase:

```
$ npm run typecheck ; echo "exit $?"
> tsc -b --noEmit
exit 0
$ npm run lint ; echo "exit $?"
> oxlint --deny-warnings
exit 0
$ npm run build ; echo "exit $?"
> npm run lint && tsc -b && vite build && node scripts/prerender.mjs
* 448 modules transformed.
* built in 372ms
prerendered dist/index.html (42596 chars)
prerendered dist/components.html (109247 chars)
exit 0
```

The sheet is still absent from the landing page's chunks — the same three markers Phase 1 used,
over the two chunks `dist/index.html` actually references versus the sheet's own:

```
$ grep -o '/assets/[^"]*\.js' dist/index.html
/assets/index-HiSFlvET.js
/assets/SiteFooter-VOpZu2sT.js
$ for f in dist/assets/*.js; do printf '%s: isolation=%s buyscroll=%s heroprog=%s\n' "$f" \
    "$(grep -ac 'Primitives in isolation' $f)" "$(grep -ac 'buy scroll distance' $f)" \
    "$(grep -ac 'HeroScroll.progress' $f)"; done
dist/assets/SiteFooter-VOpZu2sT.js: isolation=0 buyscroll=0 heroprog=0
dist/assets/components-CDGg4yHc.js: isolation=1 buyscroll=1 heroprog=1
dist/assets/index-HiSFlvET.js:      isolation=0 buyscroll=0 heroprog=0
```

---

### P5-1 · FIXED · `scripts/prerender.mjs` (new), `src/entry-server.tsx` (new), `package.json:11`, `src/main.tsx:52-56`, `src/sheet/main.tsx:31-34`, `src/lib/motion.ts:75-84`, `src/components/SiteFooter.tsx:52-57`

**The decision: prerender, both entries.** `npm run build` is now
`npm run lint && tsc -b && vite build && node scripts/prerender.mjs`. The last step opens a Vite
dev server in `middlewareMode` inside its own process — no port bound, no HMR socket, closed in a
`finally` — `ssrLoadModule`s `src/entry-server.tsx`, calls one export per page, and writes the
returned string into that page's `<div id="root">`.

**Why that mechanism and not `vite build --ssr`.** The alternative emits a server bundle that has
to be written somewhere, kept out of `dist/` (Vercel deploys `dist/` verbatim), kept out of git,
and cleaned up — four new obligations to keep an artefact nobody deploys. The dev-server route
writes no file at all except the two HTML files it rewrites, and it runs `src/entry-server.tsx`
through the project's own transform pipeline, so the SSR render and the client build cannot drift
in how they read TypeScript, JSX or module resolution.

**Why the *built* HTML and not the source template.** Everything `vite build` puts in the head has
to survive: the hashed script and stylesheet links, the `%SITE_ORIGIN%` substitution from Phase 3's
`siteOrigin` plugin, the LCP `<link rel="preload" as="image">`, and the three font preloads P5-5
adds. The script therefore replaces exactly one literal, `<div id="root"></div>`, and adds no tag
to the head — so the prerendered `<picture>` in the body does not duplicate or contradict the
image preload declared above it. If that literal ever stops matching, the build throws rather than
shipping a blank page.

```
$ grep -c 'id="root"' dist/index.html
1
$ node -e "const h=require('fs').readFileSync('dist/index.html','utf8');
           console.log('root inner chars:', h.match(/<div id=.root.>([\s\S]*)<\/div>/)[1].length)"
root inner chars: 42596
$ grep -c '<picture' dist/index.html      # line count; the prerendered body is one line
3
$ grep -o '<picture' dist/index.html | wc -l
51
$ grep -n 'hydrateRoot(' src/main.tsx src/sheet/main.tsx
src/main.tsx:50:  hydrateRoot(mount, tree)
src/sheet/main.tsx:32:  hydrateRoot(mount, tree)
```

The first frame in the HTML is the frame the client computes at scroll 0 — campus at `scale(3)`,
the three cloud layers at their resting opacity with no lift, the three drift tracks at
`LOOP_START`:

```
$ grep -o '<img[^>]*Campus[^>]*>' dist/index.html
<img src="/artwork/campus/Campus.png" alt="Illustration of the Binghamton University campus..."
 width="1672" height="941" draggable="false" decoding="async" fetchPriority="high"
 class="h-full w-full origin-top object-[52%_0%] object-cover select-none will-change-transform"
 style="transform:scale(3)"/>
$ grep -o '<div data-cloud-layer[^>]*>' dist/index.html
<div data-cloud-layer="far"  class="absolute inset-0 will-change-transform" style="opacity:0.5;transform:none">
<div data-cloud-layer="mid"  class="absolute inset-0 will-change-transform" style="opacity:0.75;transform:none">
<div data-cloud-layer="near" class="absolute inset-0 will-change-transform" style="opacity:1;transform:none">
$ grep -o '<div data-cloud-drift[^>]*>' dist/index.html | head -1
<div data-cloud-drift="true" class="absolute inset-y-0 left-0 w-[calc(100%*var(--cloud-sets))] will-change-transform" style="transform:translateX(-25%)">
```

**The two things that had to change for hydration to be clean.**

1. `usePrefersReducedMotion()` (`src/lib/motion.ts:68-80`) is now gated on having mounted. motion's
   own `useReducedMotion()` returns `null` where there is no `window`, which the `?? false` turns
   into the full-motion branch on the server — but on the client it answers truthfully from the
   *first* render, so a reduced-motion user's first render would disagree with the prerendered
   markup in `h-dvh` vs `h-[260dvh]`, in the presence of `[data-cloud-drift]`, and in
   `will-change-transform`. A `mounted` flag that is `false` on the server and on the first client
   render removes the disagreement; the effect that flips it is a **layout** effect in the browser
   (`useEffect` where there is no DOM, so React does not warn about a no-op layout effect during
   SSR), so the swap to the resting frame lands in the same frame as hydration and is never
   painted. The live readout below confirms both branches.

2. `src/components/SiteFooter.tsx` renders `new Date().getFullYear()`. The server renders it at
   *build* time and the client at *visit* time — equal every day except the ones after a New Year
   with no deploy between, on which React 19 logs the difference as an error. It is now wrapped in
   a `<span suppressHydrationWarning>`, React's documented escape hatch for exactly this (its own
   example is a timestamp), scoped to that one span so a mismatch anywhere else still surfaces.

**The dev server is the one place that still client-renders**, and deliberately: `vite dev` serves
the *source* `index.html`, whose root div is empty, and hydrating an empty root is itself a
mismatch — React 19 throws "Hydration failed because the server rendered HTML didn't match the
client" and re-renders the tree, which was observed on 5173 before the branch was added.
`src/main.tsx:47` and `src/sheet/main.tsx:29` therefore branch on `import.meta.env.DEV`, which Vite
folds to `false` in production, so the shipped bundle keeps only the `hydrateRoot` arm.

Nothing server-side reaches `dist/`: neither HTML entry imports `src/entry-server.tsx`, so it is
not in the client module graph, and `scripts/prerender.mjs` writes only the two HTML files.

---

### P5-8 · FIXED (by P5-1) · `dist/index.html` body

Consequence row, closed by the prerender and by nothing else — no image preload was added, which
the finding is explicit about (`loading="lazy"` would be wrong in-viewport, and preloading twelve
decorative cutouts would compete with the LCP image). The cloud `<picture>` elements and the campus
`<img>` are now in the HTML response, so the preload scanner sees the elements rather than only the
hint. The live network trace shows all twelve cloud AVIFs requested on load:

```
$ node p4-net.mjs 9338 http://localhost:4173/      # built output, headless Edge
1x  200  /artwork/campus/Campus-960.avif
1x  200  /artwork/clouds/cloud-1.avif ... cloud-12.avif      (12 rows, all 200, each once)
1x  200  /assets/index-HiSFlvET.js
1x  200  /assets/SiteFooter-VOpZu2sT.js
1x  200  /assets/index-JaSjmbl1.css
1x  200  /assets/fraunces-latin-600-normal-BFCDtZfi.woff2
1x  200  /assets/inter-latin-400-normal-C38fXH4l.woff2
1x  200  /assets/inter-latin-500-normal-Cerq10X2.woff2
total requests: 22
```

Every asset is fetched exactly once — the campus AVIF included, so the `imagesrcset` preload and
the `<picture>` still resolve to the same URL.

---

### P5-5 · FIXED · `vite.config.ts:62-127` (`PRELOADED_FONTS`, `fontPreload()`), `vite.config.ts:183`

A `transformIndexHtml` plugin at `order: 'post'`, reading `ctx.bundle` for the emitted `.woff2`
asset names, so no hash is written by hand. It runs on `index.html` only (the sheet is internal and
`noindex`), and in dev `ctx.bundle` is undefined and the hook is a no-op — correct, because the dev
server serves the faces unhashed out of `node_modules`. The tags are inserted *before* the
stylesheet link rather than appended to the end of the head, so the three font requests queue ahead
of the request that would otherwise have to finish before they could start.

**All three faces, not the two above the fold.** P5-5 argued against preloading Fraunces because it
is display-only and would compete with the LCP image. Against that: `<IntroSection>`'s `<h1>` is the
first thing under the hero and is set in it, `font-display: swap` makes a late face a reflow rather
than a delay, and 18 KB is small beside the 495 KB of imagery on the same connection. Preloading
the set the page actually uses is the simpler contract.

```
$ grep -c 'rel="preload" as="font"' dist/index.html
3
$ sed -n '94,99p' dist/index.html
    <script type="module" crossorigin src="/assets/index-HiSFlvET.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/SiteFooter-VOpZu2sT.js">
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fraunces-latin-600-normal-BFCDtZfi.woff2" />
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/inter-latin-400-normal-C38fXH4l.woff2" />
    <link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/inter-latin-500-normal-Cerq10X2.woff2" />
    <link rel="stylesheet" crossorigin href="/assets/index-JaSjmbl1.css">
$ for f in $(grep -o 'href="/assets/[^"]*woff2"' dist/index.html | sed 's/href="//;s/"//'); do ls -l "dist$f"; done
-rw-r--r-- 1 danz3 197609 18096 dist/assets/fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r-- 1 danz3 197609 23664 dist/assets/inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r-- 1 danz3 197609 24272 dist/assets/inter-latin-500-normal-Cerq10X2.woff2
$ grep -c 'rel="preload" as="font"' dist/components.html
0
```

`crossorigin` is on every tag even though the fonts are same-origin: fonts are always fetched in
CORS mode, and a preload whose mode does not match the later fetch is a second download rather than
a warm cache. The network trace under P5-8 shows one request per face, which is the proof that the
modes match.

**What these three tags cost: three console warnings on a *repeat* visit.** A first load in a fresh
profile is silent; a second navigation to `/` in the same tab reports each preload as unused about
three seconds after the load event. Both numbers below are sampled 3.5 s *after*
`Page.loadEventFired`, which is the window the acceptance bar in the live readout defines — the
warning fires too late for a shorter one to see it.

```
$ node p4r-console.mjs 9340 http://localhost:4173/ normal 2 3500      # fresh profile, headless Edge
--- nav#1  motion=normal  url=http://localhost:4173/  loadEventFired=yes @116ms  settle=3500ms
    messages=0   errors/warnings=0
    fonts: {"fontsStatus":"loaded","faces":["Fraunces 600 loaded","Inter 400 loaded","Inter 500 loaded"],"fontPreloads":3,"stylesheets":1,"rootChildren":1}
--- nav#2  motion=normal  url=http://localhost:4173/  loadEventFired=yes @44ms  settle=3500ms
    messages=3   errors/warnings=3
    [log.warning] The resource http://localhost:4173/assets/inter-latin-500-normal-Cerq10X2.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
    [log.warning] The resource http://localhost:4173/assets/fraunces-latin-600-normal-BFCDtZfi.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
    [log.warning] The resource http://localhost:4173/assets/inter-latin-400-normal-C38fXH4l.woff2 was preloaded using link preload but not used within a few seconds from the window's load event. Please make sure it has an appropriate `as` value and it is preloaded intentionally.
    fonts: {"fontsStatus":"loaded","faces":["Fraunces 600 loaded","Inter 400 loaded","Inter 500 loaded"],"fontPreloads":3,"stylesheets":1,"rootChildren":1}
```

The same run under `prefers-reduced-motion: reduce` (`node p4r-console.mjs 9341 ... reduce 2 3500`,
its own fresh profile) gives `messages=0 errors/warnings=0` on the first navigation and those same
three lines on the second, so this is Chromium's preload heuristic and not P5-1's reduced-motion
branch. A visitor who opens `/`, goes to `/components`, and comes back sees them.

**Why the tags stay anyway.** The faces load in every run, warning or not: `document.fonts.status`
is `"loaded"` and all three report `loaded` on the second navigation exactly as on the first, so no
typography is missing — the warning is about a bookkeeping record, not a font. And the repeat visit
re-downloads nothing:

```
$ node p4r-net.mjs 9343 http://localhost:4173/ 2 3500                 # fresh profile, headless Edge
--- nav#1  total requests observed: 23
    /assets/fraunces-latin-600-normal-BFCDtZfi.woff2  initiator=parser status=200 fromDiskCache=false servedFromMemoryCache=false wireBytes=18416
    /assets/inter-latin-400-normal-C38fXH4l.woff2  initiator=parser status=200 fromDiskCache=false servedFromMemoryCache=false wireBytes=23984
    /assets/inter-latin-500-normal-Cerq10X2.woff2  initiator=parser status=200 fromDiskCache=false servedFromMemoryCache=false wireBytes=24592
--- nav#2  total requests observed: 22
    /assets/fraunces-latin-600-normal-BFCDtZfi.woff2  initiator=parser status=304 fromDiskCache=false servedFromMemoryCache=false wireBytes=179
    /assets/inter-latin-400-normal-C38fXH4l.woff2  initiator=parser status=304 fromDiskCache=false servedFromMemoryCache=false wireBytes=179
    /assets/inter-latin-500-normal-Cerq10X2.woff2  initiator=parser status=304 fromDiskCache=false servedFromMemoryCache=false wireBytes=179
$ curl -sI http://localhost:4173/assets/inter-latin-400-normal-C38fXH4l.woff2 | grep -i cache
Cache-Control: no-cache
```

179 B per face on the second visit against 18,416 / 23,984 / 24,592 B on the first — and even those
179 B are `vite preview`'s doing, since it serves `/assets/` as `no-cache` and so forces a
revalidation. The deployed policy for `/assets/*` is `public, max-age=31536000, immutable` (P5-3 —
declared in `vercel.json`, never measured against a deployment), under which the conditional request
would not be made at all. That is a claim about bytes only: nothing measured here says the deployed
headers would silence the warning, and the expectation is that they would not.

**The mechanism is inference**, not something these two traces prove. Each face is requested exactly
once per navigation and the request is `initiator=parser` — it is the `<link>` tag's own fetch — so
on a first load the `@font-face` rule consumes that fetch and Chromium counts the preload used. On
the second navigation the face is already in the renderer's font cache, so the CSS font load
resolves without a resource fetch that could claim the preload record, and the unclaimed record is
what gets reported. Consistent with both traces; not established by them.

Narrowing the set or dropping the tags would buy a quiet console for a returning visitor at the cost
of the head start on the visit that has nothing cached — the visit P5-5 exists to speed up. The
three tags stay, and the warnings are recorded here rather than designed around.

---

### P5-13 · FIXED · `src/index.css:31-90` (three `@font-face` rules), `src/main.tsx:1-11`, `src/sheet/main.tsx:1-11`

The 655-byte stylesheet is gone, and the landing page takes exactly one. The three
`@fontsource` CSS imports that used to sit in both entries were imported by *both*, so Rollup
hoisted them into the shared chunk and Vite emitted them as a second render-blocking
`<link rel="stylesheet">`. They are now three hand-written `@font-face` rules in `src/index.css`,
which reaches each page separately — `src/landing.css` `@import`s it (a CSS-level import, inlined
before Vite sees a module) and `src/sheet/main.tsx` imports it directly — so neither copy is a
shared JS module and there is no shared CSS chunk left to link.

```
$ grep -c 'rel="stylesheet"' dist/index.html
1
$ grep -o '<link rel="stylesheet"[^>]*>' dist/index.html
<link rel="stylesheet" crossorigin href="/assets/index-JaSjmbl1.css">
$ ls dist/assets/*.css
dist/assets/components-xZOInl1b.css
dist/assets/index-JaSjmbl1.css
$ grep -rnE "^\s*import\s+['\"]@fontsource" src/ ; echo "(exit $?)"
(exit 1)
$ grep -n "url('@fontsource" src/index.css
70:  src: url('@fontsource/fraunces/files/fraunces-latin-600-normal.woff2')
79:  src: url('@fontsource/inter/files/inter-latin-400-normal.woff2')
88:  src: url('@fontsource/inter/files/inter-latin-500-normal.woff2')
```

The `import` grep is the claim that matters: not one `@fontsource` **CSS import** survives in `src/`,
and that import is what put the second stylesheet in the head. `@fontsource` is still a dependency
and the string still occurs — the three `url()` references above, which are how the woff2 files
reach the bundle at all, plus six mentions in prose:

```
$ grep -rn fontsource src/ | grep -v "url('@fontsource"
src/index.css:35: * These are hand-written rather than the three `@fontsource` `latin-*.css`
src/index.css:47: *   - `@fontsource` publishes no woff2-only entrypoint, so its `src:` lists a
src/index.css:54: * Everything else is copied verbatim from `@fontsource`'s own `latin-*.css`:
src/index.css:56: * no `unicode-range` — `@fontsource`'s latin entrypoints declare none, because
src/sheet/parts/TokensPart.tsx:341:                Self-hosted via @fontsource. Weight 600 only — a heading asking
src/sheet/parts/TokensPart.tsx:354:                Self-hosted via @fontsource. Weights 400 and 500 only — 400 for
```

Four are comments in `src/index.css` explaining the hand-written rules; two are sheet copy telling a
reader where the faces come from.

**The `url()` form that works: the bare package specifier.** `url('@fontsource/inter/files/...')`
is resolved by Vite's CSS asset resolver into `node_modules` and rewritten to the hashed
`/assets/*.woff2`; the relative `../node_modules/@fontsource/...` fallback was not needed and is
not used. Everything else is copied verbatim from `@fontsource`'s own `latin-*.css` — same family
names, same weights, `font-display: swap`. There is deliberately **no** `unicode-range`: Phase 5
§5.5 established that `@fontsource`'s latin entrypoints declare none, because the Latin subsetting
is baked into the file rather than expressed in CSS, so there was nothing to copy.

The landing and sheet stylesheets are byte-identical to the pre-prerender build of this phase
(`index-JaSjmbl1.css`, `components-xZOInl1b.css` — same content hashes), i.e. the new source files
and comments added no dead utilities. Two did appear on a first pass, `.container` and `.static`,
from an identifier and a phrase in the new prose; the identifier was renamed to `mount` and the
phrase reworded, and the hashes returned to the values above.

---

### P5-6 · FIXED · same change as P5-13 (`src/index.css:31-90`)

The hand-written `src:` lists the woff2 rung and nothing else, so the three `.woff` files
(84,492 B) are no longer emitted. Any browser that would reach the woff rung is one that never sees
the woff2 rung either, so no client loses a face.

```
$ ls dist/assets/*.woff
ls: cannot access 'dist/assets/*.woff': No such file or directory
$ ls dist/assets/*.woff2
dist/assets/fraunces-latin-600-normal-BFCDtZfi.woff2
dist/assets/inter-latin-400-normal-C38fXH4l.woff2
dist/assets/inter-latin-500-normal-Cerq10X2.woff2
```

Live, all three faces still load and both pages end at `document.fonts.status === "loaded"` — see
the readout at the end of this section.

---

### P5-2 · FIXED · `src/App.tsx:1,39,107`, `src/sheet/ComponentSheet.tsx:2,68,144`, `src/components/Hero.tsx:2,240`, `src/components/HeroClouds.tsx:2,814,823`, `src/components/Reveal.tsx:2,77,109,117,124,151,158`

Nine `motion.*` component sites became `m.*`, and both roots are wrapped in one
`<LazyMotion features={domAnimation} strict>`. `useScroll`, `useTransform`, `useReducedMotion`,
`useMotionValueEvent` and `cubicBezier` are untouched — they are hooks and helpers, not feature
bundles. `strict` makes the saving enforceable rather than conventional: rendering a `motion.*`
component below either root throws, so `domMax` cannot creep back one component at a time.

```
$ grep -rn '<motion\.' src/ ; echo "(exit $?)"
(exit 1)
$ grep -rn "from 'motion/react'" src/
src/App.tsx:1:import { domAnimation, LazyMotion } from 'motion/react'
src/components/Hero.tsx:2:import { m, useScroll, useTransform } from 'motion/react'
src/components/HeroClouds.tsx:2:import { m, useMotionValueEvent, useTransform } from 'motion/react'
src/components/Reveal.tsx:2:import { cubicBezier, m, type MotionProps } from 'motion/react'
src/lib/motion.ts:8:import { cubicBezier, useReducedMotion, type MotionValue } from 'motion/react'
src/sheet/ComponentSheet.tsx:2:import { domAnimation, LazyMotion } from 'motion/react'
```

**Shared chunk, raw bytes.**

| | raw | gzip |
| --- | --- | --- |
| Phase 5 §6.1 baseline (`SiteFooter-D2vbYzEP.js`) | 328,964 | 103,956 |
| clean build of `f820e62` on this machine (`SiteFooter-Chc-VP1O.js`) | 329,229 | 105,232 |
| after the `m.*` swap alone (`SiteFooter-CsyPoNvN.js`) | **282,710** | 91,617 |
| end of phase, incl. P5-1's hook + footer edits (`SiteFooter-VOpZu2sT.js`) | **283,048** | 90,497 |

**-46,181 B raw against the local baseline; -45,916 B raw against the audit's 328,964.** Both clear
the 40 KB target. The +338 B between the third and fourth rows is P5-1's `mounted` gate and the
footer's `<span>`, which live in the shared chunk too. The landing entry chunk grew 14,890 ->
16,013 (`LazyMotion` and `domAnimation` are imported from `src/App.tsx`), so the landing page's
total JS is 344,119 -> 299,061, **-45,058 B raw**.

The drag / pan / layout-projection region the finding located by byte offset is gone:

```
$ for s in layoutDependency isSharedProjectionDirty PanSession dragSnapToOrigin; do
    printf '%-26s %s\n' "$s" "$(grep -c "$s" dist/assets/SiteFooter-VOpZu2sT.js)"; done
layoutDependency           0
isSharedProjectionDirty    0
PanSession                 1
dragSnapToOrigin           0
```

(`PanSession` survives as a single string. The finding's own evidence had it spanning bytes
291,083-312,999, i.e. ~22 KB of implementation, and that implementation is no longer there.)

---

### P5-3 · FIXED · `vercel.json:10-32`, `README.md:111-115`

```
$ node -e "const v=require('./vercel.json');
           console.log('rewrites:', JSON.stringify(v.rewrites));
           console.log('headers:',  JSON.stringify(v.headers));
           console.log('buildCommand:', v.buildCommand)"
rewrites: [{"source":"/components","destination":"/components.html"},
           {"source":"/components/","destination":"/components.html"}]
headers:  [{"source":"/assets/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=31536000, immutable"}]},
           {"source":"/artwork/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=86400, must-revalidate"}]},
           {"source":"/brand/(.*)","headers":[{"key":"Cache-Control","value":"public, max-age=86400, must-revalidate"}]}]
buildCommand: npm run build
```

The two rewrites Phase 3 left are unchanged and `buildCommand` still runs `npm run build`, so the
prerender step runs on Vercel too. `/assets/(.*)` is everything Vite emits and all of it is
content-hashed, which is what makes `immutable` safe: the filename cannot change meaning.
`/artwork/` and `/brand/` are the 53 files `npm run images` overwrites *in place* — stable names,
changing bytes — so they get a day and an explicit `must-revalidate` instead. Two sentences in
`README.md`'s "Deploying" section say the same thing.

**Not verified: the served headers.** Vercel is not reachable from here. The finding was about the
absence of an explicit policy, and the policy now exists; whether the platform applies it is a
live check against a deployment.

---

### Live readout

**The acceptance bar, stated so the numbers below can be read.** A page passes when a **first load
in a fresh browser profile, sampled at least 3 s after `Page.loadEventFired`, produces 0 console
errors and 0 warnings**, in the normal and the `prefers-reduced-motion: reduce` branch alike, on the
**built** output. Both halves of that sentence carry weight. *First load in a fresh profile* is the
visit that has nothing cached; a **repeat** navigation to `/` is deliberately not covered, because it
is not silent — it emits the three font-preload warnings recorded verbatim under P5-5. *At least 3 s
after the load event* is what makes the measurement honest: Chromium's preload heuristic fires about
three seconds after load, so a probe that instead sleeps a fixed interval from `Page.navigate` can
close its sampling window before the warning exists and report a zero it did not earn. An earlier
draft of this section reported exactly such a zero; the console rows below were re-measured to fix
it.

Two servers, both stopped afterwards: the Vite **dev** server on 5173 and `npm run preview` serving
the built `dist/` on 4173. The DOM and motion values below come from this phase's original probe
(`p4-probe.mjs`, headless Edge over CDP on port 9338, user-data-dir `<scratchpad>\edge-profile-p4`).
Every `console` row was then re-measured with `p4r-console.mjs`, which waits for
`Page.loadEventFired` and settles 3.5 s before counting, using a fresh `--user-data-dir` per browser
(CDP ports 9340, 9341, 9350-9353; the network trace under P5-5 used 9343). Those runs also
reproduced `fontsStatus`, `stylesheets`, `fontPreloads` and `rootChildren` at the values shown.
Every **built**-page *first-load* row is a first navigation in a browser that had never loaded
anything else, and each *second navigation* row is the next navigation in that same tab; the
**dev** rows share one profile per motion branch, `/` first and `/components` second. The dev server
does not prerender, so hydration can only be judged against the built output — which is what 4173 is
for.

```
===== BUILT http://localhost:4173/ =====
scroll-0: { "scrollY": 0, "rootChildren": 1,
            "campusTransform": "matrix(3, 0, 0, 3, 0, 0)",
            "driftNodes": 3, "driftTransform": "matrix(1, 0, 0, 1, -491.323, 0)",
            "willChangeCount": 7, "cloudLayers": 3, "pictures": 49,
            "fontsStatus": "loaded",
            "fontsLoaded": ["Fraunces 600", "Inter 400", "Inter 500"],
            "stylesheets": 1, "fontPreloads": 3 }
drift@scroll0: { "t0": "matrix(1, 0, 0, 1, -491.369, 0)",
                 "t1": "matrix(1, 0, 0, 1, -492.659, 0)", "moving": true }
console (normal, first load, fresh profile): 0 messages, 0 errors/warnings
reduced-motion: { "scrollY": 0, "rootChildren": 1,
                  "campusTransform": "none",
                  "driftNodes": 0, "driftTransform": null,
                  "willChangeCount": 0, "cloudLayers": 3, "pictures": 13,
                  "fontsStatus": "loaded",
                  "fontsLoaded": ["Fraunces 600", "Inter 400", "Inter 500"],
                  "stylesheets": 1, "fontPreloads": 3 }
console (reduced, first load, fresh profile): 0 messages, 0 errors/warnings
console (second navigation to / in the same tab, normal AND reduced): 3 warnings
    — the three font preloads reported unused ~3 s after load; quoted verbatim under P5-5.
      Outside the acceptance bar; recorded, not designed around.

===== BUILT http://localhost:4173/components.html =====
scroll-0:       { "rootChildren": 1, "campusTransform": null, "driftNodes": 0,
                  "willChangeCount": 0, "pictures": 13, "fontsStatus": "loaded",
                  "fontsLoaded": ["Fraunces 600","Inter 400","Inter 500"],
                  "stylesheets": 1, "fontPreloads": 0 }
console (normal, first load, fresh profile): 1 message, 0 errors/warnings
    [log.info] Images loaded lazily and replaced with placeholders. Load events are deferred.
               See https://go.microsoft.com/fwlink/?linkid=2048113
reduced-motion: { ... identical ... }
console (reduced, first load, fresh profile): the same single info line, 0 errors/warnings
console (second navigation, same tab, normal): unchanged, that one info line — this page
    carries 0 font preloads, so there is no preload record that could go unclaimed

===== DEV http://localhost:5173/ =====
scroll-0: { "campusTransform": "matrix(3, 0, 0, 3, 0, 0)", "driftNodes": 3,
            "willChangeCount": 7, "pictures": 49, "stylesheets": 0, "fontPreloads": 0 }
drift@scroll0: { "moving": true }
console (normal): 3 messages, 0 errors/warnings
    [console.debug] [vite] connecting...
    [console.debug] [vite] connected.
    [console.info]  %cDownload the React DevTools for a better development experience:
                    https://react.dev/link/react-devtools font-weight:bold
reduced-motion: { "campusTransform": "none", "driftNodes": 0, "willChangeCount": 0,
                  "pictures": 13 }
console (reduced): 4 messages, 1 warning — the three above, plus
    [console.warning] You have Reduced Motion enabled on your device. Animations may not appear as
                      expected.. For more information and steps for solving, visit
                      https://motion.dev/troubleshooting/reduced-motion-disabled

===== DEV http://localhost:5173/components =====
console (normal):  4 messages, 0 errors/warnings — the three dev lines above, plus Edge's
                   "Images loaded lazily..." info line
console (reduced): 5 messages, 1 warning — those four plus the same motion warning
```

**Zero hydration warnings** on the built output, on both pages, in both motion branches, and none in
the repeat-navigation runs either — the condition P5-1 had to meet, and the one the dev server cannot
test. Across every built-page run the console produces exactly two kinds of message: Edge's `Images
loaded lazily...` notice on `/components.html` (info level, both motion branches, first load and
repeat alike), and the three font-preload warnings on a repeat navigation to `/` (P5-5). No error of
any kind, on any page, in any run.

Every motion invariant holds live: campus `transform` is `matrix(3, 0, 0, 3, 0, 0)` at scroll 0,
the drift track's transform
changes between two samples 500 ms apart (so the drift runs at scroll 0), and under
`prefers-reduced-motion: reduce` there are 0 `[data-cloud-drift]` nodes, 0 elements with a
`will-change` other than `auto`, and the campus transform is `none`. Under normal motion the
`will-change` count is 7, unchanged from Phase 7's live count (that is P5-7, a later row).

The one dev-only *warning* is motion's own `warnOnce` inside `useReducedMotion()`, which the library
emits when the media query matches and only when `process.env.NODE_ENV !== "production"`. It is a
library notice, not a page defect, it predates this phase, and it is absent from the production
build above — which is where the acceptance condition is measured. The other dev lines are Vite's
HMR-client handshake and React's DevTools suggestion, both `debug`/`info` and both unconditional in
a dev server.

`stylesheets: 0` on the dev rows is the dev server injecting CSS through the module graph rather
than a `<link>`; `fontPreloads: 0` there is P5-5's plugin correctly no-opping when there is no
bundle to read hashes from.

**Everything was stopped**, on the original run and on the re-measurement: `taskkill /PID <pid> /T
/F` on each dev server, preview server and headless Edge; `netstat -ano` filtered to the ports in
play (`:4173`, `:5173`, `:9338`, `:9340`-`:9343`, `:9350`-`:9353`) then returned no LISTENING row,
and a `Win32_Process` query for `msedge.exe` with this session's scratchpad path in its command line
returned 0.

---

### Invariants re-checked at the end of the phase

```
$ sed -n '74p' src/components/Hero.tsx
const PAN_START_SCALE = 3
$ grep -n "object-\[52%_0%\]\|origin-top" src/components/Hero.tsx | tail -2
131:const CAMPUS_OBJECT_POSITION = 'object-[52%_0%]'
217:                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${
$ git diff f820e62 -- src/lib/images.ts scripts/generate-images.mjs index.html
(no output — the srcset triple is untouched, and index.html was not edited at all)
$ git status --porcelain public/
(no output)
$ cmp public/404.html dist/404.html && echo identical
identical
```

---

## Phase 5 — documentation accuracy

Eighteen findings: P6-1 … P6-10, P3-2, P3-3, P3-4, P3-5, P5-9, P5-10, P5-11, P2-1. Files
touched: `README.md`, `ASSETS.md`, `index.html`, `src/lib/links.ts`, `src/lib/images.ts`,
`src/lib/motion.ts`, `src/App.tsx`, `src/components/Hero.tsx`,
`src/components/HeroClouds.tsx`, `src/components/ButtonLink.tsx`,
`src/components/sections/IntroSection.tsx`, `src/index.css`, `scripts/generate-images.mjs`.
No file outside this list changed; `public/` is untouched; nothing in `src/lib/images.ts`'s
srcset arrays, `scripts/generate-images.mjs`'s srcset array, or any `@theme` value was
edited — every diff to those three files is comment-only (verified below).

**Method.** Walked `audit/06-docs-hygiene.md` §1 (148 rows) in order, plus the specific
items named in this phase's brief from `audit/03-design-system.md` (P3-2/3/4/5),
`audit/05-performance.md` (P5-9/10/11) and `audit/02-code.md` (P2-1). For each FALSE/STALE
row, opened the source by searching for the quoted text (not the audit's line number, which
predates Phases 1–4's edits), confirmed the current code, and rewrote the claim. Every TRUE
row was re-derived against the code as it stands now rather than trusted; one — the
`ASSETS.md` "Notes" bullet on the hero's motion — had gone stale since Phase 2 replaced the
hero's `translateY` compensation with a pure top-anchored scale (`Hero.tsx:69,
"translateY is gone; scale alone drives the pan"`), which an earlier draft of this phase's
own edit to that bullet had not accounted for; caught on re-read and corrected in the same
pass (see `ASSETS.md:148–151` below).

### P6-1 · FIXED · `ASSETS.md:29`, `ASSETS.md:34`

`public/artwork/campus/` now reads "the only *source* file … (the AVIF/WebP derivatives sit
beside it — see Derivatives below)"; `public/artwork/clouds/` now reads "twelve **PNGs**"
rather than "twelve files", so the sentence no longer contradicts the same document's own
Derivatives section 50 lines below it.

```
$ grep -n "only \*source\* file\|twelve PNGs" ASSETS.md
29:the only *source* file in `public/artwork/campus/` (the AVIF/WebP derivatives sit beside
34:**The twelve PNGs in `public/artwork/clouds/` (`cloud-1.png` … `cloud-12.png`) are
$ ls public/artwork/campus | wc -l ; ls public/artwork/clouds | wc -l
9
36
```

### P6-2 · FIXED · `ASSETS.md:154`

"88% of the artwork bytes" (stale since commit `9a5a72d` doubled the cloud count) is now
"78%", recomputed and shown:

```
$ ls -l public/artwork/campus/Campus.png
-rw-r--r-- 1 danz3 197609 2942406 ... public/artwork/campus/Campus.png
$ du -cb public/artwork/campus/Campus.png public/artwork/clouds/*.png | tail -1
3780900 total
$ node -e "console.log(2942406/3780900*100)"
77.82289930968817
```

2,942,406 / 3,780,900 = 77.8%, rounded to 78% — matching `ASSETS.md:57`'s stated total.

### P6-3 · FIXED · `ASSETS.md:143–156`

The "Notes for later phases" heading and its two resolved bullets are gone. The section is
now "## Notes" and states both facts in the present tense: the hero is a vertical scale-pan
(citing `Hero.tsx`'s `object-position: 52% 0%` / `transform-origin: top`, no translation),
and the AVIF/WebP derivatives that were "the obvious lever" are cross-referenced to the
Derivatives section that already ships them. The third bullet (cloud heights) is untouched.

```
$ grep -n "Notes for later phases\|Worth confirming against the intended motion\|is the obvious lever" ASSETS.md ; echo "EXIT=$?"
EXIT=1
$ sed -n '143,156p' ASSETS.md
## Notes

Observations from the raw files. The two questions this section used to raise are both
settled — recorded here as fact rather than as open questions:

- **The hero is a vertical scale-pan, not a horizontal scroll-pan.** Campus.png is 1672 px
  wide and has no alpha; a horizontal scroll-pan would have had limited travel before
  upscaling past 1:1 on a wide desktop viewport. `src/components/Hero.tsx` instead scales
  the illustration up from a fixed top edge (`object-position: 52% 0%` +
  `transform-origin: top`, no translation at all), which fits the source dimensions.
- **At 2.81 MiB, Campus.png is 78% of the artwork bytes** (2,942,406 / 3,780,900 —
  `ASSETS.md:57`'s total — = 77.8%, rounded). It is also the largest-contentful-paint
  candidate; AVIF/WebP derivatives beside it are what keep the transferred weight far
  below that, per Derivatives above.
- The clouds are small (70–303 px tall) and will be visibly soft if scaled far above 1:1.
```

### P6-4 · FIXED · `README.md:317`

"collapses to a menu at 390px" → "collapses to a menu below `md` (768px)", matching
`src/components/SiteHeader.tsx:16`'s own (already-correct) header comment.

```
$ grep -c '390px' README.md
0
$ grep -n '768\|md:' README.md
317:    SiteHeader.tsx           fixed header, collapses to a menu below `md` (768px)
```

### P6-5 · FIXED · `README.md:195`

`1 / 0.351 ≈ 2.86` → `≈ 2.85`, matching `src/components/Hero.tsx:69`'s "S > 2.85" (Hero.tsx
itself already said 2.85; only the README quotient was stale).

```
$ grep -n "2.85\|2.86" README.md src/components/Hero.tsx
README.md:195:  the start scale must stay above `1 / 0.351 ≈ 2.85`. Measure where buildings begin in the new
src/components/Hero.tsx:69: * The binding constraint is 1/S < 0.351, i.e. S > 2.85; 2.4 would have shown
```

### P6-6 · FIXED · `README.md:301–336`

The Layout tree gained `main.tsx`, `entry-server.tsx`, `landing.css`, a `sheet/` entry
(pointing at the "component sheet" section), `scripts/prerender.mjs` and `public/404.html` —
every file Phases 1–4 added that the tree had never listed.

```
$ grep -n "main.tsx\|entry-server.tsx\|landing.css\|^  sheet/\|prerender.mjs\|404.html" README.md
303:  main.tsx                   landing entry: hydrateRoot in prod, createRoot in dev
304:  entry-server.tsx           build-time SSR render, read by scripts/prerender.mjs
307:  landing.css                index.css plus one `@source not` line, excluding the sheet
325:  sheet/                     the component sheet at /components — see above
331:  prerender.mjs              build-time prerender, run after `vite build`
335:  404.html                   the static 404 body (see "The component sheet" above)
$ ls -R src/sheet
ComponentSheet.tsx  kit.tsx  main.tsx  parts  sheet.css
parts:
ComposedPart.tsx  HeroPart.tsx  PrimitivesPart.tsx  TokensPart.tsx
```

### P6-7 · FIXED · `src/components/HeroClouds.tsx:145`

The `near` row of the cast-list comment read `cloud-5, cloud-1, cloud-8, cloud-11`; the
array at `:350,359,368,377` is `cloud-5, cloud-8, cloud-11, cloud-1`. Reordered the comment
to match. `far` (`:235,244,253,262`) and `mid` (`:282,291,300,309`) already matched their
rows and were untouched.

```
$ grep -n "id: 'far'\|id: 'mid'\|id: 'near'\|file: 'cloud" src/components/HeroClouds.tsx | head -20
226:    id: 'far',
235:        file: 'cloud-6.png',
244:        file: 'cloud-12.png',
253:        file: 'cloud-4.png',
262:        file: 'cloud-10.png',
273:    id: 'mid',
282:        file: 'cloud-7.png',
291:        file: 'cloud-2.png',
300:        file: 'cloud-9.png',
309:        file: 'cloud-3.png',
320:    id: 'near',
350:        file: 'cloud-5.png',
359:        file: 'cloud-8.png',
368:        file: 'cloud-11.png',
377:        file: 'cloud-1.png',
$ sed -n '143,145p' src/components/HeroClouds.tsx
 *     far   cloud-6, cloud-12, cloud-4,  cloud-10
 *     mid   cloud-7, cloud-2,  cloud-9,  cloud-3
 *     near  cloud-5, cloud-8,  cloud-11, cloud-1
```

### P6-8 · FIXED · 8 files, 15 sites

Every "Phase N" label across the build's own source rewritten to describe the code in
present tense rather than reference a plan that exists only in the git log. The one that was
substantively stale (`motion.ts`'s "Phase 4 … and Phase 5 … are expected to consume them" —
both had long since shipped) now reads as fact; the rest were cosmetic re-wordings of
accurate but plan-referencing prose:

- `src/components/ButtonLink.tsx:25` — "Phase 7 moved that CTA" → "That CTA now sits"
- `src/components/Hero.tsx:23,93,139` — "Phase 7 moved" → "live in <IntroSection> instead";
  "Phase 3 used" → "An earlier scheme used"; "everything Phase 4 adds" → "including
  HeroClouds's parallax"
- `src/components/HeroClouds.tsx:7,13,173,564` — "Phase 4 —" dropped from the file header;
  "Phase 7 moved the hero copy out" → "the hero copy moved out to <IntroSection>"; "Phase 6
  asked … answered no" → "was measured … and answered no"; "Phase 6 fixed that in the pan" →
  "That was fixed in the pan"
- `src/components/sections/IntroSection.tsx:11` — "Phase 7 moved it here" → "it lives here
  instead"
- `src/index.css:125,158` — "Phase 6 moved every eyebrow" → "Every eyebrow … uses"; "Type
  scale (Phase 2)" → "Type scale"
- `src/lib/images.ts:2` — "(Phase 6a)" dropped
- `src/lib/motion.ts:21,146` — see P6-9's evidence below; "Phase 4's cloud layers" → "The
  hero's cloud layers (`HeroClouds.tsx`)"
- `ASSETS.md:78` — "## Derivatives (Phase 6)" → "## Derivatives"

```
$ grep -rn "Phase [0-9]" src index.html components.html README.md ASSETS.md scripts vercel.json ; echo "EXIT=$?"
EXIT=1
```

### P6-9 · FIXED · `src/lib/motion.ts:44–49`

"motion reads the media query once at mount and does not re-subscribe" named the wrong half
of the mechanism — the underlying `matchMedia` listener *is* live (it updates a module-level
ref motion keeps for its own purposes); what never updates is the hook's own `useState`,
which is what actually causes the "no re-render on a mid-session change" behaviour the
comment was trying to describe. Reworded to name both halves, so a future reader does not
add a redundant second `matchMedia` listener while trying to "fix" a subscription that
already exists.

```
$ sed -n '44,49p' src/lib/motion.ts
 * Note: motion captures the value in `useState` at mount and never re-renders
 * on a change — the underlying media query *is* subscribed to (it updates a
 * module-level ref motion keeps for its own purposes), but nothing here reads
 * that ref again, so a mid-session OS change takes effect only on the next
 * page load.
$ grep -c "addEventListener(\"change\"" node_modules/motion-dom/dist/es/render/utils/reduced-motion/index.mjs
1
```

### P6-10 · FIXED · `ASSETS.md:78–84`, `scripts/generate-images.mjs:8–11`; `README.md` already correct

"a deploy runs `vite build` and nothing else" (`ASSETS.md`) and "a deploy needs nothing but
`vite build`" (`generate-images.mjs`) both under-described the build, which also lints and
type-checks (`package.json`'s `"build": "npm run lint && tsc -b && vite build && node
scripts/prerender.mjs"`). Both now name `npm run build` and its real steps.
`README.md:107–108` was checked and was **already** accurate (an earlier phase's prerender
work rewrote it) — "a build is lint, `tsc -b`, `vite build` and `node scripts/prerender.mjs`,
nothing else" — so no README edit was needed for this finding; it is recorded here only to
close the finding against all three sites the original evidence named.

```
$ grep -n 'npm run build` (' ASSETS.md scripts/generate-images.mjs README.md
ASSETS.md:84:`npm run build` (lint, `tsc -b`, `vite build`, then the prerender step — a lint warning
scripts/generate-images.mjs:9: * deploy needs nothing but `npm run build` (lint, `tsc -b`, `vite build`, then
```

**Retry note (checker round 1).** The first version of this entry expanded `npm run build` as
"`tsc -b && vite build`, plus the prerender step" in both `ASSETS.md:84` and
`generate-images.mjs:9–10` — omitting the lint step, i.e. the very under-description P6-10 is
about. Both parentheticals now name all four steps. The transcript above is the real output of a
command narrowed to the expansion sites (`npm run build` followed by an opening parenthesis);
round 1 of this retry had pasted a hand-curated excerpt of a wider grep, which checker round 2
caught. Three further items from the same checker round were taken in this retry:
`README.md:295–297` ("no focusable elements" → "nothing in the tab order", because Phase 2's
`tabIndex={-1}` on `<section id="top">` made the old sentence literally false — claims-table
row 45 stays TRUE); `ASSETS.md:30` ("only non-cloud asset" → "only non-cloud *source* asset",
since eight campus derivatives sit beside it); and the P6-2 heading's `ASSETS.md:152` → `:154` (first corrected to `:153` from the pre-edit file; the
retry's own two-line `ASSETS.md:84–85` pushed it one further — checker round 2).
One item was **declined**: the audit IDs (`P5-1`, `P4-4`, …) that Phases 2 and 4 left in source
comments (18 sites, `grep -rn 'P[0-9]-[0-9]' src scripts vite.config.ts`) are not the P6-8
defect. P6-8 was about "Phase N" labels pointing at a plan that exists only in the git log;
`P5-1` resolves to a tracked file in this repo (`audit/AUDIT.md` §3), so the pointer is
followable and stays.

### P3-2 · FIXED · `README.md:261`

`pine`'s role cell gained "focus rings, the button hover fill and the toggle's
border/hover fill" — the two interactive uses (`ButtonLink.tsx:30` `hover:bg-pine`;
`ExternalLink.tsx:30`, `SiteHeader.tsx:51,77`, `App.tsx:30` for focus rings; `controls.ts:39`
`TOGGLE_ON_CLOUD`'s `border-pine … hover:bg-pine`) the table previously omitted — matching
`src/sheet/parts/TokensPart.tsx:89`'s "All text, all focus rings, and the button's hover
fill," extended once more for the toggle Phase 2 added after that sheet copy was written.

```
$ grep -n "pine.*focus rings" README.md src/sheet/parts/TokensPart.tsx
README.md:261:| `pine` | `#3C5C48` | body text, headings, focus rings, the button hover fill and the toggle's border/hover fill (never pure black) |
src/sheet/parts/TokensPart.tsx:89:    role: 'All text, all focus rings, and the button’s hover fill.',
```

### P3-3 · FIXED · `README.md:262`, `src/index.css:122–130`

`haze`'s role cell now reads "**currently unused**", the same phrasing already used for
`horizon` one row above, in place of "scene colour only" — which implied a live role that
`grep -rn haze src/` (outside the sheet) does not show. The `@theme` comment above
`--color-haze` was reworded to match, since it made the same "scene colour, not text colour"
claim without noting the token has no scene use either today.

```
$ grep -rn "haze" src/ README.md | grep -v "src/sheet/"
src/components/Layout.tsx:55: * One treatment, defined once. The colour is `pine/90` rather than `haze`: haze
src/index.css:122:   * haze was defined as a scene colour, not a text colour — but it is
src/index.css:127:   * only token that clears AA on both.
src/index.css:130:  --color-haze: #7c99b4;
README.md:262:| `haze` | `#7C99B4` | **currently unused** — retired from text (2.72:1 on `cloud`, below AA) and not used as a scene colour either |
```

### P3-4 · DOCUMENTED (comment reworded) · `src/App.tsx:70–77`

The audit's own assessment (`03-design-system.md` P3-4) called this a `note`, not a
violation — the "no arbitrary hex" rule targets painted colour, and `#ccc3ad` in a comment
paints nothing — and recommended no fix beyond an exemption if a colour lint is ever added.
This phase's brief asked specifically for the hex to be replaced with a token name, so the
raw hex is gone; the wording is honest that `#ccc3ad` is a **measured artwork colour**, close
to but not equal to `stone` (`#c4b79e`), rather than claiming an equivalence that does not
hold (204,195,173 vs 196,183,158 — a 8–15 point difference per channel).

```
$ grep -n "#[0-9a-fA-F]\{6\}" src/App.tsx ; echo "EXIT=$?"
EXIT=1
$ sed -n '70,77p' src/App.tsx
          {/*
           * A `drift-*` variant, not a sky-backed one. The divider is only ever
           * *seen* after the stage unpins, i.e. after the pan has finished, and
           * the finished frame ends on the snowy foreground plaza: the bottom 20
           * rows of Campus.png average a warm sand-grey close to (but not the
           * same as) the `stone` token — a measured artwork colour, not a
           * design token, so it is not what the "no arbitrary hex" rule in
           * README's Conventions section is aimed at. A saturated
           * blue band under that would read as a stripe. (A `sky-to-cloud`
```

### P3-5 · FIXED · `README.md:274–276`, `README.md:321`

"the only two link treatments on the page" → "the only two **text-link** treatments on the
page", matching `src/components/ExternalLink.tsx:8`'s own correctly-scoped wording ("Every
**text** link on the page uses one of the two strings below"). This resolves the apparent
contradiction with `ButtonLink.tsx` (an `<a>` with its own `hover:bg-pine`) and the header
logo link (`SiteHeader.tsx:50–52`, a focus ring only) — neither is a text link, so neither
was ever a counterexample to the narrower claim. The Layout-tree line for `ExternalLink.tsx`
was reworded the same way for consistency.

```
$ grep -n "text-link" README.md
README.md:275:`LINK_ON_FROST` in `src/components/ExternalLink.tsx` are the only two **text-link**
README.md:321:    ExternalLink.tsx         same-site vs new-tab routing + the two text-link treatments
```

### P5-9 · FIXED · `ASSETS.md:118`

`brand-source/icon_discord.png`'s Alpha cell: "No (opaque)" → "Yes — channel present, fully
opaque". The file has 4 channels and `hasAlpha: true`; it is fully opaque, but "no alpha
channel" and "an alpha channel with no transparency" are different facts, and the cell
stated the wrong one.

```
$ node -e "require('sharp')('brand-source/icon_discord.png').metadata().then(m=>console.log(JSON.stringify({channels:m.channels,hasAlpha:m.hasAlpha})))"
{"channels":4,"hasAlpha":true}
$ grep -n "icon_discord.png" ASSETS.md | grep Alpha
118:| `brand-source/icon_discord.png` | 732 × 732 | n/a — opaque tile | `#97F5AC` tile, `#50B536` mark | Yes — channel present, fully opaque |
```

### P5-10 · FIXED · `ASSETS.md:138`

"5.3 KB at 1x, 11.7 KB at 2x" (KB = 1000, truncated) → "5.2 KB at 1x, 11.5 KB at 2x" (÷1024,
matching the rest of the document and `scripts/generate-images.mjs`'s own convention).

```
$ ls -l public/brand/bearcat-mask-64.png public/brand/wordmark-mask-192.png public/brand/bearcat-mask-128.png public/brand/wordmark-mask-384.png
-rw-r--r-- 1 danz3 197609 6941 ... bearcat-mask-128.png
-rw-r--r-- 1 danz3 197609 3164 ... bearcat-mask-64.png
-rw-r--r-- 1 danz3 197609 2147 ... wordmark-mask-192.png
-rw-r--r-- 1 danz3 197609 4850 ... wordmark-mask-384.png
$ node -e "console.log((3164+2147)/1024, (6941+4850)/1024)"
5.1865234375 11.5146484375
```

### P5-11 · FIXED · `index.html:26–31`

"`imagesrcset`/`imagesizes` are byte-identical to the `<picture>` sources" is true of
`dist/index.html` but not of the source, where `imagesrcset` is written across five indented
lines and `campusSrcSet('avif')` joins with `', '`. Reworded to "are identical … after
srcset whitespace normalisation (and byte-identical in the built HTML, which is what the
browser parses)".

```
$ sed -n '26,31p' index.html
      LCP preload for the campus illustration.

      The hero <img> lives inside the React bundle, so without this the browser
      cannot discover it until the module graph has parsed and the app has
      mounted. `imagesrcset`/`imagesizes` are identical to the <picture>
      sources in src/components/Hero.tsx (via src/lib/images.ts) after srcset
```

### P2-1 · FIXED · `src/lib/links.ts:10,12,19,21,26,28`

Hoisted `SCHEDULE_URL` and `HACKATHONS_URL` alongside the existing `RESOURCES_URL`, and
`NAV_LINKS` / `SITE_PAGES` now reference all three instead of re-typing the literal strings
— the same pattern `SOCIAL_LINKS` already used for `DISCORD_URL`. The module's own docstring
(`:5`, "reuse these constants rather than re-typing hrefs") is now followed throughout the
file it sits in.

```
$ grep -c "hackbu.org/resources'" src/lib/links.ts
1
$ grep -c "hackbu.org/schedule'" src/lib/links.ts
1
$ grep -c "hackbu.org/hackathons'" src/lib/links.ts
1
```

(Each of the three now appears exactly once, in its `const` definition; every other site
references the constant.)

### §1 rows changed

| Row(s) | Claim | Before | After |
|---|---|---|---|
| 12 | README "a build is just `vite build`" | FALSE | already TRUE (fixed by an earlier phase's prerender work, before this phase started; re-verified, not re-edited) |
| 18 | README "anything else → the catch-all rewrite to `/index.html`" | FALSE | already TRUE (fixed in fix-log Phase 3 — P5-4 — which replaced the whole routing table; re-verified, not re-edited) |
| 27 | README "≈ 2.86" scale floor | FALSE | TRUE (P6-5) |
| 36 | README `haze` "scene colour only" | STALE | TRUE (P3-3) |
| 40 | README "only two link treatments" | FALSE | TRUE (P3-5) |
| 57 | README Layout tree omits `main.tsx`/`landing.css`/`sheet/` | STALE | TRUE (P6-6) |
| 58 | README header collapses "at 390px" | FALSE | TRUE (P6-4) |
| 68 | ASSETS.md campus dir "only file" | STALE | TRUE (P6-1) |
| 69 | ASSETS.md "twelve files" in clouds dir | STALE | TRUE (P6-1) |
| 77 | ASSETS.md "deploy runs `vite build` and nothing else" | FALSE | TRUE (P6-10) |
| 86 | ASSETS.md `icon_discord.png` alpha "No (opaque)" | FALSE | TRUE (P5-9) |
| 88 | ASSETS.md "5.3 KB / 11.7 KB" | FALSE | TRUE (P5-10) |
| 90 | ASSETS.md scroll-pan open question | STALE | TRUE (P6-3) |
| 91 | ASSETS.md "88% of the artwork bytes" | STALE | TRUE (P6-2) |
| 92 | ASSETS.md "obvious lever" open question | STALE | TRUE (P6-3) |
| 99 | index.html "byte-identical" (source) | FALSE | TRUE (P5-11) |
| 120 | motion.ts "Phase 4 … Phase 5 … are expected to" | STALE | TRUE (P6-8) |

That is all 17 rows `audit/06-docs-hygiene.md` §1 previously marked FALSE (9) or STALE (8).
Two (rows 12 and 18) were already fixed by earlier fix-log phases before this one started and
were re-verified rather than re-edited; the other 15 were edited in this phase. Zero FALSE or
STALE rows remain. No previously-TRUE row was found to have gone stale during this phase's
re-derivation, apart from the `ASSETS.md` "Notes" bullet on hero motion mechanics, corrected
in the same edit that resolved P6-3 (see that section above) before this log entry was
written.

### Phase-wide verification

```
$ npm run typecheck ; echo "EXIT=$?"
> tsc -b --noEmit
EXIT=0

$ npm run lint ; echo "EXIT=$?"
> oxlint --deny-warnings
EXIT=0

$ npm run build ; echo "EXIT=$?"
> npm run lint && tsc -b && vite build && node scripts/prerender.mjs
✓ 448 modules transformed.
dist/components.html                                    1.52 kB
dist/index.html                                         5.41 kB
dist/assets/index-hUPakRjE.js                          16.01 kB
dist/assets/components-WZ-vvrxD.js                     53.65 kB
dist/assets/SiteFooter-ejBd3QIq.js                    282.94 kB
✓ built in 348ms
prerendered dist/index.html (42596 chars)
prerendered dist/components.html (109247 chars)
EXIT=0

$ grep -rn "Phase [0-9]" src index.html components.html README.md ASSETS.md scripts vercel.json ; echo "EXIT=$?"
EXIT=1

$ grep -c '390px' README.md
0
$ grep -n '768\|md:' README.md
317:    SiteHeader.tsx           fixed header, collapses to a menu below `md` (768px)

$ grep -c "hackbu.org/resources'" src/lib/links.ts
1

$ git status --porcelain public/
(no output)

$ git status --porcelain
 M ASSETS.md
 M README.md
 M index.html
 M scripts/generate-images.mjs
 M src/App.tsx
 M src/components/ButtonLink.tsx
 M src/components/Hero.tsx
 M src/components/HeroClouds.tsx
 M src/components/sections/IntroSection.tsx
 M src/index.css
 M src/lib/images.ts
 M src/lib/links.ts
 M src/lib/motion.ts

$ git diff -- src/lib/images.ts scripts/generate-images.mjs src/index.css | grep -c '^\(+\|-\)--color-'
0
```

Thirteen files touched, all documentation or doc comments plus the one code file
(`src/lib/links.ts`) this phase's brief explicitly named as in-scope; `public/`,
`src/lib/images.ts`'s srcset arrays, `scripts/generate-images.mjs`'s srcset array and every
`@theme` value are byte-for-byte unchanged.

## Phase 6 — optional code polish and the `will-change` measurement

Nine findings: **P5-7** (with **P2-8**), **P1-1**, **P1-2**, **P2-5**, **P2-6**, **P2-7**,
**P3-7**, **P3-8**, **P4-7**. Files touched: `src/components/Hero.tsx`,
`src/components/HeroClouds.tsx`, `src/main.tsx`, `src/sheet/main.tsx`, `vite.config.ts`,
`src/sheet/ComponentSheet.tsx`, `src/sheet/parts/TokensPart.tsx`. Nothing a reader of the landing
page can see changes; the one visible change anywhere is a 2px focus-ring offset inside the
internal component sheet, taken deliberately as part of P3-8.

### The compositor measurement (P5-7 / P2-8) — how it was taken

The open item both `05-performance.md` §4.4 and `07-live.md` §11 left behind was that no layer
count and no layer memory had ever been read, because the Phase 7 browser ran with
`--disable-gpu`. This phase read them.

Microsoft Edge 151.0.4129.101, launched **`--headless=new` with the GPU path left on** — no
`--disable-gpu` — driven over CDP with the `LayerTree` domain enabled. That mode does composite on
real hardware here, which the browser confirms itself:

```
GPU featureStatus: 2d_canvas=enabled direct_rendering_display_compositor=disabled_off_ok
  gpu_compositing=enabled multiple_raster_threads=enabled_on opengl=enabled_on
  rasterization=enabled raw_draw=disabled_off_ok skia_graphite=disabled_off
  trees_in_viz=disabled_off video_decode=enabled video_encode=enabled webgl=enabled
  webgpu=enabled webnn=disabled_off
GPU auxAttributes.glRenderer: ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 (0x00002484)
  Direct3D11 vs_5_0 ps_5_0, D3D11-32.0.15.9597)
```

`gpu_compositing=enabled` and a D3D11 renderer, so a headed run was not needed and was not used.

**Formula.** Layer count is the number of entries in the `LayerTree.layerTreeDidChange` snapshot.
"Total layer memory" is the sum of `round(width) x round(height) x 4` over those entries — layer
*bounds* at 4 bytes per pixel, `deviceScaleFactor: 1`. It is reported twice: over every layer, and
over only those with `drawsContent: true`, which is the subset that actually holds a raster.
Compositing reasons come from `LayerTree.compositingReasons` per `layerId`; owning elements from
`DOM.describeNode` on each layer's `backendNodeId`. Progress is read the way `07-live.md` §3 read
it — `scrollTo(0, trackTop + p x (track.offsetHeight - innerHeight))`, then the actual
`(scrollY - trackTop) / span` back out. One wrinkle worth recording: past the pan **nothing on the
page is animating**, so the compositor never commits and no tree is pushed; each reading therefore
disables and re-enables `LayerTree` and nudges the scroll by 1px, landing back on the exact target
offset.

### The four readings, before any code change

| Viewport | Progress | Layers | Total layer memory (all) | …of it `drawsContent` | `will-change` |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 0 | **21** | **153,470,156 B** | 110,968,500 B | 7 |
| 1440 × 900 | 0.8 | **23** | **155,828,432 B** | 48,555,300 B | 7 |
| 390 × 844 | 0 | **23** | **42,893,504 B** | 30,518,480 B | 7 |
| 390 × 844 | 0.8 | **25** | **43,697,092 B** | 14,380,976 B | 7 |

Which layers carry `will-change: transform` as a compositing reason — all seven elements, at both
scroll positions, at both viewports, `WillChangeTransform` being their **only** listed reason:

```
1440x900, progress 0.8, before:
  id=11 1425x900   5130000B draws=true  node=img.h-full.w-full.origin-top.object-[52%_0%]  reasons=[WillChangeTransform]
  id=13 1425x900   5130000B draws=false node=div[data-cloud-layer=far]                     reasons=[WillChangeTransform]
  id=14 5700x900  20520000B draws=false node=div[data-cloud-drift=true]                    reasons=[WillChangeTransform]
  id=15 1425x900   5130000B draws=false node=div[data-cloud-layer=mid]                     reasons=[WillChangeTransform]
  id=16 5700x900  20520000B draws=false node=div[data-cloud-drift=true]                    reasons=[WillChangeTransform]
  id=17 1425x900   5130000B draws=false node=div[data-cloud-layer=near]                    reasons=[WillChangeTransform]
  id=18 5937x900  21373200B draws=false node=div[data-cloud-drift=true]                    reasons=[WillChangeTransform]
```

Three things the numbers settle that the static read could not:

1. **The layers are not clipped to one viewport.** §4.4 hoped the `overflow-hidden` ancestor would
   hold each drift track near one viewport width; it does not. Each `data-cloud-drift` layer is
   its full four-sets width — 5700 × 900 and 5937 × 900 at 1440×900 — exactly as authored.
2. **The cost past the pan is not nil.** All four elements that stop changing (the campus `<img>`
   and the three `data-cloud-layer` wrappers) are still their own compositor layers at progress
   0.8, with `WillChangeTransform` as their sole compositing reason, and the campus `<img>` is
   still `drawsContent: true` holding a 1425 × 900 × 4 = 5,130,000 B raster (390 × 844 × 4 =
   1,316,640 B on mobile). The decision rule set for this phase was: release the hint if the
   four elements that stop animating after the pan each still cost a measurable compositor
   layer at progress 0.8; document-only if the cost is nil. They do, so the hint was released.
3. **The drift tracks stop drawing but keep their layers.** At progress 0.8 their `drawsContent`
   is false — they are at opacity 0 — which is the whole 62,413,200 B gap between the two
   `drawsContent` columns at 1440×900 (110,968,500 − 20,520,000 − 20,520,000 − 21,373,200 =
   48,555,300, exactly the measured figure).

### The four readings, after the change

| Viewport | Progress | Layers | Total layer memory (all) | …of it `drawsContent` | `will-change` |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 0 | 21 | 153,470,156 B | 110,968,500 B | **7** |
| 1440 × 900 | 0.8 | **21** (−2) | **145,568,432 B** (−10,260,000) | 48,555,300 B (=) | **3** |
| 390 × 844 | 0 | 23 | 42,893,504 B | 30,518,480 B | **7** |
| 390 × 844 | 0.8 | **23** (−2) | **41,063,812 B** (−2,633,280) | 14,380,976 B (=) | **3** |

Scroll 0 is byte-identical to before, which is the point: the hint is unchanged while it is doing
something. Past the pan, two composited layers go away — the campus `<img>`'s and the
`data-hero-clouds` wrapper's — and the three `data-cloud-layer` wrappers survive only as
`StickyPosition` layers, no longer as `WillChangeTransform` ones. **Raster memory is a wash**
(`drawsContent` totals are identical to the byte): the campus content still has to be rasterised,
and it moves onto the `data-hero-stage` layer that was already composited and previously drew
nothing. So the honest result is −2 compositor layers and −6.6% / −6.0% of total layer bounds past
the pan, not a texture saving. Recorded here rather than claimed as a frame-rate win, which was
not measured.

### P5-7 (with P2-8) · FIXED · `src/components/Hero.tsx:180,252` · `src/components/HeroClouds.tsx:820`

`Hero.tsx:180` adds a `panning` boolean, `progress.get() <= PAN_SCROLL_FRACTION`, kept current by
`useMotionValueEvent` on the hero's existing `useScroll` value — the same shape as `drifting` in
`HeroClouds`, and still no `scroll` listener anywhere in `src/`. `Hero.tsx:252` reads it, so the
campus `<img>` carries `will-change-transform` only while `reducedMotion` is false *and* the pan is
still running. `HeroClouds.tsx:820` gates the `data-cloud-layer` wrapper's hint on the existing
`drifting` flag, whose threshold is that layer's own `fadeEnd` — the exact progress at which the
wrapper's `y` and `opacity` stop moving, and at which its opacity is exactly 0, so the
de-promotion lands on a frame that paints nothing. The three `data-cloud-drift` tracks keep their
hint unconditionally — deliberately, and **not** because they keep animating: once `drifting` is
false, `driftLoop` (P4-4) freezes them at `LOOP_START` with no keyframes and no `repeat`, and the
second-cycle final audit measured all three at `matrix(1, 0, 0, 1, -1265, 0)` from progress ≈ 0.5
onward while still reporting `will-change: transform`. The hint is retained so that scrolling back
up resumes the drift without re-promoting three full-width (5700 × 900) tracks; the cost is three
retained compositor layers that draw nothing (their wrapper sits at opacity 0, so `drawsContent` is
false and the raster cost is nil — the 145,568,432 B post-change reading at 1440 × 900 / 0.8 still
includes their bounds). Gating this `className` on `drifting`, exactly as the sibling wrapper is,
would take the count to 0 past the hero; it is recorded as a follow-up rather than taken, because
it changes compositor behaviour after the plan's measurement pass. (An earlier version of this
paragraph claimed the tracks "animate `x` with `repeat: Infinity`" — that was true before P4-4 and
false after it; corrected by the final audit.)

Scrolling back up sets both flags true again, so this is a state of the page, not a one-way latch.

```
$ node p6-verify.mjs 9346          # dev server, headless Edge with GPU, LayerTree enabled
===== 1440x900 — scroll 0
  campus transform: matrix(3, 0, 0, 3, 0, 0)
  will-change:transform count = 7  [img | div[data-cloud-layer] | div[data-cloud-drift] | div[data-cloud-layer] | div[data-cloud-drift] | div[data-cloud-layer] | div[data-cloud-drift]]
  LAYER COUNT = 21   (drawsContent: 8)
  TOTAL LAYER MEMORY (w*h*4, all layers)      = 153470156 B
===== 1440x900 — hero progress 0.37 (mid-pan)
  scrollY=533 progress=0.370139
  campus transform: matrix(1.66528, 0, 0, 1.66528, 0, 0)
  will-change:transform count = 4  [img | div[data-cloud-drift] | div[data-cloud-drift] | div[data-cloud-drift]]
===== 1440x900 — hero progress 0.8
  campus transform: none
  will-change:transform count = 3  [div[data-cloud-drift] | div[data-cloud-drift] | div[data-cloud-drift]]
  LAYER COUNT = 21   (drawsContent: 5)
  TOTAL LAYER MEMORY (w*h*4, all layers)      = 145568432 B
===== 390x844 — scroll 0
  will-change:transform count = 7
  LAYER COUNT = 23   TOTAL LAYER MEMORY = 42893504 B
===== 390x844 — hero progress 0.8
  will-change:transform count = 3
  LAYER COUNT = 23   TOTAL LAYER MEMORY = 41063812 B
===== 1440x900 — prefers-reduced-motion: reduce, scroll 0
  campus transform: none
  will-change:transform count = 0
  data-cloud-drift nodes = 0
  track height = 900 (viewport 900)
===== 390x844 — prefers-reduced-motion: reduce, scroll 0
  campus transform: none
  will-change:transform count = 0
  data-cloud-drift nodes = 0
  track height = 844 (viewport 844)
```

Seven at scroll 0, four mid-pan (the three wrappers release at their `fadeEnd`, all ≤ 0.30, well
before 0.37), three past the pan, zero under reduced motion. The hero itself is untouched: at
`p = 0.370139` the computed transform is `matrix(1.66528, …)` — the same value `07-live.md` §3
measured before any of this, there at `p = 0.370313` on a 1280×800 viewport. (The two `p` figures
differ by 0.00017 because each viewport rounds `0.37 × span` to a whole pixel of scroll; the scale
they produce is identical to five decimals.)

The prerendered markup agrees with the client's first render, so hydration still matches — both
render `panning` true and `drifting` true at progress 0:

```
$ grep -o 'will-change-transform' dist/index.html | wc -l
7
$ grep -o 'class="h-full w-full origin-top[^"]*"' dist/index.html
class="h-full w-full origin-top object-[52%_0%] object-cover select-none will-change-transform"
```

### P1-1 · FIXED · `vite.config.ts:167,191`

`build.rollupOptions.output.manualChunks` is now a function (`vite.config.ts:167`, wired in at
`:191`) that names the two chunks both pages share instead of letting the bundler name them after a
facade module. `vendor` takes everything from `node_modules` — react, react-dom, scheduler,
`react/jsx-runtime`, `motion` and its `motion-dom` / `motion-utils` internals — plus Vite's virtual
`modulepreload-polyfill`, which has no `node_modules` path to match on and would otherwise be a
shared chunk of its own. `shared` takes `src/components/**` and `src/lib/**`, which is exactly the
set both entries import: the sheet renders the real components, sections included
(`src/sheet/parts/ComposedPart.tsx:5–9`), so naming it this way pushes nothing landing-only into
the sheet's download. Stylesheets are returned unassigned so Vite keeps handling them.

One chunk could not be named from here and is left alone: `rolldown-runtime-*.js`, 589 B, emitted
by the bundler itself and never offered to `manualChunks`. It is named after what it is.

Before, and after:

```
$ ls -l dist/assets/          # before
-rw-r--r-- 1 danz3 197609 282949 SiteFooter-ejBd3QIq.js
-rw-r--r-- 1 danz3 197609  53659 components-WZ-vvrxD.js
-rw-r--r-- 1 danz3 197609  21331 components-xZOInl1b.css
-rw-r--r-- 1 danz3 197609  18096 fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r-- 1 danz3 197609  18052 index-JaSjmbl1.css
-rw-r--r-- 1 danz3 197609  16013 index-hUPakRjE.js
-rw-r--r-- 1 danz3 197609  23664 inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r-- 1 danz3 197609  24272 inter-latin-500-normal-Cerq10X2.woff2

$ ls -l dist/assets/          # after
-rw-r--r-- 1 danz3 197609  53570 components-CSF4NymR.js
-rw-r--r-- 1 danz3 197609  21331 components-xZOInl1b.css
-rw-r--r-- 1 danz3 197609  18096 fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r-- 1 danz3 197609  18052 index-JaSjmbl1.css
-rw-r--r-- 1 danz3 197609   1187 index-QlWtpqji.js
-rw-r--r-- 1 danz3 197609  23664 inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r-- 1 danz3 197609  24272 inter-latin-500-normal-Cerq10X2.woff2
-rw-r--r-- 1 danz3 197609    589 rolldown-runtime-CbXtAM7H.js
-rw-r--r-- 1 danz3 197609  81597 shared-CpAifS0L.js
-rw-r--r-- 1 danz3 197609 216956 vendor-Z-IfkQ_V.js
```

352,621 B of JS became 353,899 B — the 1,278 B is the per-chunk boilerplate of splitting one chunk
into three. Both pages reference `vendor`, and the sheet's own code still reaches only
`components.html`:

```
$ grep -o 'assets/[^"]*' dist/index.html | sort -u
assets/fraunces-latin-600-normal-BFCDtZfi.woff2
assets/index-JaSjmbl1.css
assets/index-QlWtpqji.js
assets/inter-latin-400-normal-C38fXH4l.woff2
assets/inter-latin-500-normal-Cerq10X2.woff2
assets/rolldown-runtime-CbXtAM7H.js
assets/shared-CpAifS0L.js
assets/vendor-Z-IfkQ_V.js

$ grep -o 'assets/[^"]*' dist/components.html | sort -u
assets/components-CSF4NymR.js
assets/components-xZOInl1b.css
assets/rolldown-runtime-CbXtAM7H.js
assets/shared-CpAifS0L.js
assets/vendor-Z-IfkQ_V.js

$ for f in index-QlWtpqji shared-CpAifS0L vendor-Z-IfkQ_V rolldown-runtime-CbXtAM7H; do
>   printf "%-30s " "$f"
>   grep -c -e "Skip to the sheet" -e "Sheet sections" -e "component sheet" -e "RevealMode" "dist/assets/$f.js"
> done
index-QlWtpqji                 0
shared-CpAifS0L                0
vendor-Z-IfkQ_V                0
rolldown-runtime-CbXtAM7H      0

$ grep -c 'rel="preload" as="font"' dist/index.html
3
```

The landing stylesheet is byte-identical across the change (`index-JaSjmbl1.css`, 18,052 B, same
content hash), so `fontPreload()` still finds its three faces in `ctx.bundle` and the CSS split is
untouched.

### P1-2 · DOCUMENTED (no defect, no code) · `dist/assets/*.woff2`

Gzip is larger than raw for every `.woff2` because WOFF2 is a Brotli-compressed container (W3C
WOFF2 §1) — there is nothing left for gzip to find, and it adds its own framing. Vercel does not
gzip `font/woff2` responses, so no byte of this reaches a user. `01-baseline.md` §4 recorded it
only so its gzip column would not be misread. Nothing to fix and nothing to comment: the
observation lives in the baseline report, which is where it belongs.

```
$ ls -l dist/assets/*.woff2 | awk '{print $5, $9}'
18096 dist/assets/fraunces-latin-600-normal-BFCDtZfi.woff2
23664 dist/assets/inter-latin-400-normal-C38fXH4l.woff2
24272 dist/assets/inter-latin-500-normal-Cerq10X2.woff2
```

### P2-5 · FIXED · `src/main.tsx:17` · `src/sheet/main.tsx:14`

Both entries had the stock Vite template's `document.getElementById('root')!`. Both now bind the
node and check it, so an HTML edit that drops the div fails by name instead of inside
`hydrateRoot`:

```
$ sed -n '17,18p' src/main.tsx
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from index.html')

$ sed -n '14,15p' src/sheet/main.tsx
const mount = document.getElementById('root')
if (!mount) throw new Error('#root is missing from components.html')

$ grep -c "getElementById('root')!" src/main.tsx ; grep -c "getElementById('root')!" src/sheet/main.tsx
0
0
```

`02-code.md` §"non-null `!`" counted exactly one in `src/`; there are now none.

### P2-6 · DOCUMENTED (verified safe, comment only) · `src/components/HeroClouds.tsx:857`

`style={{ '--cloud-sets': SET_COUNT } as CSSProperties}` stays. React's `CSSProperties` has no
index signature for `--*` keys, so there is no non-assertion spelling; the alternative
(`CSSProperties & Record<'--cloud-sets', number>`) trades one assertion for one type alias and
hides nothing. The comment above the line now records why it is safe — react-dom routes custom
properties through `style.setProperty()` verbatim, so the value lands as `4`, not `4px`, and the
`calc()`s that read it stay valid.

```
$ sed -n '857p' src/components/HeroClouds.tsx
      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}

$ grep -c 'var(--cloud-sets)' dist/assets/index-JaSjmbl1.css
1
```

### P2-7 · DOCUMENTED (only legal shape, comment only) · `src/components/HeroClouds.tsx:782`

`opacity` and `y` are built above `CloudLayer`'s `reducedMotion` early return because the Rules of
Hooks require it, and the resting branch reads neither. The only way to stop building them is to
split `CloudLayer` in two so the moving branch is its own component — a second component and a
layer of indirection traded for one subscription that recomputes two numbers. Left as written, with
the reasoning now in the doc comment above the two `useTransform` calls rather than only in the
audit.

```
$ sed -n '780,785p' src/components/HeroClouds.tsx
   * `opacity` and `y` are built above the `reducedMotion` early return because
   * the Rules of Hooks require it, and the resting branch below reads neither
   * (P2-7). That is the only legal shape for one component: the alternative is
   * splitting `CloudLayer` in two so the moving branch is its own component,
   * which trades a live subscription for a second component and an extra layer
   * of indirection. Left as is deliberately.
```

### P3-7 · WONTFIX (sheet-only, exemption recorded in code) · `src/sheet/parts/TokensPart.tsx:119–131`

`bg-fern` paints the fern row's 56/64px swatch, which is a background and so is outside
README:201's "the marks and nothing else". Not changed. The rule exists because fern measures
3.27:1 on cloud and 2.75:1 on frost, so it must never carry text, a border, a link or a button —
none of which an `aria-hidden` square in an internal `noindex` catalogue is, and showing the token
is that square's entire job. `03-design-system.md`'s own Fix line for this finding is "none needed;
if the rule is ever machine-checked, exempt `src/sheet/parts/TokensPart.tsx` explicitly". Painting
fern through a brand-mark mask instead, as `Wordmark.tsx` does, was considered and rejected: it
needs a branch in the shared `Swatch` component plus a `BEARCAT_MARK` import, and it would leave
one row of a ten-row colour table not showing a colour. The exemption is now written at the element
itself so the next reader does not have to rediscover it.

```
$ grep -n 'bg-fern' src/sheet/parts/TokensPart.tsx src/components/Wordmark.tsx
src/sheet/parts/TokensPart.tsx:7: * Colours are drawn with the token utilities (`bg-sky`, `bg-fern`, ...), so a
src/sheet/parts/TokensPart.tsx:106:    swatch: 'bg-fern',
src/components/Wordmark.tsx:62:        className="brand-mark brand-mark-bearcat bg-fern block"
src/components/Wordmark.tsx:66:        className="brand-mark brand-mark-wordmark bg-fern block"
```

The landing-page half of the rule — fern on the two masked spans in `Wordmark.tsx` and nowhere
else — is unchanged and still holds.

### P3-8 · FIXED · `src/sheet/ComponentSheet.tsx:4,95,177`

The sheet's two hand-rolled cloud-link treatments now compose the exported constant. `:95` (the
sticky nav pill) and `:177` (the part-list row) both take `LINK_ON_CLOUD` from
`src/components/ExternalLink.tsx`; the part-list row's `group-hover:text-brick`, which had been
copied onto the title span, is gone — the span sets no colour of its own and inherits the
constant's `hover:text-brick`, while the two spans either side keep their explicit `text-pine/90`
and are unaffected. Verified live on the dev server with `CSS.forcePseudoState`:

```
===== /components.html — P3-8 cloud link treatment
  sticky nav pill
    className: text-pine hover:text-brick focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine text-caption block rounded-full px-3 py-2 whitespace-nowrap
    colour resting: rgb(60, 92, 72)
    colour :hover : rgb(162, 89, 58)
  part-list row
    className: text-pine hover:text-brick focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pine flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6
    colour resting: rgb(60, 92, 72)
    colour :hover : rgb(162, 89, 58)
```

`rgb(60, 92, 72)` is `pine` `#3C5C48`; `rgb(162, 89, 58)` is `brick` `#A2593A`. Both rows behave
exactly as they did. One deliberate change came with it and is noted in the code: the nav pill's
focus ring was hand-rolled at `outline-offset-2` and is now the page's own `outline-offset-4`,
which is what the constant carries and what every other link on both pages uses.

No file under `src/components/` was modified for this — only imported from:

```
$ git diff --stat -- src/components/ExternalLink.tsx
(no output)

$ grep -rn 'LINK_ON_CLOUD' src/sheet/ComponentSheet.tsx
4:import { LINK_ON_CLOUD, LINK_ON_FROST } from '../components/ExternalLink'
95:                    className={`${LINK_ON_CLOUD} text-caption block rounded-full px-3 py-2 whitespace-nowrap`}
170:               * is now `LINK_ON_CLOUD`'s own `hover:text-brick`, inherited by
177:                className={`${LINK_ON_CLOUD} flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6`}
```

### P4-7 · DOCUMENTED (no defect, comment only) · `src/components/Hero.tsx:211`

The hero region keeps `aria-label="Campus illustration"` and the `<img>` keeps its 34-word
`CAMPUS_ALT`. The overlap is real and is mild: a screen reader entering the region announces the
short label, then the long alt. Both are load-bearing and neither substitutes for the other — the
label is what a landmark list shows, where a 34-word alt would be unreadable, and the alt is what
the picture says, which a landmark list is not the place for. **1.1.1 (A)** is satisfied by the alt
and **1.3.1 (A)** by the region either way, and `04-accessibility.md` records no failure. The
comment above the attribute now says the redundancy was weighed and kept.

```
$ sed -n '205,211p' src/components/Hero.tsx
      // The hero carries no heading now, so it names itself. Short on purpose:
      // this is the landmark's label, and the full description of what is in
      // the picture is the <img>'s alt (CAMPUS_ALT), one level down. Kept as
      // is: the overlap with the alt is P4-7, which passes 1.1.1 and 1.3.1 on
      // both counts — the label is what a landmark list shows, the alt is what
      // the picture says, and dropping either loses one of the two.
      aria-label="Campus illustration"
```

### Phase-wide verification

```
$ npm run typecheck ; echo "EXIT=$?"
> tsc -b --noEmit
EXIT=0

$ npm run lint ; echo "EXIT=$?"
> oxlint --deny-warnings
EXIT=0

$ npm run build ; echo "EXIT=$?"
> npm run lint && tsc -b && vite build && node scripts/prerender.mjs
✓ 448 modules transformed.
dist/components.html                                    1.68 kB │ gzip:  0.79 kB
dist/index.html                                         5.57 kB │ gzip:  2.38 kB
dist/assets/index-JaSjmbl1.css                         18.05 kB │ gzip:  4.61 kB
dist/assets/components-xZOInl1b.css                    21.33 kB │ gzip:  5.25 kB
dist/assets/rolldown-runtime-CbXtAM7H.js                0.58 kB │ gzip:  0.36 kB
dist/assets/index-QlWtpqji.js                           1.18 kB │ gzip:  0.57 kB
dist/assets/components-CSF4NymR.js                     53.57 kB │ gzip: 16.45 kB
dist/assets/shared-CpAifS0L.js                         81.59 kB │ gzip: 28.71 kB
dist/assets/vendor-Z-IfkQ_V.js                        216.95 kB │ gzip: 70.06 kB
✓ built in 400ms
prerendered dist/index.html (42596 chars)
prerendered dist/components.html (109199 chars)
EXIT=0

$ ls dist/assets/ | grep -c 'vendor-.*\.js' ; ls dist/assets/ | grep -c 'SiteFooter'
1
0

$ node -e 'const h=require("fs").readFileSync("dist/index.html","utf8");console.log(h.includes("<div id=\"root\"></div>")?"EMPTY":"non-empty")'
non-empty

$ sed -n '74p' src/components/Hero.tsx
const PAN_START_SCALE = 3

$ grep -n "CAMPUS_OBJECT_POSITION = '\|origin-top \${CAMPUS" src/components/Hero.tsx
131:const CAMPUS_OBJECT_POSITION = 'object-[52%_0%]'
251:                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${

$ grep -rn "addEventListener('scroll'\|addEventListener(\"scroll\"\|onscroll" src/
src/components/Hero.tsx:138:  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything

$ grep -rn "Phase [0-9]" src index.html components.html README.md ASSETS.md scripts vercel.json ; echo "EXIT=$?"
EXIT=1

$ git status --porcelain public/
(no output)

$ git status --porcelain
 M src/components/Hero.tsx
 M src/components/HeroClouds.tsx
 M src/main.tsx
 M src/sheet/ComponentSheet.tsx
 M src/sheet/main.tsx
 M src/sheet/parts/TokensPart.tsx
 M vite.config.ts
```

The only `scroll` hit in `src/` is the sentence in the comment that says there is none. Seven files
touched, `public/` untouched, and the sheet-only findings (P3-7, P3-8) changed nothing under
`src/components/`.

---

## Reconciliation

Written at the end of Phase 8, after the live re-verification in `audit/08-fix-verification.md`.
One row per finding ID in `audit/AUDIT.md` §3 — **62 rows**, because five of its 57 rows carry two
IDs each (§4: P5-4+P7-1, P2-4+P7-2, P4-2+P3-1, P5-7+P2-8, P6-11+P2-9) and each ID gets its own row
here. Every status is taken from the fix-log entry above it, not re-derived; where an entry's status
is compound the primary is given and the remainder noted. The anchor column is the line in **this
file** at which the closure entry's `###` heading sits.

### Findings

| ID | Sev | Status | Closed by | Fix-log anchor |
|---|---|---|---|---|
| P1-5 | low | **FIXED** | Phase 1 | `08-fix-log.md:19` — `### P1-5 · FIXED · src/index.css:19` |
| P6-12 | low | **FIXED** | Phase 1 | `08-fix-log.md:51` — `### P6-12 · FIXED · .oxlintrc.json:3` |
| P6-13 | low | **FIXED** | Phase 1 | `08-fix-log.md:65` — `### P6-13 · FIXED · .oxlintrc.json:3` |
| P6-15 | low | **FIXED** | Phase 1 | `08-fix-log.md:105` — `### P6-15 · FIXED · package.json:11,13` |
| P2-3 | low | **FIXED** | Phase 1 | `08-fix-log.md:122` — `### P2-3 · FIXED · tsconfig.app.json:37` |
| P6-16 | note | **FIXED** *(one flag; the other **DOCUMENTED**, rationale at `tsconfig.app.json:19–36`)* | Phase 1 | `08-fix-log.md:137` — `### P6-16 · FIXED (one flag) + DOCUMENTED (the other)` |
| P6-17 | note | **FIXED** | Phase 1 | `08-fix-log.md:165` — `### P6-17 · FIXED · package.json:6–8` |
| P6-14 | note | **FIXED** | Phase 1 | `08-fix-log.md:179` — `### P6-14 · FIXED · .gitignore:9` |
| P2-4 | low | **FIXED** | Phase 2 | `08-fix-log.md:219` — `### P2-4 · FIXED · src/App.tsx:67` |
| P7-2 | note | **FIXED** | Phase 2 | `08-fix-log.md:219` — same entry, "and **P7-2** · FIXED · `src/components/Hero.tsx:204,202`" |
| P4-1 | low | **FIXED** | Phase 2 | `08-fix-log.md:261` — `### P4-1 · FIXED · src/components/ExternalLink.tsx:55,68–78,104–118` |
| P4-2 | low | **FIXED** | Phase 2 | `08-fix-log.md:299` — `### P4-2 · FIXED · src/components/controls.ts:39–41` |
| P3-1 | low | **FIXED** | Phase 2 | `08-fix-log.md:299` — same entry, "and **P3-1** · FIXED, same change" |
| P4-3 | low | **FIXED** | Phase 2 | `08-fix-log.md:355` — `### P4-3 · FIXED · sections/GetInvolvedSection.tsx:40` |
| P4-4 | low | **FIXED** | Phase 2 | `08-fix-log.md:371` — `### P4-4 · FIXED · HeroClouds.tsx:699–717, :767–772, :826` |
| P4-5 | note | **DOCUMENTED** (no code change needed) | Phase 2 | `08-fix-log.md:431` — `### P4-5 · DOCUMENTED · src/index.css:102 vs SiteHeader.tsx:49` |
| P4-8 | note | **DOCUMENTED** (no code change needed) | Phase 2 | `08-fix-log.md:459` — `### P4-8 · DOCUMENTED · src/index.css:170,174,178 measured live` |
| P5-4 | low | **FIXED** | Phase 3 | `08-fix-log.md:581` — `### P5-4 · FIXED · vercel.json:6–9, public/404.html (new), README.md:134–153` |
| P7-1 | note | **DOCUMENTED** (same change; the dev-vs-Vercel split recorded at `README.md:150–153`) | Phase 3 | `08-fix-log.md:581` — same entry |
| P2-2 | low | **FIXED** | Phase 3 | `08-fix-log.md:700` — `### P2-2 · FIXED · index.html:83–86` |
| P5-12 | note | **FIXED** | Phase 3 | `08-fix-log.md:723` — `### P5-12 · FIXED · vite.config.ts:6–45,183` |
| P3-6 | note | **FIXED** | Phase 3 | `08-fix-log.md:804` — `### P3-6 · FIXED · index.html:98, components.html:30` |
| P5-1 | **medium** | **FIXED** (prerender) | Phase 4 | `08-fix-log.md:1011` — `### P5-1 · FIXED · scripts/prerender.mjs (new), src/entry-server.tsx (new)` |
| P5-8 | note | **FIXED** (by P5-1) | Phase 4 | `08-fix-log.md:1098` — `### P5-8 · FIXED (by P5-1) · dist/index.html body` |
| P5-5 | low | **FIXED** | Phase 4 | `08-fix-log.md:1124` — `### P5-5 · FIXED · vite.config.ts:62-127, :143` |
| P5-13 | note | **FIXED** | Phase 4 | `08-fix-log.md:1225` — `### P5-13 · FIXED · src/index.css:31-90` |
| P5-6 | note | **FIXED** | Phase 4 | `08-fix-log.md:1285` — `### P5-6 · FIXED · same change as P5-13` |
| P5-2 | low | **FIXED** | Phase 4 | `08-fix-log.md:1305` — `### P5-2 · FIXED · src/App.tsx:1,39,107 and four more sites` |
| P5-3 | low | **FIXED** | Phase 4 | `08-fix-log.md:1356` — `### P5-3 · FIXED · vercel.json:10-32, README.md:111-115` |
| P6-1 | low | **FIXED** | Phase 5 | `08-fix-log.md:1544` — `### P6-1 · FIXED · ASSETS.md:29, :34` |
| P6-2 | low | **FIXED** | Phase 5 | `08-fix-log.md:1560` — `### P6-2 · FIXED · ASSETS.md:154` |
| P6-3 | note | **FIXED** | Phase 5 | `08-fix-log.md:1576` — `### P6-3 · FIXED · ASSETS.md:143–156` |
| P6-4 | low | **FIXED** | Phase 5 | `08-fix-log.md:1605` — `### P6-4 · FIXED · README.md:317` |
| P6-5 | note | **FIXED** | Phase 5 | `08-fix-log.md:1617` — `### P6-5 · FIXED · README.md:195` |
| P6-6 | note | **FIXED** | Phase 5 | `08-fix-log.md:1628` — `### P6-6 · FIXED · README.md:301–336` |
| P6-7 | note | **FIXED** | Phase 5 | `08-fix-log.md:1648` — `### P6-7 · FIXED · src/components/HeroClouds.tsx:145` |
| P6-8 | note | **FIXED** | Phase 5 | `08-fix-log.md:1678` — `### P6-8 · FIXED · 8 files, 15 sites` |
| P6-9 | note | **FIXED** | Phase 5 | `08-fix-log.md:1708` — `### P6-9 · FIXED · src/lib/motion.ts:44–49` |
| P6-10 | note | **FIXED** | Phase 5 | `08-fix-log.md:1729` — `### P6-10 · FIXED · ASSETS.md:78–84, generate-images.mjs:8–11` |
| P3-2 | low | **FIXED** | Phase 5 | `08-fix-log.md:1764` — `### P3-2 · FIXED · README.md:261` |
| P3-3 | low | **FIXED** | Phase 5 | `08-fix-log.md:1779` — `### P3-3 · FIXED · README.md:262, src/index.css:122–130` |
| P3-4 | note | **DOCUMENTED** (comment reworded) | Phase 5 | `08-fix-log.md:1796` — `### P3-4 · DOCUMENTED · src/App.tsx:70–77` |
| P3-5 | note | **FIXED** | Phase 5 | `08-fix-log.md:1821` — `### P3-5 · FIXED · README.md:274–276, :321` |
| P5-9 | note | **FIXED** | Phase 5 | `08-fix-log.md:1837` — `### P5-9 · FIXED · ASSETS.md:118` |
| P5-10 | note | **FIXED** | Phase 5 | `08-fix-log.md:1851` — `### P5-10 · FIXED · ASSETS.md:138` |
| P5-11 | note | **FIXED** | Phase 5 | `08-fix-log.md:1866` — `### P5-11 · FIXED · index.html:26–31` |
| P2-1 | low | **FIXED** | Phase 5 | `08-fix-log.md:1884` — `### P2-1 · FIXED · src/lib/links.ts:10,12,19,21,26,28` |
| P5-7 | note | **FIXED** | Phase 6 | `08-fix-log.md:2098` — `### P5-7 (with P2-8) · FIXED · Hero.tsx:180,252 · HeroClouds.tsx:820` |
| P2-8 | note | **FIXED** | Phase 6 | `08-fix-log.md:2005` — same entry |
| P1-1 | note | **FIXED** | Phase 6 | `08-fix-log.md:2174` — `### P1-1 · FIXED · vite.config.ts:167,191` |
| P1-2 | note | **DOCUMENTED** (no defect, no code) | Phase 6 | `08-fix-log.md:2254` — `### P1-2 · DOCUMENTED · dist/assets/*.woff2` |
| P2-5 | note | **FIXED** | Phase 6 | `08-fix-log.md:2269` — `### P2-5 · FIXED · src/main.tsx:17 · src/sheet/main.tsx:14` |
| P2-6 | note | **DOCUMENTED** (verified safe, comment only) | Phase 6 | `08-fix-log.md:2291` — `### P2-6 · DOCUMENTED · src/components/HeroClouds.tsx:857` |
| P2-7 | note | **DOCUMENTED** (only legal shape, comment only) | Phase 6 | `08-fix-log.md:2308` — `### P2-7 · DOCUMENTED · src/components/HeroClouds.tsx:782` |
| P3-7 | note | **WONTFIX** (sheet-only; exemption recorded in code) | Phase 6 | `08-fix-log.md:2327` — `### P3-7 · WONTFIX · src/sheet/parts/TokensPart.tsx:119–131` |
| P3-8 | note | **FIXED** | Phase 6 | `08-fix-log.md:2351` — `### P3-8 · FIXED · src/sheet/ComponentSheet.tsx:4,95,177` |
| P4-7 | note | **DOCUMENTED** (no defect, comment only) | Phase 6 | `08-fix-log.md:2390` — `### P4-7 · DOCUMENTED · src/components/Hero.tsx:211` |
| P1-3 | low | **RESOLVED** (by the project, before the plan) | pre-plan | no fix-log entry — `AUDIT.md` §3, resolved by commit `9a5a72d` |
| P1-4 | note | **RESOLVED** (by the project, before the plan) | pre-plan | no fix-log entry — `AUDIT.md` §3, resolved by commit `9a5a72d` |
| P2-9 | note | **WITHDRAWN** (on better evidence) | pre-plan | no fix-log entry — `AUDIT.md` §4 dedup note "P6-11 ← P2-9 (withdrawn)"; the real gap it pointed at is P6-15, FIXED in Phase 1 |
| P4-6 | note | **CLOSED** (verified, not an issue) | pre-plan | no fix-log entry — `AUDIT.md` §3 on `07-live.md` §10; re-measured unchanged in `08-fix-verification.md` §10 |
| P6-11 | note | **CORRECTION-NO-ACTION** | pre-plan | no fix-log entry — `AUDIT.md` §3 row marked "correction"; `react/exhaustive-deps` **is** on at `warn`, and Phase 1's P6-15 fix is what makes it bite |

### README invariants (`audit/AUDIT.md` §5), restated post-fix

| # | Invariant | Result | Post-fix evidence |
|---|---|---|---|
| a | No-buildings hero floor (`PAN_START_SCALE = 3` ≥ 2.86) | **PASS** | `src/components/Hero.tsx:74`; live `matrix(3, 0, 0, 3, 0, 0)` at 1280×800 **and** 375×812, on the dev server **and** on the built output (`08-fix-verification.md` §2, §13); band 0–0.3333 vs roofline 0.351 (`Hero.tsx:60–64`); `screenshots-after/hero-scroll0.png` shows no roof, wall or window |
| b | `object-position: 52% 0%` / `transform-origin: top` | **PASS** | `Hero.tsx:131`, `:251`; live `52% 0%` and `632.5px 0px` (187.5px at 375 px), matrix `e = f = 0` — zero translate (§2) |
| c | Brick is the only accent | **PASS** | two utility occurrences in the landing source, both interactive: `src/components/ButtonLink.tsx:30` (`bg-brick text-cloud hover:bg-pine`) and `src/components/ExternalLink.tsx:33` (`hover:text-brick`) |
| d | Fern is logo-only | **PASS** (landing) | `src/components/Wordmark.tsx:62,66` (`bg-fern`) and nowhere else under `src/` outside `src/sheet/`; the sheet swatch is P3-7, WONTFIX with the exemption written into `src/sheet/parts/TokensPart.tsx:119–131` |
| e | Haze is never applied to text | **PASS** (vacuously) | zero `*-haze` utilities in the landing source; the single repo-wide hit is `bg-haze` on the sheet's token swatch (`src/sheet/parts/TokensPart.tsx:96`), which is the token being displayed, not text |
| f | Horizon unused, intentionally | **PASS** | declared at `src/index.css:115`, zero `*-horizon` utilities in the landing source (only the sheet swatch, `TokensPart.tsx:49`); P3-3 rewrote `README.md:262` and `src/index.css:122–130` so the docs now name both unused tokens |
| g | No off-palette colours | **PASS** | `grep -rnE '#[0-9a-fA-F]{6}' src/` outside `src/sheet/` returns two hits, both inside the doc comment at `src/components/ExternalLink.tsx:12,14`; P3-4's stray hex in `App.tsx` is gone, reworded at `src/App.tsx:70–77` |
| h | Link hover only in `LINK_ON_CLOUD` / `LINK_ON_FROST` | **PASS** — the P3-1 caveat is closed | every text link still composes one of the two (`ExternalLink.tsx:33`, `:36`); the menu toggle is a `<button>`, outside the link rule, and now has its own documented named constant `TOGGLE_ON_CLOUD` (`src/components/controls.ts:39`) applied at all three former inline sites |
| i | No scroll event listeners | **PASS** | `grep -rn "addEventListener('scroll'" src/` → **1 hit**, and it is the comment at `src/components/Hero.tsx:138` asserting there are none. Both switches the plan added (`drifting` in `HeroClouds`, `panning` in `Hero`) use `useMotionValueEvent` on the existing `useScroll` value |
| j | Sheet excluded from the landing bundle | **PASS** | `dist/index.html` loads `index-*.js`, `shared-*.js`, `vendor-*.js`, `rolldown-runtime-*.js`; the sheet-only literals `"component sheet"` and `"Skip to the sheet"` return **0 hits** across all four and **1 hit** each in `components-*.js` |
| j′ | Sheet utilities kept out of the landing *stylesheet* (README:80–81) | **PASS** *(was PARTIAL FAIL)* | `grep -c 'grid-cols-5' dist/assets/index-*.css` → **0** (sheet CSS: **1**); `grep -c 'transition' dist/assets/index-*.css` → **0**. P1-5 scoped Tailwind to `src/` with `@import 'tailwindcss' source('.')` (`src/index.css:19`) and blocklisted the phantom `transition` candidate (`src/index.css:28`) |
| k | Srcset triple agreement | **PASS** | `src/lib/images.ts:25` and `scripts/generate-images.mjs:91` both `[640, 960, 1280, 1672]`; `index.html`'s `imagesrcset` carries the same four rungs; the built HTML's only artwork `sizes` is `(min-aspect-ratio: 1672/941) 100vw, 177.68vh`, byte-identical between the preload and the `<picture>` |
| l | Every image URL resolves; shipped assets match `ASSETS.md` | **PASS** | bijection scan of `dist/`: **56** image/font files, **56** referenced, **56** distinct referenced URLs, **0 missing, 0 unreferenced**; the two wrong doc cells are fixed — P5-9 at `ASSETS.md:118`, P5-10 at `ASSETS.md:138` |
| m | Contrast: every text pair ≥ 4.5:1 | **PASS** | `08-fix-verification.md` §14 — all 41 rows recomputed from the live `@theme` hexes; **20 text pairs, 0 below 4.5:1**, worst 4.62:1 (pine/90 on frost); **0 non-text pairs below their 3:1 threshold**, and the two that used to be invisible (the toggle border and its hover fill, P4-2/P3-1) now read **6.83:1** |
| n | Typecheck / lint / build clean | **PASS** | `npm run typecheck` exit 0; `npm run lint` exit 0 and now `oxlint --deny-warnings` (P6-15) with `unicorn` and `jsx-a11y` restored (P6-12, P6-13); `npm run build` exit 0 — lint, `tsc -b`, `vite build` (448 modules, 350 ms), `node scripts/prerender.mjs` |
| o | Zero console and network errors live | **PASS** | `08-fix-verification.md` §1 — 0 errors / 0 warnings / 0 failed-or-≥400 on five dev-server routes after a 3 s settle; §13 — the same on the **built** `/`, `/components.html` and `/404.html`, each a first load in a brand-new profile sampled 3.5 s after `Page.loadEventFired` |
| p | No horizontal overflow | **PASS** | §9 — `scrollWidth === clientWidth` at 1280×800 (1265 = 1265) and 375×812 (375 = 375), dev and built; still equal with the 1.4.12 text-spacing override applied (§12 N6/N7) |
| q | All 27 hrefs match `links.ts` | **PASS** | §6 — 27/27 MATCH, 0 MISMATCH. The `target` rule changed by design (P4-1): the **16** same-site `hackbu.org` anchors now carry no `target`/`rel`; the **9** genuinely off-site anchors keep `target="_blank"` + `rel="noopener noreferrer"` and each carries an `sr-only` "(opens in a new tab)"; both `mailto:` anchors and both in-page anchors carry neither |
| r | Reduced motion handled per component | **PASS** | §5 — campus `transform: none` and `will-change: auto`, track 2080 → 800 px, **zero** `[data-cloud-drift]` nodes rendered, cloud transforms byte-identical across 3.2 s, page-wide `will-change: transform` count **0**. Both new switches short-circuit before the reduced-motion branch, so it is untouched |

**All 19 invariants PASS**, including `j′`, which was the one PARTIAL FAIL in `AUDIT.md` §5.

### Counts

**By status** — 62 total:

| Status | Count | IDs |
|---|---|---|
| FIXED | **48** | P1-1, P1-5, P2-1, P2-2, P2-3, P2-4, P2-5, P2-8, P3-1, P3-2, P3-3, P3-5, P3-6, P3-8, P4-1, P4-2, P4-3, P4-4, P5-1, P5-2, P5-3, P5-4, P5-5, P5-6, P5-7, P5-8, P5-9, P5-10, P5-11, P5-12, P5-13, P6-1, P6-2, P6-3, P6-4, P6-5, P6-6, P6-7, P6-8, P6-9, P6-10, P6-12, P6-13, P6-14, P6-15, P6-16, P6-17, P7-2 |
| DOCUMENTED | **8** | P1-2, P2-6, P2-7, P3-4, P4-5, P4-7, P4-8, P7-1 |
| WONTFIX | **1** | P3-7 |
| RESOLVED (pre-plan) | **2** | P1-3, P1-4 |
| WITHDRAWN (pre-plan) | **1** | P2-9 |
| CLOSED (pre-plan) | **1** | P4-6 |
| CORRECTION-NO-ACTION (pre-plan) | **1** | P6-11 |
| **Total** | **62** | |

48 + 8 + 1 + 2 + 1 + 1 + 1 = **62**, and the seven ID lists together name each of the 62 IDs
exactly once. **P6-16 is counted once, under FIXED** — its compound entry fixed one strictness flag
and documented the decision on the other, so its `DOCUMENTED` half is noted in its row above rather
than counted as a second closure.

**By phase that closed it** — 62 total:

| Phase | Count | IDs |
|---|---|---|
| Phase 1 — tooling and build hygiene | **8** | P1-5, P6-12, P6-13, P6-15, P2-3, P6-16, P6-17, P6-14 |
| Phase 2 — accessibility and interaction | **9** | P2-4, P7-2, P4-1, P4-2, P3-1, P4-3, P4-4, P4-5, P4-8 |
| Phase 3 — routing and metadata | **5** | P5-4, P7-1, P2-2, P5-12, P3-6 |
| Phase 4 — delivery and performance | **7** | P5-1, P5-8, P5-5, P5-13, P5-6, P5-2, P5-3 |
| Phase 5 — documentation accuracy | **18** | P6-1, P6-2, P6-3, P6-4, P6-5, P6-6, P6-7, P6-8, P6-9, P6-10, P3-2, P3-3, P3-4, P3-5, P5-9, P5-10, P5-11, P2-1 |
| Phase 6 — optional code polish | **10** | P5-7, P2-8, P1-1, P1-2, P2-5, P2-6, P2-7, P3-7, P3-8, P4-7 |
| pre-plan (closed before this plan began) | **5** | P1-3, P1-4, P2-9, P4-6, P6-11 |
| **Total** | **62** | |

**By severity**, cross-checked against `AUDIT.md` §3's "1 medium · 23 low · 38 note = 62 findings in
57 rows":

| Severity | Count | Notes |
|---|---|---|
| medium | **1** | P5-1 — FIXED (Phase 4) |
| low | **23** | the 22 `low` rows in §3 plus P3-1, which §3 carries merged into the P4-2 row — **22 FIXED**, 1 RESOLVED pre-plan (P1-3) |
| note | **38** | the 34 `note` rows in §3 plus P7-1, P7-2, P2-8, P2-9 — **25 FIXED** (P6-16 among them), 8 DOCUMENTED, 1 WONTFIX, 1 RESOLVED (P1-4), 1 WITHDRAWN (P2-9), 1 CLOSED (P4-6), 1 CORRECTION-NO-ACTION (P6-11) |
| **Total** | **62** | |

**Nothing is left open.** The only work `AUDIT.md` §7 named that this plan did not do is work no
phase could do from here: Vercel-side observation of routing and cache headers, paint/LCP timings,
Safari's skip-link behaviour, and the smaller unmeasured items listed at `08-fix-verification.md`
§16. The one §7 item that *was* still doable — the compositor Layers reading P5-7 asked for — was
taken in Phase 6 above, at `08-fix-log.md:2039–2096`.

## Final audit — renumbering and observations

The cross-phase final audit (after Phase 7) found, over two cycles, that seventeen `file:line`
citations in the
closure-entry **headings** above had drifted: each was correct when written, and a later phase
then edited the same file above the cited line (Phase 4's `@font-face` block moved everything in
`src/index.css` by +62/+64; Phase 4's `LazyMotion` import moved `App.tsx` by +13; Phase 6's
`panning`/`will-change` comments moved `Hero.tsx` and `HeroClouds.tsx`; Phase 6's
`manualChunks` moved `vite.config.ts`'s `plugins:` line to 183; Phase 5's comment edits moved
`index.html`'s meta tags by +2; Phase 6's P3-8 moved `ComponentSheet.tsx`'s toggle to 109). The
headings for P2-4/P7-2, P4-2, P4-4, P4-5, P4-8, P2-2, P5-12, P3-6, P5-1, P5-5 and (found by the
second cycle) P5-2 now cite the lines as they stand at the final commit, and the abbreviated
headings quoted in the `## Reconciliation` table's anchor column — a second copy of the same cites
that the first renumbering pass missed — were renumbered to match; the bodies of those entries
still quote the transcripts captured at the time, and the reconciliation anchors
(`08-fix-log.md:<n>`) were unaffected. The second cycle also found the P5-7 rationale for the
drift tracks' retained `will-change` contradicted by P4-4 (see the corrected paragraph in that
entry and the matching comment at `src/components/HeroClouds.tsx`).

Also taken from the same audit: `src/components/controls.ts:11` said "all four class strings
identical" for three call sites whose *treatment fragment* was identical (their sizing
utilities differed) — reworded; `README.md`'s routing caveat named only the dev server, but
`vite preview` applies the same `index.html` fallback for unknown paths — widened.

Observations recorded, no action: (1) Phase 4 met "shared chunk −40 KB vs 328,964 B" at
283,048 B; after Phase 6's `vendor`/`shared` split the shared bytes are 299,142 B (−29,822) while
total landing JS is 344,119 → 300,329 B (−43,790), so the bar holds on the total-JS reading only.
(2) P5-5's transcript still names the pre-Phase-6 chunks (`index-HiSFlvET.js`,
`SiteFooter-VOpZu2sT.js`); it is a chronological record and Phase 6's entry supersedes it.
(3) The three `[data-cloud-drift]` tracks keep `will-change: transform` while frozen past the
hero (count 3 from progress 0.5 onward); inside Phase 6's 7 / <7 / 0 bar, and the LayerTree
numbers show the campus `<img>` and the three layer wrappers do release. (4) Still unmeasured,
as the plan anticipated: Vercel-side routing/headers (P7-1), FCP/LCP timings, Safari skip-link
behaviour.
