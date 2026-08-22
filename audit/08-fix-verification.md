# Phase 8 — post-fix live verification

Re-run of every live check in `audit/07-live.md` (§1–§11) against the fixed tree on branch
`audit-fixes` at `dfd4626`, plus the new checks the fix plan asks for, plus a first-ever pass over
the **built** output. Nothing outside `audit/` was created or modified: this phase writes only
`audit/08-fix-verification.md`, the `## Reconciliation` section of `audit/08-fix-log.md`, and the
PNGs under `audit/screenshots-after/`. No source or config file was touched, and no fix was made —
where a check would have failed, the failure would be recorded here rather than repaired. **None
did.**

**Environment**

| | |
|---|---|
| Browser | `Edg/151.0.4129.101`, UA `HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0` |
| | (Phase 7 ran `Edg/151.0.4129.93`; a patch bump, same major/minor.) |
| Mode | `--headless=new`, `--disable-gpu`, profile in the scratchpad dir |
| CDP | `127.0.0.1:9348` for the dev server; `9351` / `9352` / `9353` for the built output, one **fresh `--user-data-dir` per page** |
| Driver | Node v24.18.0, built-in `WebSocket` + `fetch`, no npm installs |
| Dev server | Vite dev, `http://localhost:5173`, started with the `hackbu-dev` launch configuration |
| Preview server | `npm run preview -- --port 4173 --strictPort` over `dist/`, `http://localhost:4173` |
| Presets | desktop `1280×800` `mobile:false`; mobile `375×812` `mobile:true`, both `deviceScaleFactor: 1` |
| Scripts | `cdp-audit.mjs` (unmodified, from `07-live.md`), `cdp-ax.mjs` (unmodified), and three new scratchpad probes — see **Commands run** |

**Same headless caveat as Phase 7.** `requestAnimationFrame` was not throttled — the three cloud
layers again agree on the elapsed wall clock to within 0.001 s across a 6.4 s sample (§4), so the
time-linked results are trustworthy. Compositor layer count and layer memory are **not** measured
here; that reading was taken in Phase 6 of the fix plan with GPU enabled and `LayerTree` on, and is
recorded in `audit/08-fix-log.md` under P5-7 rather than repeated.

**Deliberate differences from `07-live.md`, expected and confirmed.** Three, and only three:

1. **§6** — the 16 same-site `hackbu.org` anchors no longer carry `target`/`rel`; the 9 genuinely
   off-site anchors keep `target="_blank"` + `rel="noopener noreferrer"` and now carry an `sr-only`
   "(opens in a new tab)" notice, which changes their accessible names and their `innerText`. (P4-1)
2. **§7** — the skip link now moves focus: `document.activeElement.id === 'main'` after Enter,
   where Phase 7 read `body`. The header logo link does the same for `#top`. (P2-4, P7-2)
3. **§11** — `will-change: transform` is now released: 7 at scroll 0, 4 mid-pan, 3 past the pan,
   0 under reduced motion, where Phase 7 read 7 / 7 / 0. (P5-7, P2-8)

Everything else in §1–§11 reproduces Phase 7's readings, in several places to the digit.

---

## 1. Route loads — console messages and network requests (dev server)

Same method as Phase 7: navigate fresh, wait for `Page.loadEventFired`, then a **3 s settle**
before reading `Runtime.exceptionThrown`, `Runtime.consoleAPICalled`, `Log.entryAdded`,
`Network.loadingFailed`, and every `Network.responseReceived` with `status >= 400`.

| Route | Document status | `<title>` | First `<h1>` | Console errors | Console warnings | Failed / ≥400 |
|---|---|---|---|---|---|---|
| `/` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |
| `/components` | **200** | `HackBU component sheet` | "The HackBU component sheet." | **0 errors** | **0 warnings** | **0** |
| `/components.html` | **200** | `HackBU component sheet` | "The HackBU component sheet." | **0 errors** | **0 warnings** | **0** |
| `/nonexistent` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |
| `/componentsfoo` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |

**PASS — identical to Phase 7.** Zero errors, zero warnings, zero failed or ≥400 requests on all
five routes. The three additional stylesheets, the `@font-face` fold-in (P5-13/P5-6), the
`LazyMotion` conversion (P5-2) and the new `sr-only` spans (P4-1) introduce nothing to the console.

`document.documentElement.scrollHeight` is **7236** on the landing page and **28261** on the sheet
— the same figures Phase 7 recorded, so none of the fixes moved the page's height.

The visible body text now opens `"Skip to content Schedule Resources Hackathons Discord (opens in a
new tab) BINGHAMTON UNIVERSITY …"`. The parenthetical is the P4-1 `sr-only` notice; it is in the
accessibility tree and in `innerText`, and is not painted.

### 1a. Unknown-path behaviour on the dev server — the documented P7-1 divergence

Unchanged, and expected to be. `/nonexistent` and `/componentsfoo` both return **200** and render
the **landing page** — same title, same `h1`, `scrollHeight` 7236, `[data-hero]` present.

```
/ -> 200  <title>HackBU</title>
/components -> 200  <title>HackBU component sheet</title>
/components.html -> 200  <title>HackBU component sheet</title>
/nonexistent -> 200  <title>HackBU</title>
/componentsfoo -> 200  <title>HackBU</title>
```

`vite preview` over `dist/` behaves the same way: `/nonexistent` → title `HackBU`, `h1` "Learn to
build apps with other students.", `[data-hero]` present.

This is the divergence **P7-1** records and Phase 3 of the fix plan closed as **DOCUMENTED**: the
routing decision was *honest 404* on Vercel (`vercel.json` now carries only the two `/components`
rewrites plus `headers`, and `public/404.html` ships), while Vite's dev server and preview server
both apply their own `index.html` fallback with no `/components*` exclusion. The README records the
split at `README.md:150–153`. **Not a regression, and not a new finding.**

The 404 page itself is real and reachable in the built output — see §13.

---

## 2. Hero at scroll 0 (1280×800) — scale vs `PAN_START_SCALE`

Read from `document.querySelector('[data-hero-artwork] img')` at `window.scrollY === 0`, after two
`requestAnimationFrame`s plus 400 ms.

```
transform:        matrix(3, 0, 0, 3, 0, 0)
object-position:  52% 0%
transform-origin: 632.5px 0px
will-change:      transform
boundingClientRect: { x: -1265, y: 0, w: 3795, h: 2400, bottom: 2400 }
currentSrc: Campus-1672.avif   naturalWidth: 1421  naturalHeight: 799
track offsetHeight: 2080        scrollY: 0        innerWidth: 1280  innerHeight: 800
```

**Scale from the matrix = `3`.** `PAN_START_SCALE = 3` (`src/components/Hero.tsx:74`).
**MATCH — byte-identical to `07-live.md` §2, every field.** The pan rewrite in P5-7 added a
`panning` flag that gates the `will-change` hint only; it did not touch the transform.

At 375×812: `matrix(3, 0, 0, 3, 0, 0)`, rect `{ x: -375, y: 0, w: 1125, h: 2436 }`,
`transform-origin: 187.5px 0px`, `currentSrc: Campus-1672.avif`, `naturalWidth: 1442`, track
height **2111**. Phase 7 recorded the same transform and rect. **MATCH.**

The no-buildings floor is unaffected: the content box is still height-bound (1265×800 → aspect
1.581 < 1.777), the visible band is still `0 .. 1/3 = 0.3333` of the image height, and the first
rooftops are still at row 330/941 = **0.351** (`src/components/Hero.tsx:60–64`). `hero-scroll0.png`
under `audit/screenshots-after/` shows sky, cloud bank, ridgeline and treeline — **no roof, wall or
window anywhere in the frame**.

`sizes` still resolves as designed: density-corrected `naturalWidth` **1421** at 1280×800 against
`177.68vh × 800 = 1421.4`, and **1442** at 375×812 against `177.68vh × 812 = 1442.8`. AVIF is
selected at both; the WebP and PNG rungs are not fetched.

---

## 3. Hero mid-pan and revealed

| Target `p` | `scrollY` | Actual `p` | Computed transform | Scale | Expected | |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | `matrix(3, 0, 0, 3, 0, 0)` | **3** | 3 | **MATCH** |
| 0.37 | 474 | 0.370313 | `matrix(1.66528, 0, 0, 1.66528, 0, 0)` | **1.66528** | **1.66528** | **MATCH** |
| 0.80 | 1024 | 0.8 | `none` | **1** | 1 | **MATCH** |

Identical to `07-live.md` §3 to five decimals, including the 0.0011 gap against the nominal
`p = 0.37` that is scroll rounding (`0.37 × 1280 = 473.6 → 474`). Rect at `p = 0.37` is
`{ x: -420.8, y: 0, w: 2106.6, h: 1332.2 }`; at `p = 0.8` it is exactly the stage box
`{ x: 0, y: 0, w: 1265, h: 800 }`. `motion` still drops the transform to `none` rather than
emitting `matrix(1,0,0,1,0,0)`.

Screenshots `hero-midpan.png` (rooftops entering) and `hero-revealed.png` (full campus, clouds
gone) reproduce Phase 7's frames.

---

## 4. Clouds — drift is running, and at the documented rate

Both samples at `scrollY = 0`, 1280×800, `Page.bringToFront` first, `transform` read from the three
`[data-cloud-drift]` tracks.

| Layer | `t0` translateX | `t0 + ~6.4 s` translateX | Δ px | Documented period | Implied elapsed |
|---|---|---|---|---|---|
| far | −1271.43 | −1314.27 | **42.84** | 188 s | 6.3668 s |
| mid | −1274.37 | −1336.80 | **62.43** | 129 s | 6.3667 s |
| near | −1278.44 | −1367.91 | **89.47** | 90 s | 6.3665 s |

**Drift is running** — all three transforms changed (`[true, true, true]`). The implied-elapsed
column is `Δ ÷ (W / period)` with `W = 1265 px`; three different periods again produce one
consistent elapsed time, to within 0.0003 s. Measured near:far speed ratio **89.47 / 42.84 =
2.088** against the documented 2.09×. The absolute phase differs from Phase 7 (the loop is at a
different point in its cycle on a different run), which is expected and carries no information.

The scroll-linked wrappers are at `transform: none` with `opacity` 0.5 / 0.75 / 1 (far / mid /
near) at both samples — correct for `p = 0`.

**Seam:** `clouds-t0.png` and `clouds-t1.png` again show one continuous bank across the full
1280 px with no discontinuity, no abrupt vertical edge and no repeated column, with a tile boundary
on screen in both frames (tracks at −1271 and −1314 against a 1265 px tile). Same limit as Phase 7:
a two-frame inspection at one viewport, not a sweep of a full 188 s cycle.

**New in this tree:** the drift now *stops* once the reader is past the hero. See §12 N3.

---

## 5. Reduced motion (`prefers-reduced-motion: reduce`)

`Emulation.setEmulatedMedia`, then a full reload. `matchMedia('(prefers-reduced-motion: reduce)')
.matches` → **`true`**.

| Property | Measured | Expected | |
|---|---|---|---|
| campus `<img>` `transform` | **`none`** | scale pinned to 1 | **MATCH** |
| campus `<img>` rect | `{ x: 0, y: 0, w: 1265, h: 800 }` | exactly the stage box | **MATCH** |
| campus `<img>` `will-change` | **`auto`** | released | **MATCH** |
| `<section data-hero>` height | **800 px** | `h-dvh` ≈ `innerHeight` | **MATCH** |
| cloud layer transforms | `none` ×3, opacity 0.5 / 0.75 / 1 | static resting composition | **MATCH** |
| cloud transforms after 3.2 s | **byte-identical** to `t0` | no time-linked movement | **MATCH** |
| `[data-cloud-drift]` nodes | **0** | `RestingCloudSet` renders none | **MATCH** |
| elements with `will-change: transform` | **0** | none | **MATCH** |
| `object-position` / `transform-origin` | `52% 0%` / `632.5px 0px` | unchanged | **MATCH** |

Identical to `07-live.md` §5 in every row. `hero-reduced-motion.png` is byte-for-byte the same size
as Phase 7's (1,649,919 B), which is as strong a statement as this phase can make that the
reduced-motion frame did not change.

---

## 6. Every rendered link vs `src/lib/links.ts`

All 29 `<a>` elements in the rendered document (27 constant-derived + `#top` + `#main`), read with
`getAttribute` (not the resolved `.href` property), at 1280×800.

### Header — `<header>`, 9 anchors

| # | Text | `href` | `target` | `rel` | Visible | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | *(logo lockup)* | `#top` | *none* | *none* | yes | n/a — in-page anchor | n/a |
| 2 | Schedule | `https://hackbu.org/schedule` | **none (was `_blank`)** | **none** | yes | `NAV_LINKS[0].href` | **MATCH** |
| 3 | Resources | `https://hackbu.org/resources` | **none** | **none** | yes | `NAV_LINKS[1].href` | **MATCH** |
| 4 | Hackathons | `https://hackbu.org/hackathons` | **none** | **none** | yes | `NAV_LINKS[2].href` | **MATCH** |
| 5 | Discord *(CTA)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | yes | `DISCORD_URL` | **MATCH** |
| 6 | Schedule *(compact panel)* | `https://hackbu.org/schedule` | **none** | **none** | no (`md:hidden`) | `NAV_LINKS[0].href` | **MATCH** |
| 7 | Resources *(compact panel)* | `https://hackbu.org/resources` | **none** | **none** | no | `NAV_LINKS[1].href` | **MATCH** |
| 8 | Hackathons *(compact panel)* | `https://hackbu.org/hackathons` | **none** | **none** | no | `NAV_LINKS[2].href` | **MATCH** |
| 9 | Join the Discord *(panel CTA)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | no | `DISCORD_URL` | **MATCH** |

### Footer — `<footer>`, 14 anchors

| # | Column | Text | `href` | `target` | `rel` | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Club | Schedule | `https://hackbu.org/schedule` | **none** | **none** | `SITE_PAGES[0]` | **MATCH** |
| 2 | Club | Resources | `https://hackbu.org/resources` | **none** | **none** | `SITE_PAGES[1]` | **MATCH** |
| 3 | Club | Hackathons | `https://hackbu.org/hackathons` | **none** | **none** | `SITE_PAGES[2]` | **MATCH** |
| 4 | Club | Registration | `https://hackbu.org/registration` | **none** | **none** | `SITE_PAGES[3]` | **MATCH** |
| 5 | More | Blog | `https://hackbu.org/blog` | **none** | **none** | `SITE_PAGES[4]` | **MATCH** |
| 6 | More | Photos | `https://hackbu.org/photos` | **none** | **none** | `SITE_PAGES[5]` | **MATCH** |
| 7 | More | Organizers | `https://hackbu.org/organizers` | **none** | **none** | `SITE_PAGES[6]` | **MATCH** |
| 8 | More | Sponsors | `https://hackbu.org/sponsors` | **none** | **none** | `SITE_PAGES[7]` | **MATCH** |
| 9 | Follow | Discord | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[0]` | **MATCH** |
| 10 | Follow | GitHub | `https://github.com/HackBinghamton/HackBU` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[1]` | **MATCH** |
| 11 | Follow | LinkedIn | `https://www.linkedin.com/groups/8427110` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[2]` | **MATCH** |
| 12 | Follow | Facebook | `https://www.facebook.com/HackBinghamton` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[3]` | **MATCH** |
| 13 | Follow | Twitter | `https://twitter.com/HackBinghamton` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[4]` | **MATCH** |
| 14 | — | hello@hackbu.org | `mailto:hello@hackbu.org` | *none* | *none* | `` `mailto:${CONTACT_EMAIL}` `` | **MATCH** |

### `<main>` CTAs and body links — 5 anchors

| # | Text | `href` | `target` | `rel` | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|
| 1 | Join the Discord *(IntroSection)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `DISCORD_URL` | **MATCH** |
| 2 | Join the Discord *(GetInvolvedSection)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `DISCORD_URL` | **MATCH** |
| 3 | Sign up for the mailing list | `https://hackbu.org/mailing-list` | **none** | **none** | `MAILING_LIST_URL` | **MATCH** |
| 4 | hello@hackbu.org *(ContactSection)* | `mailto:hello@hackbu.org` | *none* | *none* | `` `mailto:${CONTACT_EMAIL}` `` | **MATCH** |
| 5 | Workshop resources | `https://hackbu.org/resources` | **none** | **none** | `RESOURCES_URL` | **MATCH** |

### Summary — 27/27, and the `target` rule reconciled

**27 of 27 constant-derived hrefs MATCH `src/lib/links.ts`. 0 MISMATCH.** No URL changed; P2-1's
constant hoist inside `links.ts` is source-level only and, as Phase 7 predicted, has no runtime
symptom.

The Phase-2 rule of the fix plan — *same-site none; external `_blank` + `noopener noreferrer`;
`mailto:` none* — holds exactly:

| Class | Count | `target` | `rel` | sr-only "(opens in a new tab)" |
|---|---|---|---|---|
| Same-site `hackbu.org` | **16** | *none* | *none* | **no** |
| Genuinely off-site (discord.gg, github.com, linkedin.com, facebook.com, twitter.com) | **9** | `_blank` | `noopener noreferrer` | **yes, all 9** |
| `mailto:` | **2** | *none* | *none* | no |
| In-page (`#top`, `#main`) | **2** | *none* | *none* | no |
| **Total anchors** | **29** | | | |

16 + 9 + 2 = **27 constant-derived**. Phase 7 recorded 25 off-site anchors with `_blank`; 16 of
those were the club's own `hackbu.org` pages and now open in place. **No anchor carries `target`
without `rel`, and no anchor carries `rel` without `target`.**

### Accessible names (CDP `Accessibility.getPartialAXTree`, 1280×800)

| Selector | Computed role | Computed name |
|---|---|---|
| `header a[href="#top"]` | `link` | **"HackBU"** |
| `header nav a[href*="schedule"]` | `link` | "Schedule" |
| `header nav a[href*="discord"]` | `link` | **"Discord (opens in a new tab)"** |
| `a[href="#main"]` | `link` | "Skip to content" |
| `footer a[href^="mailto:"]` | `link` | "hello@hackbu.org" |
| `[data-hero-artwork] img` | `image` | the full 199-character `CAMPUS_ALT` |
| `[data-hero]` | `region` | "Campus illustration" |

Only the Discord row changed, and it changed as designed: the `sr-only` notice is appended to the
accessible name rather than replacing it, so screen-reader users hear the destination *and* the
new-tab warning. The same-site "Schedule" is untouched, which is the point of P4-1 — the notice is
attached to the behaviour, not to every link. `header button[aria-controls="primary-menu"]` is
again `role=none, ignored=true` at 1280 px, where it is `md:hidden`; it is exercised at 375 px (§8).

---

## 7. Keyboard

`Emulation.setFocusEmulationEnabled` + `Page.bringToFront`, real `Input.dispatchKeyEvent`
`keyDown`/`keyUp` with `key: 'Tab'`, `code: 'Tab'`, `windowsVirtualKeyCode: 9`.

### Tab order — 25 stops, then out of the document

| Tab | Element | Region | Rect (x, y, w×h) |
|---|---|---|---|
| 1 | `a` "Skip to content" → `#main` | — | 16, 16, 145.7×40 |
| 2 | `a` logo lockup → `#top` | header | 153, 21, 199.6×37.5 |
| 3 | `a` Schedule | header | 678, 26, 75.1×28 |
| 4 | `a` Resources | header | 785, 26, 84.5×28 |
| 5 | `a` Hackathons | header | 901, 26, 95.6×28 |
| 6 | `a` **Discord (header CTA)** | header | 1029, 22, 83.5×37 |
| 7 | `a` Join the Discord | main | 153, 411, 223.3×63.8 |
| 8 | `a` Join the Discord | main | 824, 412, 239.3×71.8 |
| 9 | `a` Sign up for the mailing list | main | 748, 565, 171.1×17 |
| 10 | `a` hello@hackbu.org | main | 153, 432, 208.3×30 |
| 11 | `a` Workshop resources | main | 653, 433, 235.8×30 |
| 12–15 | `a` Schedule, Resources, Hackathons, Registration | footer | 401, 446 / 482 / 518 / 554, ~62–79×17 |
| 16–19 | `a` Blog, Photos, Organizers, Sponsors | footer | 649, 446 / 482 / 518 / 554, ~30–72×17 |
| 20–24 | `a` Discord, GitHub, LinkedIn, Facebook, Twitter | footer | 897, 446 / 482 / 518 / 554 / 590, ~46–65×17 |
| 25 | `a` hello@hackbu.org | footer | 153, 699, 119.9×21 |
| 26 | `body` — focus has left the document | — | — |

**PASS — 25 stops, DOM order, no traps, no dead stops**, exactly as Phase 7. Two rects moved by
1 px (Tab 7 y 410→411, Tab 9 y 564→565), which is sub-pixel layout rounding downstream of the
`sr-only` spans, not a layout change. `<main tabIndex={-1}>` does **not** appear in the tab order —
a negative tabindex is programmatically focusable only, which is the intended shape.

### Skip link (P2-4) — now moves focus

| Step | Phase 7 | **Phase 8** |
|---|---|---|
| Tab 1 | `a[href="#main"]` "Skip to content" | same |
| Rect while focused | 145.7 × 40 at (16, 16) | **same** |
| Rect while unfocused | 1 × 1 (`sr-only`) | **same** |
| Outline while focused | `solid 2px rgb(60, 92, 72)` | **same** |
| Enter → `location.hash` | `"#main"` | `"#main"` |
| Enter → `scrollY` | 0 | 0 |
| **`document.activeElement` after Enter** | **`body`** | **`<main id="main">`** |
| `#main` `tabIndex` / attribute | −1 / **absent** | **−1 / present** |
| Next Tab after activation | restarted from the top | **`a` "Join the Discord" (the first control inside `<main>`)** |

```
after Enter, active = {"tag":"main","id":"main","href":null,"text":"BINGHAMTON UNIVERSITY Learn to build app","tabIndex":-1,"hasTabindexAttr":true}
ASSERT activeElement.id === "main" : true
next Tab after skip lands on:
  {"tag":"a","href":"https://discord.gg/Xka5uUh","text":"Join the Discord (opens in a new tab)","tabIndex":0}
```

**P2-4 verified fixed live.** The behavioural proof is the last row: the next Tab continues from
inside `<main>` rather than restarting at the header, which is the whole point of a skip link and
the thing Phase 7 measured as broken. `src/App.tsx:67` carries `tabIndex={-1}` and
`className="focus:outline-none"`, so the landing target takes focus without painting a ring around
the entire page body.

### Focus ring on the header CTA

Focused at Tab 6 via real key events:

```
matchesFocusVisible: true
outline-style:  solid
outline-color:  rgb(60, 92, 72)      /* pine */
outline-width:  2px
outline-offset: 2px
box-shadow:     none
```

**MATCH — identical to Phase 7.** Screenshot `focus-header-cta.png`.

### 2.4.11 Focus Not Obscured

- Header height, live: **81 px** at 1280×800, **65 px** at 375×812.
- `getComputedStyle(document.documentElement).scrollPaddingTop`: **96 px** (`6rem`,
  `src/index.css:102`) at both viewports.
- 96 > 81 (15 px margin) and 96 > 65 (31 px margin).

Across all 25 tab stops the smallest `rect.y` outside the header was **411** (Tab 7). Nothing was
obscured. Same limit as Phase 7: this is what happened on this page's layout, not a proof over all
viewports. **P4-5 was closed as DOCUMENTED** on exactly this reasoning
(`audit/08-fix-log.md:431`).

---

## 8. Mobile menu (375×812, `mobile: true`)

| Step | `aria-expanded` | `#primary-menu.hidden` | `document.activeElement` |
|---|---|---|---|
| Initial | `"false"` | `true` | — |
| After click | **`"true"`** | **`false`** | — |
| After Escape (focus on toggle) | **`"false"`** | **`true`** | `button` "Open menu" (the toggle) |
| After Escape (focus on a panel link) | **`"false"`** | **`true`** | **the toggle**, 42×42 at (317, 11) |

**PASS — identical to Phase 7 in every cell.** The panel exposes exactly the four expected hrefs
when open (the three `NAV_LINKS` plus `DISCORD_URL`); the toggle's rect is **42 × 42**; the
`sr-only` label flips "Open menu" ↔ "Close menu"; Escape returns focus to the toggle from both the
toggle and a link inside the panel about to be hidden. Screenshot `mobile-menu-open.png`.

The toggle's *appearance* is the one thing that changed — see §12 N8.

---

## 9. Horizontal overflow

| Preset | `documentElement.scrollWidth` | `documentElement.clientWidth` | `window.innerWidth` | `body.scrollWidth` | Overflow |
|---|---|---|---|---|---|
| Desktop 1280×800 | **1265** | **1265** | 1280 | 1265 | **none** — `scrollWidth === clientWidth` |
| Mobile 375×812 | **375** | **375** | 375 | 375 | **none** — `scrollWidth === clientWidth` |

**PASS at both, on the dev server and on the built output** (§13). Identical to Phase 7. The 15 px
gap to `innerWidth` at desktop is headless Edge's classic scrollbar.

Full-page captures: `desktop-full.png` (1280×7236) and `mobile-full.png` (375×8339) — the same
dimensions Phase 7 produced, so the fixes changed neither page's height. Same `captureBeyondViewport`
caveat as Phase 7: the sticky hero stage paints once at the top.

---

## 10. Target sizes (P4-6)

| Target | Desktop 1280×800 | Mobile 375×812 | ≥ 24×24? |
|---|---|---|---|
| Footer column links (13) | 29.5–78.7 **× 17** | 29.5–78.7 **× 17** | no — 17 px tall, spacing exception |
| Footer mail link | **119.9 × 21** | **327 × 21** | no — 21 px tall, spacing exception |
| Header nav links | 75.1 / 84.5 / 95.6 **× 28** | *(hidden)* | **yes** |
| Header Discord CTA | **83.5 × 37** | *(hidden)* | **yes** |
| Header logo link | **199.6 × 37.5** | 159.7 × 30 | **yes** |
| Header menu toggle | *(hidden)* | **42 × 42** | **yes** |
| Skip link (focused) | **145.7 × 40** | not measured | **yes** |
| Intro CTA | **223.3 × 63.8** | not measured | **yes** |
| Get-involved CTA | **239.3 × 71.8** | not measured | **yes** |
| Mailing-list link | **171.1 × 17** | not measured | no — inline exception |
| Contact mail / resources links | **208.3 × 30** / **235.8 × 30** | not measured | **yes** |
| Mobile panel link | — | **327 × 52** | **yes** |

**PASS — every measurement reproduces Phase 7 exactly.** Footer column pitch is still 36 px
(y = 446, 482, 518, 554), so the spacing exception that closed **P4-6** still holds. The `sr-only`
notice added by P4-1 is `1 × 1` and absolutely positioned, so it changed no target's rect — the
identical numbers are the proof.

---

## 11. `will-change: transform` (P5-7 / P2-8) — now released

`document.querySelectorAll('*')` filtered on `getComputedStyle(el).willChange.includes('transform')`:

| State | Phase 7 | **Phase 8** | Elements now |
|---|---|---|---|
| Scroll 0 | 7 | **7** | campus `<img>`, 3 × `[data-cloud-layer]`, 3 × `[data-cloud-drift]` |
| Mid-pan (`p = 0.37`) | *not measured* | **4** | campus `<img>`, 3 × `[data-cloud-drift]` |
| After the pan (`p = 0.8`) | 7 | **3** | 3 × `[data-cloud-drift]` only |
| Past the hero track | *not measured* | **3** | 3 × `[data-cloud-drift]` only |
| Reduced motion | 0 | **0** | — |

```
scroll 0 : {"count":7,"sample":["img","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]"]}
p = 0.37 : {"count":4,"sample":["img","div[data-cloudDrift]","div[data-cloudDrift]","div[data-cloudDrift]"]}
p = 0.8  : {"count":3,"sample":["div[data-cloudDrift]","div[data-cloudDrift]","div[data-cloudDrift]"]}
```

`document.querySelectorAll('[style*="will-change"], .will-change-transform').length` returns the
same number at each state (7 / 3), so every hint still comes from the Tailwind class, not an inline
style.

**The part that made P5-7 a finding is gone.** P5-7's title named "seven elements, never released;
**four** stop changing partway through the hero" — those four are the campus `<img>` and the three
`[data-cloud-layer]` wrappers, and all four now release: the wrappers at their own `fadeEnd` (all
≤ 0.30, hence already released by `p = 0.37`), the `<img>` at `PAN_SCROLL_FRACTION = 0.75`.
Scrolling back to 0 restores all seven — this is page state, not a one-way latch (§12 N4, N3).

**One honest residual, recorded rather than smoothed over.** The three `[data-cloud-drift]` tracks
keep the hint unconditionally, which P5-7's closure justifies on the grounds that they animate `x`
with `repeat: Number.POSITIVE_INFINITY` and so never "stop changing". That justification is exactly
true *within* the hero, but **P4-4** — landed in a different phase — now freezes the drift once the
reader is past the track (§12 N3), so past the hero there are **3 elements carrying
`will-change: transform` that are not animating**. This is not a regression (Phase 7 measured 7 in
the same state, so the count strictly improved), it is not a failure of any check here (the plan's
bar is 7 / < 7 / 0, and 3 < 7), and it is not one of the 62 findings. It is simply the one place
where two fixes from different phases interact and the second one's justification no longer covers
the whole scroll range. Cost, if any, is three composited layers whose parent is at `opacity: 0`;
the Phase-6 Layers reading measured total layer memory *dropping* 153,470,156 → 145,568,432 B at
1440×900 across the pan, so the direction of travel is right either way.

**Compositor measurement.** Taken during fix-plan Phase 6 with GPU enabled and CDP `LayerTree` on,
at 1440×900 and 390×844; recorded at `audit/08-fix-log.md:2039` and `:2079`. Not repeated here: this
run is `--disable-gpu` and any layer figure it produced would not transfer.

---

## 12. New checks required by the fix plan

Probe: `p8-new-checks.mjs` (see **Commands run**). Run twice — against the dev server on 5173 and
against the built output on 4173. **Every reading below was identical on both**, which is itself the
evidence that prerender + `hydrateRoot` reproduces the client-only behaviour.

### N1 — Skip link moves focus (P2-4)

```
after Tab 1, active = {"tag":"a","href":"#main","text":"Skip to content","tabIndex":0,"hasTabindexAttr":false}
after Enter, active = {"tag":"main","id":"main","tabIndex":-1,"hasTabindexAttr":true}
hash = "#main"  scrollY = 0
ASSERT activeElement.id === "main" : true
```

**PASS.**

### N2 — Logo link moves focus to `#top` (P7-2)

```
after Tab 2, active = {"tag":"a","href":"#top","text":"","tabIndex":0,"hasTabindexAttr":false}
after Enter, active = {"tag":"section","id":"top","tabIndex":-1,"hasTabindexAttr":true}
hash = "#top"  scrollY = 0
ASSERT activeElement.id === "top" : true
#top tabindex: {"tabIndex":-1,"hasAttr":true}
```

**PASS.** `<section id="top" data-hero tabIndex={-1}>` (`src/components/Hero.tsx:193–196`). P7-2 was
the "same shape as P2-4" note; both in-page anchor targets now take focus, decided once as the
dedup note in `AUDIT.md` §4 asked.

### N3 — Cloud drift pauses past the hero and resumes at the top (P4-4)

| Position | `t = 0` | `t + 3.2–3.4 s` | Layer opacity | Verdict |
|---|---|---|---|---|
| `scrollY = 0` | far −1284.41 / mid −1293.28 / near −1305.54 | far −1305.94 / mid −1324.67 / near −1350.53 | 0.5 / 0.75 / 1 | **RUNNING** (transforms differ) |
| Past the track (`scrollY = 2280`, track 2080) | **−1265 ×3** | **−1265 ×3** | **0 / 0 / 0** | **STOPPED** (transforms identical across 3.4 s) |
| Back at `scrollY = 0` | far −1269.19 / mid −1271.11 / near −1273.76 | far −1290.72 / mid −1302.49 / near −1318.73 | 0.5 / 0.75 / 1 | **RESUMED** (transforms differ) |

**PASS.** All three tracks freeze on the same `−1265` = `LOOP_START`, at the moment every layer's
opacity is exactly **0**, so the snap-back lands on a frame that paints nothing. Restarting on
scroll-up proves it is a state, not a latch. This is the live confirmation of P4-4's per-layer
`fadeEnd` switch.

### N4 — `will-change` at three progress points

Covered in §11. **7 at scroll 0 → 4 at `p = 0.37` → 3 at `p = 0.8` and past the track → 0 under
reduced motion. PASS** (the plan's bar is 7 / < 7 / 0).

### N5 — `scroll-padding-top` vs header height

| Viewport | `scroll-padding-top` | Header height | Margin |
|---|---|---|---|
| 1280×800 | **96 px** | **81 px** | +15 px |
| 375×812 | **96 px** | **65 px** | +31 px |

**PASS at both.** `src/index.css:102`.

### N6 / N7 — WCAG 1.4.12 Text Spacing override

Injected verbatim after load:

```css
* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important }
p { margin-bottom: 2em !important }
```

Then counted (a) elements whose `scrollHeight > clientHeight` while `overflow` is **not** visible,
and (b) overlapping rects among all visible `h1,h2,h3,h4,a,button`, excluding ancestor/descendant
pairs.

| Viewport | | Heading/link/button boxes | Clipped elements | **Overlapping pairs** | `scrollWidth`/`clientWidth` | `docHeight` |
|---|---|---|---|---|---|---|
| 1280×800 | before | 34 | 10 | **0** | 1265 / 1265 | 7236 |
| 1280×800 | **after** | 34 | **10 (unchanged)** | **0** | 1265 / 1265 | 8189 |
| 375×812 | before | 31 | 10 | **0** | 375 / 375 | 8339 |
| 375×812 | **after** | 31 | **10 (unchanged)** | **0** | 375 / 375 | 9754 |

**PASS. Zero content is lost or overlapped at either viewport.** The decisive number is that the
clipped count is **identical before and after** the override — the spacing change introduces no new
clipping. All ten pre-existing entries are deliberate, and the same ten at both viewports:

- **nine `sr-only` boxes** (the skip link plus the eight "(opens in a new tab)" / "Open menu"
  spans): `clientHeight: 1` with `overflow: hidden` is the definition of `sr-only`. They are not
  visible content and cannot lose any.
- **one hero stage**: `div.sticky.top-0.h-dvh.w-full.overflow-hidden`, `scrollHeight 2400` vs
  `clientHeight 800` — the 3× campus artwork deliberately overflowing its one-viewport stage.

No horizontal scrollbar appears under the override at either width, and the page simply grows
taller (7236 → 8189 px desktop, 8339 → 9754 px mobile), which is what reflowable text should do.
Screenshots `text-spacing-desktop.png` and `text-spacing-mobile.png`.

**P4-8 verified.** It was closed as DOCUMENTED (`audit/08-fix-log.md:459`) on the argument that the
display line-heights below 1.5 do not clip because nothing is height-constrained; this is that
argument measured.

### N8 — Menu toggle rendered treatment (P4-2 / P3-1)

At 375×812, the live computed style of `header button[aria-controls="primary-menu"]`:

```
className:       border border-pine text-pine hover:bg-pine hover:text-cloud
                 focus-visible:outline-pine focus-visible:outline-2 focus-visible:outline-offset-2
                 -mr-2 inline-flex items-center justify-center rounded-full p-2 md:hidden
border-color:    rgb(60, 92, 72)      /* #3c5c48 = pine */
border-width:    1px    border-style: solid
color:           rgb(60, 92, 72)      /* pine */
glyph stroke:    rgb(60, 92, 72)      /* pine */
background:      rgba(0, 0, 0, 0)     /* transparent — the header's cloud shows through */
header bg:       rgb(247, 245, 238)   /* #f7f5ee = cloud */
rect:            42 × 42
```

`#3c5c48` on `#f7f5ee` = **6.83:1** by the WCAG formula (§14 row 31), against the **3:1** of
1.4.11 Non-text Contrast. Phase 4 measured the old frost border at **1.19:1**.

**PASS — the border is now visible, at 2.28× the required ratio.** The class string is
`TOGGLE_ON_CLOUD` from `src/components/controls.ts:39–41` verbatim, so the one named constant really
is what renders, at the header call site. Screenshot `toggle-mobile.png`.

### N9 — Horizontal overflow

Covered in §9. `scrollWidth === clientWidth` at 375×812 and 1280×800, dev and built. **PASS.**

---

## 13. Built-output verification (`npm run build` → `npm run preview`)

`npm run build` (which is `npm run lint && tsc -b && vite build && node scripts/prerender.mjs`)
exited **0**:

```
✓ 448 modules transformed.
dist/components.html                                    1.68 kB │ gzip:  0.79 kB
dist/index.html                                         5.57 kB │ gzip:  2.38 kB
dist/assets/fraunces-latin-600-normal-BFCDtZfi.woff2   18.09 kB
dist/assets/inter-latin-400-normal-C38fXH4l.woff2      23.66 kB
dist/assets/inter-latin-500-normal-Cerq10X2.woff2      24.27 kB
dist/assets/index-JaSjmbl1.css                         18.05 kB │ gzip:  4.61 kB
dist/assets/components-xZOInl1b.css                    21.33 kB │ gzip:  5.25 kB
dist/assets/rolldown-runtime-CbXtAM7H.js                0.58 kB │ gzip:  0.36 kB
dist/assets/index-QlWtpqji.js                           1.18 kB │ gzip:  0.57 kB
dist/assets/components-CSF4NymR.js                     53.57 kB │ gzip: 16.45 kB
dist/assets/shared-CpAifS0L.js                         81.59 kB │ gzip: 28.71 kB
dist/assets/vendor-Z-IfkQ_V.js                        216.95 kB │ gzip: 70.06 kB
✓ built in 350ms
prerendered dist/index.html (42596 chars)
prerendered dist/components.html (109199 chars)
```

Byte-exact against the sizes the fix plan records: `vendor-*.js` **216,956 B**, `shared-*.js`
**81,597 B**, `components-*.js` **53,570 B**, `index-*.js` **1,187 B**, `rolldown-runtime-*.js`
**589 B**, `index-*.css` **18,052 B**, `components-*.css` **21,331 B**.

### Structural checks on `dist/`

| Check | Command | Result | |
|---|---|---|---|
| Font preloads | `grep -c 'rel="preload" as="font"' dist/index.html` | **3** | **PASS** (P5-5) |
| Stylesheets | `grep -c 'rel="stylesheet"' dist/index.html` | **1** | **PASS** (P5-13) |
| Vendor chunk present | `ls dist/assets/` | `vendor-Z-IfkQ_V.js` | **PASS** (P1-1) |
| No `SiteFooter-*` | `ls dist/assets/SiteFooter-*` | *(none)* | **PASS** (P1-1) |
| No `.woff` | `ls dist/assets/*.woff` | *(none)* | **PASS** (P5-6) |
| `#root` non-empty | see below | 42,596 chars, `<picture>` present | **PASS** (P5-1, P5-8) |
| 404 page shipped | `cmp public/404.html dist/404.html` | exit 0, identical, 3,307 B | **PASS** (P5-4) |
| Landing CSS has no sheet utility | `grep -c 'grid-cols-5' dist/assets/index-*.css` | **0** (sheet CSS: **1**) | **PASS** (P1-5, invariant j′) |
| No phantom `transition` rule | `grep -c 'transition' dist/assets/index-*.css` | **0** | **PASS** (P1-5) |
| Every asset URL resolves | node bijection scan | **56 files, 56 referenced, 56 URLs, 0 missing, 0 unreferenced** | **PASS** (invariant l) |

`#root` in the prerendered HTML:

```html
<div id="root"><div class="bg-cloud font-sans text-pine min-h-screen"><a href="#main" class="bg-cloud
text-pine focus:outline-pine sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 …
```

`dist/index.html` is 48,150 chars of which **42,596** are inside `#root`; it contains `<picture>`
and seven `will-change-transform` occurrences (matching the client's first render, so hydration has
nothing to reconcile). Phase 5's P5-1 argument rested on an **empty** `#root`; that is no longer the
shape of the file.

### First load in a fresh profile, sampled ≥ 3 s after `Page.loadEventFired`

One brand-new `--user-data-dir` per page, so each of these really is a cold first load.

| Page | Status | `<title>` | `#root` children | `docHeight` | Console errors | Console warnings | Failed / ≥400 |
|---|---|---|---|---|---|---|---|
| `http://localhost:4173/` | **200** | `HackBU` | 1 (42,469 chars hydrated) | 7236 | **0 errors** | **0 warnings** | **0** |
| `http://localhost:4173/components.html` | **200** | `HackBU component sheet` | 1 (108,869 chars) | 28261 | **0 errors** | **0 warnings** | **0** |
| `http://localhost:4173/404.html` | **200** | `Page not found — HackBU` | *(no `#root` — static page)* | 800 | **0 errors** | **0 warnings** | **0** |

**PASS on all three.** No hydration mismatch, no React key warning, no `motion` warning, no font
warning, no 404 for any asset. The 404 page renders `h1` "Page not found" and the body copy "There
is nothing at this address — it was probably mistyped, or the page has moved."

### The documented benign repeat-navigation warning

Navigating to `/` a **second** time in the same (now-warm) profile reproduces exactly the three
warnings the fix plan predicts, and nothing else:

```
repeat-nav console errors  : 0 errors
repeat-nav console warnings: 3
  - log(javascript): The resource http://localhost:4173/assets/inter-latin-500-normal-Cerq10X2.woff2
      was preloaded using link preload but not used within a few seconds from the window's load event…
  - log(javascript): …fraunces-latin-600-normal-BFCDtZfi.woff2 …
  - log(javascript): …inter-latin-400-normal-C38fXH4l.woff2 …
repeat-nav failed / >=400   : 0
```

These are Chromium's heuristic firing when the face is served from cache and satisfied before the
"used" bookkeeping runs; they are absent on every first load, which is the acceptance bar. Recorded
once, labelled, and **not** counted as a finding.

### Hero geometry and behaviour on the built output

| Viewport | `transform` at scroll 0 | rect | `currentSrc` | `naturalWidth` | track | `#root` children |
|---|---|---|---|---|---|---|
| 1280×800 | **`matrix(3, 0, 0, 3, 0, 0)`** | `{-1265, 0, 3795, 2400}` | `Campus-1672.avif` | 1421 | 2080 | 1 |
| 375×812 | **`matrix(3, 0, 0, 3, 0, 0)`** | `{-375, 0, 1125, 2436}` | `Campus-1672.avif` | 1442 | 2111 | 1 |

Identical to the dev server and to Phase 7. N1–N9 were re-run against 4173 and returned the same
values line for line, including `activeElement.id === 'main'`, the drift pause, 7 / 4 / 3
`will-change`, 0 clipped and 0 overlapping under the text-spacing override, and
`scrollWidth === clientWidth` at both viewports.

---

## 14. Contrast — every pair recomputed from the current `src/index.css`

Tokens parsed straight out of the `@theme` block of `src/index.css` at run time (not copied), then
run through the WCAG 2.x relative-luminance formula. `pine/90` and `stone/60` are composited over
their background in sRGB and **rounded to 8 bits**, which is what a compositor stores and what a
sampling checker reads — the same convention `audit/04-accessibility.md` §7.4 established.

```
--color-sky      #4a96d2      --color-brick    #a2593a      --color-pine     #3c5c48
--color-horizon  #a8d0eb      --color-stone    #c4b79e      --color-haze     #7c99b4
--color-cloud    #f7f5ee      --color-frost    #dce3ea      --color-fern     #339966

pine/90 composite on cloud = #4f6b59   on frost = #4c6a58
stone/60 composite on frost = #cec9bc
```

| # | Pair | fg | bg | Ratio | Threshold | Verdict |
|---|---|---|---|---|---|---|
| 1 | pine text on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 2 | pine text on cloud (Layout eyebrow/heading) | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 3 | pine text on cloud (AboutSection) | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 4 | pine text on cloud (QuestionsSection) | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 5 | pine text on cloud (page default) | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 6 | pine link resting on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 7 | pine link resting on cloud (ContactSection) | `#3c5c48` | `#f7f5ee` | **6.83:1** | 4.5 | PASS |
| 8 | pine/90 text on cloud | `#4f6b59` | `#f7f5ee` | **5.38:1** | 4.5 | PASS |
| 9 | pine/90 text on cloud (IntroSection caption) | `#4f6b59` | `#f7f5ee` | **5.38:1** | 4.5 | PASS |
| 10 | pine/90 text on cloud (AboutSection) | `#4f6b59` | `#f7f5ee` | **5.38:1** | 4.5 | PASS |
| 11 | pine/90 text on cloud (ContactSection) | `#4f6b59` | `#f7f5ee` | **5.38:1** | 4.5 | PASS |
| 12 | brick text hover on cloud | `#a2593a` | `#f7f5ee` | **4.78:1** | 4.5 | PASS |
| 13 | pine text on frost | `#3c5c48` | `#dce3ea` | **5.76:1** | 4.5 | PASS |
| 14 | pine link resting on frost | `#3c5c48` | `#dce3ea` | **5.76:1** | 4.5 | PASS |
| 15 | pine link resting on frost (GetInvolved) | `#3c5c48` | `#dce3ea` | **5.76:1** | 4.5 | PASS |
| 16 | pine/90 text on frost (SiteFooter) | `#4c6a58` | `#dce3ea` | **4.62:1** | 4.5 | PASS (margin 0.12) |
| 17 | pine/90 text on frost (footer eyebrow) | `#4c6a58` | `#dce3ea` | **4.62:1** | 4.5 | PASS (margin 0.12) |
| 18 | pine/90 text on frost (GetInvolved) | `#4c6a58` | `#dce3ea` | **4.62:1** | 4.5 | PASS (margin 0.12) |
| 19 | pine glyph stroke, hover state | `#3c5c48` | `#dce3ea` | **5.76:1** | 3 | PASS |
| 20 | cloud text on brick (button label) | `#f7f5ee` | `#a2593a` | **4.78:1** | 4.5 | PASS |
| 21 | cloud text on pine (CTA hover) | `#f7f5ee` | `#3c5c48` | **6.83:1** | 4.5 | PASS |
| 22 | pine glyph stroke on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 3 | PASS |
| 23 | pine focus ring offset 4 on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 3 | PASS |
| 24 | pine focus ring offset 2 on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 3 | PASS |
| 25 | pine focus ring offset 4 on frost | `#3c5c48` | `#dce3ea` | **5.76:1** | 3 | PASS |
| 26 | pine focus ring offset 2 on frost | `#3c5c48` | `#dce3ea` | **5.76:1** | 3 | PASS |
| 27 | brick button fill on cloud | `#a2593a` | `#f7f5ee` | **4.78:1** | 3 | PASS |
| 28 | brick button fill on frost | `#a2593a` | `#dce3ea` | **4.03:1** | 3 | PASS |
| 29 | pine button fill hover on cloud | `#3c5c48` | `#f7f5ee` | **6.83:1** | 3 | PASS |
| 30 | pine button fill hover on frost | `#3c5c48` | `#dce3ea` | **5.76:1** | 3 | PASS |
| **31** | **TOGGLE border on cloud** *(was frost, 1.19:1)* | `#3c5c48` | `#f7f5ee` | **6.83:1** | **3** | **PASS — P4-2/P3-1** |
| **32** | **TOGGLE hover fill on cloud** *(was frost, 1.19:1)* | `#3c5c48` | `#f7f5ee` | **6.83:1** | **3** | **PASS — P4-2/P3-1** |
| 33 | frost border — card / rule edges on cloud | `#dce3ea` | `#f7f5ee` | **1.19:1** | n/a | decorative separator, no SC applies |
| **34** | **GetInvolved card border on frost** *(was frost-on-frost, 1.00:1)* | `#cec9bc` | `#dce3ea` | **1.28:1** | n/a | **decorative hairline — P4-3, a border that now exists** |
| 35 | stone/60 hairline on frost | `#cec9bc` | `#dce3ea` | **1.28:1** | n/a | decorative rule |
| 36 | cloud drift shape on frost | `#f7f5ee` | `#dce3ea` | **1.19:1** | n/a | `aria-hidden` decoration |
| 37 | frost drift shape on cloud | `#dce3ea` | `#f7f5ee` | **1.19:1** | n/a | `aria-hidden` decoration |
| 38 | fern logo mark on cloud | `#339966` | `#f7f5ee` | **3.27:1** | n/a | logotype, exempt |
| 39 | fern logo mark on frost | `#339966` | `#dce3ea` | **2.75:1** | n/a | logotype, exempt |
| 40 | haze on cloud / on frost | `#7c99b4` | `#f7f5ee` / `#dce3ea` | **2.72:1** / **2.29:1** | n/a | declared, not in use |
| 41 | anything on `sky` | — | — | — | — | no pair exists |

```
TEXT PAIR FAILURES (<4.5:1)     : 0
NON-TEXT PAIR FAILURES (<3:1)   : 0
WORST TEXT PAIR                 : pine/90 text on frost (SiteFooter) = 4.62:1
TOGGLE BORDER (pine on cloud)   : 6.83:1   (>= 3.0 required)
```

**All 20 text pairs clear 4.5:1** (worst 4.62:1, 0.12 of headroom — unchanged from
Phase 4, and still the number to watch if anyone retunes `frost`). **Every non-text pair with an
applicable threshold clears 3:1**, including the two that used to be the finding. Rows 33 and
35–41 are sub-3:1 and carry no applicable success criterion, exactly as Phase 4 reasoned; the only
row that moved among them is 34, from a literally invisible 1.00:1 to a deliberate 1.28:1 hairline.

### The class pairs still exist in the code

```
$ grep -rn 'text-pine/90' src/ --include=*.tsx | grep -v '^src/sheet/'
src/components/Layout.tsx:74                      src/components/SiteFooter.tsx:26
src/components/sections/AboutSection.tsx:51       src/components/SiteFooter.tsx:42
src/components/sections/ContactSection.tsx:34     src/components/sections/ContactSection.tsx:47
src/components/sections/GetInvolvedSection.tsx:61 src/components/sections/IntroSection.tsx:53
                                                  (8 call sites + 1 comment)

$ grep -n 'bg-frost' src/components/SiteFooter.tsx src/components/sections/GetInvolvedSection.tsx
  -> both present: pine/90 on frost is still a live pair (rows 16–18)

$ grep -n 'brick' src/components/ButtonLink.tsx src/components/ExternalLink.tsx
src/components/ButtonLink.tsx:30:  'bg-brick text-cloud hover:bg-pine ' +
src/components/ExternalLink.tsx:33:export const LINK_ON_CLOUD = `text-pine hover:text-brick ${FOCUS_RING}`

$ grep -rn 'border-frost' src/ --include=*.tsx | grep -v '^src/sheet/'
src/components/sections/AboutSection.tsx:44    src/components/sections/QuestionsSection.tsx:41,45
src/components/SiteHeader.tsx:48,91            (5 hits — all decorative separators, row 33)
                                               NONE on the menu toggle, NONE on the GetInvolved card
```

The toggle and the conversion card are the two places `border-frost` used to sit and no longer
does; every remaining occurrence is a card edge or a rule, which is row 33's decorative class.

---

## 15. Screenshots

`audit/screenshots-after/` reproduces every view in `audit/screenshots/` at the same dimensions,
plus three new ones for the new checks.

| File | Dimensions | Bytes | In `screenshots/` too? | What it shows |
|---|---|---|---|---|
| `hero-scroll0.png` | 1280×800 | 976457 | yes | `scrollY = 0`, scale 3 — sky, clouds, ridgeline, **no buildings** |
| `hero-midpan.png` | 1280×800 | 1296240 | yes | `p = 0.370`, scale 1.66528 — rooftops entering |
| `hero-revealed.png` | 1280×800 | 1630965 | yes | `p = 0.8`, `transform: none` — full campus, clouds gone |
| `clouds-t0.png` | 1280×800 | 978532 | yes | drift tracks at −1271 / −1274 / −1278 |
| `clouds-t1.png` | 1280×800 | 976810 | yes | `t + 6.4 s`, tracks at −1314 / −1337 / −1368 — drifted, no seam |
| `hero-reduced-motion.png` | 1280×800 | 1649919 | yes | `prefers-reduced-motion: reduce` — resting frame, static clouds |
| `focus-skip-link.png` | 1280×800 | 979236 | yes | Tab 1 — skip link un-hidden, 145.7×40, 2px pine outline |
| `focus-header-cta.png` | 1280×800 | 986761 | yes | Tab 6 — header Discord CTA with `:focus-visible` outline |
| `mobile-menu-open.png` | 375×812 | 205143 | yes | compact panel open, `aria-expanded="true"` |
| `mobile-full.png` | 375×8339 | 382983 | yes | full-page capture at 375×812 |
| `desktop-full.png` | 1280×7236 | 1090929 | yes | full-page capture at 1280×800 |
| **`text-spacing-desktop.png`** | 1280×800 | 975082 | **new** | 1.4.12 override applied at 1280×800 |
| **`text-spacing-mobile.png`** | 375×812 | 314254 | **new** | 1.4.12 override applied at 375×812 |
| **`toggle-mobile.png`** | 375×812 | 313050 | **new** | header at 375 px with the pine-bordered toggle |

`audit/screenshots/` (Phase 7, for comparison): `clouds-t0.png`, `clouds-t1.png`,
`desktop-full.png`, `focus-header-cta.png`, `focus-skip-link.png`, `hero-midpan.png`,
`hero-reduced-motion.png`, `hero-revealed.png`, `hero-scroll0.png`, `mobile-full.png`,
`mobile-menu-open.png` — **11 files, all 11 reproduced.**

Three of the eleven are **byte-identical** to Phase 7's file (`cmp` exit 0):
`focus-skip-link.png`, `hero-midpan.png` and `hero-reduced-motion.png` — the skip link's focused
appearance, the mid-pan frame and the whole reduced-motion branch render pixel-for-pixel as they
did before any fix. `desktop-full.png` and `mobile-full.png` keep the same pixel dimensions
(1280×7236, 375×8339), so the page height did not move either.

---

## 16. Result

**No check failed, and no new finding was surfaced.** Every §1–§11 reading either reproduces Phase 7
exactly or differs in one of the three ways the fix plan deliberately intended (the three listed at
the top of this file). Every new check in §12 passes. The built output is clean on first load in a
fresh profile on all three pages.

One observation is recorded that is not a finding and not a failure: past the hero track, the three
`[data-cloud-drift]` elements still carry `will-change: transform` while P4-4 holds them frozen
(§11). It is called out only because P5-7's closure reasoning — "they never stop changing" — stopped
being true of the whole scroll range once P4-4 landed in an earlier phase.

Toolchain, for the record:

```
$ npm run typecheck   -> exit 0
$ npm run lint        -> exit 0   (oxlint --deny-warnings)
$ npm run build       -> exit 0   (lint + tsc -b + vite build + prerender)
$ git status --porcelain
?? audit/screenshots-after/
```

*(`audit/08-fix-verification.md` and the `## Reconciliation` section of `audit/08-fix-log.md` are
written after this readout; the orchestrator commits all three artefacts.)*

**Still not measured, carried forward unchanged from `AUDIT.md` §7:** Vercel-side routing and cache
headers (derived from `vercel.json`, never observed against a real deployment); FCP/LCP and any
paint or Lighthouse timing; Safari's skip-link behaviour (this confirmation is Chromium-family
only); Shift-Tab traversal; the tab order at 375 px; `prefers-contrast` and forced-colors; whether
the eight `hackbu.org` URLs are still live; and a frame-by-frame sweep of a full 188 s cloud cycle.
The compositor Layers reading that `07-live.md` left open **was** taken — in fix-plan Phase 6, with
GPU enabled — and lives at `audit/08-fix-log.md:2039–2096`.

---

## Commands run

All from the repo root on Windows. Node v24.18.0, Git Bash for the `curl`/`grep`/`node` lines,
PowerShell for process control. Scripts live in the session scratchpad, not in the repo; the probes
this phase wrote are quoted below so the document stands alone.

### Servers

```bash
# dev server: started with the `hackbu-dev` launch configuration (npm run dev), port 5173
for p in "/" "/components" "/components.html" "/nonexistent" "/componentsfoo"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173$p")
  title=$(curl -s "http://localhost:5173$p" | grep -o "<title>[^<]*</title>" | head -1)
  echo "$p -> $code  $title"
done
# / -> 200  <title>HackBU</title>
# /components -> 200  <title>HackBU component sheet</title>
# /components.html -> 200  <title>HackBU component sheet</title>
# /nonexistent -> 200  <title>HackBU</title>
# /componentsfoo -> 200  <title>HackBU</title>

npm run build                                             # exit 0
nohup npm run preview -- --port 4173 --strictPort &       # PID recorded, killed at the end
```

### Headless Edge

```powershell
$sp = "<scratchpad>"
$p = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  -ArgumentList "--headless=new","--remote-debugging-port=9348","--user-data-dir=$sp\edge-profile-p7",`
                "--no-first-run","--no-default-browser-check","--disable-gpu",`
                "--window-size=1280,800","about:blank" -PassThru
$p.Id | Out-File "$sp\edge-p7.pid" -Encoding ascii        # PID = 33588

# three more, one per built page, each with a BRAND-NEW user-data-dir so the load is genuinely first:
#   port 9351 -> edge-built-a (PID 23772)   for /
#   port 9352 -> edge-built-b (PID 27256)   for /components.html
#   port 9353 -> edge-built-c (PID 46460)   for /404.html

# teardown — only the pids this phase launched, with their renderer children
taskkill /PID <pid> /T /F
```

### Probes

```bash
# 1. the unmodified Phase-7 driver, pointed at the new screenshot directory
node cdp-audit.mjs 9348 "C:/Users/danz3/Downloads/HackBUNew/audit/screenshots-after" "cdp-output-after.txt"

# 2. the unmodified Phase-7 accessible-name probe
node cdp-ax.mjs 9348 "ax-output-after.txt"

# 3. new: the checks 07-live.md does not make — run twice, dev and built
SHOTDIR=".../audit/screenshots-after" node p8-new-checks.mjs 9348 "http://localhost:5173"  "p8-new-checks.out.txt"
SHOTDIR="<scratchpad>"                 node p8-new-checks.mjs 9351 "http://localhost:4173"  "p8-new-checks-built.out.txt"

# 4. new: first-load console/network on the built output, one fresh profile per page
node p8-built-console.mjs 9351 "http://localhost:4173/"                3500 repeat
node p8-built-console.mjs 9352 "http://localhost:4173/components.html" 3500 once
node p8-built-console.mjs 9353 "http://localhost:4173/404.html"        3500 once

# 5. new: hero geometry + hydration sanity on the built output
node p8-built-hero.mjs 9351 "http://localhost:4173"

# 6. new: contrast recomputed from the current src/index.css @theme block
node p8-contrast.mjs "C:/Users/danz3/Downloads/HackBUNew"
```

### Key probe snippets, verbatim

The **skip-link / logo-link focus assertion** (`p8-new-checks.mjs`, N1 and N2) — the active element
is read after a *real* dispatched Enter, not a synthetic `click()`:

```js
const ACTIVE = `(() => { const a = document.activeElement; if (!a) return null;
  return { tag: a.tagName.toLowerCase(), id: a.id || null, href: a.getAttribute && a.getAttribute('href'),
           text: (a.innerText||a.textContent||'').trim().replace(/\s+/g,' ').slice(0,40),
           tabIndex: a.tabIndex, hasTabindexAttr: a.hasAttribute && a.hasAttribute('tabindex') }; })()`

await tab(); await sleep(150)
await key('Enter', 'Enter', 13, '\r'); await sleep(700)
const a1 = await evalJS(ACTIVE)
say('ASSERT activeElement.id === "main" : ' + (a1 && a1.id === 'main'))
```

The **drift-pause probe** (N3) — same three tracks read at rest, past the track, and back at the top:

```js
const DRIFT = `[...document.querySelectorAll('[data-cloud-drift]')].map(el => ({
  layer: el.parentElement.getAttribute('data-cloud-layer'),
  drift: getComputedStyle(el).transform,
  layerOpacity: getComputedStyle(el.parentElement).opacity }))`

const d0 = await evalJS(DRIFT); await sleep(3200); const d1 = await evalJS(DRIFT)
say('drift RUNNING at rest = ' + (JSON.stringify(d0) !== JSON.stringify(d1)))
await evalJS(`(() => { const t = document.querySelector('[data-hero]');
  window.scrollTo(0, t.offsetTop + t.offsetHeight + 200); return Math.round(window.scrollY); })()`)
const p0 = await evalJS(DRIFT); await sleep(3400); const p1 = await evalJS(DRIFT)
say('drift STOPPED = ' + (JSON.stringify(p0) === JSON.stringify(p1)))
```

The **text-spacing probe** (N6/N7) — clipped elements are only counted where `overflow` is actually
constrained, and overlap tests skip ancestor/descendant pairs (which always "overlap"):

```js
const SPACING_CSS =
  '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important } ' +
  'p { margin-bottom: 2em !important }'

// (a) clipped: scrollHeight > clientHeight while overflow is not visible
document.querySelectorAll('body *').forEach(el => {
  const cs = getComputedStyle(el)
  const ov = cs.overflow + ' ' + cs.overflowX + ' ' + cs.overflowY
  if (ov.includes('visible') && !ov.includes('hidden') && !ov.includes('clip') &&
      !ov.includes('scroll') && !ov.includes('auto')) return
  if (cs.display === 'none' || cs.visibility === 'hidden') return
  if (el.scrollHeight > el.clientHeight + 1 && el.clientHeight > 0) clipped.push(/* … */)
})

// (b) overlaps among visible h1,h2,h3,h4,a,button — document-space rects, containment excluded
if (a.el.contains(b.el) || b.el.contains(a.el)) continue
const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
if (ix > 1 && iy > 1) overlaps.push({ /* … */ })
```

The **contrast recomputation** (`p8-contrast.mjs`) — tokens are parsed out of the stylesheet at run
time, so the table cannot drift from the source:

```js
const css = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8')
const T = {}
for (const m of css.matchAll(/--color-([a-z]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) T[m[1]] = m[2].toLowerCase()

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = ([r, g, b]) => { const f = (c) => { const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
/* alpha composite in sRGB, then round to 8 bits — what the compositor stores */
const over = (fg, bg, a) => rgb(fg).map((c, i) => Math.round(c * a + rgb(bg)[i] * (1 - a)))
```

The **built-output first-load probe** (`p8-built-console.mjs`) collects the same four CDP streams
Phase 7 used, samples 3.5 s after `Page.loadEventFired`, and — with `repeat` — navigates a second
time in the warm profile to capture the documented preload warnings separately:

```js
on('Runtime.consoleAPICalled', p => bufConsole.push({ type: p.type, text: /* … */ }))
on('Runtime.exceptionThrown',  p => bufExc.push(/* … */))
on('Log.entryAdded',           p => bufLog.push({ level: p.entry.level, source: p.entry.source, text: /* … */ }))
on('Network.loadingFailed',    p => bufFailed.push(/* … */))
on('Network.responseReceived', p => { if (p.response.status >= 400) bufStatus.push(/* … */) })

const loaded = once('Page.loadEventFired')
await send('Page.navigate', { url: URL_ }, S)
await loaded
await sleep(3500)          // >= 3 s post-load, per the acceptance bar
```

### Built-output structural checks

```bash
grep -c 'rel="preload" as="font"' dist/index.html     # 3
grep -c 'rel="stylesheet"'        dist/index.html     # 1
grep -c 'grid-cols-5' dist/assets/index-*.css         # 0     (sheet CSS: 1)
grep -c 'transition'  dist/assets/index-*.css         # 0
ls dist/assets/SiteFooter-*                           # (none)
ls dist/assets/*.woff                                 # (none)
cmp public/404.html dist/404.html                     # exit 0, identical (3307 B)
```

### Teardown

```powershell
taskkill /PID 33588 /T /F   # dev-server Edge   -> SUCCESS x12
taskkill /PID 23772 /T /F   # built-page Edge A -> SUCCESS
taskkill /PID 27256 /T /F   # built-page Edge B -> SUCCESS
taskkill /PID 46460 /T /F   # built-page Edge C -> SUCCESS
taskkill /PID 35824 /T /F   # vite preview 4173 -> SUCCESS
# dev server stopped with the preview_stop tool

foreach ($p in 5173,4173,9348,9351,9352,9353) { Get-NetTCPConnection -LocalPort $p -State Listen }
# 5173 : free   4173 : free   9348 : free   9351 : free   9352 : free   9353 : free
# no msedge process remains with --headless, one of this phase's user-data-dirs, or a 93xx debug port
```

---

## Raw readouts

### `cdp-audit.mjs` — §1 route table

```
Edge: Edg/151.0.4129.101

##### 1. Route load: console + network (3s settle)
ROUTE /  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  renders: "Skip to content Schedule Resources Hackathons Discord (opens in a new tab) BINGHAMTON UNIVERSITY Learn to buil"  docHeight=7236
  / console errors: 0 errors
  / console warnings: 0 warnings
  / failed / >=400 network: 0
ROUTE /components  docStatus=200  title="HackBU component sheet"  h1="The HackBU component sheet."  hero=false
  renders: "Skip to the sheet INTERNAL · NOT LINKED FROM THE SITE The HackBU component sheet. Every component in the landi"  docHeight=28261
  /components console errors: 0 errors
  /components console warnings: 0 warnings
  /components failed / >=400 network: 0
ROUTE /components.html  docStatus=200  title="HackBU component sheet"  h1="The HackBU component sheet."  hero=false
  /components.html console errors: 0 errors
  /components.html console warnings: 0 warnings
  /components.html failed / >=400 network: 0
ROUTE /nonexistent  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  renders: "Skip to content Schedule Resources Hackathons Discord (opens in a new tab) BINGHAMTON UNIVERSITY Learn to buil"  docHeight=7236
  /nonexistent console errors: 0 errors
  /nonexistent console warnings: 0 warnings
  /nonexistent failed / >=400 network: 0
ROUTE /componentsfoo  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  /componentsfoo console errors: 0 errors
  /componentsfoo console warnings: 0 warnings
  /componentsfoo failed / >=400 network: 0
```

### `cdp-audit.mjs` — §2–§4, §11

```
##### 2-3. Hero pan (1280x800)
scroll 0: {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"632.5px 0px","willChange":"transform","rect":{"x":-1265,"y":0,"w":3795,"h":2400,"bottom":2400},"currentSrc":"Campus-1672.avif","naturalW":1421,"naturalH":799,"trackHeight":2080,"trackRectTop":0,"scrollY":0,"innerW":1280,"innerH":800}
  scale from matrix = 3  expected(p=0) = 3
progress ~0.37: scrollY=474 scale=1.66528 expected=1.6664 transform=matrix(1.66528, 0, 0, 1.66528, 0, 0) rect={"x":-420.8,"y":0,"w":2106.6,"h":1332.2,"bottom":1332.2}
progress ~0.8: scrollY=1024 scale=null expected=1.0000 transform=none rect={"x":0,"y":0,"w":1265,"h":800,"bottom":800}
will-change after pan: {"count":3,"sample":["div[data-cloudDrift]","div[data-cloudDrift]","div[data-cloudDrift]"],"attrCount":3}
will-change at scroll 0: {"count":7,"sample":["img","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]"],"attrCount":7}

##### 4. Cloud drift (scroll 0, 1280x800)
t0:    far -1271.43   mid -1274.37   near -1278.44   (wrappers: none / 0.5, none / 0.75, none / 1)
t0+6s: far -1314.27   mid -1336.80   near -1367.91   (wrappers unchanged)
drift transforms changed per layer: [true,true,true]

##### 2b. Hero scale at 375x812
mobile scroll 0 campus: {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"187.5px 0px","willChange":"transform","rect":{"x":-375,"y":0,"w":1125,"h":2436,"bottom":2436},"currentSrc":"Campus-1672.avif","naturalW":1442,"naturalH":811,"trackHeight":2111,"scrollY":0,"innerW":375,"innerH":812}
  scale = 3
```

### `cdp-audit.mjs` — §5, §7b, §9

```
##### 7b. Skip link activation
before Enter, active = {"tag":"a","text":"Skip to content","href":"#main"}
after Enter: hash="#main" scrollY=0
after Enter, active = {"tag":"main","text":"BINGHAMTON UNIVERSITY Learn to build apps with", ...}
main tabindex = {"tabIndex":-1,"hasAttr":true}
scroll-padding-top = "96px"
header height = 81

##### 5. prefers-reduced-motion: reduce (1280x800)
matchMedia reduce = true
reduced-motion campus: {"transform":"none","objectPosition":"52% 0%","transformOrigin":"632.5px 0px","willChange":"auto","rect":{"x":0,"y":0,"w":1265,"h":800,"bottom":800},"currentSrc":"Campus-1672.avif","trackHeight":800,"innerH":800}
reduced clouds static: true
reduced will-change: {"count":0,"sample":[],"attrCount":0}

overflow desktop: {"scrollWidth":1265,"innerWidth":1280,"bodyScrollWidth":1265,"clientWidth":1265}
overflow mobile:  {"scrollWidth":375,"innerWidth":375,"bodyScrollWidth":375,"clientWidth":375}
```

### `cdp-ax.mjs` — accessible names

```
header a[href="#top"]: role=link name="HackBU" ignored=false
header nav a[href*="schedule"]: role=link name="Schedule" ignored=false
header nav a[href*="discord"]: role=link name="Discord (opens in a new tab)" ignored=false
header button[aria-controls="primary-menu"]: role=none name=undefined ignored=true
a[href="#main"]: role=link name="Skip to content" ignored=false
footer a[href^="mailto:"]: role=link name="hello@hackbu.org" ignored=false
[data-hero-artwork] img: role=image name="Illustration of the Binghamton University campus under snow: a wooded
  ridgeline above red brick academic buildings and dormitories, with the Library Tower standing at the centre
  and a pale winter sky overhead." ignored=false
[data-hero]: role=region name="Campus illustration" ignored=false
```

### `p8-built-console.mjs` — built output

```
########## BUILT / (fresh profile A, first load + repeat) ##########
FIRST LOAD http://localhost:4173/  status=200  {"url":"/","title":"HackBU","h1":"Learn to build apps with other students.","rootChildren":1,"rootInnerLen":42469,"docHeight":7236,"bodyStart":"Skip to content Schedule Resources Hackathons Discord (opens in a new tab) BINGHAMTON UNIV"}
  first-load console errors  : 0 errors
  first-load console warnings: 0 warnings
  first-load failed / >=400   : 0

REPEAT NAVIGATION (same profile, warm cache) http://localhost:4173/
  repeat-nav console errors  : 0 errors
  repeat-nav console warnings: 3
    - log(javascript): The resource .../inter-latin-500-normal-Cerq10X2.woff2 was preloaded using link preload
        but not used within a few seconds from the window's load event. …
    - log(javascript): .../fraunces-latin-600-normal-BFCDtZfi.woff2 …
    - log(javascript): .../inter-latin-400-normal-C38fXH4l.woff2 …
  repeat-nav failed / >=400   : 0

########## BUILT /components.html (fresh profile B) ##########
FIRST LOAD  status=200  {"title":"HackBU component sheet","h1":"The HackBU component sheet.","rootChildren":1,"rootInnerLen":108869,"docHeight":28261}
  first-load console errors  : 0 errors
  first-load console warnings: 0 warnings
  first-load failed / >=400   : 0

########## BUILT /404.html (fresh profile C) ##########
FIRST LOAD  status=200  {"title":"Page not found — HackBU","h1":"Page not found","rootChildren":-1,"rootInnerLen":0,"docHeight":800,"bodyStart":"Page not found There is nothing at this address — it was probably mistyped, or the page ha"}
  first-load console errors  : 0 errors
  first-load console warnings: 0 warnings
  first-load failed / >=400   : 0
```

### `p8-built-hero.mjs`

```
== built 1280x800
  {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"632.5px 0px","willChange":"transform","rect":{"x":-1265,"y":0,"w":3795,"h":2400},"currentSrc":"Campus-1672.avif","naturalW":1421,"trackHeight":2080,"rootChildren":1,"docHeight":7236}
== built 375x812
  {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"187.5px 0px","willChange":"transform","rect":{"x":-375,"y":0,"w":1125,"h":2436},"currentSrc":"Campus-1672.avif","naturalW":1442,"trackHeight":2111,"rootChildren":1,"docHeight":8339}
== preview /nonexistent: {"title":"HackBU","h1":"Learn to build apps with other students.","hero":true}
```
