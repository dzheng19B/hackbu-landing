# HackBU landing page — consolidated audit

Synthesis of `audit/01-baseline.md` … `07-live.md`. Every finding below is carried from a phase
report; nothing new was raised here. Class names are written as token prose rather than as literal
utility strings wherever that costs nothing, for the reason P1-5 gives.

## 1. Executive summary

No blockers and no high findings. **1 medium, 23 low, 38 note — 62 in total**; two were resolved by
the project mid-audit (P1-3, P1-4), one withdrawn on better evidence (P2-9), one closed as
verified-not-an-issue (P4-6). Worth fixing first: **P5-1** (fully client-rendered: first paint and
LCP wait on ~110 KB gzip of JS and the LCP image is absent from the HTML — prerender, or accept and
document it); **P5-4** (unknown URLs return a soft-200 home page while `/components*` typos 404,
and the README documents neither); **P6-15 + P6-13** (no lint diagnostic can fail a build, and
`jsx-a11y` is off on a page whose main risk surface is accessibility); **P1-5** (Tailwind scans
`audit/*.md` into the shipped CSS, partly defeating the landing/sheet split). Verified solid: every
README invariant holds (§5), typecheck/lint/build are clean, the live page has zero console errors
and zero failed requests on five routes, every text pair clears 4.5:1, all 27 hrefs match `links.ts`.

---|---|---|---|---|---|
| P5-1 | medium | Landing page is fully client-rendered; FCP and LCP wait on ~110 KB gzip of JS, and the LCP `<img>` is not in the HTML | `dist/index.html:75–77` (source `index.html:77`) | 5 | open |
| P5-4 | low | Catch-all rewrite: unknown URLs return a soft 200 home page, but `/components*` typos 404 — and `README.md:90` documents neither | `vercel.json:9` | 5 | open · **also: P7-1** |
| P2-4 | low | Skip-link target `<main id="main">` is not focusable, so activating it moves the viewport but not focus | `src/App.tsx:37` | 2 | confirmed live (07 §7) · **also: P7-2** |
| P4-2 | low | Menu toggle's border and hover fill are both frost-on-cloud (1.19:1) — invisible; the same inline treatment is copy-pasted in three files | `src/components/SiteHeader.tsx:77` | 4 | open · **also: P3-1** |
| P4-4 | low | Cloud drift repeats forever with no in-page pause/stop/hide control (2.2.2, Level A) | `src/components/HeroClouds.tsx:698` | 4 | open |
| P6-15 | low | No lint diagnostic can fail a build: `lint` never denies warnings and `build` never lints | `package.json:10` | 6 | open |
| P6-13 | low | `jsx-a11y` plugin is available and switched off | `.oxlintrc.json:3` | 6 | open |
| P1-5 | low | Tailwind scans `audit/*.md` (and any non-ignored file) into the shipped CSS; +299 B and three phantom rules | `src/index.css:1` | 1 | open |
| P5-5 | low | No `preload` for the woff2 faces; fonts start only after two stylesheets parse and React mounts | `src/main.tsx:15` | 5 | open |
| P5-2 | low | motion's drag / pan / layout-projection features are bundled though the page uses none (~50 KB of the shared chunk) | `src/components/Hero.tsx:2` | 5 | open |
| P5-3 | low | No `headers` block in `vercel.json`: 495 KB of un-hashed image assets get an unstated platform default | `vercel.json:6` | 5 | open |
| P4-1 | low | Every off-site link opens in a new tab with no notice, including the club's own eight pages | `src/components/ExternalLink.tsx:52` | 4 | open |
| P4-3 | low | Frost border painted on a frost fill — 1.00:1, a border that cannot render | `src/components/sections/GetInvolvedSection.tsx:34` | 4 | open |
| P6-12 | low | Naming `plugins` in `.oxlintrc.json` silently drops the default-on `unicorn` plugin (13 rules) | `.oxlintrc.json:3` | 6 | open |
| P2-2 | low | Open Graph image metadata ships without `og:title`, `og:type` or `og:url` | `index.html:66` | 2 | open |
| P2-3 | low | `strict` is never declared; strictness is inherited from a TS-version default | `tsconfig.app.json:19–23` | 2 | stands — Ph 6 verified it resolves **true** under tsc 6.0.3 |
| P2-1 | low | `links.ts` re-types three URLs it already exports as constants | `src/lib/links.ts:18` | 2 | open (no runtime symptom, 07 §6) |
| P3-2 | low | README's `pine` role omits its two interactive uses (button hover fill, focus rings) | `README.md:191` | 3 | open |
| P3-3 | low | `haze` is now entirely unused, but only `horizon` is flagged as unused | `README.md:192` | 3 | open |
| P6-1 | low | `ASSETS.md`'s file-count sentences predate the derivatives; the file contradicts itself 50 lines later | `ASSETS.md:29` | 6 | open |
| P6-2 | low | `ASSETS.md:149`'s "88% of the artwork bytes" was not updated at 6→12 clouds; it is 78% | `ASSETS.md:149` | 6 | open |
| P6-4 | low | `README.md:235` puts the header's menu breakpoint at 390px; it is 768px (`md`) | `README.md:235` | 6 | open |
| P1-3 | low | Redundant duplicate `.vercel` ignore rule | `.gitignore:6` | 1 | **RESOLVED** by `9a5a72d` |
| P5-7 | note | `will-change: transform` on seven elements, never released; four stop changing partway through the hero | `src/components/HeroClouds.tsx:749` | 5 | open — 7 confirmed live, 0 under reduced motion; compositor cost unmeasured · **also: P2-8** |
| P6-11 | note | Correction: `react/exhaustive-deps` **is** enabled at `warn` via the react plugin's defaults | `.oxlintrc.json:3` | 6 | correction · **also: P2-9 (WITHDRAWN — "no exhaustive-deps rule" is wrong; the real gap is enforcement, see the lint-never-fails row above)** |
| P5-8 | note | The twelve cloud AVIFs (173 KB) are above the fold but undiscoverable until the bundle renders | `src/components/HeroClouds.tsx:615` | 5 | consequence of the client-rendering row above |
| P5-13 | note | Two render-blocking stylesheets on the landing page, one of them 655 B of `@font-face` | `dist/index.html:72–73` | 5 | open |
| P5-6 | note | Three `.woff` fallbacks (84,492 B) ship in `dist/` and can never be fetched | `dist/assets/SiteFooter-DgSLZxXM.css` | 5 | deploy weight only |
| P1-1 | note | The shared vendor chunk is named `SiteFooter-*.js` (React + motion + shared components, 329 KB) | `vite.config.ts:24` | 1 | naming only |
| P1-2 | note | Gzip size exceeds raw size for the six font files | `dist/assets/*.woff2` (01 §4) | 1 | informational, not a defect |
| P2-5 | note | Non-null assertion on the React root element | `src/main.tsx:28` | 2 | inventory item |
| P2-6 | note | `as CSSProperties` assertion to pass a CSS custom property | `src/components/HeroClouds.tsx:780` | 2 | verified safe |
| P2-7 | note | `CloudLayer` builds two scroll-linked motion values the reduced-motion branch never reads | `src/components/HeroClouds.tsx:720` | 2 | only legal shape for one component |
| P3-4 | note | A raw hex lives in a source comment outside `@theme` | `src/App.tsx:44` | 3 | paints nothing |
| P3-5 | note | README:205's "the only two link treatments" is contradicted by two links that use neither | `README.md:205` | 3 | wording; source comment scopes it correctly |
| P3-6 | note | No `theme-color` meta on either entry point | `index.html:1–80` (absent) | 3 | optional |
| P3-7 | note | Fern paints a swatch background in the component sheet | `src/sheet/parts/TokensPart.tsx:106` | 3 | sheet-only |
| P3-8 | note | The sheet hand-rolls the cloud link treatment instead of importing it | `src/sheet/ComponentSheet.tsx:81` | 3 | sheet-only |
| P4-5 | note | 2.4.11 Focus Not Obscured vs the fixed opaque header | `src/components/SiteHeader.tsx:47` | 4 | **partly open** — Ph 7 saw nothing obscured across 25 tab stops, but did not test a half-hidden link |
| P4-7 | note | The hero region's label restates what the illustration's alt already says | `src/components/Hero.tsx:172` | 4 | mild redundancy |
| P4-8 | note | Display line-heights sit below 1.5; 1.4.12 wants a live text-spacing override | `src/index.css:88` | 4 | **open** — not measured in Ph 7 |
| P5-9 | note | `ASSETS.md` records `icon_discord.png` as having no alpha; the file is RGBA | `ASSETS.md:116` | 5 | doc fix (Ph 6 row 86 FALSE) |
| P5-10 | note | `ASSETS.md`'s mask-rung KB figures use KB=1000 while the rest of the file uses 1024 | `ASSETS.md:136` | 5 | doc fix (Ph 6 row 88 FALSE) |
| P5-11 | note | "byte-identical" in the preload comment is true of the built HTML, not of the source | `index.html:28` | 5 | doc fix (Ph 6 row 99 FALSE) |
| P5-12 | note | `og:image` hardcodes the Vercel preview domain | `index.html:67` | 5 | doc/build fix (Ph 6 row 101) |
| P6-3 | note | `ASSETS.md`'s "Notes for later phases" block is advice that has since been taken | `ASSETS.md:141–151` | 6 | stale |
| P6-5 | note | README:125's scale floor is a rounding error and disagrees with the code comment it documents (2.86 vs 2.85) | `README.md:125` | 6 | conservative, harmless |
| P6-6 | note | The README's Layout tree omits `src/main.tsx`, `src/landing.css` and all of `src/sheet/` | `README.md:222–247` | 6 | stale |
| P6-7 | note | The cloud cast comment lists the `near` layer in an order the array does not use | `src/components/HeroClouds.tsx:143` | 6 | cosmetic |
| P6-8 | note | "Phase N" labels across 8 files reference a plan that exists only in the git log; one is future-tense for shipped work | `src/lib/motion.ts:15` | 6 | open |
| P6-9 | note | `motion.ts:38`'s "does not re-subscribe" describes the wrong half of the mechanism | `src/lib/motion.ts:38` | 6 | effect correct, mechanism wrong |
| P6-10 | note | "a deploy is just `vite build`" is stated in three places; the build also type-checks | `README.md:71` | 6 | open |
| P6-14 | note | `.gitignore`'s `.env*` would also ignore a committed `.env.example` | `.gitignore:7` | 6 | latent |
| P6-16 | note | Two strictness flags beyond `strict` are off: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` | `tsconfig.app.json:19–23` (absent) | 6 | policy choice; see the undeclared-`strict` row above |
| P6-17 | note | No `engines` field and no documented Node version for a Vite 8 / TS 6 toolchain | `package.json:21–32` (absent) | 6 | open |
| P1-4 | note | `moreclouds.zip` and 13 cloud PNGs were untracked with no matching ignore rule | `.gitignore:12` | 1 | **RESOLVED** by `9a5a72d` |
| P4-6 | note | Three targets pass 2.5.8 only through the spacing/inline exception, on derived numbers | `src/components/SiteFooter.tsx:64` | 4 | **CLOSED** — Ph 7 measured 17 px links at 36 px pitch, 21 px mail link with 92 px clearance; exception holds |

**Counts:** 1 medium · 23 low · 38 note = 62 findings in 57 rows (five merged, §4). Of those,
2 RESOLVED, 1 WITHDRAWN, 1 CLOSED, 58 open. By owning phase: 1 → 5 · 2 → 9 · 3 → 8 · 4 → 8 ·
5 → 13 · 6 → 17 · 7 → 2. The two heaviest phases are documentation accuracy (Phase 6, of which
12 are new doc defects and none is above `low`) and delivery (Phase 5, which owns the only medium).

## 4. Deduplication notes

- **P5-4 ← P7-1.** One root cause: `vercel.json:9`'s `(?!components)` catch-all. Phase 5 derived
  the Vercel behaviour statically; Phase 7 observed that the Vite dev server has no such exclusion
  and serves the landing page for *every* unknown path. Phase 6's claims-table row 18 marks
  `README.md:90` FALSE for the same reason. One fix (decide the routing policy, then correct
  README:90) closes all three.
- **P2-4 ← P7-2.** Same defect shape — an in-page anchor whose target carries no `tabIndex={-1}`.
  P2-4 is `#main` (confirmed live: `activeElement` falls back to `body`); P7-2 is `#top` on the
  logo link. Whoever adds the tab index should decide both at once.
- **P4-2 ← P3-1.** Same element, `SiteHeader.tsx:77`. Phase 3 saw an undocumented third hover
  treatment written inline and copy-pasted into three files; Phase 4 measured it and found both
  the border and the hover fill at 1.19:1, i.e. invisible. Extracting one named constant with a
  visible colour fixes both.
- **P5-7 ← P2-8.** The same `will-change` observation, seven elements. P5-7 is the fuller write-up
  (per-element justification, layer extent); Phase 7 confirmed the count of 7 at scroll 0 and at
  `p = 0.8`, and 0 under reduced motion.
- **P6-11 ← P2-9 (withdrawn).** P2-9 concluded from `.oxlintrc.json` alone that no exhaustive-deps
  rule exists. `npx oxlint --print-config` shows `react/exhaustive-deps: "warn"` arriving with the
  react plugin's `correctness` defaults. P2-9's hand-check of the two hooks stands; its conclusion
  does not. The real gap is enforcement — P6-15.

## 5. Verified correct

Each README invariant, with the phase that settled it.

| # | Invariant | Result | Evidence |
|---|---|---|---|
| a | No-buildings hero floor (`PAN_START_SCALE = 3` ≥ 2.86) | **PASS** | Ph 2 §1 (`src/components/Hero.tsx:74`); Ph 7 §2 measured `matrix(3,0,0,3,0,0)` at scroll 0 at both 1280×800 and 375×812, band 0–0.3333 vs roofline 0.351 |
| b | `object-position: 52% 0%` / `transform-origin: top` | **PASS** | Ph 2 §1 (`Hero.tsx:131`, `:209`); Ph 7 §2 read `52% 0%` and `632.5px 0px`, zero translate |
| c | Brick is the only accent | **PASS** | Ph 3 §2 Rule 1 — brick occurs twice, both interactive (`ButtonLink.tsx:30`, `ExternalLink.tsx:33`) |
| d | Fern is logo-only | **PASS** (landing) | Ph 3 §2 Rule 2 — only `Wordmark.tsx:52,56`; sheet swatch is P3-7 |
| e | Haze is never applied to text | **PASS** (vacuously) | Ph 3 §2 Rule 3 — zero haze occurrences anywhere in the landing page |
| f | Horizon unused, intentionally | **PASS** | Ph 3 §1.2 (`src/index.css:35` declared, never referenced) |
| g | No off-palette colours | **PASS** | Ph 3 §2 Rule 4 — commands C3–C13 all clean; the only stray hex is a comment (P3-4) |
| h | Link hover only in `LINK_ON_CLOUD` / `LINK_ON_FROST` | **PASS**, with the P3-1 caveat | Ph 3 §2 Rule 5 — every text link composes one of the two; the menu toggle is a `<button>`, outside the rule but undocumented |
| i | No scroll event listeners | **PASS** | Ph 2 §2 — 5 grep hits, none a scroll listener (3 comments, 1 `useScroll`, 1 `keydown` with cleanup) |
| j | Sheet excluded from the landing bundle | **PASS** | Ph 1 §6 — three sheet-only string literals: 0 hits in both chunks reachable from `index.html`, 1 hit in the sheet chunk |
| k | Srcset triple agreement | **PASS** | Ph 5 §1.2 — `images.ts:25` vs `generate-images.mjs:90` vs `index.html:44` all `[640,960,1280,1672]`; byte-identical in the built HTML; `sizes` byte-identical everywhere |
| l | Every image URL resolves; ASSETS.md inventory matches | **PASS** | Ph 5 §2–§3 — 53 referenced URLs, 53 files, a bijection; all dimensions and byte counts match; `clouds-all-b.png` correctly absent from `public/` |
| m | Contrast: every text pair ≥ 4.5:1 | **PASS** | Ph 4 §7.3 — 41 pairs recomputed from the WCAG formula, worst text pair 4.62:1 (pine/90 on frost, 0.12 of headroom) |
| n | Typecheck / lint / build clean | **PASS** | Ph 1 §1–§3 — all three exit 0, no warnings; 450 modules, 403 ms |
| o | Zero console and network errors live | **PASS** | Ph 7 §1 — 0 errors, 0 warnings, 0 failed or ≥400 requests on five routes after a 3 s settle |
| p | No horizontal overflow | **PASS** | Ph 7 §9 — `scrollWidth === clientWidth` at 1280×800 and 375×812 |
| q | All 27 hrefs match `links.ts` | **PASS** | Ph 7 §6 — 27/27 MATCH; 25/25 off-site anchors carry `target="_blank"` **and** `rel="noopener noreferrer"`; both `mailto:` anchors carry neither |
| r | Reduced motion handled per component | **PASS** | Ph 4 §6 (all five animated components); Ph 7 §5 — transform `none`, track 2080→800 px, no drift element rendered at all, `will-change` count 0 |

Also worth recording as clean: Phase 2 read **all 24 files in scope** (the 22 under `src/` outside
`src/sheet/`, plus `index.html` and `vite.config.ts`) and found no `any`, no `@ts-ignore`, no dead
exports among 46, no duplicate DOM ids, no raw off-site anchors, no hooks-order hazards, and one
effect with matching cleanup. Phase 6 checked **148 documentation claims: 131 TRUE, 9 FALSE, 8
STALE** — every FALSE and STALE row is owned by a finding above. Phase 7 additionally confirmed the
cloud drift runs at exactly the documented 188 / 129 / 90 s periods, with no visible seam, and that
the mobile disclosure returns focus to its toggle on Escape from both the toggle and a panel link.

## 6. Suggested next plan

Six chunks, ordered by the severity they close. Two sequencing notes: chunk 2's Tailwind scoping
changes the CSS byte baseline, so land it before measuring anything in chunk 1; and the
`will-change` change in chunk 6 must wait on the Layers reading in §7, because the compositor may
already be clipping those layers and the cost may be nil.

**1 — Delivery and perf.** Closes **P5-1**, **P5-5**, **P5-3**, **P5-8**, **P5-13**, **P5-2**,
**P5-6**. Files: `vite.config.ts`, `src/main.tsx`, `src/index.css`, `vercel.json`, the four motion
import sites. Start with the P5-1 decision — prerender both entries with `renderToString` (the app
has no runtime data above the fold) or record the decision to stay client-rendered; P5-8 falls out
either way. Then the cheap wins: a build-time font preload, an explicit `headers` block, folding
the 655 B stylesheet in, and `LazyMotion` with `domAnimation`. *Acceptance:* `dist/index.html`
contains the hero `<picture>` (or a written decision not to), a woff2 preload tag exists, and the
shared chunk drops by roughly 50 KB raw.

**2 — Tooling and build hygiene.** Closes **P1-5**, **P6-12**, **P6-13**, **P6-15**, **P2-3**,
**P6-16**, **P6-17**, **P6-14**. Files: `src/index.css`, `.oxlintrc.json`, `package.json`,
`tsconfig.app.json`, `tsconfig.node.json`, `.gitignore`. Scope Tailwind's import source; add
`unicorn` and `jsx-a11y` to `plugins`; make `lint` deny warnings and wire it into `build` or CI;
declare `strict` explicitly and record the decision on the two extra flags; add `engines`.
*Acceptance:* rebuilding with a new file in `audit/` leaves `dist/assets/index-*.css` byte-identical;
`npm run lint` exits non-zero on a deliberately introduced warning.

**3 — Accessibility and interaction.** Closes **P2-4** (+**P7-2**), **P4-1**, **P4-2**/**P3-1**,
**P4-3**, **P4-4**, **P4-5**, **P4-8**. Files: `src/App.tsx`, `src/components/SiteHeader.tsx`,
`src/components/ExternalLink.tsx`, `src/components/sections/GetInvolvedSection.tsx`,
`src/components/HeroClouds.tsx`. Add `tabIndex={-1}` to `<main>` (and decide `#top`); extract one
visible, named toggle treatment; give same-site links an in-place mode or a visually-hidden new-tab
notice; drop or restate the zero-contrast border; stop the drift once the layers reach opacity 0.
*Acceptance:* activating the skip link leaves `document.activeElement` on `<main>`; the toggle's
border measures ≥ 3:1; a text-spacing override at 1.5× / 0.12em / 0.16em / 2× breaks no heading.

**4 — Routing and metadata.** Closes **P5-4** (+**P7-1**, `README.md:90`), **P2-2**, **P5-12**,
**P3-6**. Files: `vercel.json`, `index.html`, `README.md`. Decide whether unknown paths should 404
honestly (drop rule 3, optionally add `public/404.html`) or keep the fallback and correct README:90;
add `og:title` / `og:type` / `og:url`; template the `og:image` origin from a Vercel build variable
or document it as a domain-move task; optionally add a theme colour. *Acceptance:* a deployed
`/nonexistent` and `/componentsfoo` behave the same way as each other and as the README says.

**5 — Documentation accuracy.** Closes **P6-1**, **P6-2**, **P6-3**, **P6-4**, **P6-5**, **P6-6**,
**P6-7**, **P6-8**, **P6-9**, **P6-10**, **P3-2**, **P3-3**, **P3-5**, **P5-9**, **P5-10**,
**P5-11**, **P2-1**, **P3-4**. Files: `README.md` (most of them), `ASSETS.md`, and the header
comments in `src/lib/motion.ts`, `src/components/HeroClouds.tsx`, `index.html`, plus
`src/lib/links.ts` for the constant hoist. Sweep `ASSETS.md` in one pass — three of its defects all
date from the 6→12 cloud change. *Acceptance:* re-running Phase 6's claims table yields 0 FALSE and
0 STALE rows.

**6 — Optional code polish.** Closes **P2-5**, **P2-6**, **P2-7**, **P2-8**/**P5-7**, **P1-1**,
**P1-2**, **P3-7**, **P3-8**, **P4-7**. Files: `src/main.tsx`, `src/components/HeroClouds.tsx`,
`src/components/Hero.tsx`, `vite.config.ts`, `src/sheet/*`. None of these changes behaviour a user
can see. Do the `will-change` release only after the Layers reading below; several of the rest are
better closed by a one-line comment than by a code change. *Acceptance:* build output unchanged
except for the intended chunk rename.

## 7. Open items / not measured

- **Vercel-side behaviour.** Everything in P5-4 and P5-3 is derived from `vercel.json` and the
  platform docs, never observed. Phase 7 could only drive the Vite dev server, which has no
  `/components*` exclusion (P7-1). The default `Cache-Control` on static output, the exact
  `path-to-regexp` options Vercel compiles `source` with, and the production domain all remain
  unverified.
- **Compositor cost of `will-change` (P5-7).** Headless Edge ran with `--disable-gpu`, so layer
  count and layer memory were deliberately not fabricated. Needs a headed DevTools Layers capture
  at 1440×900 and 390×844 plus a Performance trace across the pan.
- **FCP / LCP numbers.** No paint or timing metric was captured in any phase, and no Lighthouse run
  was made. P5-1 rests on the structural argument (empty `#root`, LCP element created by React),
  which is sound, but the size of the win is unquantified.
- **2.4.11 (P4-5) and 1.4.12 (P4-8).** Phase 7 saw no focused element obscured across 25 tab stops,
  but never engineered a link sitting half under the fixed header; the text-spacing override was
  never applied at all.
- **Safari skip-link behaviour (P2-4).** The live confirmation was Chromium-family only. Safari
  historically does not move the sequential focus navigation starting point for a non-focusable
  target unless Full Keyboard Access is on, which is the case where the skip link silently does
  nothing.
- **Cloud seam.** Phase 7 confirmed no seam in two sampled frames with a tile boundary on screen in
  both — strong, but not a frame-by-frame sweep of a full 188 s cycle at more than one viewport.
- **Mobile footer pitch.** The 36 px vertical pitch that carries P4-6's spacing exception was
  measured at 1280×800 and inferred at 375×812 from identical classes, not measured there.
- Smaller gaps Phase 7 named: Shift-Tab traversal, the tab order at 375 px, `prefers-contrast` and
  forced-colors modes, whether the eight hackbu.org URLs are still live, and four source comments
  that need a network or a pixel measurement to settle (`index.html:8`, `Hero.tsx:63–64`,
  `HeroClouds.tsx:206–207`, `src/index.css:137–145`). `HeroClouds.tsx:176–199`'s alpha-weighted
  cloud-coverage percentages were also never re-derived by any phase.
