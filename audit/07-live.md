# Phase 7 — Live behaviour verification

Read-only audit of the HackBU landing page. This phase drove the **running Vite dev server at
`http://localhost:5173`** with **headless Microsoft Edge 151.0.4129.93** over the Chrome DevTools
Protocol and recorded what the page actually does: console output, network failures, the hero's
computed transforms at three scroll positions, cloud drift over time, the reduced-motion branch,
every rendered link, the keyboard tab order, the mobile menu, and horizontal overflow.

Nothing outside `audit/` was created or modified. The Edge process this phase launched (PID 40508)
was terminated at the end of the run; the dev server was left running for the orchestrator.

**Environment**

| | |
|---|---|
| Browser | `Edg/151.0.4129.93`, UA `HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0` |
| Mode | `--headless=new`, `--disable-gpu`, profile in the scratchpad dir |
| CDP | `127.0.0.1:9333`, flat sessions, domains `Page` `Runtime` `Log` `Network` `DOM` `Accessibility` |
| Driver | Node v24.18.0, built-in `WebSocket` + `fetch`, no npm installs |
| Server | Vite dev server (already running), `http://localhost:5173` |
| Presets | desktop `1280×800` `mobile:false`; mobile `375×812` `mobile:true`, both `deviceScaleFactor: 1` |

**Headless caveat, stated once and up front.** `requestAnimationFrame` was **not** throttled in this
run — the cloud drift advanced at exactly the documented rate across a 6.4 s sample (§3), and all
three layers agreed on the elapsed time to within 0.01 s, so the time-linked animation results here
are trustworthy. What headless does *not* give: GPU-backed compositing. Compositor layer count and
layer memory were therefore not measured (see §11), and paint timings are not reported at all.

---

## 1. Route loads — console messages and network requests

Each route was navigated to fresh, allowed to fire `load`, then given a **3 s settle** before the
buffers were read. Collected: `Runtime.exceptionThrown`, `Runtime.consoleAPICalled` (error/warning),
`Log.entryAdded` (error/warning), `Network.loadingFailed`, and every `Network.responseReceived`
with `status >= 400`.

| Route | Document status | `<title>` | First `<h1>` | Console errors | Console warnings | Failed / ≥400 requests |
|---|---|---|---|---|---|---|
| `/` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |
| `/components` | **200** | `HackBU component sheet` | "The HackBU component sheet." | **0 errors** | **0 warnings** | **0** |
| `/components.html` | **200** | `HackBU component sheet` | "The HackBU component sheet." | **0 errors** | **0 warnings** | **0** |
| `/nonexistent` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |
| `/componentsfoo` | **200** | `HackBU` | "Learn to build apps with other students." | **0 errors** | **0 warnings** | **0** |

Zero errors, zero warnings, and zero failed or ≥400 requests on **all five** routes. No React
key/hydration warnings, no `motion` warnings, no 404s for artwork, fonts or brand masks.

### 1a. Unknown-path behaviour on the dev server

`/components` and `/components.html` render the **same** document: same title, same `h1`, same
`document.documentElement.scrollHeight` of **28261 px**, and `document.querySelector('[data-hero]')`
is `null` on both (the sheet has no hero). Vite's dev server resolves the extensionless path to the
`components.html` entry.

`/nonexistent` and `/componentsfoo` **both** return **200** and render the **landing page** —
identical title, `h1`, `scrollHeight` of **7236 px**, and `[data-hero]` present. Vite's dev server
applies its `index.html` fallback to every unmatched path, with no exclusion for `/components*`.

This is **not** what **P5-4** derived for the deployed `vercel.json`, where `/componentsfoo` is
predicted to reach a platform **404** (the `(?!components)` negative lookahead in the catch-all
fails on a path that starts with `components`) while `/nonexistent` gets the catch-all rewrite to
`/index.html` and a soft **200**. The dev server and Vercel therefore diverge on `/components*`
misspellings. No judgement is offered here — this phase can only observe the dev server, and
**P5-4** already carries the Vercel-side analysis. See **P7-1**.

---

## 2. Hero at scroll 0 (1280×800) — scale vs `PAN_START_SCALE`

Read from `document.querySelector('[data-hero-artwork] img')` with `window.scrollY === 0`, after two
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
**MATCH — exact, not approximate.**

Everything else the geometry contract predicts holds:

- `transform-origin: 632.5px 0px` is `origin-top` resolved against the 1265 px content box
  (1265/2 = 632.5, vertical 0) — the top edge is the anchor, as `Hero.tsx:131` intends.
- `object-position: 52% 0%` matches `object-[52%_0%]` (`Hero.tsx:131`).
- **No `translateY` at all** — the matrix has `e = f = 0`. This is the Phase-3-to-now change
  documented at `Hero.tsx:88–127`: the pin is bought with `object-position`/`transform-origin`
  rather than a derived translate.
- The rect is `x: -1265, w: 3795` = exactly 3 × the 1265 px content box, growing symmetrically
  about the horizontal centre; `y: 0, h: 2400` = 3 × 800, growing downward from the top edge only.

### No building pixels at scroll 0

Two independent checks agree.

*Geometric.* The `<img>` content box is 1265×800 → aspect 1.581, below the artwork's
1672/941 = 1.777, so `object-cover` is height-bound and `f1 = 1`. The visible band is
`0 .. f1/S = 0 .. 0.3333` of the image height. The first rooftops start at row 330/941 = **0.351**
(`Hero.tsx:60–64`). 0.3333 < 0.351, with 16 source rows of clearance.

*Visual.* `hero-scroll0.png` shows sky, cloud bank, the distant ridgeline and treeline, and nothing
else. **No roof, wall or window is visible anywhere in the frame.**

The same holds at 375×812: `matrix(3, 0, 0, 3, 0, 0)`, rect `x: -375, y: 0, w: 1125, h: 2436`,
content box 375×812 → aspect 0.462, also height-bound, same 0..0.333 band.

### `sizes` resolves as designed (bonus verification)

`img.naturalWidth` is density-corrected against the `w`-descriptor `sizes` list, so it reports the
CSS width the browser resolved `CAMPUS_SIZES` to:

| Viewport | Reported `naturalWidth` | `CAMPUS_SIZES` = `(min-aspect-ratio: 1672/941) 100vw, 177.68vh` | |
|---|---|---|---|
| 1280×800 | **1421** | aspect 1.60 < 1.777 → `177.68vh` = 1.7768 × 800 = **1421.4** | MATCH |
| 375×812 | **1442** | aspect 0.46 < 1.777 → `177.68vh` = 1.7768 × 812 = **1442.8** | MATCH |

`currentSrc` is `Campus-1672.avif` at both — the top of the ladder, which is the correct pick for a
1421 px slot at DPR 1 (`src/lib/images.ts:25`, `:57`). AVIF was selected over WebP and the PNG
fallback was not fetched.

---

## 3. Hero mid-pan and revealed

`window.scrollTo(0, trackOffsetTop + p × (trackHeight − innerHeight))`, then two rAFs + 300 ms.
Track height 2080 px, viewport 800 px, so the scrollable span is 1280 px.

| Target `p` | `scrollY` | Actual `p` | Computed transform | Scale | Expected scale | |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | `matrix(3, 0, 0, 3, 0, 0)` | **3** | 3 | **MATCH** |
| 0.37 | 474 | 0.370313 | `matrix(1.66528, 0, 0, 1.66528, 0, 0)` | **1.66528** | **1.66528** | **MATCH** |
| 0.80 | 1024 | 0.8 | `none` | **1** | 1 | **MATCH** |

The expected column is `PAN_START_SCALE + (1 − PAN_START_SCALE) × ease(clamp(p / 0.75))` with
`ease = cubicBezier(0.4, 0, 0.35, 1)` (`src/lib/motion.ts:54`, `Hero.tsx:87`), solved by bisection in
the driver script. At the nominal `p = 0.37` that formula gives 1.6664; the 0.0011 gap is entirely
the scroll rounding — `0.37 × 1280 = 473.6` was rounded to `scrollY = 474`, i.e. `p = 0.370313`, and
`expectedScale(0.370313) = 1.66528`, which is the measured value to five decimals. **Exact match.**

At `p = 0.8` — past `PAN_SCROLL_FRACTION = 0.75` — the computed transform is `none`: `motion` drops
the transform entirely once `scale` reaches 1 rather than emitting `matrix(1,0,0,1,0,0)`. The rect is
`{ x: 0, y: 0, w: 1265, h: 800 }`, exactly the stage box, so the illustration is at its resting size.
`hero-revealed.png` shows the full campus — Library Tower centred, dormitories, plaza, foreground
snow — with the clouds fully faded (every layer's opacity reaches 0 by `p = 0.30`, and the pan does
not finish until 0.75, so nothing is ever revealed from under a cloud).

`hero-midpan.png` at `p = 0.37`, scale 1.665, shows the visible band at `0..1/1.665 = 0..0.60` of the
image — rooftops are on screen, which is the reveal doing its job.

---

## 4. Clouds — drift is running, and at the documented rate

Both samples taken at `scrollY = 0`, 1280×800, with `Page.bringToFront` issued first. `transform` read
from the three `[data-cloud-drift]` tracks.

| Layer | `t0` translateX | `t0 + ~6.4 s` translateX | Δ px | Documented period | Implied elapsed |
|---|---|---|---|---|---|
| far | −1303.10 | −1346.16 | **43.06** | 188 s | 6.40 s |
| mid | −1320.52 | −1383.27 | **62.75** | 129 s | 6.40 s |
| near | −1344.58 | −1434.52 | **89.94** | 90 s | 6.40 s |

**Drift is running.** All three transforms changed (`[true, true, true]`).

The implied-elapsed column is `Δ ÷ (W / period)` with `W = 1265 px`, one stage width of travel per
cycle (`HeroClouds.tsx:436–441`). All three layers independently imply **6.40 s** of wall clock (6.3994 / 6.3990 / 6.3989 s)
between the samples — the `sleep(6000)` plus the round-trip cost of the two `Runtime.evaluate` calls.
Three different periods producing one consistent elapsed time is strong evidence that the periods are
exactly the documented **188 / 129 / 90 s** (`HeroClouds.tsx:691–702`), and that rAF was running at
full rate. The measured near:far speed ratio is 89.94 / 43.06 = **2.089**, against the documented
2.09× (`HeroClouds.tsx:114`).

The scroll-linked wrappers were at `transform: none` with `opacity` 0.5 / 0.75 / 1 (far / mid /
near) at both samples — correct for `p = 0`, where the lift is 0 and each layer sits at its full
`layer.opacity`.

### Seam

**No seam is visible in either frame.** `clouds-t0.png` and `clouds-t1.png` show one continuous cloud
bank across the full 1280 px width; the clouds have visibly moved left between them with no
discontinuity, no abrupt vertical edge, and no repeated column.

This is a stronger check than "we did not happen to catch the wrap instant". The tracks were at
−1303 and −1346 px against a 1265 px tile, i.e. mid-tile, so a tile boundary sat on screen in both
frames (at x ≈ 1227 and x ≈ 1184 respectively) and no discontinuity appears there. The construction
that makes this work — `SET_COUNT` tiles each one stage wide, clouds allowed to overflow their own
tile so the overflow is reproduced one tile over — is documented at `HeroClouds.tsx:436–468`; the
observation is consistent with it. **Limit of this check:** it is a two-frame visual inspection at one
viewport, not a frame-by-frame sweep of a full 188 s cycle.

---

## 5. Reduced motion (`prefers-reduced-motion: reduce`)

`Emulation.setEmulatedMedia` with `features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]`,
then a full reload. `matchMedia('(prefers-reduced-motion: reduce)').matches` → **`true`**, so the
emulation took.

| Property | Measured | Expected | Source | |
|---|---|---|---|---|
| campus `<img>` `transform` | **`none`** | scale pinned to 1 | `Hero.tsx:150–152` | **MATCH** |
| campus `<img>` rect | `{ x: 0, y: 0, w: 1265, h: 800 }` | exactly the stage box | — | **MATCH** |
| `<section data-hero>` height | **800 px** | `h-dvh` ≈ `innerHeight` (800) | `Hero.tsx:176` | **MATCH** |
| cloud layer transforms | `none` ×3, opacity 0.5 / 0.75 / 1 | static resting composition | `HeroClouds.tsx:731` | **MATCH** |
| cloud transforms after 3.2 s | **byte-identical** to `t0` | no time-linked movement | `HeroClouds.tsx:731` | **MATCH** |
| elements with `will-change: transform` | **0** | none — nothing animates | `Hero.tsx:213`, `HeroClouds.tsx` | **MATCH** |
| `object-position` / `transform-origin` | `52% 0%` / `632.5px 0px` | unchanged | `Hero.tsx:131` | **MATCH** |

The track collapsing from 2080 px to 800 px means the 160dvh of pinned scrolling disappears
entirely — under reduced motion the page is 800 px of hero and then straight into the content, with
no dead scroll. `hero-reduced-motion.png` shows the finished frame as the *first* thing on screen:
the full campus at scale 1, with a visibly denser cloud bank along the top edge than the animated
branch's `hero-revealed.png` has at the same scale — because in the animated branch the layers have
faded to opacity 0 by `p = 0.30`, whereas here they sit at their full 0.5 / 0.75 / 1.

`RestingCloudSet` also renders no `[data-cloud-drift]` element at all under reduced motion — the
selector returned zero nodes, versus three in the animated branch. There is no drift track to
animate, not merely a paused one.

---

## 6. Every rendered link vs `src/lib/links.ts`

All 29 `<a>` elements in the rendered document (28 constant-derived anchors plus the skip link `#main`), read with `getAttribute` (not the resolved
`.href` property), at 1280×800. `visible` is `rect.width > 0 && rect.height > 0`.

### Header — `<header>`, 9 anchors

| # | Text | `href` | `target` | `rel` | Visible | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | *(logo lockup)* | `#top` | — | — | yes | n/a — in-page anchor | n/a |
| 2 | Schedule | `https://hackbu.org/schedule` | `_blank` | `noopener noreferrer` | yes | `NAV_LINKS[0].href` | **MATCH** |
| 3 | Resources | `https://hackbu.org/resources` | `_blank` | `noopener noreferrer` | yes | `NAV_LINKS[1].href` | **MATCH** |
| 4 | Hackathons | `https://hackbu.org/hackathons` | `_blank` | `noopener noreferrer` | yes | `NAV_LINKS[2].href` | **MATCH** |
| 5 | Discord *(CTA)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | yes | `DISCORD_URL` | **MATCH** |
| 6 | Schedule *(compact panel)* | `https://hackbu.org/schedule` | `_blank` | `noopener noreferrer` | no (`md:hidden`) | `NAV_LINKS[0].href` | **MATCH** |
| 7 | Resources *(compact panel)* | `https://hackbu.org/resources` | `_blank` | `noopener noreferrer` | no | `NAV_LINKS[1].href` | **MATCH** |
| 8 | Hackathons *(compact panel)* | `https://hackbu.org/hackathons` | `_blank` | `noopener noreferrer` | no | `NAV_LINKS[2].href` | **MATCH** |
| 9 | Join the Discord *(compact panel CTA)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | no | `DISCORD_URL` | **MATCH** |

The compact-panel anchors are in the DOM at desktop width but have zero-size rects — the panel is
`hidden` and `md:hidden`. They are not in the tab order (§7). At 375×812 the pairing inverts: the
five `md:flex` anchors go zero-size and the panel's four take over once it is opened.

### Footer — `<footer>`, 14 anchors

| # | Column | Text | `href` | `target` | `rel` | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Club | Schedule | `https://hackbu.org/schedule` | `_blank` | `noopener noreferrer` | `SITE_PAGES[0]` | **MATCH** |
| 2 | Club | Resources | `https://hackbu.org/resources` | `_blank` | `noopener noreferrer` | `SITE_PAGES[1]` | **MATCH** |
| 3 | Club | Hackathons | `https://hackbu.org/hackathons` | `_blank` | `noopener noreferrer` | `SITE_PAGES[2]` | **MATCH** |
| 4 | Club | Registration | `https://hackbu.org/registration` | `_blank` | `noopener noreferrer` | `SITE_PAGES[3]` | **MATCH** |
| 5 | More | Blog | `https://hackbu.org/blog` | `_blank` | `noopener noreferrer` | `SITE_PAGES[4]` | **MATCH** |
| 6 | More | Photos | `https://hackbu.org/photos` | `_blank` | `noopener noreferrer` | `SITE_PAGES[5]` | **MATCH** |
| 7 | More | Organizers | `https://hackbu.org/organizers` | `_blank` | `noopener noreferrer` | `SITE_PAGES[6]` | **MATCH** |
| 8 | More | Sponsors | `https://hackbu.org/sponsors` | `_blank` | `noopener noreferrer` | `SITE_PAGES[7]` | **MATCH** |
| 9 | Follow | Discord | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[0]` = `DISCORD_URL` | **MATCH** |
| 10 | Follow | GitHub | `https://github.com/HackBinghamton/HackBU` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[1]` | **MATCH** |
| 11 | Follow | LinkedIn | `https://www.linkedin.com/groups/8427110` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[2]` | **MATCH** |
| 12 | Follow | Facebook | `https://www.facebook.com/HackBinghamton` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[3]` | **MATCH** |
| 13 | Follow | Twitter | `https://twitter.com/HackBinghamton` | `_blank` | `noopener noreferrer` | `SOCIAL_LINKS[4]` | **MATCH** |
| 14 | — | hello@hackbu.org | `mailto:hello@hackbu.org` | *none* | *none* | `` `mailto:${CONTACT_EMAIL}` `` | **MATCH** |

Column order matches `SITE_PAGES.slice(0, 4)` / `.slice(4)` (`SiteFooter.tsx:16–17`) exactly, in
array order.

### `<main>` CTAs and body links — 5 anchors

| # | Text | `href` | `target` | `rel` | `links.ts` constant | Verdict |
|---|---|---|---|---|---|---|
| 1 | Join the Discord *(IntroSection)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `DISCORD_URL` | **MATCH** |
| 2 | Join the Discord *(GetInvolvedSection)* | `https://discord.gg/Xka5uUh` | `_blank` | `noopener noreferrer` | `DISCORD_URL` | **MATCH** |
| 3 | Sign up for the mailing list | `https://hackbu.org/mailing-list` | `_blank` | `noopener noreferrer` | `MAILING_LIST_URL` | **MATCH** |
| 4 | hello@hackbu.org *(ContactSection)* | `mailto:hello@hackbu.org` | *none* | *none* | `` `mailto:${CONTACT_EMAIL}` `` | **MATCH** |
| 5 | Workshop resources | `https://hackbu.org/resources` | `_blank` | `noopener noreferrer` | `RESOURCES_URL` | **MATCH** |

Plus the skip link `#main` (in-page, no constant).

### Summary

**27 of 27 constant-derived hrefs MATCH. 0 MISMATCH.** Every one of the 25 off-site anchors carries
`target="_blank"` **and** `rel="noopener noreferrer"` — the `ExternalLink` hardening holds at
runtime with no exceptions. Both `mailto:` anchors carry **no** `target` and **no** `rel`, which is
`MailLink`'s documented behaviour (`ExternalLink.tsx:47`, `:67`). The two in-page anchors (`#top`,
`#main`) carry neither, correctly.

Note that **P2-1** is a source-level duplication inside `links.ts` (`RESOURCES_URL` and
`DISCORD_URL` re-typed inside `NAV_LINKS` / `SITE_PAGES` / `SOCIAL_LINKS`). It has no runtime
symptom: the duplicated literals are byte-identical to the constants, which is exactly what this
table confirms — `RESOURCES_URL` and `NAV_LINKS[1].href` both render as
`https://hackbu.org/resources`. The risk P2-1 names is future drift, not present breakage.

### Accessible names (CDP `Accessibility.getPartialAXTree`, 1280×800)

| Selector | Computed role | Computed name |
|---|---|---|
| `header a[href="#top"]` | `link` | **"HackBU"** |
| `header nav a[href*="schedule"]` | `link` | "Schedule" |
| `header nav a[href*="discord"]` | `link` | "Discord" |
| `a[href="#main"]` | `link` | "Skip to content" |
| `footer a[href^="mailto:"]` | `link` | "hello@hackbu.org" |
| `[data-hero-artwork] img` | `image` | the full 199-character `CAMPUS_ALT` |
| `[data-hero]` | `region` | "Campus illustration" |

The header logo link's `innerText` is empty (both marks are CSS-masked empty `<span>`s), but its
computed accessible name is **"HackBU"**, supplied by the `role="img"` + `aria-label` wrapper at
`Wordmark.tsx:47–48`. Phase 4 recorded this as a PASS by inspection; it is now confirmed against a
real accessibility tree.

`header button[aria-controls="primary-menu"]` came back `role=none, ignored=true` — expected, and
not a defect: this probe ran at 1280 px where the toggle is `md:hidden` (`display: none`). Its
behaviour was verified at 375 px instead (§8).

---

## 7. Keyboard

From a fresh load at 1280×800 with `Emulation.setFocusEmulationEnabled` and `Page.bringToFront`,
`Input.dispatchKeyEvent` `keyDown`/`keyUp` with `key: 'Tab'`, `code: 'Tab'`,
`windowsVirtualKeyCode: 9`, reading `document.activeElement` after each press.

### Tab order — 25 stops, then out of the document

| Tab | Element | Region | Rect (x, y, w×h) |
|---|---|---|---|
| 1 | `a` "Skip to content" → `#main` | — | 16, 16, 145.7×40 |
| 2 | `a` logo lockup → `#top` | header | 153, 21, 199.6×37.5 |
| 3 | `a` Schedule | header | 678, 26, 75.1×28 |
| 4 | `a` Resources | header | 785, 26, 84.5×28 |
| 5 | `a` Hackathons | header | 901, 26, 95.6×28 |
| 6 | `a` **Discord (header CTA)** | header | 1029, 22, 83.5×37 |
| 7 | `a` Join the Discord | main | 153, 410, 223.3×63.8 |
| 8 | `a` Join the Discord | main | 824, 412, 239.3×71.8 |
| 9 | `a` Sign up for the mailing list | main | 748, 564, 171.1×17 |
| 10 | `a` hello@hackbu.org | main | 153, 432, 208.3×30 |
| 11 | `a` Workshop resources | main | 653, 433, 235.8×30 |
| 12–15 | `a` Schedule, Resources, Hackathons, Registration | footer | 401, 446 / 482 / 518 / 554, ~62–79×17 |
| 16–19 | `a` Blog, Photos, Organizers, Sponsors | footer | 649, 446 / 482 / 518 / 554, ~30–72×17 |
| 20–24 | `a` Discord, GitHub, LinkedIn, Facebook, Twitter | footer | 897, 446 / 482 / 518 / 554 / 590, ~46–65×17 |
| 25 | `a` hello@hackbu.org | footer | 153, 699, 119.9×21 |
| 26 | `body` — focus has left the document | — | — |

**Every interactive element is reached, once, in DOM order, with no traps and no dead stops.**
The reconciliation: the document holds **29** `<a>` elements (1 skip link + 9 header + 14 footer +
5 main) and **1** `<button>` (the menu toggle). At 1280 px the 4 compact-panel anchors and the
toggle are `display: none`, so 29 − 4 = **25** focusable elements — exactly the 25 stops observed.
Shift-Tab was not exercised.

### Skip link (P2-4)

| Step | Observed |
|---|---|
| Tab 1 | `document.activeElement` = `a[href="#main"]`, text "Skip to content" |
| Rect while focused | **145.7 × 40 at (16, 16)** — `position: absolute`, `clip: auto`, `clip-path: none` |
| Rect while unfocused | **1 × 1** (`sr-only`) |
| Outline while focused | `solid 2px rgb(60, 92, 72)` — the `pine` token |
| Enter | `location.hash` → **`"#main"`**, `scrollY` = 0 |
| `document.activeElement` after Enter | **`body`** |
| `document.getElementById('main')` | `tabIndex` = −1 (the default for a non-focusable element), **no `tabindex` attribute** |

So the skip link **works visually** — it un-hides on focus into a real 145.7×40 pill with a visible
2px pine outline (`focus-skip-link.png`) — and **moves the viewport**, but **does not move focus**:
`activeElement` falls back to `body`. This is exactly **P2-4** (`src/App.tsx:29`/`:37`), now confirmed
live rather than derived. Because the target is at the top of the document, `scrollY` stays 0 and
the visual outcome is indistinguishable from doing nothing; the cost is that the *next* Tab restarts
from the top of the page rather than continuing from `<main>`. Not re-raised here.

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

CDP-dispatched Tab **does** produce `:focus-visible` — `el.matches(':focus-visible')` returned
`true`, so this is the real keyboard-focus appearance, not the mouse one. 2px solid pine at 2px
offset matches the `focus-visible:outline-pine focus-visible:outline-2
focus-visible:outline-offset-2` contract. Screenshot `focus-header-cta.png`. **MATCH.**

### 2.4.11 Focus Not Obscured — the fixed header vs focused links

- Header height measured live: **81 px** (80 px bar + 1 px bottom border).
- `getComputedStyle(document.documentElement).scrollPaddingTop`: **96 px** (`6rem`,
  `src/index.css:22`).
- 96 > 81, with 15 px of margin.

Across all 25 tab stops, the smallest `rect.y` for any element *outside* the header was **410**
(Tab 7) — every below-the-fold link the browser scrolled into view landed hundreds of pixels clear
of the 81 px header. **Nothing was obscured at any point in the tab traversal.** *Limit:* this is
what happened at 1280×800 on this page's actual layout, where no focusable element sits close enough
to a scroll boundary to be pushed under the bar; it is not a proof that no viewport size could
produce one.

---

## 8. Mobile menu (375×812, `mobile: true`)

The toggle was operated with `.click()` via `Runtime.evaluate`; Escape was a real
`Input.dispatchKeyEvent`.

| Step | `aria-expanded` | `#primary-menu.hidden` | `document.activeElement` |
|---|---|---|---|
| Initial | `"false"` | `true` | — |
| After click | **`"true"`** | **`false`** | — |
| After Escape (focus on toggle) | **`"false"`** | **`true`** | `button` "Close menu" → **"Open menu"** (the toggle) |
| After Escape (focus on a panel link) | **`"false"`** | **`true`** | **the toggle**, 42×42 at (317, 11) |

- The panel exposes exactly the four expected hrefs when open: the three `NAV_LINKS` plus
  `DISCORD_URL`. Screenshot `mobile-menu-open.png`.
- The toggle's rect is **42 × 42** — comfortably over the 24×24 that WCAG 2.5.8 (AA) asks for, and
  2 px shy of the 44×44 of 2.5.5 (AAA), which is not a conformance target here.
- The `sr-only` label flips from "Open menu" to "Close menu" with state — visible in the
  `activeElement` text before and after Escape.
- **Escape returns focus to the toggle in both cases**, including the one that matters: focus parked
  on a link *inside* the panel that is about to be hidden. The `toggleRef.current?.focus()` at
  `SiteHeader.tsx:41` does what its comment claims. Without it, focus would be stranded on a
  `hidden` element.
- The panel is a disclosure, not a modal: focus is **not** moved into it on open and it is **not**
  focus-trapped. That is the correct pattern for `aria-expanded` + `aria-controls` on a button and is
  not raised as a finding.

*Not measured:* the tab order at 375 px (only the desktop traversal was recorded), and Shift-Tab out
of the open panel.

---

## 9. Horizontal overflow

| Preset | `documentElement.scrollWidth` | `window.innerWidth` | `documentElement.clientWidth` | `body.scrollWidth` | Overflow |
|---|---|---|---|---|---|
| Desktop 1280×800 | **1265** | **1280** | 1265 | 1265 | **none** (1265 < 1280) |
| Mobile 375×812 | **375** | **375** | 375 | 375 | **none** (equal) |

Desktop `scrollWidth` is 15 px under `innerWidth` because headless Edge renders a classic 15 px
scrollbar; `scrollWidth === clientWidth` on both presets, which is the real test. **No horizontal
scrollbar at either size.** Full-page captures: `desktop-full.png` (1280×7236) and `mobile-full.png`
(375×8339). *Caveat on those two:* they are `captureBeyondViewport` clips taken at `scrollY = 0`, so
the `sticky` hero stage is painted once at the top and the 260dvh track below it reads as one tall
frame — that is a screenshot artefact of full-page capture, not what a user scrolling sees.

---

## 10. Target sizes — real `getBoundingClientRect()` (P4-6)

All measured live, not derived from font metrics.

| Target | Desktop 1280×800 | Mobile 375×812 | ≥ 24×24? |
|---|---|---|---|
| Footer column links (13 of them) | 29.5–78.7 **× 17** | 29.5–78.7 **× 17** | **no — 17 px tall** |
| Footer mail link | **119.9 × 21** | **327 × 21** | **no — 21 px tall** |
| Header nav links | 75.1 / 84.5 / 95.6 **× 28** | *(hidden)* | **yes** |
| Header Discord CTA | **83.5 × 37** | *(hidden)* | **yes** |
| Header logo link | **199.6 × 37.5** | 159.7 × 30 | **yes** |
| Header menu toggle | *(hidden)* | **42 × 42** | **yes** |
| Skip link (focused) | **145.7 × 40** | not measured | **yes** |
| Intro CTA | **223.3 × 63.8** | not measured | **yes** |
| Get-involved CTA | **239.3 × 71.8** | not measured | **yes** |
| Mailing-list link | **171.1 × 17** | not measured | **no — 17 px tall** |
| Contact mail / resources links | **208.3 × 30** / **235.8 × 30** | not measured | **yes** |

**P4-6 resolved.** It flagged three targets as passing 2.5.8 "only through an exception, on derived
numbers". The numbers are now measured, and the exception holds:

- The footer column links are **17 px** tall, so they do not meet the 24×24 minimum directly. They
  qualify under the **spacing exception**: measured vertical pitch within a column is **36 px**
  (tab-stop rects at y = 446, 482, 518, 554), so 24 px-diameter circles centred on adjacent targets
  are 36 px apart and cannot intersect. Horizontally the three columns start at x = 401, 649 and 897
  with the widest link 78.7 px, leaving ≥ 169 px of clear space. The mobile footer links measure the
  same 17 px and use the same `gap-3` / `text-caption` classes, so the 36 px pitch carries over
  (*inference from identical classes, not separately measured*).
- The footer mail link is **21 px** tall and sits alone on its row above the copyright line (which
  is text, not a target). It spans y = 699..720; the nearest other target is the Twitter link, which
  ends at y = 607 — **92 px** of clear space, far past the 24 px the spacing exception needs.
- The mailing-list link (171.1 × 17) is inline in a sentence and takes 2.5.8's **inline exception**.

Nothing here is a new failure; **P4-6** can be closed as verified rather than left unverified.

---

## 11. `will-change: transform` (P5-7)

`document.querySelectorAll('*')` filtered on `getComputedStyle(el).willChange.includes('transform')`:

| State | Count | Elements |
|---|---|---|
| Scroll 0 | **7** | campus `<img>`, 3 × `[data-cloud-layer]`, 3 × `[data-cloud-drift]` |
| After the pan completes (`p = 0.8`) | **7** | *identical set* |
| Reduced motion | **0** | — |

`document.querySelectorAll('[style*="will-change"], .will-change-transform').length` returns the same
**7**, so every hint comes from the Tailwind `will-change-transform` class, not from an inline style.

This confirms **P5-7**'s static count of seven, and confirms the part that made it a note: **the hint
is never released.** All three cloud layers reach opacity 0 by `p = 0.30` and stop changing, and the
campus `<img>` stops changing at `p = 0.75`, but all seven still carry `will-change: transform` at
`p = 0.8`. Under reduced motion the count is 0, so the hint is correctly conditional on the motion
branch. Not re-raised.

**What is not measurable here.** Compositor layer count and layer memory were **not** measured. CDP
does expose a `LayerTree` domain, but this run did not enable it, and more importantly headless Edge
with `--disable-gpu` does not composite the way a GPU-backed browser does — any layer-memory figure
read here would not transfer to a real device, which is what P5-7 actually cares about. P5-7's
request for a DevTools Layers panel reading at 1440×900 and 390×844 therefore remains **open** and
must be done by hand in a headed browser.

---

## Screenshots

All under `audit/screenshots/`. Sizes from `ls -l`; dimensions read from each PNG's IHDR chunk.

| File | Dimensions | Bytes | What it shows |
|---|---|---|---|
| `hero-scroll0.png` | 1280×800 | 976255 | Hero at `scrollY = 0`, scale 3 — sky, clouds, ridgeline, treeline, **no buildings** |
| `hero-midpan.png` | 1280×800 | 1296240 | `p = 0.370`, scale 1.66528 — rooftops entering frame |
| `hero-revealed.png` | 1280×800 | 1558208 | `p = 0.8`, scale 1 (`transform: none`) — full campus, clouds gone |
| `clouds-t0.png` | 1280×800 | 979183 | Clouds at `t`, drift tracks at −1303 / −1321 / −1345 px |
| `clouds-t1.png` | 1280×800 | 978603 | Clouds at `t + 6.4 s`, tracks at −1346 / −1383 / −1435 px — visibly drifted, no seam |
| `hero-reduced-motion.png` | 1280×800 | 1649919 | `prefers-reduced-motion: reduce` — resting frame, static clouds, 800 px track |
| `focus-skip-link.png` | 1280×800 | 979236 | Tab 1 — skip link un-hidden, 145.7×40, 2px pine outline |
| `focus-header-cta.png` | 1280×800 | 980340 | Tab 6 — header Discord CTA with `:focus-visible` outline |
| `mobile-menu-open.png` | 375×812 | 204916 | Compact panel open, `aria-expanded="true"` |
| `mobile-full.png` | 375×8339 | 382195 | Full-page capture at 375×812 |
| `desktop-full.png` | 1280×7236 | 1089338 | Full-page capture at 1280×800 |

---

## Findings

### P7-1 — `note` — The dev server serves the landing page for every unknown path, including `/components*`, which is not what P5-4 derives for Vercel

**Evidence.** §1 route table, from the driver script: `/nonexistent` → 200, title `HackBU`,
`[data-hero]` present, `scrollHeight` 7236; `/componentsfoo` → **200**, byte-identical readout to
`/nonexistent`. `curl -s -o /dev/null -w "%{http_code}"` agrees for both. Also `/components` → 200
serving the sheet without the `.html` extension, identical to `/components.html` (title
`HackBU component sheet`, `scrollHeight` 28261, no `[data-hero]`).

**Expected + source.** **P5-4** (`audit/05-performance.md:805`, `:808`) derives from `vercel.json:9`
that on the deployed site `/componentsfoo` reaches a **platform 404** — the catch-all's
`(?!components)` lookahead fails on any path starting with `components` — while `/nonexistent`
rewrites to `/index.html` and returns a soft **200**. `README.md:90` claims the catch-all covers
"anything else", which **P6** row 18 already marks FALSE.

**Divergence, not a defect.** Vite's dev server applies its own `index.html` fallback with no
`/components*` exclusion, so the two environments disagree on exactly one class of URL. This phase
can only observe the dev server; it does not confirm or contradict the Vercel behaviour, which
remains derived from `vercel.json` and unverified against a real deployment.

**Suggested fix.** None here — the divergence is inherent to Vite dev vs Vercel routing; if anyone
wants them to agree, the fix belongs to `vercel.json`'s catch-all and is P5-4's call.

### P7-2 — `note` — unverified: the header logo link's `#top` target has the same non-focusable-target shape as P2-4

**Evidence.** Not measured live — Enter was dispatched on the skip link only. From source:
`<section id="top" data-hero>` (`src/components/Hero.tsx:167–170`) carries no `tabIndex`, and the
header logo link points at `#top` (`src/components/SiteHeader.tsx:50`). The live tab run shows the
logo link is Tab stop 2 with accessible name "HackBU", so it *is* keyboard-reachable and therefore
*can* be activated by Enter.

**Expected + source.** By the same reasoning as **P2-4** (`audit/02-code.md:255`), activating it
should scroll to the hero and leave `document.activeElement` on `body`.

**Why it is a note and not a finding.** A back-to-top logo link is not an accessibility affordance
that WCAG requires to move focus, and the target is the top of the document, so the practical cost
is nil. It is recorded only so that whoever fixes P2-4 by adding `tabIndex={-1}` knows there is a
second in-page anchor target with the same shape and can decide once.

**Suggested fix.** If P2-4 is fixed with `tabIndex={-1}` on `<main id="main">`, consider whether
`#top` wants the same treatment; otherwise leave it.

---

## Looks fine — what was checked and passed

Each item below was measured in the browser, not inferred.

1. **Console cleanliness.** 0 errors, 0 warnings, 0 exceptions, 0 `Log` entries at error or warning
   level, on all five routes, after a 3 s settle. (§1)
2. **Network cleanliness.** 0 `Network.loadingFailed` events and 0 responses with status ≥ 400 on all
   five routes. No missing artwork, fonts or brand masks. (§1)
3. **Hero start scale.** `matrix(3, 0, 0, 3, 0, 0)` at `scrollY = 0`, at both 1280×800 and 375×812 —
   exactly `PAN_START_SCALE = 3`. (§2)
4. **Hero pin geometry.** `object-position: 52% 0%`, `transform-origin: 632.5px 0px` (= `origin-top`),
   and **zero translate** in the matrix. (§2)
5. **No buildings at scroll 0.** Confirmed geometrically (band 0..0.3333 vs roofline 0.351) and
   visually in `hero-scroll0.png`. (§2)
6. **Responsive image selection.** `Campus-1672.avif` chosen at both viewports; density-corrected
   `naturalWidth` (1421 / 1442) matches `CAMPUS_SIZES`'s `177.68vh` to within a rounding step. (§2)
7. **Pan easing.** Measured scale at `p = 0.370313` is 1.66528; the `cubicBezier(0.4, 0, 0.35, 1)`
   formula gives 1.66528. Five-decimal agreement. (§3)
8. **Pan completion.** `transform: none` and a rect exactly equal to the stage box by `p = 0.8`,
   i.e. the pan really does finish at `PAN_SCROLL_FRACTION = 0.75` and holds. (§3)
9. **Cloud drift is running**, and all three layers imply the same 6.40 s elapsed from three
   different documented periods (188 / 129 / 90 s); measured speed ratio 2.089 vs documented 2.09. (§4)
10. **No cloud seam** in either sampled frame, with a tile boundary on screen in both. (§4)
11. **Reduced motion.** `transform: none`, track collapsed 2080 → 800 px, no `[data-cloud-drift]`
    element rendered at all, cloud transforms byte-identical across 3.2 s, `will-change` count 0. (§5)
12. **Link integrity.** 27/27 constant-derived hrefs MATCH `src/lib/links.ts`; 25/25 off-site anchors
    carry `target="_blank"` **and** `rel="noopener noreferrer"`; both `mailto:` anchors carry
    neither, by design. (§6)
13. **Accessible names.** Header logo link computes to "HackBU" despite empty text; hero `<img>`
    carries the full `CAMPUS_ALT`; hero section is a `region` named "Campus illustration". (§6)
14. **Tab order.** 25 stops, DOM order, no traps, no dead stops, every visible interactive element
    reached exactly once; hidden compact-panel anchors correctly excluded. (§7)
15. **Focus ring.** Header CTA under CDP-dispatched Tab matches `:focus-visible` and renders
    `solid 2px rgb(60, 92, 72)` at `2px` offset. (§7)
16. **Skip link visibility.** 1×1 unfocused → 145.7×40 focused with a 2px pine outline. (§7)
17. **2.4.11.** `scroll-padding-top` 96 px vs a measured 81 px header; no focused element was
    obscured at any of the 25 tab stops. (§7)
18. **Mobile menu.** `aria-expanded` toggles correctly, panel `hidden` toggles with it, panel exposes
    the four expected hrefs, Escape closes it, and **focus returns to the 42×42 toggle** from both
    the toggle and a panel link. (§8)
19. **No horizontal overflow** at 375×812 or 1280×800 — `scrollWidth === clientWidth` on both. (§9)
20. **Target sizes.** Every target either meets 24×24 or clears the spacing/inline exception on
    measured numbers, closing P4-6. (§10)

## Carried forward for Phase 8

- **P5-7's Layers reading remains open** — it cannot be taken headless with `--disable-gpu`, and this
  phase deliberately did not fabricate one.
- **P5-4's Vercel-side behaviour remains derived from `vercel.json`**, not observed; §1a shows only
  what the *dev server* does.
- **Not measured this phase:** Shift-Tab traversal, the tab order at 375 px, `prefers-contrast` /
  forced-colors, and any timing/paint metric.

---

## Commands run

### Environment setup

```bash
# dev server was already running; confirmed reachable
curl -s -o /dev/null -w "dev:%{http_code}\n" http://localhost:5173/      # -> dev:200

# per-route status straight from the dev server
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
```

```powershell
# launch headless Edge, remember only OUR pid
$sp = "<scratchpad>"
$p = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
  -ArgumentList "--headless=new","--remote-debugging-port=9333","--user-data-dir=$sp\edge-profile",`
                "--no-first-run","--no-default-browser-check","--disable-gpu",`
                "--window-size=1280,800","about:blank" -PassThru
$p.Id | Out-File -FilePath "$sp\edge.pid" -Encoding ascii   # PID=40508
```

```bash
node cdp-audit.mjs 9333 "C:/Users/danz3/Downloads/HackBUNew/audit/screenshots" "<scratchpad>/cdp-output.txt"
node cdp-ax.mjs 9333 "<scratchpad>/ax-output.txt"

# PNG dimensions
node -e 'const fs=require("fs");for(const f of fs.readdirSync(".").filter(x=>x.endsWith(".png"))){const b=fs.readFileSync(f);console.log(f,b.readUInt32BE(16)+"x"+b.readUInt32BE(20),b.length+"B");}'
```

```powershell
# teardown: only the pid we launched, with its renderer children
taskkill /PID (Get-Content "$sp\edge.pid") /T /F     # -> SUCCESS x12, PID 40508 and children
# CDP endpoint confirmed down afterwards; dev server left running
```


### Driver script — `cdp-audit.mjs` (verbatim)

Written to the scratchpad, not the repo. Invoked as `node cdp-audit.mjs 9333 <audit/screenshots> <out.txt>`.

````js
/**
 * Phase 7 live-behaviour probe. Drives headless Microsoft Edge over CDP.
 * Usage: node cdp-audit.mjs <cdp-port> <screenshot-out-dir>
 * Node 24 built-ins only (global WebSocket + fetch). No npm installs.
 */
import fs from 'node:fs'
import path from 'node:path'

const PORT = process.argv[2] || '9333'
const OUT = process.argv[3]
const BASE = 'http://localhost:5173'
fs.mkdirSync(OUT, { recursive: true })

/* ---------------------------------------------------------------- CDP glue */

let nextId = 1
const pending = new Map()
const listeners = []
let ws

function send(method, params = {}, sessionId) {
  const id = nextId++
  const msg = { id, method, params }
  if (sessionId) msg.sessionId = sessionId
  ws.send(JSON.stringify(msg))
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method })
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id)
        reject(new Error(`timeout: ${method}`))
      }
    }, 60000)
  })
}
function on(method, fn) {
  listeners.push({ method, fn })
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const sock = new WebSocket(url)
    sock.onopen = () => resolve(sock)
    sock.onerror = (e) => reject(new Error('ws error ' + e.message))
    sock.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id)
        pending.delete(m.id)
        if (m.error) p.reject(new Error(`${p.method}: ${JSON.stringify(m.error)}`))
        else p.resolve(m.result)
        return
      }
      for (const l of listeners) if (l.method === m.method) l.fn(m.params, m)
    }
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/* -------------------------------------------------------------- log buffers */

let bufConsole = []
let bufExceptions = []
let bufLog = []
let bufNetFailed = []
let bufNetStatus = []
const clearBufs = () => {
  bufConsole = []
  bufExceptions = []
  bufLog = []
  bufNetFailed = []
  bufNetStatus = []
}

/* -------------------------------------------------------------- report sink */

const REPORT = []
function say(...parts) {
  const line = parts.join(' ')
  REPORT.push(line)
  console.log(line)
}
function block(title) {
  say('')
  say('##### ' + title)
}

/* --------------------------------------------------------------- page utils */

let S // sessionId

async function evalJS(expression, awaitPromise = false) {
  const r = await send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise },
    S,
  )
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}
function once(method, timeout = 15000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), timeout)
    const entry = {
      method,
      fn: (p) => {
        clearTimeout(t)
        const i = listeners.indexOf(entry)
        if (i >= 0) listeners.splice(i, 1)
        resolve(p)
      },
    }
    listeners.push(entry)
  })
}
async function goto(url, settleMs = 3000) {
  clearBufs()
  const loaded = once('Page.loadEventFired')
  await send('Page.navigate', { url }, S)
  await loaded
  await sleep(settleMs)
}
async function settleFrames(ms = 300) {
  await evalJS(
    'new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(r,' + ms + '))))',
    true,
  )
}
async function shot(name, opts = {}) {
  const params = { format: 'png', ...opts }
  const r = await send('Page.captureScreenshot', params, S)
  const p = path.join(OUT, name)
  fs.writeFileSync(p, Buffer.from(r.data, 'base64'))
  say(`  screenshot ${name} (${fs.statSync(p).size} bytes)`)
}
async function viewport(width, height, mobile) {
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile: !!mobile },
    S,
  )
}
function fmtErrs(label) {
  const errs = []
  for (const c of bufConsole) if (c.type === 'error') errs.push(`console.error: ${c.text}`)
  for (const e of bufExceptions) errs.push(`exception: ${e}`)
  for (const l of bufLog) if (l.level === 'error') errs.push(`log(${l.source}): ${l.text}`)
  const warns = bufConsole.filter((c) => c.type === 'warning' || c.type === 'warn').map((c) => `console.warn: ${c.text}`)
  for (const l of bufLog) if (l.level === 'warning') warns.push(`log(${l.source}): ${l.text}`)
  const net = []
  for (const f of bufNetFailed) net.push(`FAILED ${f.type} ${f.url} — ${f.errorText}`)
  for (const s of bufNetStatus) net.push(`HTTP ${s.status} ${s.url}`)
  say(`  ${label} console errors: ${errs.length === 0 ? '0 errors' : errs.length}`)
  errs.forEach((e) => say('    - ' + e))
  say(`  ${label} console warnings: ${warns.length === 0 ? '0 warnings' : warns.length}`)
  warns.forEach((e) => say('    - ' + e))
  say(`  ${label} failed / >=400 network: ${net.length === 0 ? '0' : net.length}`)
  net.forEach((e) => say('    - ' + e))
}

/* ------------------------------------------------------- cubic-bezier maths */

function cubicBezier(x1, y1, x2, y2) {
  const bx = (t) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
  const by = (t) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
  return (x) => {
    let lo = 0,
      hi = 1
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      if (bx(mid) < x) lo = mid
      else hi = mid
    }
    return by((lo + hi) / 2)
  }
}
const EASE = cubicBezier(0.4, 0, 0.35, 1)
const PAN_START_SCALE = 3
const PAN_SCROLL_FRACTION = 0.75
const expectedScale = (p) => {
  const t = Math.min(1, Math.max(0, p / PAN_SCROLL_FRACTION))
  return PAN_START_SCALE + (1 - PAN_START_SCALE) * EASE(t)
}

/* ------------------------------------------------------------- page readers */

const READ_CAMPUS = `(() => {
  const img = document.querySelector('[data-hero-artwork] img');
  if (!img) return { error: 'no campus img' };
  const cs = getComputedStyle(img);
  const r = img.getBoundingClientRect();
  const track = document.querySelector('[data-hero]');
  const tr = track.getBoundingClientRect();
  return {
    transform: cs.transform,
    objectPosition: cs.objectPosition,
    transformOrigin: cs.transformOrigin,
    willChange: cs.willChange,
    rect: { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), bottom: +r.bottom.toFixed(1) },
    currentSrc: img.currentSrc.split('/').pop(),
    naturalW: img.naturalWidth, naturalH: img.naturalHeight,
    trackHeight: +track.offsetHeight.toFixed(1),
    trackRectTop: +tr.top.toFixed(1),
    scrollY: Math.round(window.scrollY),
    innerW: window.innerWidth, innerH: window.innerHeight
  };
})()`

const READ_CLOUDS = `(() => {
  const out = [];
  document.querySelectorAll('[data-cloud-drift]').forEach((el, i) => {
    const cs = getComputedStyle(el);
    out.push({ i, layer: el.parentElement.getAttribute('data-cloud-layer'), transform: cs.transform, willChange: cs.willChange });
  });
  document.querySelectorAll('[data-cloud-layer]').forEach((el) => {
    const cs = getComputedStyle(el);
    out.push({ wrapper: el.getAttribute('data-cloud-layer'), transform: cs.transform, opacity: cs.opacity });
  });
  return out;
})()`

const WILLCHANGE_COUNT = `(() => {
  let n = 0; const tags = [];
  document.querySelectorAll('*').forEach((el) => {
    const wc = getComputedStyle(el).willChange;
    if (wc && wc.includes('transform')) { n++; if (tags.length < 12) tags.push(el.tagName.toLowerCase() + (el.dataset && Object.keys(el.dataset)[0] ? '[data-' + Object.keys(el.dataset)[0] + ']' : '') ); }
  });
  return { count: n, sample: tags, attrCount: document.querySelectorAll('[style*="will-change"], .will-change-transform').length };
})()`

function linkDump(scope) {
  return `(() => {
    const root = document.querySelector('${scope}');
    if (!root) return { error: 'no ${scope}' };
    return [...root.querySelectorAll('a')].map(a => {
      const r = a.getBoundingClientRect();
      return {
        text: (a.innerText || a.textContent || '').trim().slice(0, 40),
        href: a.getAttribute('href'),
        target: a.getAttribute('target'),
        rel: a.getAttribute('rel'),
        visible: r.width > 0 && r.height > 0,
        w: +r.width.toFixed(1), h: +r.height.toFixed(1)
      };
    });
  })()`
}

const ACTIVE_EL = `(() => {
  const a = document.activeElement;
  if (!a) return null;
  const r = a.getBoundingClientRect();
  return {
    tag: a.tagName.toLowerCase(),
    text: (a.innerText || a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 46),
    href: a.getAttribute && a.getAttribute('href'),
    ariaLabel: a.getAttribute && a.getAttribute('aria-label'),
    inHeader: !!a.closest && !!a.closest('header'),
    inFooter: !!a.closest && !!a.closest('footer'),
    rect: { x: Math.round(r.x), y: Math.round(r.y), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }
  };
})()`

async function key(k, code, vk, text) {
  const p = { key: k, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk }
  await send('Input.dispatchKeyEvent', { type: 'keyDown', ...p, ...(text ? { text } : {}) }, S)
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...p }, S)
}
const tab = () => key('Tab', 'Tab', 9)

async function scrollToProgress(p) {
  await evalJS(
    `(() => { const t = document.querySelector('[data-hero]');
      const max = t.offsetHeight - window.innerHeight;
      window.scrollTo(0, Math.round(t.offsetTop + ${p} * max)); return window.scrollY; })()`,
  )
  await settleFrames(300)
}
function scaleFromMatrix(m) {
  const nums = /matrix(3d)?\(([^)]+)\)/.exec(m)
  if (!nums) return null
  const a = nums[2].split(',').map((s) => parseFloat(s.trim()))
  return nums[1] ? a[0] : a[0]
}

/* ---------------------------------------------------------------- main flow */

async function main() {
  const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
  say('Edge: ' + ver.Browser + ' / ' + ver['User-Agent'])
  ws = await connect(ver.webSocketDebuggerUrl)

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const att = await send('Target.attachToTarget', { targetId, flatten: true })
  S = att.sessionId

  await send('Page.enable', {}, S)
  await send('Runtime.enable', {}, S)
  await send('Log.enable', {}, S)
  await send('Network.enable', {}, S)
  try { await send('Emulation.setFocusEmulationEnabled', { enabled: true }, S) } catch (e) { say('focus emulation unavailable: ' + e.message) }

  on('Runtime.consoleAPICalled', (p) => {
    if (p.sessionId !== undefined && p.sessionId !== S) return
    bufConsole.push({ type: p.type, text: (p.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 300) })
  })
  on('Runtime.exceptionThrown', (p) => {
    bufExceptions.push((p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '?').slice(0, 300))
  })
  on('Log.entryAdded', (p) => {
    bufLog.push({ level: p.entry.level, source: p.entry.source, text: (p.entry.text + ' ' + (p.entry.url || '')).slice(0, 300) })
  })
  on('Network.loadingFailed', (p) => {
    bufNetFailed.push({ type: p.type, url: p.request?.url || '(unknown)', errorText: p.errorText })
  })
  on('Network.requestWillBeSent', (p) => { reqUrl.set(p.requestId, p.request.url) })
  on('Network.responseReceived', (p) => {
    if (p.response.status >= 400) bufNetStatus.push({ status: p.response.status, url: p.response.url })
    docStatus.set(p.response.url, p.response.status)
  })

  await viewport(1280, 800, false)

  /* ---- 1. per-route console + network ---- */
  block('1. Route load: console + network (3s settle)')
  for (const route of ['/', '/components', '/components.html', '/nonexistent', '/componentsfoo']) {
    docStatus.clear()
    await goto(BASE + route, 3000)
    const info = await evalJS(`(() => ({
      url: location.pathname,
      title: document.title,
      h1: (document.querySelector('h1')||{}).innerText || null,
      hero: !!document.querySelector('[data-hero]'),
      bodyStart: document.body.innerText.replace(/\\s+/g,' ').trim().slice(0,110),
      docHeight: document.documentElement.scrollHeight
    }))()`)
    say(`ROUTE ${route}  docStatus=${docStatus.get(BASE + route) ?? '(not seen)'}  title="${info.title}"  h1="${info.h1}"  hero=${info.hero}`)
    say(`  renders: "${info.bodyStart}"  docHeight=${info.docHeight}`)
    fmtErrs(route)
  }

  /* ---- 2/3. hero pan ---- */
  block('2-3. Hero pan (1280x800)')
  await goto(BASE + '/', 2500)
  await evalJS('window.scrollTo(0,0)')
  await settleFrames(400)
  let c = await evalJS(READ_CAMPUS)
  say('scroll 0: ' + JSON.stringify(c))
  say(`  scale from matrix = ${scaleFromMatrix(c.transform)}  expected(p=0) = ${expectedScale(0)}`)
  await shot('hero-scroll0.png')

  for (const [p, name] of [[0.37, 'hero-midpan.png'], [0.8, 'hero-revealed.png']]) {
    await scrollToProgress(p)
    const cc = await evalJS(READ_CAMPUS)
    say(`progress ~${p}: scrollY=${cc.scrollY} scale=${scaleFromMatrix(cc.transform)} expected=${expectedScale(p).toFixed(4)} transform=${cc.transform} rect=${JSON.stringify(cc.rect)}`)
    await shot(name)
  }
  const wcAfter = await evalJS(WILLCHANGE_COUNT)
  say('will-change after pan: ' + JSON.stringify(wcAfter))
  await evalJS('window.scrollTo(0,0)')
  await settleFrames(400)
  const wcTop = await evalJS(WILLCHANGE_COUNT)
  say('will-change at scroll 0: ' + JSON.stringify(wcTop))

  /* ---- 4. clouds drift ---- */
  block('4. Cloud drift (scroll 0, 1280x800)')
  await send('Page.bringToFront', {}, S)
  await evalJS('window.scrollTo(0,0)')
  await settleFrames(500)
  const cl0 = await evalJS(READ_CLOUDS)
  say('t0: ' + JSON.stringify(cl0))
  await shot('clouds-t0.png')
  await sleep(6000)
  const cl1 = await evalJS(READ_CLOUDS)
  say('t0+6s: ' + JSON.stringify(cl1))
  await shot('clouds-t1.png')
  const moved = cl0.filter((x) => x.i !== undefined).map((x, i) => x.transform !== cl1[i].transform)
  say('drift transforms changed per layer: ' + JSON.stringify(moved))

  /* ---- 9/10 desktop: overflow, links, rects ---- */
  block('6/9/10. Desktop 1280x800: overflow, links, rects')
  const ov1 = await evalJS(`({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScrollWidth: document.body.scrollWidth, clientWidth: document.documentElement.clientWidth })`)
  say('overflow desktop: ' + JSON.stringify(ov1))
  const hdrD = await evalJS(linkDump('header'))
  say('HEADER links (desktop): ' + JSON.stringify(hdrD, null, 1))
  const ftrD = await evalJS(linkDump('footer'))
  say('FOOTER links (desktop): ' + JSON.stringify(ftrD, null, 1))
  const mainD = await evalJS(linkDump('main'))
  say('MAIN links/CTAs (desktop): ' + JSON.stringify(mainD, null, 1))
  const skipD = await evalJS(`(() => { const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')==='#main'); const r=a.getBoundingClientRect(); return { href:a.getAttribute('href'), text:a.textContent.trim(), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; })()`)
  say('skip link: ' + JSON.stringify(skipD))
  const fullH = await evalJS('Math.min(document.documentElement.scrollHeight, 14000)')
  await shot('desktop-full.png', { captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1280, height: fullH, scale: 1 } })

  /* ---- 7. keyboard ---- */
  block('7. Keyboard tab order (1280x800, fresh load)')
  await goto(BASE + '/', 2000)
  await send('Page.bringToFront', {}, S)
  await evalJS('document.body.focus(); window.scrollTo(0,0)')
  await tab()
  await sleep(150)
  const first = await evalJS(ACTIVE_EL)
  say('Tab 1 -> ' + JSON.stringify(first))
  const skipVis = await evalJS(`(() => { const a=document.activeElement; const cs=getComputedStyle(a); const r=a.getBoundingClientRect(); return { clip: cs.clip, clipPath: cs.clipPath, position: cs.position, w:+r.width.toFixed(1), h:+r.height.toFixed(1), top:Math.round(r.top), left:Math.round(r.left), outline: cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor, visible: r.width>1 && r.height>1 }; })()`)
  say('skip link when focused: ' + JSON.stringify(skipVis))
  await shot('focus-skip-link.png')

  const order = [first]
  let ctaShot = false
  for (let i = 2; i <= 40; i++) {
    await tab()
    await sleep(80)
    const a = await evalJS(ACTIVE_EL)
    order.push(a)
    if (!ctaShot && a && a.inHeader && a.href && a.href.includes('discord.gg')) {
      const outline = await evalJS(`(() => { const el=document.activeElement; const cs=getComputedStyle(el); return { matchesFocusVisible: el.matches(':focus-visible'), outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth, outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow }; })()`)
      say(`header Discord CTA focused at Tab ${i}: ` + JSON.stringify(outline))
      await evalJS('window.scrollTo(0,0)')
      await settleFrames(200)
      await shot('focus-header-cta.png')
      ctaShot = true
    }
    if (a && a.tag === 'body') break
  }
  order.forEach((a, i) => say(`  Tab ${i + 1}: ` + JSON.stringify(a)))

  /* skip link activation */
  block('7b. Skip link activation')
  await goto(BASE + '/', 1500)
  await send('Page.bringToFront', {}, S)
  await tab()
  await sleep(120)
  say('before Enter, active = ' + JSON.stringify(await evalJS(ACTIVE_EL)))
  await key('Enter', 'Enter', 13, '\r')
  await sleep(600)
  say('after Enter: hash=' + JSON.stringify(await evalJS('location.hash')) + ' scrollY=' + (await evalJS('Math.round(window.scrollY)')))
  say('after Enter, active = ' + JSON.stringify(await evalJS(ACTIVE_EL)))
  say('main tabindex = ' + JSON.stringify(await evalJS(`(() => { const m=document.getElementById('main'); return { tabIndex: m.tabIndex, hasAttr: m.hasAttribute('tabindex') }; })()`)))
  say('scroll-padding-top = ' + JSON.stringify(await evalJS(`getComputedStyle(document.documentElement).scrollPaddingTop`)))
  say('header height = ' + JSON.stringify(await evalJS(`document.querySelector('header').getBoundingClientRect().height`)))

  /* ---- 5. reduced motion ---- */
  block('5. prefers-reduced-motion: reduce (1280x800)')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, S)
  await goto(BASE + '/', 2500)
  await evalJS('window.scrollTo(0,0)')
  await settleFrames(400)
  const rmMatch = await evalJS(`matchMedia('(prefers-reduced-motion: reduce)').matches`)
  say('matchMedia reduce = ' + rmMatch)
  const rc = await evalJS(READ_CAMPUS)
  say('reduced-motion campus: ' + JSON.stringify(rc))
  say(`  scale = ${scaleFromMatrix(rc.transform) ?? 'none (no matrix)'}  trackHeight=${rc.trackHeight} innerH=${rc.innerH}`)
  const rcl0 = await evalJS(READ_CLOUDS)
  await shot('hero-reduced-motion.png')
  await sleep(3200)
  const rcl1 = await evalJS(READ_CLOUDS)
  say('reduced clouds t0: ' + JSON.stringify(rcl0))
  say('reduced clouds t0+3.2s: ' + JSON.stringify(rcl1))
  say('reduced clouds static: ' + (JSON.stringify(rcl0) === JSON.stringify(rcl1)))
  say('reduced will-change: ' + JSON.stringify(await evalJS(WILLCHANGE_COUNT)))
  await send('Emulation.setEmulatedMedia', { features: [] }, S)

  /* ---- 8/9/10 mobile ---- */
  block('8/9/10. Mobile 375x812')
  await viewport(375, 812, true)
  await goto(BASE + '/', 2500)
  const ov2 = await evalJS(`({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScrollWidth: document.body.scrollWidth, clientWidth: document.documentElement.clientWidth })`)
  say('overflow mobile: ' + JSON.stringify(ov2))
  const fullH2 = await evalJS('Math.min(document.documentElement.scrollHeight, 20000)')
  await shot('mobile-full.png', { captureBeyondViewport: true, clip: { x: 0, y: 0, width: 375, height: fullH2, scale: 1 } })

  const hdrM = await evalJS(linkDump('header'))
  say('HEADER links (mobile, menu closed): ' + JSON.stringify(hdrM))
  const ftrM = await evalJS(linkDump('footer'))
  say('FOOTER links (mobile): ' + JSON.stringify(ftrM, null, 1))
  const mailM = await evalJS(`(() => { const a=document.querySelector('footer a[href^="mailto:"]'); const r=a.getBoundingClientRect(); return { href:a.getAttribute('href'), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; })()`)
  say('footer mail link (mobile): ' + JSON.stringify(mailM))

  say('menu button before click: ' + JSON.stringify(await evalJS(`(() => { const b=document.querySelector('header button[aria-controls="primary-menu"]'); const r=b.getBoundingClientRect(); return { ariaExpanded: b.getAttribute('aria-expanded'), w:+r.width.toFixed(1), h:+r.height.toFixed(1), panelHidden: document.getElementById('primary-menu').hidden }; })()`)))
  await evalJS(`document.querySelector('header button[aria-controls="primary-menu"]').click()`)
  await settleFrames(400)
  say('menu button after click: ' + JSON.stringify(await evalJS(`(() => { const b=document.querySelector('header button[aria-controls="primary-menu"]'); return { ariaExpanded: b.getAttribute('aria-expanded'), panelHidden: document.getElementById('primary-menu').hidden, panelLinks: [...document.getElementById('primary-menu').querySelectorAll('a')].map(a=>a.getAttribute('href')) }; })()`)))
  await shot('mobile-menu-open.png')
  await evalJS(`document.querySelector('header button[aria-controls="primary-menu"]').focus()`)
  say('focus moved into panel? active = ' + JSON.stringify(await evalJS(ACTIVE_EL)))
  await send('Page.bringToFront', {}, S)
  await key('Escape', 'Escape', 27)
  await settleFrames(400)
  say('after Escape: ' + JSON.stringify(await evalJS(`(() => { const b=document.querySelector('header button[aria-controls="primary-menu"]'); return { ariaExpanded: b.getAttribute('aria-expanded'), panelHidden: document.getElementById('primary-menu').hidden }; })()`)))
  say('after Escape, active = ' + JSON.stringify(await evalJS(ACTIVE_EL)))

  /* Escape from a focused panel link */
  block('8b. Escape while focus is inside the open panel')
  await evalJS(`document.querySelector('header button[aria-controls="primary-menu"]').click()`)
  await settleFrames(300)
  await evalJS(`document.getElementById('primary-menu').querySelector('a').focus()`)
  say('focused panel link: ' + JSON.stringify(await evalJS(ACTIVE_EL)))
  await key('Escape', 'Escape', 27)
  await settleFrames(400)
  say('after Escape: ' + JSON.stringify(await evalJS(`(() => { const b=document.querySelector('header button[aria-controls="primary-menu"]'); return { ariaExpanded: b.getAttribute('aria-expanded'), panelHidden: document.getElementById('primary-menu').hidden }; })()`)))
  say('after Escape, active = ' + JSON.stringify(await evalJS(ACTIVE_EL)))

  /* mobile hero scale sanity */
  block('2b. Hero scale at 375x812')
  await evalJS('window.scrollTo(0,0)')
  await settleFrames(400)
  const cm = await evalJS(READ_CAMPUS)
  say('mobile scroll 0 campus: ' + JSON.stringify(cm))
  say('  scale = ' + scaleFromMatrix(cm.transform))

  say('')
  say('DONE')
}

const reqUrl = new Map()
const docStatus = new Map()

main()
  .catch((e) => {
    say('FATAL: ' + (e.stack || e.message))
  })
  .finally(async () => {
    fs.writeFileSync(process.argv[4] || 'cdp-output.txt', REPORT.join('\n'))
    try { ws.close() } catch {}
    process.exit(0)
  })
````

### Accessible-name probe — `cdp-ax.mjs` (verbatim)

````js
/** Supplementary: computed accessible names for header/footer links. */
import fs from 'node:fs'
const PORT = process.argv[2] || '9333'
let nextId = 1
const pending = new Map()
const listeners = []
let ws, S
function send(method, params = {}, sessionId) {
  const id = nextId++
  const msg = { id, method, params }
  if (sessionId) msg.sessionId = sessionId
  ws.send(JSON.stringify(msg))
  return new Promise((res, rej) => {
    pending.set(id, { res, rej, method })
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error('timeout ' + method)) } }, 30000)
  })
}
function connect(url) {
  return new Promise((resolve, reject) => {
    const s = new WebSocket(url)
    s.onopen = () => resolve(s)
    s.onerror = (e) => reject(e)
    s.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && pending.has(m.id)) {
        const p = pending.get(m.id); pending.delete(m.id)
        if (m.error) p.rej(new Error(p.method + ': ' + JSON.stringify(m.error))); else p.res(m.result)
        return
      }
      for (const l of listeners) if (l.method === m.method) l.fn(m.params)
    }
  })
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const out = []
const say = (s) => { out.push(s); console.log(s) }

const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()
ws = await connect(ver.webSocketDebuggerUrl)
const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
S = (await send('Target.attachToTarget', { targetId, flatten: true })).sessionId
await send('Page.enable', {}, S)
await send('Runtime.enable', {}, S)
await send('DOM.enable', {}, S)
await send('Accessibility.enable', {}, S)
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, S)
await send('Page.navigate', { url: 'http://localhost:5173/' }, S)
await sleep(4000)

const { root } = await send('DOM.getDocument', { depth: -1, pierce: true }, S)
async function axFor(selector) {
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector }, S)
  if (!nodeId) return `${selector}: NOT FOUND`
  const { nodes } = await send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false }, S)
  const n = nodes[0]
  return `${selector}: role=${n?.role?.value} name=${JSON.stringify(n?.name?.value)} ignored=${n?.ignored}`
}
for (const sel of [
  'header a[href="#top"]',
  'header nav a[href*="schedule"]',
  'header nav a[href*="discord"]',
  'header button[aria-controls="primary-menu"]',
  'a[href="#main"]',
  'footer a[href^="mailto:"]',
  '[data-hero-artwork] img',
  '[data-hero]',
]) {
  say(await axFor(sel))
}
say('hero section aria-label = ' + JSON.stringify((await send('Runtime.evaluate', { expression: `document.querySelector('[data-hero]').getAttribute('aria-label')`, returnByValue: true }, S)).result.value))
say('campus alt = ' + JSON.stringify((await send('Runtime.evaluate', { expression: `document.querySelector('[data-hero-artwork] img').alt.slice(0,120)`, returnByValue: true }, S)).result.value))
fs.writeFileSync(process.argv[3] || 'ax-output.txt', out.join('\n'))
ws.close()
process.exit(0)
````

### Raw output of `cdp-audit.mjs`

````text
Edge: Edg/151.0.4129.93 / Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0

##### 1. Route load: console + network (3s settle)
ROUTE /  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  renders: "Skip to content Schedule Resources Hackathons Discord BINGHAMTON UNIVERSITY Learn to build apps with other stu"  docHeight=7236
  / console errors: 0 errors
  / console warnings: 0 warnings
  / failed / >=400 network: 0
ROUTE /components  docStatus=200  title="HackBU component sheet"  h1="The HackBU component sheet."  hero=false
  renders: "Skip to the sheet INTERNAL · NOT LINKED FROM THE SITE The HackBU component sheet. Every component in the landi"  docHeight=28261
  /components console errors: 0 errors
  /components console warnings: 0 warnings
  /components failed / >=400 network: 0
ROUTE /components.html  docStatus=200  title="HackBU component sheet"  h1="The HackBU component sheet."  hero=false
  renders: "Skip to the sheet INTERNAL · NOT LINKED FROM THE SITE The HackBU component sheet. Every component in the landi"  docHeight=28261
  /components.html console errors: 0 errors
  /components.html console warnings: 0 warnings
  /components.html failed / >=400 network: 0
ROUTE /nonexistent  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  renders: "Skip to content Schedule Resources Hackathons Discord BINGHAMTON UNIVERSITY Learn to build apps with other stu"  docHeight=7236
  /nonexistent console errors: 0 errors
  /nonexistent console warnings: 0 warnings
  /nonexistent failed / >=400 network: 0
ROUTE /componentsfoo  docStatus=200  title="HackBU"  h1="Learn to build apps with other students."  hero=true
  renders: "Skip to content Schedule Resources Hackathons Discord BINGHAMTON UNIVERSITY Learn to build apps with other stu"  docHeight=7236
  /componentsfoo console errors: 0 errors
  /componentsfoo console warnings: 0 warnings
  /componentsfoo failed / >=400 network: 0

##### 2-3. Hero pan (1280x800)
scroll 0: {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"632.5px 0px","willChange":"transform","rect":{"x":-1265,"y":0,"w":3795,"h":2400,"bottom":2400},"currentSrc":"Campus-1672.avif","naturalW":1421,"naturalH":799,"trackHeight":2080,"trackRectTop":0,"scrollY":0,"innerW":1280,"innerH":800}
  scale from matrix = 3  expected(p=0) = 3
  screenshot hero-scroll0.png (976255 bytes)
progress ~0.37: scrollY=474 scale=1.66528 expected=1.6664 transform=matrix(1.66528, 0, 0, 1.66528, 0, 0) rect={"x":-420.8,"y":0,"w":2106.6,"h":1332.2,"bottom":1332.2}
  screenshot hero-midpan.png (1296240 bytes)
progress ~0.8: scrollY=1024 scale=null expected=1.0000 transform=none rect={"x":0,"y":0,"w":1265,"h":800,"bottom":800}
  screenshot hero-revealed.png (1558208 bytes)
will-change after pan: {"count":7,"sample":["img","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]"],"attrCount":7}
will-change at scroll 0: {"count":7,"sample":["img","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]","div[data-cloudLayer]","div[data-cloudDrift]"],"attrCount":7}

##### 4. Cloud drift (scroll 0, 1280x800)
t0: [{"i":0,"layer":"far","transform":"matrix(1, 0, 0, 1, -1303.1, 0)","willChange":"transform"},{"i":1,"layer":"mid","transform":"matrix(1, 0, 0, 1, -1320.52, 0)","willChange":"transform"},{"i":2,"layer":"near","transform":"matrix(1, 0, 0, 1, -1344.58, 0)","willChange":"transform"},{"wrapper":"far","transform":"none","opacity":"0.5"},{"wrapper":"mid","transform":"none","opacity":"0.75"},{"wrapper":"near","transform":"none","opacity":"1"}]
  screenshot clouds-t0.png (979183 bytes)
t0+6s: [{"i":0,"layer":"far","transform":"matrix(1, 0, 0, 1, -1346.16, 0)","willChange":"transform"},{"i":1,"layer":"mid","transform":"matrix(1, 0, 0, 1, -1383.27, 0)","willChange":"transform"},{"i":2,"layer":"near","transform":"matrix(1, 0, 0, 1, -1434.52, 0)","willChange":"transform"},{"wrapper":"far","transform":"none","opacity":"0.5"},{"wrapper":"mid","transform":"none","opacity":"0.75"},{"wrapper":"near","transform":"none","opacity":"1"}]
  screenshot clouds-t1.png (978603 bytes)
drift transforms changed per layer: [true,true,true]

##### 6/9/10. Desktop 1280x800: overflow, links, rects
overflow desktop: {"scrollWidth":1265,"innerWidth":1280,"bodyScrollWidth":1265,"clientWidth":1265}
HEADER links (desktop): [
 {
  "text": "",
  "href": "#top",
  "target": null,
  "rel": null,
  "visible": true,
  "w": 199.6,
  "h": 37.5
 },
 {
  "text": "Schedule",
  "href": "https://hackbu.org/schedule",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 75.1,
  "h": 28
 },
 {
  "text": "Resources",
  "href": "https://hackbu.org/resources",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 84.5,
  "h": 28
 },
 {
  "text": "Hackathons",
  "href": "https://hackbu.org/hackathons",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 95.6,
  "h": 28
 },
 {
  "text": "Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 83.5,
  "h": 37
 },
 {
  "text": "Schedule",
  "href": "https://hackbu.org/schedule",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": false,
  "w": 0,
  "h": 0
 },
 {
  "text": "Resources",
  "href": "https://hackbu.org/resources",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": false,
  "w": 0,
  "h": 0
 },
 {
  "text": "Hackathons",
  "href": "https://hackbu.org/hackathons",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": false,
  "w": 0,
  "h": 0
 },
 {
  "text": "Join the Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": false,
  "w": 0,
  "h": 0
 }
]
FOOTER links (desktop): [
 {
  "text": "Schedule",
  "href": "https://hackbu.org/schedule",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 61.8,
  "h": 17
 },
 {
  "text": "Resources",
  "href": "https://hackbu.org/resources",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 69.6,
  "h": 17
 },
 {
  "text": "Hackathons",
  "href": "https://hackbu.org/hackathons",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 78.7,
  "h": 17
 },
 {
  "text": "Registration",
  "href": "https://hackbu.org/registration",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 78.7,
  "h": 17
 },
 {
  "text": "Blog",
  "href": "https://hackbu.org/blog",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 29.5,
  "h": 17
 },
 {
  "text": "Photos",
  "href": "https://hackbu.org/photos",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.8,
  "h": 17
 },
 {
  "text": "Organizers",
  "href": "https://hackbu.org/organizers",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 72.2,
  "h": 17
 },
 {
  "text": "Sponsors",
  "href": "https://hackbu.org/sponsors",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 62.7,
  "h": 17
 },
 {
  "text": "Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 50.9,
  "h": 17
 },
 {
  "text": "GitHub",
  "href": "https://github.com/HackBinghamton/HackBU",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.7,
  "h": 17
 },
 {
  "text": "LinkedIn",
  "href": "https://www.linkedin.com/groups/8427110",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 55.7,
  "h": 17
 },
 {
  "text": "Facebook",
  "href": "https://www.facebook.com/HackBinghamton",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 65,
  "h": 17
 },
 {
  "text": "Twitter",
  "href": "https://twitter.com/HackBinghamton",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.5,
  "h": 17
 },
 {
  "text": "hello@hackbu.org",
  "href": "mailto:hello@hackbu.org",
  "target": null,
  "rel": null,
  "visible": true,
  "w": 119.9,
  "h": 21
 }
]
MAIN links/CTAs (desktop): [
 {
  "text": "Join the Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 223.3,
  "h": 63.8
 },
 {
  "text": "Join the Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 239.3,
  "h": 71.8
 },
 {
  "text": "Sign up for the mailing list",
  "href": "https://hackbu.org/mailing-list",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 171.1,
  "h": 17
 },
 {
  "text": "hello@hackbu.org",
  "href": "mailto:hello@hackbu.org",
  "target": null,
  "rel": null,
  "visible": true,
  "w": 208.3,
  "h": 30
 },
 {
  "text": "Workshop resources",
  "href": "https://hackbu.org/resources",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 235.8,
  "h": 30
 }
]
skip link: {"href":"#main","text":"Skip to content","w":1,"h":1}
  screenshot desktop-full.png (1089338 bytes)

##### 7. Keyboard tab order (1280x800, fresh load)
Tab 1 -> {"tag":"a","text":"Skip to content","href":"#main","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":16,"y":16,"w":145.7,"h":40}}
skip link when focused: {"clip":"auto","clipPath":"none","position":"absolute","w":145.7,"h":40,"top":16,"left":16,"outline":"solid 2px rgb(60, 92, 72)","visible":true}
  screenshot focus-skip-link.png (979236 bytes)
header Discord CTA focused at Tab 6: {"matchesFocusVisible":true,"outlineStyle":"solid","outlineColor":"rgb(60, 92, 72)","outlineWidth":"2px","outlineOffset":"2px","boxShadow":"none"}
  screenshot focus-header-cta.png (980340 bytes)
  Tab 1: {"tag":"a","text":"Skip to content","href":"#main","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":16,"y":16,"w":145.7,"h":40}}
  Tab 2: {"tag":"a","text":"","href":"#top","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":153,"y":21,"w":199.6,"h":37.5}}
  Tab 3: {"tag":"a","text":"Schedule","href":"https://hackbu.org/schedule","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":678,"y":26,"w":75.1,"h":28}}
  Tab 4: {"tag":"a","text":"Resources","href":"https://hackbu.org/resources","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":785,"y":26,"w":84.5,"h":28}}
  Tab 5: {"tag":"a","text":"Hackathons","href":"https://hackbu.org/hackathons","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":901,"y":26,"w":95.6,"h":28}}
  Tab 6: {"tag":"a","text":"Discord","href":"https://discord.gg/Xka5uUh","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":1029,"y":22,"w":83.5,"h":37}}
  Tab 7: {"tag":"a","text":"Join the Discord","href":"https://discord.gg/Xka5uUh","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":153,"y":410,"w":223.3,"h":63.8}}
  Tab 8: {"tag":"a","text":"Join the Discord","href":"https://discord.gg/Xka5uUh","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":824,"y":412,"w":239.3,"h":71.8}}
  Tab 9: {"tag":"a","text":"Sign up for the mailing list","href":"https://hackbu.org/mailing-list","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":748,"y":564,"w":171.1,"h":17}}
  Tab 10: {"tag":"a","text":"hello@hackbu.org","href":"mailto:hello@hackbu.org","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":153,"y":432,"w":208.3,"h":30}}
  Tab 11: {"tag":"a","text":"Workshop resources","href":"https://hackbu.org/resources","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":653,"y":433,"w":235.8,"h":30}}
  Tab 12: {"tag":"a","text":"Schedule","href":"https://hackbu.org/schedule","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":401,"y":446,"w":61.8,"h":17}}
  Tab 13: {"tag":"a","text":"Resources","href":"https://hackbu.org/resources","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":401,"y":482,"w":69.6,"h":17}}
  Tab 14: {"tag":"a","text":"Hackathons","href":"https://hackbu.org/hackathons","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":401,"y":518,"w":78.7,"h":17}}
  Tab 15: {"tag":"a","text":"Registration","href":"https://hackbu.org/registration","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":401,"y":554,"w":78.7,"h":17}}
  Tab 16: {"tag":"a","text":"Blog","href":"https://hackbu.org/blog","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":649,"y":446,"w":29.5,"h":17}}
  Tab 17: {"tag":"a","text":"Photos","href":"https://hackbu.org/photos","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":649,"y":482,"w":45.8,"h":17}}
  Tab 18: {"tag":"a","text":"Organizers","href":"https://hackbu.org/organizers","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":649,"y":518,"w":72.2,"h":17}}
  Tab 19: {"tag":"a","text":"Sponsors","href":"https://hackbu.org/sponsors","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":649,"y":554,"w":62.7,"h":17}}
  Tab 20: {"tag":"a","text":"Discord","href":"https://discord.gg/Xka5uUh","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":897,"y":446,"w":50.9,"h":17}}
  Tab 21: {"tag":"a","text":"GitHub","href":"https://github.com/HackBinghamton/HackBU","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":897,"y":482,"w":45.7,"h":17}}
  Tab 22: {"tag":"a","text":"LinkedIn","href":"https://www.linkedin.com/groups/8427110","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":897,"y":518,"w":55.7,"h":17}}
  Tab 23: {"tag":"a","text":"Facebook","href":"https://www.facebook.com/HackBinghamton","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":897,"y":554,"w":65,"h":17}}
  Tab 24: {"tag":"a","text":"Twitter","href":"https://twitter.com/HackBinghamton","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":897,"y":590,"w":45.5,"h":17}}
  Tab 25: {"tag":"a","text":"hello@hackbu.org","href":"mailto:hello@hackbu.org","ariaLabel":null,"inHeader":false,"inFooter":true,"rect":{"x":153,"y":699,"w":119.9,"h":21}}
  Tab 26: {"tag":"body","text":"Skip to content Schedule Resources Hackathons ","href":null,"ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":0,"y":-6436,"w":1265,"h":7235.6}}

##### 7b. Skip link activation
before Enter, active = {"tag":"a","text":"Skip to content","href":"#main","ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":16,"y":16,"w":145.7,"h":40}}
after Enter: hash="#main" scrollY=0
after Enter, active = {"tag":"body","text":"Skip to content Schedule Resources Hackathons ","href":null,"ariaLabel":null,"inHeader":false,"inFooter":false,"rect":{"x":0,"y":0,"w":1265,"h":7235.6}}
main tabindex = {"tabIndex":-1,"hasAttr":false}
scroll-padding-top = "96px"
header height = 81

##### 5. prefers-reduced-motion: reduce (1280x800)
matchMedia reduce = true
reduced-motion campus: {"transform":"none","objectPosition":"52% 0%","transformOrigin":"632.5px 0px","willChange":"auto","rect":{"x":0,"y":0,"w":1265,"h":800,"bottom":800},"currentSrc":"Campus-1672.avif","naturalW":1421,"naturalH":799,"trackHeight":800,"trackRectTop":0,"scrollY":0,"innerW":1280,"innerH":800}
  scale = none (no matrix)  trackHeight=800 innerH=800
  screenshot hero-reduced-motion.png (1649919 bytes)
reduced clouds t0: [{"wrapper":"far","transform":"none","opacity":"0.5"},{"wrapper":"mid","transform":"none","opacity":"0.75"},{"wrapper":"near","transform":"none","opacity":"1"}]
reduced clouds t0+3.2s: [{"wrapper":"far","transform":"none","opacity":"0.5"},{"wrapper":"mid","transform":"none","opacity":"0.75"},{"wrapper":"near","transform":"none","opacity":"1"}]
reduced clouds static: true
reduced will-change: {"count":0,"sample":[],"attrCount":0}

##### 8/9/10. Mobile 375x812
overflow mobile: {"scrollWidth":375,"innerWidth":375,"bodyScrollWidth":375,"clientWidth":375}
  screenshot mobile-full.png (382195 bytes)
HEADER links (mobile, menu closed): [{"text":"","href":"#top","target":null,"rel":null,"visible":true,"w":159.7,"h":30},{"text":"Schedule","href":"https://hackbu.org/schedule","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Resources","href":"https://hackbu.org/resources","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Hackathons","href":"https://hackbu.org/hackathons","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Discord","href":"https://discord.gg/Xka5uUh","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Schedule","href":"https://hackbu.org/schedule","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Resources","href":"https://hackbu.org/resources","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Hackathons","href":"https://hackbu.org/hackathons","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0},{"text":"Join the Discord","href":"https://discord.gg/Xka5uUh","target":"_blank","rel":"noopener noreferrer","visible":false,"w":0,"h":0}]
FOOTER links (mobile): [
 {
  "text": "Schedule",
  "href": "https://hackbu.org/schedule",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 61.8,
  "h": 17
 },
 {
  "text": "Resources",
  "href": "https://hackbu.org/resources",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 69.6,
  "h": 17
 },
 {
  "text": "Hackathons",
  "href": "https://hackbu.org/hackathons",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 78.7,
  "h": 17
 },
 {
  "text": "Registration",
  "href": "https://hackbu.org/registration",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 78.7,
  "h": 17
 },
 {
  "text": "Blog",
  "href": "https://hackbu.org/blog",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 29.5,
  "h": 17
 },
 {
  "text": "Photos",
  "href": "https://hackbu.org/photos",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.8,
  "h": 17
 },
 {
  "text": "Organizers",
  "href": "https://hackbu.org/organizers",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 72.2,
  "h": 17
 },
 {
  "text": "Sponsors",
  "href": "https://hackbu.org/sponsors",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 62.7,
  "h": 17
 },
 {
  "text": "Discord",
  "href": "https://discord.gg/Xka5uUh",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 50.9,
  "h": 17
 },
 {
  "text": "GitHub",
  "href": "https://github.com/HackBinghamton/HackBU",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.7,
  "h": 17
 },
 {
  "text": "LinkedIn",
  "href": "https://www.linkedin.com/groups/8427110",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 55.7,
  "h": 17
 },
 {
  "text": "Facebook",
  "href": "https://www.facebook.com/HackBinghamton",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 65,
  "h": 17
 },
 {
  "text": "Twitter",
  "href": "https://twitter.com/HackBinghamton",
  "target": "_blank",
  "rel": "noopener noreferrer",
  "visible": true,
  "w": 45.5,
  "h": 17
 },
 {
  "text": "hello@hackbu.org",
  "href": "mailto:hello@hackbu.org",
  "target": null,
  "rel": null,
  "visible": true,
  "w": 327,
  "h": 21
 }
]
footer mail link (mobile): {"href":"mailto:hello@hackbu.org","w":327,"h":21}
menu button before click: {"ariaExpanded":"false","w":42,"h":42,"panelHidden":true}
menu button after click: {"ariaExpanded":"true","panelHidden":false,"panelLinks":["https://hackbu.org/schedule","https://hackbu.org/resources","https://hackbu.org/hackathons","https://discord.gg/Xka5uUh"]}
  screenshot mobile-menu-open.png (204916 bytes)
focus moved into panel? active = {"tag":"button","text":"Close menu","href":null,"ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":317,"y":11,"w":42,"h":42}}
after Escape: {"ariaExpanded":"false","panelHidden":true}
after Escape, active = {"tag":"button","text":"Open menu","href":null,"ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":317,"y":11,"w":42,"h":42}}

##### 8b. Escape while focus is inside the open panel
focused panel link: {"tag":"a","text":"Schedule","href":"https://hackbu.org/schedule","ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":24,"y":81,"w":327,"h":52}}
after Escape: {"ariaExpanded":"false","panelHidden":true}
after Escape, active = {"tag":"button","text":"Open menu","href":null,"ariaLabel":null,"inHeader":true,"inFooter":false,"rect":{"x":317,"y":11,"w":42,"h":42}}

##### 2b. Hero scale at 375x812
mobile scroll 0 campus: {"transform":"matrix(3, 0, 0, 3, 0, 0)","objectPosition":"52% 0%","transformOrigin":"187.5px 0px","willChange":"transform","rect":{"x":-375,"y":0,"w":1125,"h":2436,"bottom":2436},"currentSrc":"Campus-1672.avif","naturalW":1442,"naturalH":811,"trackHeight":2111,"trackRectTop":0,"scrollY":0,"innerW":375,"innerH":812}
  scale = 3

DONE
````

### Raw output of `cdp-ax.mjs`

````text
header a[href="#top"]: role=link name="HackBU" ignored=false
header nav a[href*="schedule"]: role=link name="Schedule" ignored=false
header nav a[href*="discord"]: role=link name="Discord" ignored=false
header button[aria-controls="primary-menu"]: role=none name=undefined ignored=true
a[href="#main"]: role=link name="Skip to content" ignored=false
footer a[href^="mailto:"]: role=link name="hello@hackbu.org" ignored=false
[data-hero-artwork] img: role=image name="Illustration of the Binghamton University campus under snow: a wooded ridgeline above red brick academic buildings and dormitories, with the Library Tower standing at the centre and a pale winter sky overhead." ignored=false
[data-hero]: role=region name="Campus illustration" ignored=false
hero section aria-label = "Campus illustration"
campus alt = "Illustration of the Binghamton University campus under snow: a wooded ridgeline above red brick academic buildings and d"
````
