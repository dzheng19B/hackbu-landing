# Phase 1 — Baseline audit

Repo: `C:\Users\danz3\Downloads\HackBUNew` · Commit at time of audit: `b7d66f0` (HEAD, branch `main`)
Scope: read-only. No files outside `audit/` were created or modified by this phase.

---

## 1. `npm run typecheck`

Command: `npm run typecheck` (= `tsc -b --noEmit`)

```
> hackbu-landing@0.0.0 typecheck
> tsc -b --noEmit
```

`EXIT=0`

No errors, no warnings, no output beyond the npm script header. Clean.

---

## 2. `npm run lint`

Command: `npm run lint` (= `oxlint`)

```
> hackbu-landing@0.0.0 lint
> oxlint
```

`EXIT=0`

No errors, no warnings, no output beyond the npm script header. Clean.

`.oxlintrc.json` in effect:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

---

## 3. `npm run build`

Command: `npm run build` (= `tsc -b && vite build`)

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
dist/assets/index-C196zhqA.css                         17.45 kB │ gzip:   4.46 kB
dist/assets/components-Cf7WB3lH.css                    20.73 kB │ gzip:   5.10 kB
dist/assets/index-Doilyled.js                          13.92 kB │ gzip:   5.49 kB
dist/assets/components-BraKJ2N4.js                     52.75 kB │ gzip:  15.99 kB
dist/assets/SiteFooter-D2vbYzEP.js                    328.96 kB │ gzip: 105.11 kB

✓ built in 409ms
```

`EXIT=0`

No warnings emitted by `tsc -b` or `vite build`. Build is clean.

---

## 4. `dist/assets/` inventory, sizes, and module-graph reachability

Byte sizes from `stat -c%s`; gzip sizes from `gzip -c file | wc -c` (independent measurement, matches Vite's own reported gzip figures above to within rounding). Reachability determined by grepping `dist/index.html` and `dist/components.html` directly, then grepping every referenced JS/CSS file for further `assets/*.js`/`assets/*.css` filename references (dynamic-import / cross-chunk pointers) — none were found, so the reference graph is exactly two levels deep (HTML → asset) plus one CSS→font level (`@font-face url()`).

| File | Bytes | Gzip bytes | Referenced by `index.html` | Referenced by `components.html` | How |
|---|---:|---:|:---:|:---:|---|
| `SiteFooter-D2vbYzEP.js` | 328,964 | 103,956 | yes | yes | `<link rel="modulepreload">` in both HTML files |
| `SiteFooter-DgSLZxXM.css` | 655 | 256 | yes | yes | `<link rel="stylesheet">` in both HTML files |
| `index-Doilyled.js` | 13,928 | 5,500 | yes | no | `<script type="module" src=...>` in `index.html` |
| `index-C196zhqA.css` | 17,459 | 4,448 | yes | no | `<link rel="stylesheet">` in `index.html` |
| `components-BraKJ2N4.js` | 52,754 | 15,888 | no | yes | `<script type="module" src=...>` in `components.html` |
| `components-Cf7WB3lH.css` | 20,738 | 5,063 | no | yes | `<link rel="stylesheet">` in `components.html` |
| `fraunces-latin-600-normal-BFCDtZfi.woff2` | 18,096 | 18,160 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |
| `fraunces-latin-600-normal-DL5QCzvS.woff` | 22,512 | 22,530 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |
| `inter-latin-400-normal-C38fXH4l.woff2` | 23,664 | 23,701 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |
| `inter-latin-400-normal-CyCys3Eg.woff` | 30,696 | 30,549 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |
| `inter-latin-500-normal-BL9OpVg8.woff` | 31,284 | 31,099 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |
| `inter-latin-500-normal-Cerq10X2.woff2` | 24,272 | 24,287 | yes (indirect) | yes (indirect) | `@font-face url()` in `SiteFooter-DgSLZxXM.css` |

Total `dist/assets/` on disk: 585,022 bytes (12 files). No file in `dist/assets/` is unreferenced by either HTML entry — every asset is reachable from at least one page.

Evidence commands:
```
grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/index-Doilyled.js | sort -u        # (empty — no further chunk refs)
grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/SiteFooter-D2vbYzEP.js | sort -u    # (empty — no further chunk refs)
grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/components-BraKJ2N4.js | sort -u    # (empty — no further chunk refs)
grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/SiteFooter-DgSLZxXM.css | sort -u
  → fraunces-latin-600-normal-BFCDtZfi.woff2, fraunces-latin-600-normal-DL5QCzvS.woff,
    inter-latin-400-normal-C38fXH4l.woff2, inter-latin-400-normal-CyCys3Eg.woff,
    inter-latin-500-normal-BL9OpVg8.woff, inter-latin-500-normal-Cerq10X2.woff2
grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/index-C196zhqA.css | sort -u      # (empty)
grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/components-Cf7WB3lH.css | sort -u # (empty)
```

Direct `cat` of both HTML files confirms the table above; see the "Commands run" section for the exact `cat dist/index.html` / `cat dist/components.html` invocations.

---

## 5. `src/sheet/` isolation from the landing bundle

`vite.config.ts` states the intended design explicitly (comment above `build.rollupOptions`):

> "They share the component tree, so Rollup hoists what both import into a shared chunk and each page's own entry chunk holds only its own code. The sheet's code therefore never reaches the landing page's bundle — verify by checking that nothing under `src/sheet/` appears in the landing page's module graph after a build."

This phase performed that verification. `src/sheet/` contains: `ComponentSheet.tsx`, `kit.tsx`, `main.tsx`, `parts/ComposedPart.tsx`, `parts/HeroPart.tsx`, `parts/PrimitivesPart.tsx`, `parts/TokensPart.tsx`, `sheet.css`. Distinctive strings pulled from those files (read directly, not guessed):

- `"nine colours"` (from `ComponentSheet.tsx`: *"The nine colours and the seven type steps, at size."*)
- `"Documented rather than embedded"` (from `ComponentSheet.tsx`, the Hero tab blurb)
- `"ComponentSheet"`, `"HeroPart"`, `"TokensPart"`, `"PrimitivesPart"`, `"ComposedPart"` (component/module identifiers)

Method: grep every chunk reachable from `dist/index.html` (`index-Doilyled.js`, `SiteFooter-D2vbYzEP.js`, `index-C196zhqA.css`, `SiteFooter-DgSLZxXM.css` — the full landing-page reference set established in §4) for each string, using `grep -ac` (binary-safe — plain `grep -c` silently reports 0 on these minified files because they trip grep's binary-file heuristic, which would have produced a false "clean" result).

```
for f in dist/assets/index-Doilyled.js dist/assets/SiteFooter-D2vbYzEP.js dist/assets/index-C196zhqA.css dist/assets/SiteFooter-DgSLZxXM.css; do
  grep -ac "nine colours" "$f"
  grep -ac "Documented rather than embedded" "$f"
  grep -ac "ComponentSheet" "$f"
  grep -ac "HeroPart\|TokensPart\|PrimitivesPart\|ComposedPart" "$f"
done
```

Result: **0 matches in all four files, for every string.**

Positive control (same strings, same method, against `components-BraKJ2N4.js` — the chunk `components.html` loads and `index.html` does not): `"nine colours"` → 1 match, `"Documented rather than embedded"` → 1 match, confirming the grep methodology does detect these strings when they are present, i.e. the zero result above is not a false negative from encoding/binary issues.

**Conclusion: no `src/sheet/` module or its content appears in any chunk reachable from `dist/index.html`.** The isolation the `vite.config.ts` comment claims is real, confirmed against this build's output.

---

## 6. Git state

### `git status --porcelain`

```
?? artwork/clouds/cloud-10.png
?? artwork/clouds/cloud-11.png
?? artwork/clouds/cloud-12.png
?? artwork/clouds/cloud-7.png
?? artwork/clouds/cloud-8.png
?? artwork/clouds/cloud-9.png
?? artwork/clouds/clouds-all-b.png
?? moreclouds.zip
?? public/artwork/clouds/cloud-10.png
?? public/artwork/clouds/cloud-11.png
?? public/artwork/clouds/cloud-12.png
?? public/artwork/clouds/cloud-7.png
?? public/artwork/clouds/cloud-8.png
?? public/artwork/clouds/cloud-9.png
```

(Captured before this phase wrote `audit/01-baseline.md`; once this file exists, `audit/` itself will additionally show as untracked — that is this phase's own, permitted output.)

### `git status --porcelain --ignored`

Same 14 lines as above, plus:

```
!! .env.local
!! .vercel/
!! HackBULogo.zip
!! dist/
!! node_modules/
```

### `.gitignore` (verbatim)

```
node_modules/
dist/
.vercel/

.vercel
.env*
HackBULogo.zip
```

### Root-level untracked / ignored-but-present artefacts, classified

| Path | Status | Note |
|---|---|---|
| `moreclouds.zip` | **untracked** | 890,621 bytes. Not covered by any `.gitignore` rule — will be picked up by a plain `git add .` unless deliberately excluded. |
| `HackBULogo.zip` | **ignored** | 378,189 bytes. Matched by literal `.gitignore` line `HackBULogo.zip`. |
| `.env.local` | **ignored** | 1,263 bytes. Matched by `.env*`. |
| `.vercel/` | **ignored** | Matched by both `.vercel/` and `.vercel` lines (redundant duplicate rule — harmless but worth noting, see P1-3). Contains `README.txt` (520 bytes) and `project.json` (119 bytes); not read/printed by this audit. |
| `dist/` | **ignored** | Matched by `dist/`. Present because `npm run build` was run in this phase, as instructed. |
| `node_modules/` | **ignored** | Matched by `node_modules/`. 41 top-level entries; pre-existing, pre-installed. |
| `artwork/clouds/cloud-7.png` … `cloud-12.png` (6 files) | **untracked** | Not covered by any ignore rule. Sibling files `cloud-1.png`…`cloud-6.png` (not listed by `git status`) are presumably already tracked, so these 6 are new additions pending `git add`. |
| `artwork/clouds/clouds-all-b.png` | **untracked** | Not covered by any ignore rule. |
| `public/artwork/clouds/cloud-7.png` … `cloud-12.png` (6 files) | **untracked** | Mirrors the `artwork/clouds/` set into the served `public/` tree; same non-ignored status. |

No `git status --porcelain` or `--ignored` entries were misclassified relative to `.gitignore`'s literal rules — every `!!` line matches a rule and every `??` line matches nothing in the file. This was checked by re-reading `.gitignore` verbatim above and matching each rule to each reported path by hand.

### `git log --oneline` (all, 16 commits)

```
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

---

## Findings

**P1-1** — severity: `note` — Shared vendor chunk named after a leaf component (`SiteFooter-D2vbYzEP.js`)
Evidence: `dist/index.html` and `dist/components.html` both `modulepreload` `dist/assets/SiteFooter-D2vbYzEP.js` (328,964 bytes / 103,956 bytes gzip — by far the largest chunk in `dist/assets/`). `head -c 2000 dist/assets/SiteFooter-D2vbYzEP.js` shows it opens with the `react.transitional.element`/`react.portal`/React internals bootstrap, confirming it is Rollup's hoisted shared chunk (React + ReactDOM + `motion` + every component both entries import), not just the `SiteFooter` component.
Expected behaviour: none violated — this is exactly what the `vite.config.ts` comment describes ("Rollup hoists what both import into a shared chunk"). Rollup's default chunk-naming heuristic picks a facade module's name for the shared chunk, which here happens to be `SiteFooter.tsx`, producing a misleading filename for anyone reading `dist/assets/` cold.
Suggested fix: none required for correctness; a future phase could set `build.rollupOptions.output.manualChunks` or `chunkFileNames` to give the shared chunk an explicit name (e.g. `vendor` or `shared`) if the misleading name causes confusion during future audits or debugging.

**P1-2** — severity: `note` — Fonts are already-compressed formats; gzip does not shrink them
Evidence (this phase's independent gzip measurement): `inter-latin-400-normal-C38fXH4l.woff2` 23,664 bytes raw → 23,701 bytes gzip (gzip is 37 bytes *larger* than raw); `fraunces-latin-600-normal-BFCDtZfi.woff2` 18,096 → 18,160; all four `.woff`/`.woff2` files show gzip ≥ raw. This matches Vite's own build output, which reports no gzip figure at all for these files (only for text assets).
Expected behaviour: unverified — this is a property of gzipping already-compressed binary formats in general, not something specific to this repo's config, and this local build's gzip measurement doesn't tell us what compression (if any) Vercel applies at serve time.
Suggested fix: none needed; noted for completeness since the byte-size table above reports gzip figures for every file per the phase instructions.

**P1-3** — severity: `low` — Redundant `.gitignore` rule for `.vercel`
Evidence: `.gitignore` lines 3 and 5: `.vercel/` and `.vercel` (verbatim, see §6). Both match the same directory; the trailing-slash form alone is sufficient.
Expected behaviour: `.gitignore` entries are typically deduplicated; this is a leftover from `0de3e8e Ignore Vercel link artifacts and local env` per `git log`.
Suggested fix: drop one of the two lines (out of scope for this read-only phase — flagged for a later phase with write access to non-`audit/` files).

**P1-4** — severity: `note` — `moreclouds.zip` and 13 new cloud PNGs are untracked with no matching ignore rule
Evidence: `git status --porcelain` (§6) lists `moreclouds.zip` and 12 PNGs (6 under `artwork/clouds/`, 6 mirrored under `public/artwork/clouds/`) plus `artwork/clouds/clouds-all-b.png`, none matched by any `.gitignore` rule.
Expected behaviour: unverified — whether `moreclouds.zip` (890,621 bytes, an archive of source art rather than a build artefact) belongs in version control, in `.gitignore`, or should simply be deleted after extraction is a project decision this phase does not have grounds to make.
Suggested fix: none from this phase; flagged so a later phase / the user decides whether `moreclouds.zip` should be `.gitignore`d (it resembles `HackBULogo.zip`, which already is) before the next commit.

No findings were raised against typecheck, lint, or build output — all three commands ran clean with no warnings, and no other anomaly was observed in the `dist/assets/` reachability analysis or `src/sheet/` isolation check.

---

## Commands run

```bash
cd "C:\Users\danz3\Downloads\HackBUNew"
mkdir -p audit

npm run typecheck > /tmp/typecheck.out 2>&1; echo "EXIT=$?"
cat /tmp/typecheck.out

npm run lint > /tmp/lint.out 2>&1; echo "EXIT=$?"
cat /tmp/lint.out

npm run build > /tmp/build.out 2>&1; echo "EXIT=$?"
cat /tmp/build.out

ls -la dist/assets/
for f in dist/assets/*; do
  sz=$(stat -c%s "$f")
  gz=$(gzip -c "$f" | wc -c)
  echo "$f | bytes=$sz | gzip=$gz"
done

cat dist/index.html
cat dist/components.html

grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/index-Doilyled.js | sort -u
grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/SiteFooter-D2vbYzEP.js | sort -u
grep -o 'assets/[A-Za-z0-9_.-]*\.\(js\|css\)' dist/assets/components-BraKJ2N4.js | sort -u

grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/index-C196zhqA.css | sort -u
grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/components-Cf7WB3lH.css | sort -u
grep -o '[A-Za-z0-9_-]*\.\(woff2\?\)' dist/assets/SiteFooter-DgSLZxXM.css | sort -u

cat vite.config.ts
find src/sheet -type f | sort
grep -n "'" src/sheet/ComponentSheet.tsx | head -30
grep -n '"[A-Za-z][A-Za-z ]\{5,\}"' src/sheet/parts/*.tsx src/sheet/ComponentSheet.tsx | head -40

for f in dist/assets/index-Doilyled.js dist/assets/SiteFooter-D2vbYzEP.js dist/assets/index-C196zhqA.css dist/assets/SiteFooter-DgSLZxXM.css; do
  grep -ac "nine colours" "$f"
  grep -ac "Documented rather than embedded" "$f"
  grep -ac "ComponentSheet" "$f"
  grep -ac "HeroPart\|TokensPart\|PrimitivesPart\|ComposedPart" "$f"
done
# positive control:
grep -ac "nine colours" dist/assets/components-BraKJ2N4.js
grep -ac "Documented rather than embedded" dist/assets/components-BraKJ2N4.js

git status --porcelain
git status --porcelain --ignored
cat .gitignore
git log --oneline --all

ls -la .vercel/
ls -la .env.local
ls dist/
ls node_modules | wc -l
cat .oxlintrc.json
cat package.json
```
