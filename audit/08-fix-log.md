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

### P2-4 · FIXED · `src/App.tsx:54` (reasoning at `:37–53`) — and **P7-2** · FIXED · `src/components/Hero.tsx:176,184`

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

### P4-2 · FIXED · `src/components/controls.ts:39–41`, applied at `src/components/SiteHeader.tsx:78`, `src/sheet/ComponentSheet.tsx:96`, `src/sheet/parts/PrimitivesPart.tsx:510` — and **P3-1** · FIXED, same change

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

### P4-4 · FIXED · `src/components/HeroClouds.tsx:699–718` (`driftLoop`), `:761–765` (the switch), `:809`

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

### P4-5 · DOCUMENTED (no code change needed) · `src/index.css:40` vs `src/components/SiteHeader.tsx:48`

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

### P4-8 · DOCUMENTED (no code change needed) · `src/index.css:106,110,114` measured live

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
