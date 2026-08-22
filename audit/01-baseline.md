# Phase 1 Baseline (re-run)

**Baseline HEAD:** `15bc3684e396db4f79258ee6dd6037369f79cbb6` (`15bc368`, "audit: phase 2 report")

This is a re-run of Phase 1. The previous baseline report was written at `1126c73`, but the
project subsequently received `9a5a72d` ("Clouds: add six new cutouts across the three depth
layers; tidy repo"), which touched `.gitignore`, `README.md`, `ASSETS.md`,
`scripts/generate-images.mjs`, `src/components/Hero.tsx`, `src/components/HeroClouds.tsx`,
`src/sheet/parts/HeroPart.tsx`, added 6 new cloud PNGs (+ AVIF/WebP derivatives) plus
`clouds-all-b.png`, and deleted the old `audit/01-baseline.md`. `HEAD` (`15bc368`) adds only
`audit/02-code.md` on top of `9a5a72d`. Every number below was re-derived against the current
tree; nothing was copied from the old report except for direct comparison in §7.

`git log --oneline -1` was checked before and after this run and stayed at `15bc368` throughout —
no mid-run drift.

---

## 1. `npm run typecheck`

```
> hackbu-landing@0.0.0 typecheck
> tsc -b --noEmit

EXIT=0
```

No output besides the npm script header; no type errors.

## 2. `npm run lint`

```
> hackbu-landing@0.0.0 lint
> oxlint

EXIT=0
```

`npx oxlint` run standalone (outside the npm wrapper) also produced zero stdout/stderr output
with `EXIT=0` — oxlint is silent on a clean run in this environment (no "Found 0 warnings and 0
errors" summary line was printed, unlike some oxlint versions/configs). Exit code is the
authoritative clean signal here.

## 3. `npm run build`

```
> hackbu-landing@0.0.0 build
> tsc -b && vite build

vite v8.2.2 building client environment for production...
transforming...
✓ 450 modules transformed.
rendering chunks...
computing gzip size...
dist/components.html                                    1.46 kB │ gzip:   0.71 kB
dist/index.html                                         3.57 kB │ gzip:   1.61 kB
dist/assets/fraunces-latin-600-normal-BFCDtZfi.woff2   18.09 kB
dist/assets/fraunces-latin-600-normal-DL5QCzvS.woff    22.51 kB
dist/assets/inter-latin-400-normal-C38fXH4l.woff2      23.66 kB
dist/assets/inter-latin-500-normal-Cerq10X2.woff2      24.27 kB
dist/assets/inter-latin-400-normal-CyCys3Eg.woff       30.69 kB
dist/assets/inter-latin-500-normal-BL9OpVg8.woff       31.28 kB
dist/assets/SiteFooter-DgSLZxXM.css                     0.65 kB │ gzip:   0.23 kB
dist/assets/index-OqmKQzXD.css                         17.56 kB │ gzip:   4.49 kB
dist/assets/components-CFX3UKPI.css                    20.81 kB │ gzip:   5.11 kB
dist/assets/index-B2XwinZz.js                          14.60 kB │ gzip:   5.65 kB
dist/assets/components-DbRnhCYk.js                     53.83 kB │ gzip:  16.42 kB
dist/assets/SiteFooter-D2vbYzEP.js                    328.96 kB │ gzip: 105.11 kB

✓ built in 403ms
EXIT=0
```

## 4. `dist/assets/` inventory (byte size + gzip size)

> Snapshot from the §3 build. The §8 rebuild (with both audit reports on disk) superseded these
> hashed filenames on disk — JS byte sizes unchanged, CSS +299 B each, all four per-entry hashes
> rolled (e.g. `index-B2XwinZz.js` → `index-BCCAt3yZ.js`). Later phases wildcard the names.

Byte size from `ls -la` (== `stat -c%s`); gzip size from `gzip -c f | wc -c` (raw gzip stream
size, independent of Vite's own reported gzip column above — the two agree to within a couple of
bytes, which is expected since Vite also uses gzip level 9-ish compression).

| File | Bytes | Gzip bytes |
|---|---:|---:|
| `SiteFooter-D2vbYzEP.js` | 328,964 | 103,956 |
| `SiteFooter-DgSLZxXM.css` | 655 | 256 |
| `components-CFX3UKPI.css` | 20,818 | 5,075 |
| `components-DbRnhCYk.js` | 53,832 | 16,297 |
| `fraunces-latin-600-normal-BFCDtZfi.woff2` | 18,096 | 18,160 |
| `fraunces-latin-600-normal-DL5QCzvS.woff` | 22,512 | 22,530 |
| `index-B2XwinZz.js` | 14,604 | 5,667 |
| `index-OqmKQzXD.css` | 17,563 | 4,478 |
| `inter-latin-400-normal-C38fXH4l.woff2` | 23,664 | 23,701 |
| `inter-latin-400-normal-CyCys3Eg.woff` | 30,696 | 30,549 |
| `inter-latin-500-normal-BL9OpVg8.woff` | 31,284 | 31,099 |
| `inter-latin-500-normal-Cerq10X2.woff2` | 24,272 | 24,287 |

(Gzip sizes of the already-compressed `.woff`/`.woff2` files come out slightly *larger* than the
source — expected, gzip adds container overhead to incompressible font-binary data.)

`dist/` root also has `index.html` (3,578 bytes) and `components.html` (1,461 bytes).

## 5. Chunk reachability: `dist/index.html` vs `dist/components.html`

Full contents of both HTML files were read directly.

**`dist/index.html`** references:
- `<script type="module" src="/assets/index-B2XwinZz.js">` (entry)
- `<link rel="modulepreload" href="/assets/SiteFooter-D2vbYzEP.js">`
- `<link rel="stylesheet" href="/assets/SiteFooter-DgSLZxXM.css">`
- `<link rel="stylesheet" href="/assets/index-OqmKQzXD.css">`

**`dist/components.html`** references:
- `<script type="module" src="/assets/components-DbRnhCYk.js">` (entry)
- `<link rel="modulepreload" href="/assets/SiteFooter-D2vbYzEP.js">`
- `<link rel="stylesheet" href="/assets/SiteFooter-DgSLZxXM.css">`
- `<link rel="stylesheet" href="/assets/components-CFX3UKPI.css">`

Dynamic-import cross-check (`grep -aoE '"[^"]*\.(js|css)"'` and a raw `SiteFooter-[A-Za-z0-9]+`
search over every JS chunk, to catch imports not visible in the HTML):

```
$ grep -ao '"[^"]*\.\(js\|css\)"' dist/assets/index-B2XwinZz.js | sort -u
"./SiteFooter-D2vbYzEP.js"
$ grep -ao '"[^"]*\.\(js\|css\)"' dist/assets/components-DbRnhCYk.js | sort -u
"./SiteFooter-D2vbYzEP.js"
$ grep -aoE '"[^"]*\.(js|css)"' dist/assets/SiteFooter-D2vbYzEP.js | sort -u
(no matches)
```

No chunk references `assets/index-*` or `assets/components-*` from inside another chunk — the
only inter-chunk edge is both entry chunks dynamically importing `SiteFooter-D2vbYzEP.js`, which
matches the `modulepreload` hint present in both HTML files. CSS files were checked for
`@import` and none use it (each page's stylesheet is self-contained, one `<link>` per file).

**Verdict — JS chunks:**

| Chunk | Referenced by |
|---|---|
| `index-B2XwinZz.js` | `index.html` only |
| `components-DbRnhCYk.js` | `components.html` only |
| `SiteFooter-D2vbYzEP.js` | **both** (dynamic import from both entry chunks; `modulepreload` in both HTML files) |

**Verdict — CSS chunks:**

| Chunk | Referenced by |
|---|---|
| `index-OqmKQzXD.css` | `index.html` only |
| `components-CFX3UKPI.css` | `components.html` only |
| `SiteFooter-DgSLZxXM.css` | **both** (linked in both HTML files) |

**Fonts (6 `.woff`/`.woff2` files):** referenced only from `SiteFooter-DgSLZxXM.css` (checked via
`grep -oE '[A-Za-z0-9_-]+\.(woff2?|png|jpg|avif|webp)'` over each CSS file) — so they load on
**both** pages, transitively through the shared footer stylesheet. `index-OqmKQzXD.css` and
`components-CFX3UKPI.css` each reference `bearcat-mask-{64,128}.png` and
`wordmark-mask-{192,384}.png`, but those are served from `public/brand/` (root-relative, not
content-hashed) and correctly do **not** appear in `dist/assets/`.

## 6. `src/sheet/` isolation from the landing bundle

`src/sheet/` contains: `ComponentSheet.tsx`, `kit.tsx`, `main.tsx`, `parts/ComposedPart.tsx`,
`parts/HeroPart.tsx`, `parts/PrimitivesPart.tsx`, `parts/TokensPart.tsx`.

Three distinctive string literals, each traced to an exact source line:

1. `'Primitives in isolation'` — `src/sheet/ComponentSheet.tsx:32`
2. `'The track exists only to buy scroll distance...'` (tested substring: `buy scroll distance`) — `src/sheet/parts/HeroPart.tsx:46`
3. `name: 'HeroScroll.progress'` (tested substring: `HeroScroll.progress`) — `src/sheet/parts/HeroPart.tsx:323`

`grep -ac <string> <chunk>` over every JS chunk in `dist/assets/`:

```
STRING: Primitives in isolation
  SiteFooter-D2vbYzEP.js : 0
  components-DbRnhCYk.js : 1
  index-B2XwinZz.js       : 0

STRING: buy scroll distance
  SiteFooter-D2vbYzEP.js : 0
  components-DbRnhCYk.js : 1
  index-B2XwinZz.js       : 0

STRING: HeroScroll.progress
  SiteFooter-D2vbYzEP.js : 0
  components-DbRnhCYk.js : 1
  index-B2XwinZz.js       : 0
```

All three strings are **0** in both chunks reachable from `dist/index.html`
(`index-B2XwinZz.js` and the shared `SiteFooter-D2vbYzEP.js`), and **1** (positive control) in
`components-DbRnhCYk.js`, the chunk built from `components.html`'s entry (`src/sheet/main.tsx`).

**Conclusion: no `src/sheet/` code reaches the landing (`index.html`) module graph.** This
matches the doc comment at `src/sheet/ComponentSheet.tsx:19` ("Its code is not in the landing
page's bundle") and the design note in `vite.config.ts` (two Rollup inputs, shared chunk hoisted
out, sheet code never reaches the landing entry).

## 7. Git state

### `git status --porcelain`

```
(empty — clean working tree)
```

### `git status --porcelain --ignored`

```
!! .env.local
!! .vercel/
!! HackBULogo.zip
!! dist/
!! moreclouds.zip
!! node_modules/
```

### `git log --oneline --all`

```
15bc368 audit: phase 2 report
9a5a72d Clouds: add six new cutouts across the three depth layers; tidy repo
1126c73 audit: phase 1 report
b7d66f0 Clouds: slow all layers 1.5x by raising the drift anchor to 90s
d32f0ad Clouds: derive drift speed from layer scale so parallax reads as depth
fb392cf Component sheet at /components; harden ExternalLink prop spread order
5580022 Brand: real HackBU marks via CSS masks, fern logo-only token; audit cleanup
0de3e8e Ignore Vercel link artifacts and local env
c2676a1 Phase 7: README covering setup, build, deploy and artwork replacement
51ce8fa Fix AA: replace brick hover on frost with underline cue; return focus on Escape
70a4578 Hero is now pure illustration; headline/CTA moved to intro section below
af97dff Phase 6: AVIF/WebP derivatives, preload, ultrawide framing fix, AA contrast, a11y
7b89c41 Phase 5 addendum: real hero copy, contraction/voice pass across sections
809712e Phase 5: real copy for four sections, whileInView staggered reveals
f71ca23 Phase 4 fix: four-tile track for exact loop identity; coherent reduced-motion resting frame
d956860 Phase 4: three-layer cloud parallax with seamless horizontal loop
95b1389 Phase 3: hero scroll-pan reveal via motion useScroll/useTransform
b683d56 Phase 2: page shell, header/footer, four sections, snowdrift dividers
fbd6149 Phase 1: Vite+React+TS scaffold, Tailwind v4 tokens, fonts, asset inventory
17387dd Initial: artwork assets
```

### `.gitignore` (verbatim)

```
# Dependencies and build output
node_modules/
dist/

# Vercel CLI link and the local env it writes (contains an OIDC token)
.vercel/
.env*

# Source archives the artwork and branding were delivered in. Their contents
# live unpacked in artwork/ and brand-source/, so the zips are redundant here.
HackBULogo.zip
moreclouds.zip
```

Single `.vercel/` line (was two lines — `.vercel/` and `.vercel` — at `1126c73`); single
`.env*` glob covers `.env.local`. `HackBULogo.zip` and `moreclouds.zip` are both explicitly
listed.

### Root-level artefacts: tracked / ignored / untracked

| Path | Status | Note |
|---|---|---|
| `.claude/launch.json` | tracked | `git ls-files .claude` → `.claude/launch.json`; not matched by any ignore rule |
| `.env.local` | ignored | matched by `.env*` |
| `.gitignore` | tracked | |
| `.oxlintrc.json` | tracked | |
| `.vercel/` | ignored | matched by `.vercel/`; contains the Vercel CLI project link, not read |
| `ASSETS.md` | tracked | |
| `HackBULogo.zip` | ignored | matched by `HackBULogo.zip` |
| `README.md` | tracked | |
| `artwork/` | tracked | includes `artwork/clouds/cloud-1.png` … `cloud-12.png` and `clouds-all-b.png`, all tracked (confirmed via `git ls-files artwork/clouds/`) |
| `audit/` | tracked | `audit/02-code.md` present; this report is new (untracked until commit, per instructions this phase makes no commits) |
| `brand-source/` | tracked | not independently re-audited this phase (out of Phase 1 scope) |
| `components.html` | tracked | |
| `dist/` | ignored | matched by `dist/`; present because `npm run build` ran in this phase |
| `index.html` | tracked | |
| `moreclouds.zip` | ignored | matched by `moreclouds.zip` (`git check-ignore -v` → `.gitignore:12:moreclouds.zip`); confirmed not tracked (`git ls-files moreclouds.zip` → empty) |
| `node_modules/` | ignored | matched by `node_modules/` |
| `package-lock.json` | tracked | |
| `package.json` | tracked | |
| `public/` | tracked | includes `public/artwork/clouds/cloud-7..12.{png,webp,avif}`, all tracked |
| `scripts/` | tracked | |
| `src/` | tracked | |
| `tsconfig.app.json` / `tsconfig.json` / `tsconfig.node.json` | tracked | |
| `vercel.json` | tracked | |
| `vite.config.ts` | tracked | |

`git status --porcelain` is empty, which independently confirms there are no untracked
non-ignored files anywhere in the tree (not just at root) — the working tree exactly matches
`HEAD`.

### Previously raised findings — status check

**P1-3** (old report, `low`): redundant `.gitignore` rule — both `.vercel/` and `.vercel` lines
matched the same path. **Resolved in `9a5a72d`.** Current `.gitignore` has a single `.vercel/`
line (confirmed above, verbatim). Not re-raised.

**P1-4** (old report, `note`): `moreclouds.zip` and 13 new cloud PNGs were untracked with no
matching ignore rule. **Resolved in `9a5a72d`.** The 13 PNGs (6 in `artwork/clouds/`, 6 mirrored
+ derivatives in `public/artwork/clouds/`, plus `clouds-all-b.png`) are now tracked (confirmed via
`git ls-files`), and `moreclouds.zip` is now explicitly `.gitignore`d and untracked (confirmed via
`git check-ignore -v` and `git ls-files`). Not re-raised.

## 8. Tailwind content-scanning bleed from `audit/*.md` — verified (see P1-5)

The concern: Tailwind v4's automatic content detection (via `@tailwindcss/vite`, registered in
`vite.config.ts:20`) scans every non-gitignored file in the project for utility-class candidates.
`audit/` is not gitignored, so prose in `audit/*.md` can add rules to the shipped CSS. The first
run of this phase (against `audit/02-code.md` only) could not isolate an audit-only token; the
checker's rebuild at `1c4fa9f` (with `audit/01-baseline.md` on disk) and the orchestrator's
follow-up did.

**A/B byte sizes (JS chunks byte-identical in both builds):**

| File | Build with `audit/02-code.md` only (§4) | Build with both audit reports | Δ |
| --- | ---: | ---: | ---: |
| `index-*.css` | 17,563 | 17,862 | +299 |
| `components-*.css` | 20,818 | 21,117 | +299 |

**Selectors present in the built landing CSS whose class token occurs nowhere in the landing
source set** (`src/` minus `src/sheet/`, `index.html`, `components.html`), found by extracting
every `.class{` selector from `dist/assets/index-*.css` and grepping the source set for the
unescaped token:

```
$ grep -o '\.isolate{[^}]*}\|\.table{[^}]*}\|\.grid-cols-5{[^}]*}' dist/assets/index-CePBE3nM.css
.isolate{isolation:isolate}
.table{display:table}
.grid-cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}
$ grep -rn "isolate" src/ index.html components.html
(no output)
$ grep -rn "grid-cols-5" src/ audit/
src/sheet/parts/PrimitivesPart.tsx:492:            className="grid grid-cols-2 gap-3 sm:grid-cols-5"
audit/02-code.md:526:stylesheet and not the landing one (`grid-cols-5`: 0 hits in `index-*.css`, 1 in
audit/02-code.md:694:$ grep -c 'grid-cols-5' dist/assets/index-hTiJsblS.css ; grep -c 'grid-cols-5' dist/assets/components-V_S1l_xU.css
```

`isolate` occurs only as English prose in this report (the word "isolate" in §8's earlier
draft); `grid-cols-5` is a sheet-only utility that `src/landing.css:22` (`@source not "./sheet"`)
deliberately excludes from the landing bundle — it re-entered via the quotation at
`audit/02-code.md:526`. So the scanning bleed is real and it also partially defeats the
landing/sheet CSS split.

---

## Findings

No findings were raised against typecheck, lint, or build output — all three commands ran clean
with no warnings/errors, and no chunk-reachability or `src/sheet/` isolation anomaly was observed.

### P1-1 — `note` — shared vendor chunk is named `SiteFooter-*.js` (carried over from the first baseline)

**Evidence.** §4/§5: `dist/assets/SiteFooter-D2vbYzEP.js` is 328,964 bytes (103,956 gz), is
`modulepreload`ed by both `dist/index.html` and `dist/components.html`, and contains React
(`grep -ac "react.transitional.element" dist/assets/SiteFooter-D2vbYzEP.js` → 2). `src/components/SiteFooter.tsx`
is a 72-line footer component.

**Expected.** Rollup names a shared chunk after its first "facade" module (Rollup docs,
`output.chunkFileNames` / manual chunks); the behaviour is correct, but the name suggests
footer-only code to anyone reading a build log or a performance trace.

**Fix.** `build.rollupOptions.output.manualChunks` in `vite.config.ts` (e.g. `vendor: ['react',
'react-dom', 'motion']`), or accept the name and document it in the README build section.

### P1-2 — `note` — gzip size exceeds raw size for the six font files (carried over; informational)

**Evidence.** §4 table: e.g. `inter-latin-400-normal-C38fXH4l.woff2` 23,664 raw → 23,701 gz.

**Expected.** WOFF/WOFF2 are already compressed (W3C WOFF2 spec §1: Brotli-compressed
container), so gzip cannot shrink them; Vercel does not apply gzip to `font/woff2` responses.
Not a defect — listed so the §4 gzip column is not misread.

**Fix.** None needed.

### P1-3 / P1-4 — resolved

**P1-3** (duplicate `.vercel` ignore rule) and **P1-4** (untracked `moreclouds.zip` / cloud PNGs)
from the previous baseline are both **resolved** as of `9a5a72d` — see §7. Not re-raised.

### P1-5 — `low` — Tailwind scans `audit/*.md` (and any other non-ignored file) into the shipped CSS

**Evidence.** §8: with both audit reports on disk the landing CSS grows 17,563 → 17,862 bytes and
gains `.isolate`, `.table` and `.grid-cols-5` rules; `isolate` appears nowhere in `src/` or the
HTML entries, and `grid-cols-5` exists only at `src/sheet/parts/PrimitivesPart.tsx:492` (excluded
from the landing bundle by `src/landing.css:22`) and in prose at `audit/02-code.md:526`.
Configuration: `vite.config.ts:20` registers `tailwindcss()` with no `@source` restriction;
`src/index.css:1` is a bare `@import 'tailwindcss';`.

**Expected.** Tailwind v4 docs, "Detecting classes in source files": automatic detection scans
every file not covered by `.gitignore`; projects that keep non-source text (docs, reports, fixtures)
in the tree should scope it with `@import "tailwindcss" source("../src")` or `@source not`. The
landing/sheet split in `src/landing.css:22` presumes the only way a sheet utility reaches the
landing CSS is through `src/sheet/`, which is no longer true once any other file quotes one.

**Fix.** In `src/index.css` change line 1 to `@import 'tailwindcss' source('.')` (or
`source(none)` plus explicit `@source` lines for `src/` and the two HTML entries) so scanning is
limited to real source. Until then, note that `README.md`/`ASSETS.md` can also contribute rules
(none do today — every other landing-CSS selector was matched to a landing source file).

---

## Commands run

```
git rev-parse HEAD
git log --oneline -1
ls audit/
cat package.json
npm run typecheck > /tmp/tc.out 2>&1; echo "EXIT=$?" >> /tmp/tc.out; cat /tmp/tc.out
npm run lint > /tmp/lint.out 2>&1; echo "EXIT=$?" >> /tmp/lint.out; cat /tmp/lint.out
npx oxlint 2>&1; echo "EXIT=$?"
npm run build > /tmp/build.out 2>&1; echo "EXIT=$?" >> /tmp/build.out; cat /tmp/build.out
ls -la dist/assets/
ls -la dist/*.html
for f in dist/assets/*; do sz=$(stat -c%s "$f"); gz=$(gzip -c "$f" | wc -c); echo "$f  bytes=$sz  gzip=$gz"; done
cat dist/index.html
cat dist/components.html
for f in dist/assets/*.js; do grep -ao 'assets/[A-Za-z0-9._-]*\.\(js\|css\)' "$f" | sort -u; done
for f in dist/assets/index-B2XwinZz.js dist/assets/components-DbRnhCYk.js; do grep -ao '"[^"]*\.\(js\|css\)"' "$f" | sort -u; grep -aoE "SiteFooter-[A-Za-z0-9]+" "$f" | sort -u; done
grep -aoE '"[^"]*\.(js|css)"' dist/assets/SiteFooter-D2vbYzEP.js | sort -u
for f in dist/assets/*.css; do grep -n "@import" "$f"; done
find src/sheet -name "*.tsx" | sort
grep -n "label:\|title:\|blurb:" src/sheet/ComponentSheet.tsx
grep -n "'[A-Za-z][A-Za-z0-9 ,.'-]\{8,\}'" src/sheet/parts/HeroPart.tsx
for s in "Primitives in isolation" "buy scroll distance" "HeroScroll.progress"; do for f in dist/assets/*.js; do grep -ac "$s" "$f"; done; done
git status --porcelain
git status --porcelain --ignored
git log --oneline --all
cat .gitignore
ls -la .
git ls-files | grep -v '/'
git ls-files .claude
git check-ignore -v .claude
git ls-files artwork/clouds/
git ls-files public/artwork/clouds/
git show 1126c73:audit/01-baseline.md > /tmp/old-report.md
grep -n "P1-3\|P1-4" -A 6 /tmp/old-report.md
git ls-files moreclouds.zip
git check-ignore -v moreclouds.zip
cat vite.config.ts
grep -oE 'class="[^"]*"|className="[^"]*"' audit/02-code.md
grep -rn "w-\[calc(100%\*var(--cloud-sets))\]" src/
grep -oE '[a-zA-Z0-9_-]+:?[a-zA-Z0-9_/.\[\]%*()-]*\[[^]]*\]' audit/02-code.md | sort -u
grep -rn "object-\[52%_0%\]" src/
for f in dist/assets/*.css; do grep -oE '[A-Za-z0-9_-]+\.(woff2?|png|jpg|avif|webp)' "$f" | sort -u; done
git show --stat 9a5a72d

# added after the checker's rebuild at 1c4fa9f (orchestrator follow-up, §8 / P1-5)
ls -l dist/assets/*.css dist/assets/*.js
grep -o '\.isolate{[^}]*}\|\.table{[^}]*}\|\.grid-cols-5{[^}]*}' dist/assets/index-CePBE3nM.css
grep -rn "isolate" src/ index.html components.html
grep -rn "grid-cols-5" src/ audit/
grep -n "@source\|@import" src/index.css src/landing.css
```
