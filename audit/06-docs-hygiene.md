# Phase 6 — documentation accuracy, repo hygiene, tooling config

Read-only. No file outside `audit/` was created or modified; no commits were made. Working
tree at `374a9a7` (`audit: phase 5 report (correct P5-9 mechanism per checker)`), clean.

**Method.** Every factual claim in `README.md`, `ASSETS.md`, the comments in `index.html`,
`components.html`, `vite.config.ts` and `src/lib/{images,links,motion}.ts`, plus the
fact-asserting header comments in `src/components/*.tsx`, was checked against the code as it
stands. Claims already adjudicated by an earlier phase are marked with that phase's finding ID
and are **not** re-raised as new P6 findings. Claims that cannot be settled without a network
or a browser are listed separately in §1.10 rather than guessed at.

Contents: §1 claims table · §2 repo hygiene · §3 tooling config · §4 findings · §5 commands ·
§6 handover.

---

## 1. Claims table

Verdicts: **TRUE** (accurate now) · **FALSE** (inaccurate as written) · **STALE** (was accurate
when written; the code moved). "Ref" names the earlier finding that already owns the issue.

### 1.1 README — stack, scripts, deploy, component sheet

| # | Claim (abridged) | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 1 | "theme lives in `src/index.css`, not a JS config" | `README.md:26` | `src/index.css:32` `@theme`; `ls tailwind.config.* postcss.config.*` → none | TRUE |
| 2 | "Tailwind CSS v4 via the `@tailwindcss/vite` plugin" | `README.md:26` | `package.json:22,29` (`^4.3.3`), `vite.config.ts:3,20` | TRUE |
| 3 | "all scroll work goes through `useScroll` / `useTransform` / `whileInView`" | `README.md:28–29` | `src/components/Hero.tsx:140,150,154`; `src/components/Reveal.tsx:70–71,101–102` | TRUE |
| 4 | "There are no `scroll` event listeners." | `README.md:29` | `grep -rn "addEventListener" src/` → only `SiteHeader.tsx:42` (`keydown`) and `sheet/parts/TokensPart.tsx:232` (`resize`) | TRUE |
| 5 | "`sharp` as a dev-only dependency" | `README.md:31` | `package.json:28` (devDependencies); imported only at `scripts/generate-images.mjs:77` | TRUE |
| 6 | Script table — six rows (`dev`, `build`, `preview`, `typecheck`, `lint`, `images`) | `README.md:49–54` | `package.json:7–13`; all six commands match verbatim | TRUE |
| 7 | "`npm run build` Type-checks (`tsc -b`) then builds to `dist/`" | `README.md:50` | `package.json:8` `tsc -b && vite build`; `vite.config.ts:22` `outDir: 'dist'` | TRUE |
| 8 | "root `tsconfig.json` is a solution file (`"files": []` plus project references)" | `README.md:56–58` | `tsconfig.json:2–6` | TRUE |
| 9 | "`vercel.json` … pins the framework to Vite, the build command to `npm run build` and the output directory to `dist`" | `README.md:62–64` | `vercel.json:3,4,5` | TRUE |
| 10 | "No environment variables, no backend, no database." | `README.md:63–64` | `vercel.json` has no `env`/`functions` key; the only local env file holds one CLI-issued token (§2.2) | TRUE |
| 11 | "Image derivatives are **committed**" | `README.md:70` | `git ls-files public \| wc -l` → 53 | TRUE |
| 12 | "a build is just `vite build`" | `README.md:71` | `package.json:8` — a build is `tsc -b && vite build`; `vercel.json:4` runs `npm run build` | **FALSE** (P6-10) |
| 13 | "The build has **two** entry points, declared in `vite.config.ts`" | `README.md:75–76` | `vite.config.ts:24–27` | TRUE |
| 14 | "nothing under `src/sheet/` reaches the landing page's bundle" | `README.md:79–80` | Phase 1 §6 (module-graph proof); chunk naming caveat is P1-1 | TRUE |
| 15 | "`src/landing.css`, which is `src/index.css` plus one `@source not` line" | `README.md:81` | `src/landing.css:20,22` — exactly `@import './index.css'` + `@source not "./sheet"` | TRUE |
| 16 | "`/components`, `/components/` → the explicit rewrites in `vercel.json`" | `README.md:88` | `vercel.json:7,8`; Phase 5 §7 walk rows 2–3 | TRUE |
| 17 | "`/components.html` → the filesystem … the catch-all excludes `/components*` besides" | `README.md:89` | `vercel.json:9` lookahead; Phase 5 §7 walk row 4 | TRUE |
| 18 | "anything else → the catch-all rewrite to `/index.html`" | `README.md:90` | `vercel.json:9` — `/components-foo` and any `/components*` path is **excluded** and 404s | **FALSE** — ref **P5-4** |
| 19 | "The sheet is `noindex, nofollow`" | `README.md:92` | `components.html:17` | TRUE |
| 20 | "and is not linked from the landing page" | `README.md:92` | `grep -rn "href=" src/components src/App.tsx index.html` → no `/components` href anywhere | TRUE |

### 1.2 README — hero geometry

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 21 | "At `PAN_START_SCALE = 3` the opening frame is image rows 0–0.333" | `README.md:12` | `src/components/Hero.tsx:74` (`= 3`), `:66–72` (band is `0 .. f1/S`, `f1 ≤ 1`) | TRUE |
| 22 | "the hill and treeline silhouette breaks the horizon at row 0.1934" | `README.md:13` | `src/components/HeroClouds.tsx:206–207` (source row 182 of 941); `182/941 = 0.1934` | TRUE (arithmetic; the pixel row itself is heuristic — §1.10) |
| 23 | "about 42% of that frame is distant hills" | `README.md:13–14` | `((1/3) − 0.1934) / (1/3) = 41.98%` | TRUE |
| 24 | "The first rooftops are at 0.351 and stay off screen" | `README.md:14` | `src/components/Hero.tsx:61–64` (row 330/941 = 0.3507). Independent scan of `Campus.png` for reddish pixels (`R>100, R−G>40, R−B>40`): rows 320–329 = 0, row 330 = 1, **row 333 = 11**, ≥100 at row 354 | TRUE (corroborated within 3 rows; see §1.10 on the "past 100 within ten rows" clause) |
| 25 | "would need a start scale above `1 / 0.1934 ≈ 5.17`" | `README.md:15` | `1/0.1934 = 5.1706` | TRUE |
| 26 | "**`PAN_START_SCALE`** … (currently `3`)" | `README.md:122` | `src/components/Hero.tsx:74` | TRUE |
| 27 | "the start scale must stay above `1 / 0.351 ≈ 2.86`" | `README.md:125` | `1/0.351 = 2.8490`; `src/components/Hero.tsx:69` states the same floor as "**S > 2.85**" | **FALSE** (P6-5) |
| 28 | "**`object-position`** on the campus `<img>` (currently `52% 0%`)" | `README.md:128` | `src/components/Hero.tsx:131` `object-[52%_0%]`, applied at `:209` | TRUE |
| 29 | "the vertical `0%` … together with `transform-origin: top`" | `README.md:129–132` | `src/components/Hero.tsx:209` `origin-top`; `:104–112` | TRUE |
| 30 | "twelve cutouts, four per layer, cast onto the layers by intrinsic height" | `README.md:135` | `src/components/HeroClouds.tsx:224–375` — `far`/`mid`/`near`, four `file:` entries each; heights ascend 70→303 | TRUE |
| 31 | "The horizontal drift loop derives its tile count from how far clouds hang past the tile edge" | `README.md:136–138` | `src/components/HeroClouds.tsx:417–431` (`measureTileOverhang`), `:463` (`SET_COUNT = ⌈oR⌉ + ⌈oL⌉ + 2`), `:476` "derived, not hardcoded" | TRUE |
| 32 | "`clouds-all-b.png` … must not be copied into `public/`" | `README.md:140–142` | Absent from `public/` (Phase 5 §2.6); `scripts/generate-images.mjs:142–144` reads `public/artwork/clouds` only | TRUE |

### 1.3 README colour table vs `src/index.css` — every token, both hex values

`README.md:183–193` against the `@theme` block. README writes hex uppercase, the stylesheet
lowercase; no other difference.

| Token | README hex (`README.md:line`) | `src/index.css` hex (line) | Verdict |
|---|---|---|---|
| `sky` | `#4A96D2` (`:185`) | `#4a96d2` (`:34`) | TRUE (equal, case only) |
| `horizon` | `#A8D0EB` (`:186`) | `#a8d0eb` (`:35`) | TRUE |
| `cloud` | `#F7F5EE` (`:187`) | `#f7f5ee` (`:36`) | TRUE |
| `frost` | `#DCE3EA` (`:188`) | `#dce3ea` (`:37`) | TRUE |
| `brick` | `#A2593A` (`:189`) | `#a2593a` (`:38`) | TRUE |
| `stone` | `#C4B79E` (`:190`) | `#c4b79e` (`:39`) | TRUE |
| `pine` | `#3C5C48` (`:191`) | `#3c5c48` (`:40`) | TRUE |
| `haze` | `#7C99B4` (`:192`) | `#7c99b4` (`:49`) | TRUE |
| `fern` | `#339966` (`:193`) | `#339966` (`:67`) | TRUE (byte-identical) |

Nine `--color-*` declarations exist and nine rows are documented — no undocumented token, no
documented-but-missing token. The component sheet holds a **third** copy of this table
(`src/sheet/parts/TokensPart.tsx:41,48,58,65,73,80,87,95,105`); all nine values there match
`src/index.css` as well, so the three copies agree today.

### 1.4 README — colour, animation and hero-content conventions

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 33 | "Eight palette tokens plus one logo-only token, defined once in the `@theme` block" | `README.md:179` | `src/index.css:34–40,49` (8) + `:67` (`fern`) | TRUE |
| 34 | "no arbitrary hex, no default Tailwind palette colours, no `#000000`" | `README.md:180–181` | `grep -rEn "bg-(black\|white\|gray\|slate\|…)"` → no hits; every hex in `src/` is a token definition or a restatement of one (`ExternalLink.tsx:12,14`, `index.css:55`, `TokensPart.tsx`), plus the one comment hex at `App.tsx:44` | TRUE — ref **P3-4** for the comment hex |
| 35 | "`horizon` — **currently unused**" | `README.md:186` | No `horizon` utility anywhere in `src/` | TRUE |
| 36 | "`haze` — scene colour only" | `README.md:192` | `haze` has no occurrence in `src/` outside its declaration (Phase 4 row 40) — it is unused, not "scene only" | **STALE** — ref **P3-3** |
| 37 | "`haze` … measures 2.72:1 on `cloud`" | `README.md:195–196` | Phase 4 §contrast row 40 — exact | TRUE |
| 38 | "Secondary text uses `pine/90`." | `README.md:197–198` | Phase 4 (5.36 documented vs 5.38 computed, compositing rounding) | TRUE |
| 39 | "`fern` … fills the marks and nothing else … measures 3.27:1 on `cloud`" | `README.md:200–203` | `src/components/Wordmark.tsx:52,56` are the only landing uses of `bg-fern`; ratio exact (Phase 4 rows 38–39). Sheet-only swatch is P3-7 | TRUE |
| 40 | "`LINK_ON_CLOUD` and `LINK_ON_FROST` … are the only two link treatments on the page" | `README.md:204–207` | `ButtonLink.tsx:30` and `SiteHeader.tsx:49–52` use neither | **FALSE** — ref **P3-5** (and P3-1) |
| 41 | "brick hover on `cloud` (4.78:1), … brick on frost measures 4.03:1" | `README.md:206–207` | `src/components/ExternalLink.tsx:12–17,33,36`; ratios exact (Phase 4 rows 12, 28) | TRUE |
| 42 | "Only `transform` and `opacity` are ever animated" | `README.md:209–211` | Animated values are `scale` (`Hero.tsx:212`), `opacity`+`y` (`HeroClouds.tsx:750`), `x` (`HeroClouds.tsx:692–694`), `opacity`+`y` (`Reveal.tsx:52–53,70–71`). `left/top/width/height` at `HeroClouds.tsx:646–652,670–676` are static styles, never animated | TRUE |
| 43 | "Every animation is gated behind `usePrefersReducedMotion()`" | `README.md:211–213` | `Hero.tsx:135`; `HeroClouds` via `useHeroScroll().reducedMotion`; `Reveal.tsx:65,96,143` | TRUE |
| 44 | "the hero's tall scroll track collapses so no dead scroll space is left behind" | `README.md:213–214` | `Hero.tsx:80` (`h-[260dvh]`) vs `:176` (`reducedMotion ? 'h-dvh' : TRACK_HEIGHT`) | TRUE |
| 45 | "The hero contains no text and no focusable elements, by design." | `README.md:216–217` | `grep -n "<a \|<button\|tabIndex\|href=" src/components/Hero.tsx src/components/HeroClouds.tsx` → no output | TRUE |

### 1.5 README — swapping artwork and branding

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 46 | "Source art lives in `artwork/` … The files the site actually ships are in `public/artwork/`" | `README.md:96–97` | Phase 5 §2.5 — 13/13 byte-identical copies | TRUE |
| 47 | Directory listing: `Campus.png`, `Campus-{640,960,1280,1672}.{avif,webp}`, `cloud-1..12.png`, `cloud-1..12.{avif,webp}` | `README.md:99–106` | `ls public/artwork/**` — exactly these 9 + 36 files | TRUE |
| 48 | "Run `npm run images` to regenerate the AVIF and WebP derivatives. The PNGs remain as the `<picture>` fallback." | `README.md:113–114` | `scripts/generate-images.mjs:123–151`; `Hero.tsx:201–202` (`src={CAMPUS_PNG}`), `HeroClouds` `cloudSources()` PNG last | TRUE |
| 49 | "Update `ASSETS.md`, which records every file with its pixel dimensions." | `README.md:115` | Phase 5 §2 — the ASSETS entry set and the on-disk set are the same 53 files | TRUE |
| 50 | "The three brand files live in `brand-source/` … `npm run images` derives everything the site ships from them into `public/brand/`" | `README.md:146–148` | `ls brand-source` → 3 files; `scripts/generate-images.mjs:178–223` writes all 8 outputs | TRUE |
| 51 | `public/brand/` listing incl. "apple-touch-icon.png 180x180", "og-image.png 732x732" | `README.md:155–161` | `ls -l public/brand` (8 files); dimensions per Phase 5 §2.3 | TRUE |
| 52 | "`<Wordmark>` renders two empty elements painted in the `fern` token; each one's shape is cut from the alpha channel … (`.brand-mark-*` in `src/index.css`)" | `README.md:163–165` | `src/components/Wordmark.tsx:51–58`; `src/index.css:147–177` | TRUE |
| 53 | "the bearcat's `#339966` and the wordmark's `#42B872`" | `README.md:165–166` | Pixel histogram of opaque pixels: `brand-source/icon.png` → `#339966` ×482,305 (dominant of 24); `text.png` → `#42b872` ×892,178 (of 9) | TRUE |
| 54 | "The derivatives carry no colour at all — their RGB is flattened to white before encoding" | `README.md:168–169` | `scripts/generate-images.mjs:168–172` (RGB←255) | TRUE |
| 55 | "check the ink dimensions it prints against `BEARCAT_MARK` / `WORDMARK_MARK` in `src/lib/images.ts`" | `README.md:171–173` | `scripts/generate-images.mjs:249–253` prints both boxes; `src/lib/images.ts:83–84` | TRUE |
| 56 | "`icon_discord.png` … is the touch icon and the social card, and its pale green must not enter the stylesheet" | `README.md:174–175` | `index.html:19` + `:67` are the two uses; `grep -i "97f5ac\|50b536" src/` → none | TRUE |

### 1.6 README — the Layout tree

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 57 | The `src/` tree as printed | `README.md:222–247` | Omits `src/main.tsx`, `src/landing.css` and the whole of `src/sheet/` (7 files) — both of the latter are documented at `README.md:81` and exist per `ls -R src` | **STALE** (P6-6) |
| 58 | "`SiteHeader.tsx` fixed header, collapses to a menu at 390px" | `README.md:235` | `SiteHeader.tsx:45` is `fixed`; the collapse is at **`md` = 768px** (`:56` `md:flex`, `:77` `md:hidden`, `:90` `md:hidden`) — the component's own header says so correctly at `:15–16` | **FALSE** (P6-4) |
| 59 | "`SiteFooter.tsx` all eight existing site pages" | `README.md:236` | `src/lib/links.ts:23–32` (8 entries); `SiteFooter.tsx:16–17` splits 4/4 | TRUE |
| 60 | "`ButtonLink.tsx` the page's one button treatment" | `README.md:238` | `src/components/ButtonLink.tsx:5–15,29–31` — one `BASE`, sizes only | TRUE |
| 61 | "`index.css` Tailwind theme: colour tokens, type scale, fonts" | `README.md:227` | `src/index.css:32–111` | TRUE |
| 62 | "`links.ts` every off-site URL, centralised" | `README.md:229` | `grep -rn "href=" src/components src/App.tsx` — every off-site href resolves to a `links.ts` constant; only `#top`/`#main` and the `mailto:` template are literal | TRUE |
| 63 | "`Reveal.tsx` whileInView reveals (enter-once, staggered)" | `README.md:233` | `Reveal.tsx:46` (`staggerChildren: 0.12`), `:70–71`, `viewport once` | TRUE |

### 1.7 `ASSETS.md`

Per-file dimensions and byte sizes were verified by Phase 5 §2 and are not re-derived here; the
rows below are the **prose** claims, counts and derived numbers.

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 64 | "Every image originally in … `artwork/` has been copied into `public/artwork/` … originals … untouched" | `ASSETS.md:3–5` | Phase 5 §2.5 — 13/13 identical | TRUE |
| 65 | "`artwork/clouds/cloud-N.png` → `public/artwork/clouds/cloud-N.png` (N = 1..12)" | `ASSETS.md:12` | `ls public/artwork/clouds/*.png` → 12, `cloud-1`…`cloud-12` | TRUE |
| 66 | "One file in `artwork/clouds/` is **deliberately not copied**: `clouds-all-b.png` (2172 × 724)" | `ASSETS.md:15–19` | Phase 5 §2.6 — absent from `public/`, present at `artwork/clouds/`, 2172×724, 453,487 B | TRUE |
| 67 | "Vite serves them verbatim … Reference them by absolute URL … **not** by import" | `ASSETS.md:21–23` | `src/lib/images.ts:16,88–92` — absolute paths, no imports | TRUE |
| 68 | "It is the only file in `public/artwork/campus/`, and the only non-cloud asset." | `ASSETS.md:29` | That directory holds **9** files (`Campus.png` + 8 derivatives); contradicted by `ASSETS.md:79–80` in the same document | **STALE** (P6-1) |
| 69 | "**The twelve files in `public/artwork/clouds/`** (`cloud-1.png` … `cloud-12.png`)" | `ASSETS.md:33` | That directory holds **36** files (12 PNG + 12 AVIF + 12 WebP); the parenthetical scopes it to the PNGs | **STALE** (P6-1) |
| 70 | "They are not a spritesheet and not tiles of one image" | `ASSETS.md:35–38` | `src/lib/images.ts:87–93` + `HeroClouds.tsx:641–653` place each cutout independently | TRUE |
| 71 | "13 files, 3,780,900 bytes (3.61 MiB) total." | `ASSETS.md:57` | Recomputed: 2,942,406 + 838,494 = **3,780,900** | TRUE |
| 72 | "Listed in the order the hero casts them, which is a sort on **intrinsic height**" | `ASSETS.md:59–61` | Table heights ascend 70, 97, 108, 167, 170, 194, 221, 229, 253, 259, 294, 303 | TRUE (the `near` array in `HeroClouds.tsx:348–375` is ordered differently — P6-7) |
| 73 | "123–160 px wide / 38–92 px tall (far), 210–344 / 136–183 (mid) and 359–493 / 291–348 (near)" | `ASSETS.md:63–65` | Computed from `HeroClouds.tsx:225,272,319` scales (0.55/0.8/1.15) × intrinsic dims — all six ranges reproduce exactly | TRUE |
| 74 | "the flat wisps (3.20, 2.45, 2.46) land in `far`, the near-square cumulus towers (1.06, 1.13, 1.36) in `near`" | `ASSETS.md:64–65` | `HeroClouds.tsx:233–260` (far = 6,12,4,10) and `:348–375` (near = 5,8,11,1) | TRUE |
| 75 | "All thirteen are valid PNGs at 8-bit depth" | `ASSETS.md:73` | Phase 5 §2.1 (`depth: uchar` on all) | TRUE |
| 76 | "`npm run images` … writes AVIF and WebP derivatives **beside** each PNG" | `ASSETS.md:79–81` | `scripts/generate-images.mjs:134–137,148–149` | TRUE |
| 77 | "The derivatives are committed, so a deploy runs `vite build` and nothing else." | `ASSETS.md:81–82` | Committed: yes (53 tracked). "nothing else": `package.json:8` runs `tsc -b` first | **FALSE** (P6-10) |
| 78 | Derivative table — 4 AVIF @ q68 738 KB, 4 WebP @ q82 790 KB, 12 cloud AVIF @ q70 169 KB, 12 cloud WebP @ q82/alpha90 256 KB | `ASSETS.md:86–89` | On-disk totals 755,368 / 809,322 / 173,219 / 262,542 B = 737.7 / 790.4 / 169.2 / 256.4 KiB; qualities at `generate-images.mjs:92–96` | TRUE |
| 79 | "the hero magnifies the artwork up to 3x" | `ASSETS.md:91–92` | `Hero.tsx:74` | TRUE |
| 80 | "The clouds render at up to 1.15x their intrinsic width … `<picture>` switches on format only, with no `srcset`" | `ASSETS.md:93–94` | `HeroClouds.tsx:319` (near `scale: 1.15`); `src/lib/images.ts:87–93` returns three URLs, no srcset | TRUE |
| 81 | "13 image requests, **495,259 bytes (483.7 KB)** — the widest campus AVIF (322,040 B) plus the twelve cloud AVIFs (173,219 B)" | `ASSETS.md:96–98` | 322,040 + 173,219 = 495,259; /1024 = 483.65 KiB | TRUE |
| 82 | "Doubling the cloud count added 93,296 B." | `ASSETS.md:98–99` | `cloud-7..12.avif` sum = **93,296 B** exactly (old six = 79,923) | TRUE |
| 83 | "That is 13% of the 3.61 MB … and **32% of the 1.5 MB budget**" | `ASSETS.md:99–100` | 495,259/3,780,900 = 13.1%; /1,572,864 = 31.5% | TRUE |
| 84 | "the drift track mounts `SET_COUNT` copies of each cutout, but they share one URL each" | `ASSETS.md:102–104` | `HeroClouds.tsx:436–476`, `:641–653`; Phase 5 §2.2 (each derivative fetched once) | TRUE |
| 85 | "`icon.png` … `#339966`, one stroke colour / `text.png` … `#42B872` / `icon_discord.png` `#97F5AC` tile, `#50B536` mark" | `ASSETS.md:114–116` | Opaque-pixel histogram: `#339966` (of 24 near-identical AA variants), `#42b872` (of 9), `#97f5ac` + `#50b536` dominant | TRUE |
| 86 | `icon_discord.png` alpha column "No (opaque)" | `ASSETS.md:116` | 4 channels, `hasAlpha: true` | **FALSE** — ref **P5-9** |
| 87 | Brand output table — 8 rows with sizes and byte counts | `ASSETS.md:123–132` | Phase 5 §2.3 — all 8 match | TRUE |
| 88 | "**5.3 KB at 1x, 11.7 KB at 2x**" | `ASSETS.md:134–136` | 5,311 B and 11,791 B — 11.7 matches neither KB=1000 (11.8) nor 1024 (11.5) | **FALSE** — ref **P5-10** |
| 89 | "`icon_discord.png` is 2,158,148 bytes … for a 14-colour 732 × 732 image" | `ASSETS.md:138` | `ls -l` → 2,158,148 B; histogram → exactly **14** distinct opaque colours | TRUE |
| 90 | "Campus.png is 1672 px wide and has no alpha … A horizontal scroll-pan has limited travel … Worth confirming against the intended motion before building it." | `ASSETS.md:145–148` | The hero was built and is a vertical scale-pan (`Hero.tsx:150–157`) — the open question is closed | **STALE** (P6-3) |
| 91 | "it is 88% of the artwork bytes" | `ASSETS.md:149` | 2,942,406 / 3,780,900 = **77.8%** (it was 88.1% at six clouds) | **STALE** (P6-2) |
| 92 | "Compressing it or emitting a WebP/AVIF alongside is the obvious lever if load time matters." | `ASSETS.md:150–151` | Done — `ASSETS.md:77–89` in the same file documents the derivatives | **STALE** (P6-3) |
| 93 | "The clouds are small (70–303 px tall)" | `ASSETS.md:152` | Intrinsic heights run 70 (`cloud-6`) to 303 (`cloud-11`) | TRUE |

### 1.8 `index.html` and `components.html` comments

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 94 | "Favicons: the bearcat mark, from `brand-source/icon.png` via `npm run images`" | `index.html:6–7` | `scripts/generate-images.mjs:200–212` | TRUE |
| 95 | "Two rungs because … a hi-dpi tab wants the 64" | `index.html:7–9` | `index.html:11–12` ship both rungs | TRUE (the "3.4% of its height" measurement is unverified — §1.10) |
| 96 | "`icon_discord.png` … ships in the two places that ask for one and nowhere in the page" | `index.html:15–17` | `index.html:19` (apple-touch) and `:67` (og:image); no other reference in `src/` or either HTML | TRUE |
| 97 | "Its tile colour is deliberately absent from the stylesheet." | `index.html:17` | `grep -i "97f5ac\|50b536" src/` → none | TRUE |
| 98 | "The hero `<img>` lives inside the React bundle, so without this the browser cannot discover it" | `index.html:26–28` | `src/components/Hero.tsx:201–213` | TRUE |
| 99 | "`imagesrcset`/`imagesizes` are byte-identical to the `<picture>` sources" | `index.html:28–30` | True of `dist/index.html`, not of the source attribute | **FALSE** as written — ref **P5-11** |
| 100 | "`href` is deliberately omitted" | `index.html:35–37` | `index.html:39–51` — no `href` attribute present | TRUE |
| 101 | "og:image … pinned to the deployed origin" (`https://hackbu-landing.vercel.app/...`) | `index.html:58–59,67` | `.vercel/project.json` → `projectName: hackbu-landing`, i.e. the project's default Vercel domain. `README.md:60–71` documents no domain at all | TRUE as to the origin's provenance — ref **P5-12** for the hardcoding |
| 102 | "The card is square (732x732 — the tile's own size) … which is why the Twitter card is `summary`" | `index.html:60–62` | `index.html:69–70,72`; `og-image.png` is 732×732 | TRUE |
| 103 | "Title and description come from `<title>` and the description above." | `index.html:63–64` | `index.html:52–55,74` — there is no `og:title`/`og:description`, so this relies on scraper fallback | TRUE (fallback behaviour) — ref **P2-2** |
| 104 | "Same bearcat favicons as the landing page." | `components.html:6` | `components.html:7–8` vs `index.html:11–12` — identical | TRUE |
| 105 | "It deploys alongside the landing page" | `components.html:13–14` | `vite.config.ts:26`; Phase 5 §7 (`dist/components.html`) | TRUE |
| 106 | "it is not a page anyone should arrive at from a search result" + `noindex, nofollow` | `components.html:15,17` | `components.html:17` | TRUE |
| 107 | "No og:image, no preload. The sheet ships no LCP illustration above the fold (the campus image is documentation, far down the page)" | `components.html:24–26` | No `og:`/`preload` in the file; `src/sheet/ComponentSheet.tsx:106–109` renders `HeroPart` **last** of four parts | TRUE (note the framing differs from `src/lib/images.ts:60–63`, "content, not decoration" — Phase 4 §) |

### 1.9 `vite.config.ts`, `src/lib/*.ts`, `src/index.css`, component headers

| # | Claim | Source | Code / evidence | Verdict |
|---|---|---|---|---|
| 108 | "`index.html` → `dist/index.html`; `components.html` → `dist/components.html`" | `vite.config.ts:9–10` | `vite.config.ts:24–27`; Phase 5 §7 dist listing | TRUE |
| 109 | "The sheet's code therefore never reaches the landing page's bundle" | `vite.config.ts:12–16` | Phase 1 §6 | TRUE |
| 110 | "Three copies of the campus srcset exist and they must agree" | `src/lib/images.ts:9–13` | Phase 5 §1 — all three agree (byte-identical after HTML attribute normalisation) | TRUE |
| 111 | "`npm run images` prints the strings it generated" | `src/lib/images.ts:13` | `scripts/generate-images.mjs:242–245` | TRUE |
| 112 | "The derivative ladder … stops at the intrinsic 1672px" | `src/lib/images.ts:21–25` | `scripts/generate-images.mjs:90,127–132` (throws above intrinsic) | TRUE |
| 113 | "Must match `imagesizes` on the preload link in index.html" | `src/lib/images.ts:53–57` | `index.html:50` — identical string (Phase 5 §1.2) | TRUE |
| 114 | "The campus illustration is content, not decoration … rather than an empty alt" | `src/lib/images.ts:59–67` | `Hero.tsx:203` `alt={CAMPUS_ALT}` | TRUE |
| 115 | "`<Wordmark>` gives each mark an `aspect-ratio` built from these numbers" | `src/lib/images.ts:76–84` | `src/components/Wordmark.tsx:53,57` | TRUE |
| 116 | "Cloud cutouts are pure decoration" | `src/lib/images.ts:86` | `HeroClouds.tsx:617–618` (`alt=""`, `aria-hidden`) | TRUE |
| 117 | "Every off-site URL the page points at, in one place." | `src/lib/links.ts:2` | See row 62 | TRUE |
| 118 | "The three header nav destinations (the Discord CTA is separate)." | `src/lib/links.ts:15` | 3 entries `:17–19`; `SiteHeader.tsx:56–63` maps them, `:66` renders the CTA separately | TRUE |
| 119 | "All eight existing hackbu.org pages, split into two footer columns." | `src/lib/links.ts:22` | 8 entries `:24–31`; `SiteFooter.tsx:16–17` slices 0–4 / 4– | TRUE |
| 120 | "Phase 3 establishes both. Phase 4 (cloud parallax) and Phase 5 (section reveals) **are expected to** consume them" | `src/lib/motion.ts:15–17` | Both shipped: `HeroClouds.tsx:4`, `Reveal.tsx:3` | **STALE** (P6-8) |
| 121 | "See `Hero.tsx`, which collapses its 260dvh track to a single viewport." | `src/lib/motion.ts:35–36` | `Hero.tsx:80,176` | TRUE |
| 122 | "motion reads the media query once at mount and does not re-subscribe, so a mid-session OS change takes effect on the next page load" | `src/lib/motion.ts:38–39` | `framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs` — `useState(prefersReducedMotion.current)`, never updated (its own `TODO` says so) | TRUE as to effect; the mechanism wording is imprecise (P6-9) |
| 123 | "Phase 7 moved the headline, lede and Discord CTA out to `<IntroSection>`" | `src/components/Hero.tsx:23–24` | `src/components/sections/IntroSection.tsx:11,50`; commit `70a4578` | TRUE |
| 124 | "no hand-rolled `addEventListener('scroll', …)` anywhere in `src/`" | `src/components/Hero.tsx:137–139` | See row 4 | TRUE |
| 125 | "There is no scroll event listener anywhere" | `src/components/HeroClouds.tsx:26–28` | See row 4 | TRUE |
| 126 | Layer cast list: `far` 6,12,4,10 / `mid` 7,2,9,3 / `near` 5,1,8,11 | `src/components/HeroClouds.tsx:141–143` | Membership matches `:233–375`; the `near` array is ordered 5, 8, 11, 1 | TRUE (membership); ordering mismatch — P6-7 |
| 127 | "the ridgeline breaks the stage at 58.02% of its height" | `src/components/HeroClouds.tsx:206–210` | `0.1934 / (1/3) = 58.02%` | TRUE |
| 128 | "far 90 × (1.15 / 0.55) = 188s / mid … = 129s / near 90s … far:near speed ratio of 2.09x" | `src/components/HeroClouds.tsx:107–114` | `:227,274,321` = 188/129/90; 90×1.15/0.55 = 188.2, 90×1.15/0.8 = 129.4; 188/90 = 2.089 vs 1.15/0.55 = 2.091 | TRUE |
| 129 | "Nothing in this project uses `transition` or `transition-*`" | `src/index.css:5–8` | `grep -rn "transition-" src/` → no utility use; only the motion config key at `HeroClouds.tsx:694` and prose | TRUE |
| 130 | "Section anchors already carry `scroll-mt-24`" | `src/index.css:15` | `src/components/Layout.tsx:44` | TRUE |
| 131 | "Faces are self-hosted via @fontsource (imported in `src/main.tsx`)" | `src/index.css:69–70` | `src/main.tsx:15–17` — Fraunces 600, Inter 400, Inter 500 (the sheet imports the same three at `src/sheet/main.tsx:9–11`, which this line does not mention) | TRUE |
| 132 | "Exactly the three faces the finished page uses … Fraunces 600 … Inter 400 … Inter 500" | `src/main.tsx:6–13` | `src/main.tsx:15–17`; `grep -rn "@fontsource" src/` shows no fourth face | TRUE |
| 133 | "`./landing.css` is `./index.css` plus one `@source not` line" | `src/main.tsx:19–25` | `src/landing.css:20,22` | TRUE |
| 134 | "`components.html` imports `src/index.css` directly, so it still scans everything" | `src/landing.css:12–14` | `src/sheet/main.tsx:13` `import '../index.css'` | TRUE |
| 135 | "The page's only button treatment … A `secondary` outlined-pine variant … is gone" | `src/components/ButtonLink.tsx:5–15` | `ButtonLink.tsx:29–41` — one `BASE`, three sizes, no variant prop | TRUE |
| 136 | "Every **text** link on the page uses one of the two strings below" | `src/components/ExternalLink.tsx:8` | Correct as scoped (this is the wording P3-5 recommends for `README.md:205`) | TRUE |
| 137 | "Below `md` (768px) the three links and the CTA collapse behind a toggle, so the 390px layout is the lockup plus a menu button." | `src/components/SiteHeader.tsx:15–16` | `SiteHeader.tsx:56,77,90` | TRUE (and it is `README.md:235` that garbles this — P6-4) |
| 138 | "`generateClouds` reads whatever PNGs sit in `public/artwork/clouds/`, which is the cutouts and only the cutouts" | `scripts/generate-images.mjs:26–29` | `:142–144`; `clouds-all-b.png` absent from `public/` | TRUE |
| 139 | "`favicon-{32,64}.png` are the bearcat, trimmed and squared on transparency" | `scripts/generate-images.mjs:68–71` | `:200–212` (`trim` + `fit: 'contain'`, transparent background) | TRUE |

### 1.10 Claims not settleable in a read-only, offline pass

Listed rather than guessed; none is counted in the tally.

- `index.html:8` — "strokes are 3.4% of its height" (`brand-source/icon.png`). Needs a stroke-width
  measurement, not a metadata read. **unverified:**
- `src/components/Hero.tsx:63–64` — "the count jumps to 11 at row 330 and climbs past 100 within
  ten rows". My independent reddish-pixel scan puts the count-of-11 at row **333** and the
  crossing of 100 at row **354** (21 rows later). The threshold used by whoever wrote the comment
  is not recorded, so the discrepancy is most likely a different colour test, not a wrong claim —
  the substantive number (first rooftops ≈ row 330 = 0.351) is corroborated within three rows.
  **unverified:** the "within ten rows" clause.
- `src/components/HeroClouds.tsx:206–207` — "the first silhouette pixel of the hills is source row
  182". Same class of measurement. **unverified:** (the arithmetic built on it checks out).
- `src/lib/links.ts:5` — "These are the canonical live URLs taken from hackbu.org". Requires
  fetching hackbu.org. **Phase 7.**
- `src/index.css:137–139` — "Firefox only shipped `image-set()` in 88". External compatibility
  claim. **unverified:**
- `src/index.css:145` — "Only one rung is ever fetched — an unmatched media query loads nothing."
  Browser behaviour. **Phase 7.**
- `src/components/HeroClouds.tsx:176–199` — the coverage percentages (66.4% bbox / 29.6%
  alpha-weighted, 16 of 48 nodes). Phase 5 §reproduced the node counts; the alpha weighting was
  not re-derived. **Phase 7/8 if it matters.**

### Tally

| Section | Rows | TRUE | FALSE | STALE |
|---|---:|---:|---:|---:|
| 1.1 README — stack, scripts, deploy, sheet | 20 | 18 | 2 | 0 |
| 1.2 README — hero geometry | 12 | 11 | 1 | 0 |
| 1.3 README colour table (9 tokens) | 9 | 9 | 0 | 0 |
| 1.4 README — conventions | 13 | 11 | 1 | 1 |
| 1.5 README — artwork / branding | 11 | 11 | 0 | 0 |
| 1.6 README — Layout tree | 7 | 5 | 1 | 1 |
| 1.7 `ASSETS.md` | 30 | 22 | 3 | 5 |
| 1.8 `index.html` / `components.html` | 14 | 13 | 1 | 0 |
| 1.9 config, `src/lib`, component headers | 32 | 31 | 0 | 1 |
| **Total** | **148** | **131** | **9** | **8** |

(Numbered rows run 1–139; §1.3's nine token rows are unnumbered, which is why the total is 148.)

Of the **9 FALSE** rows, **5 belong to earlier phases** — row 18 → P5-4, row 40 → P3-5, row 86 →
P5-9, row 88 → P5-10, row 99 → P5-11 — and 4 are new, covered by three findings: rows 12 and 77 →
P6-10, row 27 → P6-5, row 58 → P6-4.

Of the **8 STALE** rows, **1 belongs to an earlier phase** (row 36 → P3-3) and 7 are new: rows 68
and 69 → P6-1, row 57 → P6-6, row 91 → P6-2, rows 90 and 92 → P6-3, row 120 → P6-8.

Seven further claims could not be settled offline and are excluded from the counts (§1.10).

---

## 2. Repo hygiene

### 2.1 `.gitignore` coverage, root-level artefacts

`.gitignore` is 12 lines, three commented groups (dependencies/build output; Vercel link + local
env; source archives). Phase 1 §7 established tracked/ignored status; the column that is new here
is whether each entry is **consistent with its siblings** — i.e. whether the same rule was applied
to things of the same kind.

| Artefact | Ignore status (`git check-ignore -v`) | Tracked? | Kind | Consistent with siblings? |
|---|---|---|---|---|
| `node_modules/` | ignored — `.gitignore:2` | no | installed dependencies | **Yes** — reproducible from `package-lock.json` |
| `dist/` | ignored — `.gitignore:3` | no (`git ls-files dist` → 0) | build output | **Yes** — see §2.3 |
| `.vercel/` | ignored — `.gitignore:6` | no | CLI link + local env writes | **Yes** — machine-local, and it is what writes `.env.local` |
| `.env.local` | ignored — `.gitignore:7` (`.env*`) | no | local env | **Yes** — see §2.2 |
| `HackBULogo.zip` | ignored — `.gitignore:11` | no | delivery archive, unpacked into `brand-source/` | **Yes** — pairs with `moreclouds.zip` |
| `moreclouds.zip` | ignored — `.gitignore:12` | no | delivery archive, unpacked into `artwork/clouds/` | **Yes** — pairs with `HackBULogo.zip` |
| `artwork/` | **not ignored** | tracked (14 files) | read-only source art | **Yes** — it is an input, and `README.md:96` says so |
| `brand-source/` | **not ignored** | tracked (3 files) | read-only source art | **Yes** — same class as `artwork/`, same treatment |
| `public/` | **not ignored** | tracked (53 files) | shipped assets **and** committed derivatives | **Yes** — see §2.3 |
| `audit/` | **not ignored** | tracked (5 files; this report is the 6th, untracked) | project documentation | Yes as version control; **but** it is inside Tailwind's scan root — see §2.4 |
| `package-lock.json` | **not ignored** | tracked | lockfile | **Yes** — see §3.3 |
| `.claude/` | **not ignored** | tracked (`.claude/launch.json`) | editor/agent config | Mostly — `launch.json` is shared config and belongs in the repo, but the directory also hosts `settings.local.json` in normal use, which would be committed by accident. One line (`.claude/settings.local.json`) would close it. Not raised as a finding: no such file exists today. |

Two consistency observations worth recording, neither of them a defect:

- The `.env*` pattern at `.gitignore:7` is broader than its own comment ("the local env it writes").
  It also swallows `.env.example`, the conventional *committed* template. There is no such file
  today, so nothing is being lost — but the day someone adds one it will silently not appear in
  `git status`. See **P6-14**.
- The two zips are named individually rather than matched by `*.zip`. That is a deliberate,
  narrower rule (a future zip is *not* ignored, so it has to be dealt with consciously) and it is
  applied to both archives equally. Consistent.

### 2.2 `.env.local`

- **Ignored:** yes. `git check-ignore -v .env.local` → `.gitignore:7:.env*    .env.local`. It is
  not tracked (`git status --porcelain --ignored` lists it as `!!`, per Phase 1 §7).
- **Size:** `wc -l .env.local` → 2 lines.
- **Key names present** (from `grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env.local`, which stops at the
  `=` and cannot emit a value): **`VERCEL_OIDC_TOKEN`**. No value was read, printed or stored.
- **Classification:** one key, and it is **secret-shaped** — the name contains `TOKEN`, and
  `.gitignore:5` documents it as an OIDC token written by the Vercel CLI. It is Vercel *tooling*
  credential material rather than an application secret: nothing in `src/`, `vite.config.ts` or
  `vercel.json` reads any `VERCEL_*` variable, and no `import.meta.env` reference exists outside
  Vite's own types. So `README.md:63`'s "No environment variables" is accurate about the
  application even though the file exists.
- **Status: correctly ignored, nothing to remediate.** It is short-lived CLI-issued material, not
  a long-lived API key, and it has never been tracked (no history rewrite needed).

### 2.3 `dist/` is ignored — and that is right even though derivatives are committed

`dist/` is matched by `.gitignore:3` and holds 0 tracked files, while 36 AVIF/WebP derivatives
under `public/artwork/` and 8 PNGs under `public/brand/` **are** committed. That looks
inconsistent and is not, because the two sets sit on opposite sides of the build:

- `dist/` is **output**. It is regenerated by `vite build` on every deploy from committed inputs,
  its filenames are content-hashed (so every rebuild churns the diff), and nothing reads it except
  the host. Committing it would add ~1 MB of duplicate bytes per build with no reproducibility gain.
- `public/artwork/**` and `public/brand/**` are **inputs**. `vite build` does not produce them —
  `npm run images` does, by hand, and `sharp` is a devDependency that never runs on Vercel
  (`scripts/generate-images.mjs:8–10`). If they were not committed, a deploy would either need
  `sharp` in the build (slow, platform-binary-sensitive) or would ship a page with no artwork.

So the rule the repo actually follows is "commit what the build consumes, ignore what the build
emits", and both entries obey it.

### 2.4 Should `audit/` be ignored, or `@source not`-excluded? (given P1-5)

**Recommendation — do neither of those two things; scope Tailwind's source root instead.** (No
change was made; this is advice.)

P1-5 established that `src/index.css:1`'s bare `@import 'tailwindcss'` scans every non-ignored file
in the repo, and that with the audit reports on disk the landing stylesheet grew 17,563 → 17,862
bytes and gained `.isolate`, `.table` and `.grid-cols-5` — utilities that exist only because
`audit/*.md` quotes the words. Three ways out, in order of preference:

1. **Scope the import** — `@import 'tailwindcss' source('./')` from `src/`, or `source(none)` plus
   explicit `@source` lines for `src/` and the two HTML entries. This fixes the whole class of
   problem (audit reports, README, ASSETS, any future doc or fixture) in one line, which is exactly
   P1-5's own fix. **Preferred.**
2. `@source not "../audit"` in `src/index.css`. Works, but it is a denylist: the next non-source
   directory re-opens the hole, and it also has to be repeated for `README.md`/`ASSETS.md` if they
   ever quote a utility name.
3. Add `audit/` to `.gitignore`. This *would* stop the scan (Tailwind honours `.gitignore`), but it
   is the wrong instrument — it would take the audit reports out of version control to fix a CSS
   build problem. **Not recommended.**

Note that option 1 also removes the reason to care where `audit/` lives, which is why it is the one
worth doing.

---

## 3. Tooling configuration

### 3.1 `.oxlintrc.json`

The file is 8 lines. Declared: `plugins: ["react", "typescript", "oxc"]` (`:3`) and two rules —
`react/rules-of-hooks: "error"` (`:5`) and `react/only-export-components: ["warn", {
allowConstantExport: true }]` (`:6`). No `categories` block, so the default category
(`correctness`) applies.

**Effective configuration** (`npx oxlint --print-config`): **131 rules enabled** —
57 eslint-core, 33 `react/`, 27 `typescript/`, 14 `oxc/`. `npm run lint` currently exits 0 with no
diagnostics, over 29 files (`npx oxlint --debug=files` — all of `src/`, plus
`scripts/generate-images.mjs` and `vite.config.ts`; `dist/` and `node_modules/` are excluded).

Rules and plugins worth naming, with their actual current state:

| Rule / plugin | State | Evidence |
|---|---|---|
| `react/rules-of-hooks` | **enabled, `deny`** (config says `"error"`) | `.oxlintrc.json:5`; `--print-config` → `"deny"` |
| `react/only-export-components` | **enabled, `warn`**, `allowConstantExport: true` | `.oxlintrc.json:6` |
| `react/exhaustive-deps` | **enabled, `warn`** — by the react plugin's `correctness` defaults, *not* by the config file | `--print-config` → `"react/exhaustive-deps": "warn"`. This **corrects P2-9** — see P6-11 |
| `no-unused-vars` (eslint core) | **enabled, `warn`** | `--print-config` |
| `react/jsx-key` | **enabled, `warn`** | `--print-config` |
| `typescript/no-explicit-any` | **NOT enabled** (it is not a `correctness` rule; no `categories` block raises it) | absent from `--print-config`'s 131 |
| `unicorn/*` | **NOT enabled — 13 rules lost.** oxlint enables `unicorn` by default (`--help`: "Disable unicorn plugin, which is turned on by default"); naming `plugins` **overwrites the base set** (schema description of `plugins`) | Effective config has 0 `unicorn/` rules. A control run with `plugins:["react","typescript","oxc","unicorn"]` yields 142 rules; a bare `{"rules":{}}` yields 111 with 13 `unicorn/` and 0 `react/`. See **P6-12** |
| `jsx-a11y/*` | **available but NOT enabled** — `jsx-a11y` is in the plugin enum (`LintPluginOptionsSchema`: `eslint, react, unicorn, typescript, oxc, import, jsdoc, jest, vitest, jsx-a11y, nextjs, react-perf, promise, node, vue`) and is off by default (`--help`: "Enable the JSX-a11y plugin") | 0 `jsx-a11y/` rules in the effective config. Relevant to Phase 4's findings — see **P6-13** |
| `import/*` | available, **NOT enabled** (off by default; not in `plugins`) | same enum; `--help`: "Enable import plugin" |
| `promise/*`, `node/*`, `react-perf/*`, `jsdoc/*` | available, **NOT enabled** | same enum |

One structural point that costs more than any individual rule: `npm run lint` is
`oxlint` with no `--deny-warnings` and no `--max-warnings`, and `npm run build` does not call it.
Every rule above except `react/rules-of-hooks` is `warn`, so **no lint diagnostic can fail a build
or a deploy today** — see **P6-15**.

### 3.2 TypeScript configuration

Three files: `tsconfig.json` is a solution file (`files: []`, references to the two others);
`tsconfig.app.json` covers `src` (27 files, per `--showConfig`); `tsconfig.node.json` covers
`vite.config.ts` only. `npm run typecheck` (`tsc -b --noEmit`) exits 0. Installed compiler:
**TypeScript 6.0.3**.

`npx tsc --showConfig -p tsconfig.app.json` prints explicitly-set options plus options *implied* by
them; it does not print compiler defaults. So flags absent from both the file and the `--showConfig`
output are at their TS 6 default, which I probed directly (see §5).

| Flag | `tsconfig.app.json` | `tsconfig.node.json` | Effective value | Evidence |
|---|---|---|---|---|
| `strict` | **not declared** | **not declared** | **true** (TS 6 default) | `--showConfig` omits it; probe: default-config `tsc` on a file with an untyped parameter, `null`-to-`string`, and an optional-object deref errors with TS7006 / TS2322 / TS18048, and `--strict false` silences all three. Ref **P2-3** for the fact that it is undeclared |
| `noUnusedLocals` | `:20` `true` | `:17` `true` | true | `--showConfig` |
| `noUnusedParameters` | `:21` `true` | `:18` `true` | true | `--showConfig` |
| `noFallthroughCasesInSwitch` | `:23` `true` | `:20` `true` | true | `--showConfig` |
| `erasableSyntaxOnly` | `:22` `true` | `:19` `true` | true | `--showConfig` |
| `verbatimModuleSyntax` | `:14` `true` | `:12` `true` | true | `--showConfig` |
| `isolatedModules` | **not declared** | not declared | **true** — implied by `verbatimModuleSyntax` | printed by `--showConfig` though absent from the file (alongside `preserveConstEnums: true`) |
| `noUncheckedSideEffectImports` | **not declared** | not declared | **true** (TS 6 default) | Probe: a side-effect import of a non-existent `.css` errors TS2882 under bare defaults. The project is unaffected because `types: ["vite/client"]` (`tsconfig.app.json:7`) declares `*.css` |
| `noUncheckedIndexedAccess` | **not declared** | not declared | **false** | Probe: `const arr: string[] = ['a']; const first: string = arr[0]` compiles clean under bare defaults. See **P6-16** |
| `exactOptionalPropertyTypes` | **not declared** | not declared | **false** | Probe: `{ a: undefined }` assigned to `{ a?: number }` compiles clean. See **P6-16** |
| `skipLibCheck` | `:9` `true` | `:7` `true` | true | `--showConfig` |
| `target` | `:4` `es2023` | `:4` `es2023` | `es2023` | `--showConfig` |
| `lib` | `:5` `["ES2023", "DOM"]` | `:5` `["ES2023"]` | `["es2023","dom"]` | `--showConfig` |
| `moduleResolution` | `:12` `bundler` | (implied by `module: nodenext`) | `bundler` / `nodenext` | `--showConfig` |
| `module` | `:6` `esnext` | `:10` `nodenext` | as declared | file |
| `noEmit` | `:16` `true` | `:14` `true` | true | `--showConfig` |
| `jsx` | `:17` `react-jsx` | n/a | `react-jsx` | `--showConfig` |

One coverage gap, stated as fact rather than raised: `tsconfig.node.json:22` includes only
`vite.config.ts`, so **`scripts/generate-images.mjs` is type-checked by nothing** (it is `.mjs`,
and `allowJs` is off everywhere). It *is* linted — it appears in oxlint's 29-file list. Given it is
a hand-run build script with no imports from `src/`, that is a defensible line to draw; noted so
Phase 8 does not have to re-derive it.

### 3.3 `package.json`

- **Version ranges.** All 16 dependencies use caret ranges except TypeScript: `typescript:
  "~6.0.2"` (`package.json:30`) is the single tilde — the conventional pin, since a TS minor can
  introduce new errors. Everything else (`react ^19.2.8`, `motion ^13.1.1`, `vite ^8.2.0`,
  `tailwindcss ^4.3.3`, `oxlint ^1.75.0`, `sharp ^0.35.3`, …) floats to the next major. Consistent,
  and safe **because** of the next point.
- **Lockfile.** `package-lock.json` is committed and not ignored — `lockfileVersion: 3`, 146
  package entries, `name: hackbu-landing`. No competing `yarn.lock`/`pnpm-lock.yaml`. So the caret
  ranges resolve reproducibly for both local installs and Vercel.
- **`engines`.** **Absent** — `grep -n "engines" package.json` → no match, and `README.md` names no
  Node version either (`grep -n "Node" README.md` → no match). See **P6-17**.
- **`private: true`** (`:3`) is set, correctly for a non-published app.

---

## 4. Findings

### P6-1 — `low` — `ASSETS.md`'s file-count sentences predate the derivatives, and the file now contradicts itself

**Evidence.** `ASSETS.md:29`: "It is the only file in `public/artwork/campus/`, and the only
non-cloud asset." On disk that directory holds nine files:

```
$ ls public/artwork/campus
Campus-1280.avif  Campus-1280.webp  Campus-1672.avif  Campus-1672.webp
Campus-640.avif   Campus-640.webp   Campus-960.avif   Campus-960.webp  Campus.png
```

The same document says so itself 50 lines later — `ASSETS.md:79–80`, "writes AVIF and WebP
derivatives **beside** each PNG". `ASSETS.md:33` has the same shape ("The twelve files in
`public/artwork/clouds/`", now 36 files) but is saved by its parenthetical, which names the twelve
PNGs explicitly.

**Expected.** `ASSETS.md:79–89` and Phase 5 §2.2 — 8 campus derivatives and 24 cloud derivatives
are committed and documented.

**Fix.** `ASSETS.md:29` → "It is the only *source* file in `public/artwork/campus/` (the AVIF/WebP
derivatives sit beside it — see Derivatives below)"; make `:33` say "twelve PNGs".

### P6-2 — `low` — `ASSETS.md:149`'s "88% of the artwork bytes" was not updated when the cloud count doubled

**Evidence.** `ASSETS.md:149`: "**At 2.81 MiB, Campus.png dominates page weight** — it is 88% of the
artwork bytes". Recomputed from the files on disk: 2,942,406 / 3,780,900 = **77.8%**. At six clouds
it was 2,942,406 / 3,338,215 = 88.1%, so the figure was correct before commit `9a5a72d`.

**Expected.** `ASSETS.md:57` in the same file gives the current total (3,780,900 B) that makes the
number 78%.

**Fix.** 88% → 78%, or delete the sentence with the rest of the stale block (P6-3).

### P6-3 — `note` — `ASSETS.md`'s "Notes for later phases" block is advice that has since been taken

**Evidence.** `ASSETS.md:141–151`. "A horizontal scroll-pan has limited travel … Worth confirming
against the intended motion before building it" (`:147–148`) — the hero was built and is a vertical
scale-pan (`src/components/Hero.tsx:150–157`). "Compressing it or emitting a WebP/AVIF alongside is
the obvious lever if load time matters" (`:150–151`) — done, and documented at `ASSETS.md:77–89`
above it. Only the third bullet (`:152`, cloud heights 70–303 px) is still live, and it *was*
updated for twelve clouds.

**Expected.** The section's own framing: "observations from the raw files, not design decisions"
(`:143`) — written before there was a design.

**Fix.** Delete the first two bullets or move them under a "resolved" heading; the third stays.

### P6-4 — `low` — `README.md:235` puts the header's menu breakpoint at 390px; it is 768px

**Evidence.** `README.md:235`: "`SiteHeader.tsx`  fixed header, collapses to a menu at 390px". The
collapse is at Tailwind's `md`: `src/components/SiteHeader.tsx:56` (`hidden … md:flex` on the nav),
`:77` (`md:hidden` on the toggle), `:90` (`md:hidden` on the panel). The component's own header
comment states it correctly — `:15–16`, "Below `md` (768px) the three links and the CTA collapse
behind a toggle, so the 390px layout is the lockup plus a menu button."

**Expected.** `src/components/SiteHeader.tsx:15–16`; 390px is the narrow *test viewport* used
throughout the audit, not a breakpoint. `grep -rn "390" src/` returns nine hits — comments naming
the narrow test viewport (`Hero.tsx:115,127`, `HeroClouds.tsx:48,176,542,545`, `SiteHeader.tsx:16`,
`sheet/parts/HeroPart.tsx:269`) and SVG path data (`SnowdriftDivider.tsx:62`) — and none is a
breakpoint or media query. [Corrected after checker review.]

**Fix.** `README.md:235` → "fixed header, collapses to a menu below `md` (768px)".

### P6-5 — `note` — `README.md:125`'s scale floor is a rounding error, and disagrees with the code comment it documents

**Evidence.** `README.md:125`: "the start scale must stay above `1 / 0.351 ≈ 2.86`". `1/0.351 =
2.8490`. `src/components/Hero.tsx:69` states the same constraint as "The binding constraint is
`1/S < 0.351`, i.e. **S > 2.85**".

**Expected.** The two documents should quote the same floor, and the quotient rounds to 2.85.

**Assessment.** Harmless in direction — 2.86 is *more* conservative than the true floor, and the
shipped scale is 3 either way — but a reader deriving a new scale from a new illustration will get
two different floors from two files.

**Fix.** `README.md:125` → `≈ 2.85`, matching `Hero.tsx:69`.

### P6-6 — `note` — the README's Layout tree omits `src/main.tsx`, `src/landing.css` and all of `src/sheet/`

**Evidence.** `README.md:222–247` prints `src/` as `App.tsx`, `index.css`, `lib/`, `components/`.
`ls -R src` also shows `main.tsx`, `landing.css` and `sheet/` (7 files:
`ComponentSheet.tsx`, `kit.tsx`, `main.tsx`, `sheet.css`, `parts/{Composed,Hero,Primitives,Tokens}Part.tsx`).
Both omissions are documented *elsewhere in the same README* — `:81` explains `src/landing.css` and
`:73–92` is a whole section about the sheet.

**Expected.** A tree titled "Layout" that is used as the orientation map for new contributors.

**Assessment.** STALE rather than wrong: the sheet landed after the README (commits `fb392cf` vs
`c2676a1`), and the tree was accurate when written. `main.tsx` was never listed.

**Fix.** Add three lines: `main.tsx`, `landing.css`, and a `sheet/` entry pointing at `:73`.

### P6-7 — `note` — the cloud cast list in `HeroClouds.tsx:143` lists the `near` layer in an order the array does not use

**Evidence.** `src/components/HeroClouds.tsx:143`: "`near   cloud-5, cloud-1, cloud-8, cloud-11`".
The array at `:348,357,366,375` is `cloud-5, cloud-8, cloud-11, cloud-1`. `far` (`:233–260`) and
`mid` (`:280–307`) match their comment rows exactly.

**Expected.** The comment presents itself as the cast list; membership is right (and the height
sort it describes — 253, 259, 294, 303 — is the comment's order, not the array's).

**Assessment.** Cosmetic: within a layer the array order affects only DOM order of absolutely
positioned, `aria-hidden` images. Flagged because the comment is the only place the casting is
explained, and the mismatch invites a reader to "fix" the array.

**Fix.** Reorder the comment row to `cloud-5, cloud-8, cloud-11, cloud-1`, or say the row is the
height sort rather than the array.

### P6-8 — `note` — "Phase N" labels across 8 files reference a plan that exists only in the git log, and one is written in the future tense for work already shipped

**Evidence.** `grep -rn "Phase [0-9]" src index.html components.html README.md ASSETS.md scripts
vercel.json` → 15 sites in 8 files: `ButtonLink.tsx:25`, `Hero.tsx:23,93,139`,
`HeroClouds.tsx:7,13,171,561`, `IntroSection.tsx:11`, `index.css:45,76`, `images.ts:2` ("Phase 6a"),
`motion.ts:15,105`, `ASSETS.md:77` ("## Derivatives (Phase 6)"). No plan document exists in the
repo (`grep -n "Phase" README.md` → no match). The labels resolve only against commit subjects
(`git log --oneline`: `Phase 1: Vite+React+TS scaffold…` … `Phase 7: README…`).

The stale one: `src/lib/motion.ts:15–17` — "Phase 4 (cloud parallax) and Phase 5 (section reveals)
**are expected to** consume them, not re-derive them." Both shipped (`HeroClouds.tsx:4`,
`Reveal.tsx:3`, commits `d956860` and `809712e`).

**Assessment.** Two costs. First, a new contributor cannot resolve "Phase 6" without archaeology in
the git log. Second — relevant to this audit specifically — the build phases are numbered 1–7 and
collide with the audit reports' own 1–8, so "Phase 6" in `ASSETS.md:77` and "(Phase 6a)" in
`images.ts:2` mean the *build's* phase 6, not this document.

**Fix.** Either add a short "History" section to the README mapping phase numbers to commits, or
rewrite the labels as what they actually describe ("when the derivatives landed", "when the copy
moved out of the hero"). At minimum, change `motion.ts:15–17` to past tense.

### P6-9 — `note` — `src/lib/motion.ts:38`'s "does not re-subscribe" describes the wrong half of the mechanism

**Evidence.** `src/lib/motion.ts:38–39`: "motion reads the media query once at mount and does not
re-subscribe, so a mid-session OS change takes effect on the next page load." The library does
subscribe: `node_modules/motion-dom/dist/es/render/utils/reduced-motion/index.mjs` —
`motionMediaQuery.addEventListener("change", setReducedMotionPreferences)`, which keeps the global
`prefersReducedMotion.current` live. What never updates is the hook's React state:
`node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs` —
`const [shouldReduceMotion] = useState(prefersReducedMotion.current)`, with the library's own
`TODO See if people miss automatically updating shouldReduceMotion setting` immediately below.

**Assessment.** The user-visible consequence the comment states is **correct** — the component will
not re-render on a mid-session change. Only the stated mechanism is wrong, and it matters because
someone reading "does not re-subscribe" might add a `matchMedia` listener of their own (a second
subscription) instead of the one-line fix (`useSyncExternalStore`, or re-reading on route change).

**Fix.** "motion captures the value in `useState` at mount and never re-renders on change (it does
listen to the media query, but only to update a module-level ref) …".

### P6-10 — `note` — "a deploy is just `vite build`" is stated in three places; the build also type-checks

**Evidence.** `README.md:71` ("a build is just `vite build`"), `ASSETS.md:81–82` ("a deploy runs
`vite build` and nothing else"), `scripts/generate-images.mjs:9` ("a deploy needs nothing but `vite
build`"). The actual command is `package.json:8` — `"build": "tsc -b && vite build"` — invoked by
`vercel.json:4` as `npm run build`. `README.md:50` states it correctly two dozen lines earlier.

**Assessment.** The point all three sentences are making — that `npm run images` does *not* run on
deploy, because the derivatives are committed — is true and important. The phrasing just
under-describes the build, which matters because a type error fails the deploy and someone reading
"just `vite build`" would not expect that.

**Fix.** "a deploy runs `npm run build` (`tsc -b && vite build`) and nothing else — in particular
not `npm run images`."

### P6-11 — `note` — correction to P2-9: `react/exhaustive-deps` **is** enabled, at `warn`

**Evidence.** P2-9 concluded "nothing checks dependency arrays" and "the guardrail is absent" from
the fact that `.oxlintrc.json` does not name the rule. The effective configuration does enable it:

```
$ npx oxlint --print-config
… "react/exhaustive-deps": "warn", …
```

It arrives with the `react` plugin's `correctness` category, which `.oxlintrc.json:3` turns on. 131
rules are active in total; only two of them come from the `rules` block.

**Assessment.** P2-9's *file-level* observation is literally true (the rule is not named in the
config) and its hand-check of the two hooks stands. Its conclusion is not: the guardrail exists, at
`warn` severity, and `npm run lint` currently reports no violations. The residual issue is severity
plus enforcement, which is P6-15, not absence.

**Fix.** None to the code. Phase 8 should carry P2-9 forward as "enabled at `warn`, not enforced"
rather than "absent".

### P6-12 — `low` — naming `plugins` in `.oxlintrc.json` silently drops the default-on `unicorn` plugin (13 rules)

**Evidence.** `.oxlintrc.json:3` — `"plugins": ["react", "typescript", "oxc"]`. The schema is
explicit that this is a replacement, not an addition:

> `node_modules/oxlint/configuration_schema.json`, `properties.plugins.description`: "NOTE: Setting
> the `plugins` field will overwrite the base set of plugins. The `plugins` array should reflect all
> of the plugins you want to use."

and `npx oxlint --help` says unicorn is on by default ("`--disable-unicorn-plugin`  Disable unicorn
plugin, which is turned on by default"). Measured, with `--print-config`:

| Config | Total rules | Breakdown |
|---|---:|---|
| project's `.oxlintrc.json` | 131 | 57 core, 33 react, 27 typescript, 14 oxc, **0 unicorn** |
| `{"plugins":["react","typescript","oxc","unicorn"],"rules":{}}` | 142 | + **13 unicorn**, 31 react |
| `{"rules":{}}` (defaults) | 111 | 57 core, 14 oxc, 27 typescript, **13 unicorn**, 0 react |

**Expected.** The config's evident intent is "add react to the defaults" — the two rules it names
are both react rules.

**Fix.** `"plugins": ["react", "typescript", "oxc", "unicorn"]`, or record in the README that
unicorn is deliberately off.

### P6-13 — `low` — the `jsx-a11y` plugin is available and switched off, on a page whose audit is half accessibility

**Evidence.** `jsx-a11y` is a supported oxlint plugin
(`configuration_schema.json` → `LintPluginOptionsSchema` enum: `eslint, react, unicorn, typescript,
oxc, import, jsdoc, jest, vitest, **jsx-a11y**, nextjs, react-perf, promise, node, vue`) and is off
unless enabled (`--help`: "`--jsx-a11y-plugin`  Enable the JSX-a11y plugin and detect accessibility
problems"). `.oxlintrc.json:3` does not list it, and the effective config contains **0** `jsx-a11y/`
rules.

**Assessment.** Phase 4 found eight a11y issues by hand. Several of the rule families in that plugin
(`anchor-is-valid`, `alt-text`, `aria-props`, `role-has-required-aria-props`, `no-autofocus`) are
exactly the class of regression a static check catches cheaply and a human review has to re-derive
every time. This is the single highest-value change to the lint config.

**Fix.** Add `"jsx-a11y"` to `plugins`, run once, and triage. (Not done here — read-only phase.)

### P6-14 — `note` — `.gitignore:7`'s `.env*` would also ignore a committed `.env.example`

**Evidence.** `.gitignore:5–7` — the comment scopes the rule to "the local env it writes (contains
an OIDC token)", but the pattern is `.env*`, which matches `.env.example`, `.env.sample` and
`.env.production` alike. Today the only match is `.env.local` (§2.2), so nothing is being lost.

**Fix.** Either narrow to `.env.local` / `.env*.local`, or add a negation `!.env.example`, before
anyone adds a template that then silently fails to appear in `git status`.

### P6-15 — `low` — no lint diagnostic can fail a build: `npm run lint` never denies warnings, and `npm run build` never lints

**Evidence.** `package.json:10` — `"lint": "oxlint"`, with no `--deny-warnings` and no
`--max-warnings`. `package.json:8` — `"build": "tsc -b && vite build"`, which does not invoke
oxlint. `vercel.json:4` runs `npm run build`. Of the 131 effective rules, **130 are `warn`** and one
(`react/rules-of-hooks`) is `deny` (`--print-config`). Observed: `npm run lint` exits **0**.

**Assessment.** Today the repo is clean, so nothing is being suppressed. But the guardrails the
project chose deliberately — `react/only-export-components` (`.oxlintrc.json:6`) and
`react/exhaustive-deps` (P6-11) — can only ever print, never block, and there is no CI configuration
in the repo (`ls .github` → absent) that would read the output. A stale-closure regression would
ship.

**Fix.** `"lint": "oxlint --deny-warnings"` (or `--max-warnings=0`), and either add lint to `build`
or add a CI step that runs it.

### P6-16 — `note` — two strictness flags beyond `strict` are off: `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`

**Evidence.** Neither appears in `tsconfig.app.json`, `tsconfig.node.json`, or the `--showConfig`
output, and neither is part of `strict`. Probed against the installed compiler (TS 6.0.3) with no
config: `const arr: string[] = ['a']; const first: string = arr[0]` compiles clean
(`noUncheckedIndexedAccess` off) and `const o: {a?: number} = { a: undefined }` compiles clean
(`exactOptionalPropertyTypes` off). Ref **P2-3** for the separate point that `strict` itself is
never declared — which I can now confirm resolves to **true** by TS 6 default (§3.2).

**Assessment.** Both are opt-in-by-design and both cost churn. `noUncheckedIndexedAccess` is the
more relevant of the two here: the codebase indexes tuples and arrays in several places
(`HeroClouds.tsx` layer/cloud maps, `src/lib/images.ts:28` `CAMPUS_WIDTHS.map`), though all through
`map`/`for…of` rather than raw subscripts, so the immediate yield would be near zero.

**Fix.** Optional. If either is wanted, `noUncheckedIndexedAccess` first. Otherwise record the
decision alongside the `strict` decision P2-3 asks for.

### P6-17 — `note` — no `engines` field and no documented Node version, for a Vite 8 / TS 6 toolchain

**Evidence.** `grep -n "engines" package.json` → no match. `grep -n "Node" README.md` → no match;
`README.md:33–43` ("Local setup") goes straight from `npm install` to `npm run dev`. `vercel.json`
pins the framework and the build command but no runtime. The toolchain is Vite `^8.2.0`,
TypeScript `~6.0.2`, `@types/node ^24.13.3` and `sharp ^0.35.3` — all of which have Node floors, and
`sharp` additionally ships platform-specific binaries.

**Assessment.** Vercel picks a Node major from project settings that live outside the repo (I did
not read them: `.vercel/project.json` holds only ids and `projectName`). So the version that builds
the deploy is not discoverable from the repo at all.

**Fix.** Add `"engines": { "node": ">=20" }` (or whatever the intended floor is) to `package.json`,
and one line in "Local setup". `engines` is also what Vercel reads to select a runtime.

---

## 5. Commands run

Verbatim, in order. All read-only; nothing outside `audit/` was written (the three probe files live
in the session scratchpad, outside the repo).

```bash
ls -la && echo "--- audit ---" && ls -la audit/
cat -n README.md
cat -n ASSETS.md
for f in index.html components.html vite.config.ts vercel.json package.json tsconfig.json tsconfig.app.json tsconfig.node.json .oxlintrc.json .gitignore; do echo "=== $f ==="; cat -n "$f"; done
cat -n src/index.css
cat -n src/landing.css
ls -R src
cat -n src/lib/images.ts
cat -n src/lib/links.ts
cat -n src/lib/motion.ts
cat -n src/components/Hero.tsx
cat -n src/main.tsx
cat -n src/sheet/main.tsx
cat -n src/components/HeroClouds.tsx
sed -n '30,220p' src/components/HeroClouds.tsx
cat -n scripts/generate-images.mjs
grep -rn "Phase [0-9]" src index.html components.html README.md ASSETS.md scripts vercel.json vite.config.ts
grep -rn "addEventListener\|onScroll\|'scroll'\|\"scroll\"" src/
grep -rn "useScroll" src/
ls -l public/artwork/campus
ls public/artwork/clouds | sed 's/.*\.//' | sort | uniq -c
ls public/artwork/clouds/*.png
for ext in avif webp png; do du -cb public/artwork/campus/*.$ext | tail -1; du -cb public/artwork/clouds/*.$ext | tail -1; done
ls -l artwork/campus artwork/clouds
ls -l public/brand
ls -l brand-source
grep -n "^### P5-\|^## \|^| P5-" audit/05-performance.md
grep -n "11.7\|5.3 KB\|ASSETS.md:136\|ASSETS.md:116\|byte-identical\|components.html" audit/05-performance.md
sed -n '188,340p' audit/05-performance.md
for p in moreclouds.zip HackBULogo.zip .env.local .vercel/ dist/ node_modules/ audit/ artwork/ brand-source/ public/ package-lock.json .claude/; do printf '%-20s ' "$p"; git check-ignore -v "$p" || echo "NOT IGNORED"; done
grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env.local
wc -l .env.local
ls -a .vercel
node -e "const j=require('./.vercel/project.json');console.log(Object.keys(j).join(', '));…"   # key names only
node -e "console.log('projectName:', require('./.vercel/project.json').projectName)"
for d in artwork brand-source public audit dist scripts src .claude; do printf '%-14s tracked=%s\n' "$d" "$(git ls-files "$d" | wc -l)"; done
git status --short
git log --oneline -3
node -e "…require('./node_modules/oxlint/configuration_schema.json')…"        # top-level keys
node -e "…console.log('plugins schema:', JSON.stringify(j.properties.plugins)…"
node -e "…console.log(JSON.stringify(d.LintPluginOptionsSchema)…"             # plugin enum
npx --no-install oxlint --help
npx --no-install oxlint --print-config
npx --no-install oxlint --rules
npx --no-install oxlint --print-config > "$SCRATCH/oxcfg.json"
node -e "…rule counts by plugin prefix, severities of six named rules…"
printf '{"plugins":["react","typescript","oxc","unicorn"],"rules":{}}' > "$SCRATCH/with-unicorn.json"
printf '{"rules":{}}' > "$SCRATCH/default.json"
npx --no-install oxlint --print-config -c "$SCRATCH/with-unicorn.json"
npx --no-install oxlint --print-config -c "$SCRATCH/default.json"
npx --no-install oxlint --debug=files
sed -n '396,432p' audit/02-code.md
npm run lint
npm run typecheck
npx --no-install tsc --version
npx --no-install tsc --showConfig -p tsconfig.app.json
printf 'export function f(x) { return x }\nexport let s: string = null\nexport function g(o?: {a: number}) { return o.a }\n' > "$SCRATCH/strictprobe.ts"
npx --no-install tsc --noEmit --ignoreConfig --target es2023 "$SCRATCH/strictprobe.ts"
npx --no-install tsc --noEmit --ignoreConfig --strict false --target es2023 "$SCRATCH/strictprobe.ts"
cat > "$SCRATCH/probe2.ts" <<'EOF'
import './definitely-missing-side-effect.css'
const arr: string[] = ['a']
export const first: string = arr[0]
type O = { a?: number }
const o: O = { a: undefined }
export const oo = o
EOF
npx --no-install tsc --noEmit --ignoreConfig --target es2023 --moduleResolution bundler --module esnext "$SCRATCH/probe2.ts"
grep -n "jsx-a11y\|oxlint" audit/04-accessibility.md
grep -n "oxlint\|exhaustive-deps\|P2-9" audit/02-code.md
grep -n "2\.72\|4\.78\|4\.03\|3\.27\|5\.36\|2\.29\|2\.75\|4\.65" audit/03-design-system.md audit/04-accessibility.md
grep -n "^### P3-\|^### P4-" audit/03-design-system.md audit/04-accessibility.md
sed -n '405,428p' audit/03-design-system.md
sed -n '$(grep -n "^### Root-level artefacts" audit/01-baseline.md),+35p' audit/01-baseline.md
sed -n '$(grep -n "^### P1-5" audit/01-baseline.md),+22p' audit/01-baseline.md
node -e "…README token table vs src/index.css, both hex values, per token…"
grep -n "id: '\|scale:\|opacity:\|driftSeconds:\|file: 'cloud" src/components/HeroClouds.tsx
sed -n '1,30p' src/components/SiteHeader.tsx
sed -n '44,50p' src/components/SiteHeader.tsx
grep -n "390\|md:hidden\|collapses to a menu\|breakpoint" audit/0*.md
grep -rn "#[0-9a-fA-F]\{6\}\|#[0-9a-fA-F]\{3\}\b" src/ --include=*.tsx --include=*.ts --include=*.css
grep -rEn "bg-(black|white|gray|slate|zinc|neutral|red|blue|green)-?[0-9]*|text-(black|white|gray|slate)" src/
sed -n '30,60p' src/components/Wordmark.tsx
grep -n "<a \|<button\|tabIndex\|href=" src/components/Hero.tsx src/components/HeroClouds.tsx
sed -n '1,40p' src/components/ExternalLink.tsx
sed -n '1,35p' src/components/ButtonLink.tsx
grep -rn "animate=\|style={{\|initial=" src/components/*.tsx
sed -n '630,700p' src/components/HeroClouds.tsx
grep -n "initial\|animate\|whileInView\|transition\|opacity\|y:" src/components/Reveal.tsx
ls tailwind.config.* postcss.config.*
grep -n "SITE_PAGES\|slice\|grid-cols\|column" src/components/SiteFooter.tsx
grep -n "Part\b\|<.*Part" src/sheet/ComponentSheet.tsx
grep -n "alt=\|aria-hidden\|decoding\|loading=" src/components/HeroClouds.tsx
grep -n "SET_COUNT\|hang\|overhang\|LOOP_START\|LOOP_END" src/components/HeroClouds.tsx
grep -rn "components" src/components src/App.tsx src/lib index.html
grep -n "usePrefersReducedMotion\|reducedMotion" src/components/Reveal.tsx
node -e "…sheet TokensPart hexes vs src/index.css…"
grep -rn "@fontsource" src/
grep -n "engines\|node" package.json
grep -n "Node\|node " README.md
ls -d .github
node -e "const p=require('./package-lock.json');console.log('lockfileVersion',p.lockfileVersion,…)"
ls yarn.lock pnpm-lock.yaml npm-shrinkwrap.json
node -e "…sharp raw scan of public/artwork/campus/Campus.png for reddish rows…"
node -e "…sharp opaque-colour histograms of the three brand-source PNGs…"
node -e "…byte totals, campus share at 6 vs 12 clouds, new-six AVIF sum, 1/0.351, 1/0.1934, 42%, 58.02%…"
grep -rln "useReducedMotion" node_modules/motion-dom/dist/es/ node_modules/framer-motion/dist/es/
cat node_modules/framer-motion/dist/es/utils/reduced-motion/*.mjs
cat node_modules/motion-dom/dist/es/render/utils/reduced-motion/index.mjs
grep -rn "transition-\|\"transition\"\|'transition'\| transition " src/ --include=*.tsx --include=*.ts --include=*.css
grep -rn "scroll-mt" src/
grep -rn "href=" src/components src/App.tsx
grep -n "…" README.md ASSETS.md      # line-number confirmation for every quoted claim
```

Not run, per this phase's constraints: `npm run images`, `npm install`, `npm run dev`, `npm run
preview`, `npm run build`, `npx vercel`, anything networked. `.env.local` was never opened, `cat`ed,
or read beyond the two commands shown, and no value from it appears anywhere in this report.

---

## 6. Handover

**For Phase 7 (live).**

- Four claims need a browser or a network to settle: `src/lib/links.ts:5` (are the eight
  hackbu.org URLs plus the five socials still canonical and live?), `src/index.css:145` ("only one
  mask rung is ever fetched" — check the network panel at 1x and 2x), `src/index.css:137–139` (the
  Firefox 88 `image-set()` claim), and `index.html:8` (the 3.4% stroke-height measurement).
- `og:image` resolves to `https://hackbu-landing.vercel.app/brand/og-image.png`, and
  `.vercel/project.json`'s `projectName` is `hackbu-landing`, so the URL matches the project's
  default Vercel domain rather than being a typo — but P5-12 stands: nothing in the repo documents
  the production domain, so confirm what the deploy actually serves.
- Worth confirming live: that `/components-anything` really 404s (P5-4's static walk), since
  `README.md:90` claims otherwise.

**For Phase 8 (consolidation).**

- **P2-9 needs restating, not repeating.** `react/exhaustive-deps` is enabled at `warn` by the react
  plugin's correctness defaults (P6-11). The real gap is enforcement (P6-15), not absence.
- **P2-3 can be closed with a fact:** `strict` is undeclared but resolves to **true** under the
  pinned TypeScript 6.0.3, verified by probe. The remaining question is whether to declare it
  explicitly, which is a policy choice, not a defect.
- Three documentation defects cluster around commit `9a5a72d` (six→twelve clouds): P6-1, P6-2 and
  the still-accurate `ASSETS.md:152`. Whoever fixes one should sweep the file.
- Doc-accuracy findings by file: `README.md` — P6-4, P6-5, P6-6, P6-10 (+ P5-4, P3-2, P3-3, P3-5,
  P2-2). `ASSETS.md` — P6-1, P6-2, P6-3, P6-10 (+ P5-9, P5-10). Source comments — P6-7, P6-8, P6-9
  (+ P5-11, P3-4). That is 12 new doc issues, none above `low`, and the README carries the most.
- Tooling findings are the actionable half of this phase: **P6-13** (`jsx-a11y` off) and **P6-15**
  (warnings never fail) are the two worth doing something about; P6-12 (unicorn silently dropped) is
  a one-word fix.
- P1-5's fix (scope Tailwind's `@import` source) also disposes of the "should `audit/` be ignored"
  question — §2.4. No `.gitignore` change is needed for it, and none is recommended.
