# Phase 5 — Performance & delivery

Read-only audit. No file outside `audit/` was created or modified; `git status --porcelain`
was empty before and after (see §10). No build was run — every `dist/` number is Phase 1's,
re-checked against the bytes on disk. `npm run images` was **not** run; the sharp script in §10
calls `.metadata()` only and writes nothing.

Tree state during this phase: working tree clean at Phase 1's baseline, `dist/` holding the
`1c4fa9f`-era build (hashed names differ from `01-baseline.md` §4 — known, P1-5).

---

## 1. Srcset triple-agreement

### 1.1 The three copies, verbatim

**`src/lib/images.ts:25`** — the derivative ladder:

```ts
const CAMPUS_WIDTHS = [640, 960, 1280, 1672] as const
```

**`src/lib/images.ts:27–31`** — how the string is built:

```ts
function campusSrcSet(extension: 'avif' | 'webp'): string {
  return CAMPUS_WIDTHS.map(
    (width) => `/artwork/campus/Campus-${width}.${extension} ${width}w`,
  ).join(', ')
}
```

**`scripts/generate-images.mjs:90`** — the generator's ladder:

```js
const CAMPUS_WIDTHS = [640, 960, 1280, 1672]
```

**`scripts/generate-images.mjs:242–243`** — the generator's printed string:

```js
const srcset = (ext) =>
  CAMPUS_WIDTHS.map((w) => `/artwork/campus/Campus-${w}.${ext} ${w}w`).join(', ')
```

**`index.html:44–50`** — the preload attributes (source form):

```html
      imagesrcset="
        /artwork/campus/Campus-640.avif 640w,
        /artwork/campus/Campus-960.avif 960w,
        /artwork/campus/Campus-1280.avif 1280w,
        /artwork/campus/Campus-1672.avif 1672w
      "
      imagesizes="(min-aspect-ratio: 1672/941) 100vw, 177.68vh"
```

**`src/lib/images.ts:57`** — the `sizes` copy:

```ts
export const CAMPUS_SIZES = '(min-aspect-ratio: 1672/941) 100vw, 177.68vh'
```

### 1.2 Side-by-side comparison and verdict

Output of `node <scratchpad>/srcset.mjs` (full script in §10), which extracts `CAMPUS_WIDTHS`
from both files with a regex, replays `campusSrcSet()` / `srcset()` exactly as written, and
pulls the attributes out of `index.html`:

```
--- CAMPUS_WIDTHS ---
src/lib/images.ts:25         [640,960,1280,1672]
scripts/generate-images.mjs:90 [640,960,1280,1672]
widths MATCH: true

--- AVIF srcset ---
images.ts campusSrcSet("avif")
  "/artwork/campus/Campus-640.avif 640w, /artwork/campus/Campus-960.avif 960w, /artwork/campus/Campus-1280.avif 1280w, /artwork/campus/Campus-1672.avif 1672w"
generate-images.mjs srcset("avif")
  "/artwork/campus/Campus-640.avif 640w, /artwork/campus/Campus-960.avif 960w, /artwork/campus/Campus-1280.avif 1280w, /artwork/campus/Campus-1672.avif 1672w"
index.html imagesrcset (raw)
  "\n        /artwork/campus/Campus-640.avif 640w,\n        /artwork/campus/Campus-960.avif 960w,\n        /artwork/campus/Campus-1280.avif 1280w,\n        /artwork/campus/Campus-1672.avif 1672w\n      "
index.html imagesrcset (normalised)
  "/artwork/campus/Campus-640.avif 640w, /artwork/campus/Campus-960.avif 960w, /artwork/campus/Campus-1280.avif 1280w, /artwork/campus/Campus-1672.avif 1672w"

byte-identical (images.ts vs raw index.html attr): false
semantically identical (normalised): true
generate-images.mjs vs index.html (normalised): true

--- WebP srcset (no preload counterpart; images.ts vs script) ---
images.ts campusSrcSet("webp")
  "/artwork/campus/Campus-640.webp 640w, /artwork/campus/Campus-960.webp 960w, /artwork/campus/Campus-1280.webp 1280w, /artwork/campus/Campus-1672.webp 1672w"
generate-images.mjs srcset("webp")
  "/artwork/campus/Campus-640.webp 640w, /artwork/campus/Campus-960.webp 960w, /artwork/campus/Campus-1280.webp 1280w, /artwork/campus/Campus-1672.webp 1672w"
MATCH: true

--- sizes ---
src/lib/images.ts:57 CAMPUS_SIZES
  "(min-aspect-ratio: 1672/941) 100vw, 177.68vh"
index.html:50 imagesizes (raw)
  "(min-aspect-ratio: 1672/941) 100vw, 177.68vh"
byte-identical: true
```

And against the **built** HTML, which is what a browser actually parses — Vite collapses the
multi-line attribute:

```
$ node -e "…"          # full command in §10
dist/index.html:44 imagesrcset == "/artwork/campus/Campus-640.avif 640w, /artwork/campus/Campus-960.avif 960w, /artwork/campus/Campus-1280.avif 1280w, /artwork/campus/Campus-1672.avif 1672w"
images.ts campusSrcSet(avif) == "/artwork/campus/Campus-640.avif 640w, /artwork/campus/Campus-960.avif 960w, /artwork/campus/Campus-1280.avif 1280w, /artwork/campus/Campus-1672.avif 1672w"
BYTE-IDENTICAL in the BUILT html: true
imagesizes byte-identical: true
```

### **VERDICT: MATCH.**

| Pair | Verdict |
| --- | --- |
| `CAMPUS_WIDTHS` (images.ts:25) vs `CAMPUS_WIDTHS` (generate-images.mjs:90) | **MATCH** — `[640,960,1280,1672]` both |
| `campusSrcSet('avif')` vs generator `srcset('avif')` | **MATCH** — byte-identical |
| `campusSrcSet('avif')` vs `index.html:44` `imagesrcset` (source) | **MATCH semantically**; not byte-identical (indentation/newlines) |
| `campusSrcSet('avif')` vs `dist/index.html:44` `imagesrcset` (built) | **MATCH — byte-identical** |
| `CAMPUS_SIZES` (images.ts:57) vs `imagesizes` (index.html:50 / dist:45) | **MATCH — byte-identical** |
| `campusSrcSet('webp')` vs generator `srcset('webp')` | **MATCH** (no preload counterpart — correct, see §1.3) |

The whitespace difference is not a defect: the HTML srcset grammar (WHATWG HTML, "parsing a
srcset attribute") splits on ASCII whitespace and commas, so a multi-line attribute and a
single-line one produce the same candidate list. It is only a **documentation** inaccuracy —
see P5-11.

### 1.3 Preload `type` / `media` and the selected URL

`index.html:39–51` in full:

```html
    <link
      rel="preload"
      as="image"
      type="image/avif"
      fetchpriority="high"
      imagesrcset="…"
      imagesizes="(min-aspect-ratio: 1672/941) 100vw, 177.68vh"
    />
```

Checked, all correct:

- **`type="image/avif"` is right.** Per MDN (`<link>` → `rel="preload"` → `type`), the browser
  only fetches the preload if it supports that MIME type. That is exactly the condition
  `<picture>` uses at `src/components/Hero.tsx:191–195` (`<source type="image/avif">` first), so
  a non-AVIF browser skips the preload rather than warming a file it will not use. There is no
  WebP preload, and there should not be: a second `<link>` with `type="image/webp"` would fire
  on *every* AVIF-capable browser too (WebP support is a superset) and double-fetch.
- **No `media` attribute is correct.** The image is needed at every viewport; the viewport-
  dependent part is the rung, and `imagesizes` expresses that.
- **`href` omitted is legal.** WHATWG HTML: `href` may be omitted on a `rel=preload` link when
  `imagesrcset` is present and contains a candidate with a width descriptor (and `imagesizes` is
  then required, which it is).
- **`fetchpriority="high"`** matches `fetchPriority="high"` on the `<img>` (`Hero.tsx:208`).
- **Position:** the preload is at `dist/index.html:39–46`, ahead of the module script at line 70,
  so the preload scanner reaches it first.

**Does the preload resolve to the same URL `<picture>` picks?** Yes, by construction — the
selection inputs (`srcset` candidates, `sizes`) are byte-identical strings, and both are
evaluated against the same viewport by the same algorithm. Worked through for common viewports
(`sizes` = `100vw` when viewport aspect ≥ 1672/941 = 1.77683, else `177.68vh`):

| Viewport | Aspect | `sizes` resolves to | DPR 1 rung | DPR 2 rung |
| --- | ---: | ---: | --- | --- |
| 390×844 (phone) | 0.462 | 177.68vh = 1499.6 px | `Campus-1672.avif` | `Campus-1672.avif` |
| 768×1024 (tablet) | 0.750 | 1819.4 px | `Campus-1672.avif` | `Campus-1672.avif` |
| 1440×900 (laptop) | 1.600 | 1599.1 px | `Campus-1672.avif` | `Campus-1672.avif` |
| 1920×1080 | 1.778 | 100vw = 1920 px | `Campus-1672.avif` | `Campus-1672.avif` |
| 2560×1080 (ultrawide) | 2.370 | 100vw = 2560 px | `Campus-1672.avif` | `Campus-1672.avif` |
| 1024×600 (short landscape) | 1.707 | 1066.1 px | `Campus-1280.avif` | `Campus-1672.avif` |

The 1672 rung is selected everywhere except viewports under ~720 CSS px tall at DPR 1 — the
ladder's lower rungs are effectively dead weight on the wire (they cost nothing at runtime; they
cost 468 KB of repo/deploy bytes). That is a deliberate trade the docstring at
`src/lib/images.ts:38–56` already argues for; not raised as a finding.

Consistent with ASSETS.md:96–100's measured 13 requests / 495,259 B, which §2.4 below
re-derives exactly.

---

## 2. Asset inventory — on-disk vs. documented

Dimensions and byte sizes read with `sharp(file).metadata()` + `fs.stat` (script and full output
in §10). `public/` holds **53 files**, all images, no strays:

```
$ find public -type f ! -name '*.png' ! -name '*.webp' ! -name '*.avif' | sort
(no output)
$ find public -type f | wc -l
53
```

### 2.1 `public/artwork/` — PNG originals (ASSETS.md:43–55 inventory table)

| File | On-disk dims | On-disk bytes | ASSETS.md claim | Verdict |
| --- | --- | ---: | --- | --- |
| `public/artwork/campus/Campus.png` | 1672×941 | 2,942,406 | 1672 × 941, 2,942,406 B, colour type 2 truecolor RGB, no alpha | **MATCH** |
| `public/artwork/clouds/cloud-1.png` | 429×259 | 107,042 | 429 × 259, 107,042 B, RGBA, alpha yes | **MATCH** |
| `public/artwork/clouds/cloud-2.png` | 430×194 | 84,998 | 430 × 194, 84,998 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-3.png` | 263×229 | 67,012 | 263 × 229, 67,012 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-4.png` | 266×108 | 32,041 | 266 × 108, 32,041 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-5.png` | 343×253 | 87,093 | 343 × 253, 87,093 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-6.png` | 224×70 | 17,623 | 224 × 70, 17,623 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-7.png` | 413×170 | 70,612 | 413 × 170, 70,612 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-8.png` | 312×294 | 95,464 | 312 × 294, 95,464 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-9.png` | 380×221 | 83,747 | 380 × 221, 83,747 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-10.png` | 291×167 | 51,509 | 291 × 167, 51,509 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-11.png` | 342×303 | 115,138 | 342 × 303, 115,138 B, RGBA | **MATCH** |
| `public/artwork/clouds/cloud-12.png` | 238×97 | 26,215 | 238 × 97, 26,215 B, RGBA | **MATCH** |

`sharp` reports `channels: 3, hasAlpha: false` for `Campus.png` and `channels: 4, hasAlpha:
true, depth: uchar` for all twelve cutouts — agreeing with ASSETS.md's colour-type and alpha
columns and with ASSETS.md:73 ("All thirteen are valid PNGs at 8-bit depth").

ASSETS.md:57 claims "13 files, 3,780,900 bytes (3.61 MiB) total" — recomputed: **3,780,900 B.
MATCH.**

### 2.2 `public/artwork/` — AVIF/WebP derivatives (ASSETS.md:84–89, documented by pattern)

ASSETS.md documents these as four *patterns* with totals rather than per-file rows, so each row
below is checked against the pattern and against the group total.

| File | On-disk dims | Bytes | ASSETS.md claim | Verdict |
| --- | --- | ---: | --- | --- |
| `campus/Campus-640.avif` | 640×360 | 69,508 | `campus/Campus-{640,960,1280,1672}.avif`, 4 files, AVIF q68, 738 KB | **MATCH** |
| `campus/Campus-960.avif` | 960×540 | 142,171 | ″ | **MATCH** |
| `campus/Campus-1280.avif` | 1280×720 | 221,649 | ″ | **MATCH** |
| `campus/Campus-1672.avif` | 1672×941 | 322,040 | ″ | **MATCH** |
| `campus/Campus-640.webp` | 640×360 | 73,812 | `campus/Campus-{…}.webp`, 4 files, WebP q82, 790 KB | **MATCH** |
| `campus/Campus-960.webp` | 960×540 | 147,568 | ″ | **MATCH** |
| `campus/Campus-1280.webp` | 1280×720 | 238,404 | ″ | **MATCH** |
| `campus/Campus-1672.webp` | 1672×941 | 349,538 | ″ | **MATCH** |
| `clouds/cloud-1.avif` … `cloud-12.avif` (12 files) | intrinsic, each = its PNG's dims | 5,299–22,197 | `clouds/cloud-N.avif`, 1 each at intrinsic × 12, AVIF q70, 169 KB | **MATCH** (all 12) |
| `clouds/cloud-1.webp` … `cloud-12.webp` (12 files) | intrinsic, each = its PNG's dims | 7,348–33,902 | `clouds/cloud-N.webp`, 1 each × 12, WebP q82 alphaQuality 90, 256 KB | **MATCH** (all 12) |

Group totals recomputed:

```
campus avif 755368 737.7 KB (ASSETS.md: 738 KB)
campus webp 809322 790.4 KB (ASSETS.md: 790 KB)
cloud  avif 173219 169.2 KB (ASSETS.md: 169 KB)
cloud  webp 262542 256.4 KB (ASSETS.md: 256 KB)
```

All four **MATCH**. Every derivative's dimensions equal its ladder rung / its PNG's intrinsic
size, confirming ASSETS.md:91–94 ("The clouds render at up to 1.15x their intrinsic width, so
they get one derivative each … with no `srcset`") and the `withoutEnlargement: true` guard at
`scripts/generate-images.mjs:133`.

### 2.3 `public/brand/` (ASSETS.md:123–132)

| File | On-disk dims | Bytes | ASSETS.md claim | Verdict |
| --- | --- | ---: | --- | --- |
| `brand/bearcat-mask-64.png` | 64×67 | 3,164 | 64 × 67, 3,164 B, from `icon.png` trimmed | **MATCH** |
| `brand/bearcat-mask-128.png` | 128×134 | 6,941 | 128 × 134, 6,941 B | **MATCH** |
| `brand/wordmark-mask-192.png` | 192×27 | 2,147 | 192 × 27, 2,147 B | **MATCH** |
| `brand/wordmark-mask-384.png` | 384×54 | 4,850 | 384 × 54, 4,850 B | **MATCH** |
| `brand/favicon-32.png` | 32×32 | 1,824 | 32 × 32, 1,824 B | **MATCH** |
| `brand/favicon-64.png` | 64×64 | 4,601 | 64 × 64, 4,601 B | **MATCH** |
| `brand/apple-touch-icon.png` | 180×180 | 7,805 | 180 × 180, 7,805 B | **MATCH** |
| `brand/og-image.png` | 732×732 | 10,014 | 732 × 732, 10,014 B | **MATCH** |

`og-image.png`'s 732×732 also matches `index.html:69–70`'s `og:image:width`/`height`. **No
UNDOCUMENTED rows and no MISSING rows anywhere: the ASSETS.md entry set and the on-disk set are
the same 53 files.**

The mask-rung KB figures at ASSETS.md:136 are 0.1–0.2 KB off under either unit convention — see
P5-10 (cosmetic).

### 2.4 Cross-checks of ASSETS.md's derived numbers

```
first-load AVIF path = 322040 + 173219 = 495259 (ASSETS.md: 495,259 -> true )
brand 1x rungs: 5311 B (ASSETS.md: 5.3 KB)
brand 2x rungs: 11791 B (ASSETS.md: 11.7 KB)
```

ASSETS.md:96–100's "13 image requests, 495,259 bytes" reproduces exactly from the files on disk.

### 2.5 `artwork/` originals vs `public/artwork/` copies

ASSETS.md:3–13 claims `public/artwork/` is a verbatim copy. Verified stronger than dimensions —
byte-for-byte with `cmp`:

```
IDENTICAL  artwork/campus/Campus.png == public/artwork/campus/Campus.png
IDENTICAL  artwork/clouds/cloud-1.png == public/artwork/clouds/cloud-1.png
IDENTICAL  artwork/clouds/cloud-10.png == public/artwork/clouds/cloud-10.png
IDENTICAL  artwork/clouds/cloud-11.png == public/artwork/clouds/cloud-11.png
IDENTICAL  artwork/clouds/cloud-12.png == public/artwork/clouds/cloud-12.png
IDENTICAL  artwork/clouds/cloud-2.png == public/artwork/clouds/cloud-2.png
IDENTICAL  artwork/clouds/cloud-3.png == public/artwork/clouds/cloud-3.png
IDENTICAL  artwork/clouds/cloud-4.png == public/artwork/clouds/cloud-4.png
IDENTICAL  artwork/clouds/cloud-5.png == public/artwork/clouds/cloud-5.png
IDENTICAL  artwork/clouds/cloud-6.png == public/artwork/clouds/cloud-6.png
IDENTICAL  artwork/clouds/cloud-7.png == public/artwork/clouds/cloud-7.png
IDENTICAL  artwork/clouds/cloud-8.png == public/artwork/clouds/cloud-8.png
IDENTICAL  artwork/clouds/cloud-9.png == public/artwork/clouds/cloud-9.png
```

**13/13 MATCH.**

### 2.6 `clouds-all-b.png` must not reach `public/` — confirmed

ASSETS.md:15–19 and `scripts/generate-images.mjs:26–29` both require it. On disk:

```
$ ls -la public/artwork/clouds/clouds-all-b.png
ls: cannot access 'public/artwork/clouds/clouds-all-b.png': No such file or directory
$ find public -name 'clouds-all-b*' | wc -l
0
```

**CONFIRMED absent.** The file exists only at `artwork/clouds/clouds-all-b.png`, 2172×724,
453,487 B — matching ASSETS.md:71 exactly (**MATCH**).

### 2.7 `brand-source/` (ASSETS.md:112–116, not shipped)

| File | On-disk dims | Bytes | ASSETS.md claim | Verdict |
| --- | --- | ---: | --- | --- |
| `brand-source/icon.png` | 1920×2033 | 196,106 | 1920 × 2033, ink box 1741 × 1828 | **MATCH** (dims) |
| `brand-source/text.png` | 7690×1080 | 189,929 | 7690 × 1080, ink 7690 × 1080 no padding | **MATCH** |
| `brand-source/icon_discord.png` | 732×732 | 2,158,148 | 732 × 732; ASSETS.md:138 "2,158,148 bytes"; alpha "No (opaque)" | **MISMATCH (alpha column only)** — see P5-9 |

`sharp` reports `channels: 4, hasAlpha: true` for `icon_discord.png`. The ink boxes at
ASSETS.md:114–115 match `BEARCAT_MARK`/`WORDMARK_MARK` in `src/lib/images.ts:83–84`; they are
produced by a `.trim()` at `scripts/generate-images.mjs:183–185` and were not independently
re-derived here (that would require running the trim, which is a write path in the real script —
skipped).

---

## 3. Every image URL referenced from source resolves

### 3.1 Enumeration

```
$ grep -rn "/artwork/\|/brand/" src/ index.html components.html
```

(full output in §10). The reference sites, after discarding prose in comments:

| Source | `file:line` | URL form |
| --- | --- | --- |
| Campus PNG fallback | `src/lib/images.ts:16` | `/artwork/campus/Campus.png` |
| Campus srcset template | `src/lib/images.ts:29` (× widths at `:25`, × `avif`/`webp` at `:33–36`) | `/artwork/campus/Campus-{W}.{ext}` |
| Cloud sources | `src/lib/images.ts:90–92` (× the 12 `file:` literals at `HeroClouds.tsx:233,242,251,260,280,289,298,307,348,357,366,375`) | `/artwork/clouds/{base}.{png,webp,avif}` |
| Cloud sources, component sheet | same helper, × the 12 literals at `src/sheet/parts/HeroPart.tsx:72–75,86–89,100–103` | same 36 URLs |
| Bearcat mask 1x/2x | `src/index.css:158–159`, `:169–170` | `/brand/bearcat-mask-{64,128}.png` |
| Wordmark mask 1x/2x | `src/index.css:163–164`, `:174–175` | `/brand/wordmark-mask-{192,384}.png` |
| Favicons | `index.html:11–12`, `components.html:7–8` | `/brand/favicon-{32,64}.png` |
| Apple touch icon | `index.html:19` | `/brand/apple-touch-icon.png` |
| Preload rungs | `index.html:45–48` | `/artwork/campus/Campus-{640,960,1280,1672}.avif` |
| `og:image` | `index.html:67` | `https://hackbu-landing.vercel.app/brand/og-image.png` |

### 3.2 Resolution proof

The check derives the URL set from the source constants themselves (so a drift in
`CAMPUS_WIDTHS` or the cloud cast would change the list), strips the `og:image` origin, and
`test -f`s each one under `public/`. Script `/tmp/urls.sh` reproduced verbatim in §10.

```
$ sh /tmp/urls.sh | sed 's#^https\?://[^/]*##' | sort -u > /tmp/urls.txt
$ while read -r u; do if [ -f "public$u" ]; then echo "OK      public$u"; else echo "MISSING public$u"; fi; done < /tmp/urls.txt
=== referenced URLs (53) — existence check ===
OK      public/artwork/campus/Campus-1280.avif
OK      public/artwork/campus/Campus-1280.webp
OK      public/artwork/campus/Campus-1672.avif
OK      public/artwork/campus/Campus-1672.webp
OK      public/artwork/campus/Campus-640.avif
OK      public/artwork/campus/Campus-640.webp
OK      public/artwork/campus/Campus-960.avif
OK      public/artwork/campus/Campus-960.webp
OK      public/artwork/campus/Campus.png
OK      public/artwork/clouds/cloud-1.avif
OK      public/artwork/clouds/cloud-1.png
OK      public/artwork/clouds/cloud-1.webp
OK      public/artwork/clouds/cloud-10.avif
OK      public/artwork/clouds/cloud-10.png
OK      public/artwork/clouds/cloud-10.webp
OK      public/artwork/clouds/cloud-11.avif
OK      public/artwork/clouds/cloud-11.png
OK      public/artwork/clouds/cloud-11.webp
OK      public/artwork/clouds/cloud-12.avif
OK      public/artwork/clouds/cloud-12.png
OK      public/artwork/clouds/cloud-12.webp
OK      public/artwork/clouds/cloud-2.avif
OK      public/artwork/clouds/cloud-2.png
OK      public/artwork/clouds/cloud-2.webp
OK      public/artwork/clouds/cloud-3.avif
OK      public/artwork/clouds/cloud-3.png
OK      public/artwork/clouds/cloud-3.webp
OK      public/artwork/clouds/cloud-4.avif
OK      public/artwork/clouds/cloud-4.png
OK      public/artwork/clouds/cloud-4.webp
OK      public/artwork/clouds/cloud-5.avif
OK      public/artwork/clouds/cloud-5.png
OK      public/artwork/clouds/cloud-5.webp
OK      public/artwork/clouds/cloud-6.avif
OK      public/artwork/clouds/cloud-6.png
OK      public/artwork/clouds/cloud-6.webp
OK      public/artwork/clouds/cloud-7.avif
OK      public/artwork/clouds/cloud-7.png
OK      public/artwork/clouds/cloud-7.webp
OK      public/artwork/clouds/cloud-8.avif
OK      public/artwork/clouds/cloud-8.png
OK      public/artwork/clouds/cloud-8.webp
OK      public/artwork/clouds/cloud-9.avif
OK      public/artwork/clouds/cloud-9.png
OK      public/artwork/clouds/cloud-9.webp
OK      public/brand/apple-touch-icon.png
OK      public/brand/bearcat-mask-128.png
OK      public/brand/bearcat-mask-64.png
OK      public/brand/favicon-32.png
OK      public/brand/favicon-64.png
OK      public/brand/og-image.png
OK      public/brand/wordmark-mask-192.png
OK      public/brand/wordmark-mask-384.png
--- missing: 0 ---
```

**53 referenced URLs, 53 files under `public/`, zero missing and zero orphans** — a bijection.
Every favicon, apple-touch-icon and OG URL from `index.html` is in that set.

And `dist/` mirrors `public/` exactly:

```
$ diff <(cd public && find . -type f | sort) <(cd dist && find artwork brand -type f | sed 's|^|./|' | sort)
IDENTICAL file lists (53)
```

---

## 4. `<picture>` order, CLS, and loading hints

### 4.1 Source order

| Element | AVIF | WebP | PNG fallback | Order |
| --- | --- | --- | --- | --- |
| Campus hero | `src/components/Hero.tsx:191–195` | `:196–200` | `<img src={CAMPUS_PNG}>` `:202` | **AVIF → WebP → PNG. Correct.** |
| Cloud cutout | `src/components/HeroClouds.tsx:613` | `:614` | `<img src={sources.png}>` `:616` | **Correct.** |
| Campus, component sheet | `src/sheet/parts/HeroPart.tsx:169` | `:170` | `:171–178` | **Correct.** |
| Cloud, component sheet | `src/sheet/parts/HeroPart.tsx:232` | `:233` | `:234–241` | **Correct.** |

`<picture>` picks the first `<source>` whose `type` the browser supports, so AVIF-before-WebP is
required and is what is written. Both `<picture>` elements carry `className="contents"`
(`Hero.tsx:190`, `HeroClouds.tsx:612`) so they add no box — deliberate, documented at
`Hero.tsx:184–189` and `HeroClouds.tsx:593–595`.

### 4.2 CLS

| Element | Intrinsic size declared | Layout position | CLS risk |
| --- | --- | --- | --- |
| Campus `<img>` | `width={1672} height={941}` (`Hero.tsx:204–205` from `images.ts:17–18`) | inside `data-hero-artwork`, `absolute inset-0` (`Hero.tsx:183`), img is `h-full w-full object-cover` (`:209`) | **None** — out of flow, size fixed by the stage |
| Cloud `<img>` (drift) | `width={cloud.width} height={cloud.height}` (`HeroClouds.tsx:619–620`) | `absolute h-auto max-w-none` + inline `width: min(px, vw)` (`:645–650`) | **None** — absolutely positioned; and `h-auto` + width + the width/height attributes give the browser an `aspect-ratio` before the bytes arrive |
| Cloud `<img>` (resting) | same attributes | `absolute w-auto max-w-none` + inline `height: min(%, vw)` (`:669–674`) | **None** — same, mirrored axis |
| Sheet campus/cloud `<img>` | width/height attributes present (`HeroPart.tsx:174–175, 237–238`) | in flow | **Reserved** by the width/height attributes |

The width/height attributes on the two hero images are functionally redundant (the elements are
out of flow) but harmless and correct. Brand marks are `mask-image` on empty elements with an
`aspect-ratio` from `BEARCAT_MARK`/`WORDMARK_MARK` (`src/components/Wordmark.tsx`,
`src/index.css:147–178`), so their box exists before the mask loads — no CLS there either.

### 4.3 `loading` / `fetchpriority` / `decoding`

| Element | `loading` | `fetchpriority` | `decoding` | Assessment |
| --- | --- | --- | --- | --- |
| Campus hero (`Hero.tsx:206–208`) | *absent* → `eager` | `high` | `async` | **Correct.** LCP element: eager + high is what web.dev's "Optimize LCP" prescribes; matches the preload's `fetchpriority="high"`. |
| Clouds (`HeroClouds.tsx:621–622`) | *absent* → `eager` | *absent* → `auto` | `async` | **Correct that they are not lazy** — they are inside the hero stage, in the initial viewport, and `loading="lazy"` on in-viewport content is exactly the anti-pattern web.dev's "Browser-level lazy loading" warns against. See P5-8 for the real constraint (they are not discoverable at all until React renders). |
| Sheet campus (`HeroPart.tsx:176–177`) | `lazy` | — | `async` | **Correct** — documentation image far below the fold on an internal page. |
| Sheet clouds (`HeroPart.tsx:239–240`) | `lazy` | — | `async` | **Correct** — same. |

There are **no below-fold images on the landing page at all**. `grep -rn "<img" src/ --include=*.tsx | grep -v "^src/sheet/"`
returns seven lines, six of which are prose inside doc comments; the only element is
`HeroClouds.tsx:615`. The one other image element on the page is `<motion.img` at
`Hero.tsx:201`. Everything below the hero is text, inline SVG dividers and CSS-masked brand
marks.

**Should the clouds be lazy? No.** They are in the hero stage at scroll 0 (`Hero.tsx:220`,
`HeroClouds.tsx:771–785`) and 16 of the 48 mounted nodes intersect the stage box at 390×844
(`HeroClouds.tsx:176–186`). Lazy-loading in-viewport images delays them past layout for no
benefit.

**Should they be `fetchpriority="low"`?** Arguably, to keep them behind the LCP image — but see
P5-8: because they are React-rendered, they cannot even start until the bundle has executed, by
which time the preloaded campus AVIF is already in flight. Marked for Phase 7 measurement rather
than raised as a fix.

### 4.4 `will-change` (Phase 2's P2-8, assessed statically)

Three source sites, seven runtime elements:

```
$ grep -rn "will-change" src/
src/components/Hero.tsx:210:                  reducedMotion ? '' : 'will-change-transform'
src/components/HeroClouds.tsx:749:      className="absolute inset-0 will-change-transform"
src/components/HeroClouds.tsx:754:        className="… w-[calc(100%*var(--cloud-sets))] will-change-transform"
$ grep -o 'will-change:[^};]*' dist/assets/index-CePBE3nM.css | sort | uniq -c
      1 will-change:transform
```

1 campus `<img>` + 3 `data-cloud-layer` wrappers + 3 `data-cloud-drift` tracks = **7 elements**,
matching Phase 2's count.

What can be said from the code alone:

- **The three drift tracks are permanently justified.** They animate `x` with
  `repeat: Number.POSITIVE_INFINITY` (`HeroClouds.tsx:698`), so the transform genuinely never
  stops changing for the life of the document. MDN's "remove it when the element stops changing"
  never triggers for these.
- **The other four are not.** Every layer's `opacity` reaches 0 by track progress
  `fadeEnd` = 0.30 (far, `HeroClouds.tsx:230`) / 0.26 (mid, `:277`) / 0.22 (near, `:324`), and its `y` stops there too
  (`:726–729`); the campus `scale` stops at `PAN_SCROLL_FRACTION` = 0.75 (`Hero.tsx:87,150–157`).
  Past 0.75 of a 260dvh track all four are static but stay promoted forever.
- **Layer extent.** `data-cloud-drift` is `w-[calc(100%*var(--cloud-sets))]` with
  `--cloud-sets` = `SET_COUNT` = 4 (`HeroClouds.tsx:485,754,780`), i.e. **four viewport widths
  wide**. Its `data-hero-clouds` ancestor is `overflow-hidden` (`:774`) and the stage is too
  (`Hero.tsx:181`), so a compositor that intersects layer bounds with the ancestor clip should
  hold each texture near one viewport rather than four.
- **The campus `<img>` is viewport-sized (`h-full w-full`) but drawn at `scale: 3`** at scroll 0
  (`Hero.tsx:74,209–212`). Whether Chromium re-rasters the promoted layer as the scale animates
  3 → 1, or magnifies one raster (which would look soft at the start of the pan), is not
  decidable from source.

**Everything past this point needs live measurement.** Composited layer count, GPU memory,
raster-scale behaviour and whether any of this actually costs a frame cannot be established from
static code, and the verification browser Phase 4 used runs with `document.hidden` so
`requestAnimationFrame` never fires (`HeroClouds.tsx:197–199`). **Handed to Phase 7:** DevTools
Layers panel capture at 1440×900 and 390×844, plus a Performance trace across the pan.

---

## 5. Fonts

### 5.1 Imports

| Import | `file:line` |
| --- | --- |
| `import '@fontsource/fraunces/latin-600.css'` | `src/main.tsx:15` |
| `import '@fontsource/inter/latin-400.css'` | `src/main.tsx:16` |
| `import '@fontsource/inter/latin-500.css'` | `src/main.tsx:17` |
| `import '@fontsource/fraunces/latin-600.css'` | `src/sheet/main.tsx:9` |
| `import '@fontsource/inter/latin-400.css'` | `src/sheet/main.tsx:10` |
| `import '@fontsource/inter/latin-500.css'` | `src/sheet/main.tsx:11` |

Packages: `@fontsource/fraunces ^5.3.0`, `@fontsource/inter ^5.3.0` (`package.json:15–16`).
**Three faces imported: Fraunces 600, Inter 400, Inter 500.**

### 5.2 Families and weights actually used

`@theme` definitions:

| Token | `file:line` |
| --- | --- |
| `--font-display: 'Fraunces', ui-serif, Georgia, …` | `src/index.css:71` |
| `--font-sans: 'Inter', ui-sans-serif, system-ui, …` | `src/index.css:72–73` |

There is **no** `--font-serif` or `--font-mono` token, and no `font-serif`/`font-mono` utility is
used anywhere in `src/`.

Family utilities on the landing page:

| Utility | `file:line` |
| --- | --- |
| `font-sans` (page default, on the app root) | `src/App.tsx:27` |
| `font-display` | `src/components/Layout.tsx:99`, `src/components/sections/AboutSection.tsx:47`, `ContactSection.tsx:8`, `GetInvolvedSection.tsx:37`, `IntroSection.tsx:40`, `QuestionsSection.tsx:47` |

Weight utilities on the landing page (`grep -rnoE "font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[[0-9]+\])"` over `src/` minus `src/sheet/`):

| Utility | Weight | `file:line` |
| --- | --- | --- |
| `font-medium` | 500 | `src/components/ButtonLink.tsx:29`, `src/components/Layout.tsx:74` |
| `font-semibold` | 600 | `src/components/Layout.tsx:99`, `AboutSection.tsx:47`, `ContactSection.tsx:8`, `GetInvolvedSection.tsx:37`, `IntroSection.tsx:40`, `QuestionsSection.tsx:47` |
| (none) | 400 default | everywhere else, via `font-sans` at `App.tsx:27` |

Plus one raw declaration in the sheet only: `font-weight: 500` at `src/sheet/sheet.css:63`.

### 5.3 Imported vs used — verdict

| Face | Imported at | Used at | Verdict |
| --- | --- | --- | --- |
| Inter 400 | `main.tsx:16` | default weight under `font-sans` (`App.tsx:27`) | **used** |
| Inter 500 | `main.tsx:17` | `font-medium` (`ButtonLink.tsx:29`, `Layout.tsx:74`), `sheet.css:63` | **used** |
| Fraunces 600 | `main.tsx:15` | `font-display` + `font-semibold`, same six lines — every `font-semibold` in the landing co-occurs with `font-display` on its own line | **used** |

**No unused import, and no used-but-unimported weight.** The one way a missing weight normally
sneaks in — `<b>`/`<strong>`, which Tailwind Preflight sets to `bolder` (≈700, unimported, so
synthetic bold) — does not occur:

```
$ grep -rnoE "<(strong|b|em|i)>" src/ --include=*.tsx | grep -v "^src/sheet/"
(no output)
```

(The component sheet does use `<b>` — 60 occurrences across three files — but it is an internal
page, not the landing bundle, and the synthetic-bold result there is cosmetic.)

### 5.4 Does the installed `@fontsource` CSS set `font-display`?

```
$ cat node_modules/@fontsource/inter/latin-400.css
/* inter-latin-400-normal */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(./files/inter-latin-400-normal.woff2) format('woff2'), url(./files/inter-latin-400-normal.woff) format('woff');
}
$ cat node_modules/@fontsource/fraunces/latin-600.css
/* fraunces-latin-600-normal */
@font-face {
  font-family: 'Fraunces';
  font-style: normal;
  font-display: swap;
  font-weight: 600;
  src: url(./files/fraunces-latin-600-normal.woff2) format('woff2'), url(./files/fraunces-latin-600-normal.woff) format('woff');
}
```

**Yes — `font-display: swap` on every face.** It survives into the build; the whole shipped
font stylesheet is 655 bytes:

```
$ cat dist/assets/SiteFooter-DgSLZxXM.css
@font-face{font-family:Fraunces;font-style:normal;font-display:swap;font-weight:600;src:url(/assets/fraunces-latin-600-normal-BFCDtZfi.woff2)format("woff2"),url(/assets/fraunces-latin-600-normal-DL5QCzvS.woff)format("woff")}@font-face{font-family:Inter;font-style:normal;font-display:swap;font-weight:400;src:url(/assets/inter-latin-400-normal-C38fXH4l.woff2)format("woff2"),url(/assets/inter-latin-400-normal-CyCys3Eg.woff)format("woff")}@font-face{font-family:Inter;font-style:normal;font-display:swap;font-weight:500;src:url(/assets/inter-latin-500-normal-Cerq10X2.woff2)format("woff2"),url(/assets/inter-latin-500-normal-BL9OpVg8.woff)format("woff")}
```

`swap` means no invisible text (no FOIT), at the cost of a fallback→webfont reflow. That reflow
counts against CLS, which is what P5-5 is about.

### 5.5 `unicode-range` and the six files

**No `unicode-range` is declared** — the three `@font-face` blocks above have none. The six
files are therefore **not** six unicode subsets: they are **three faces × two container formats**
(woff2 + woff). The subsetting is baked into the file, not expressed in CSS — `@fontsource`'s
`latin-*.css` entrypoints reference `*-latin-*-normal.woff2` files that already contain only the
Latin subset, which is why they are 18–24 KB rather than the 100 KB+ a full Inter face would be.

Consequence: the browser downloads the face whenever any element uses that family/weight,
regardless of which glyphs the text needs. For an English-only page that is the right trade —
a `unicode-range` split would only help a page that sometimes renders no Latin text at all.

Wire cost, from `dist/assets/`:

```
woff2 total (fetched): 66032 B
woff  total (shipped, never fetched by any browser that supports woff2): 84492 B
```

See P5-6.

---

## 6. Bundles

### 6.1 Chunk sizes (Phase 1's numbers, re-checked on disk)

```
$ ls -la dist/assets/
-rw-r--r-- 328964 SiteFooter-D2vbYzEP.js
-rw-r--r--    655 SiteFooter-DgSLZxXM.css
-rw-r--r--  53832 components-DkUzVuby.js
-rw-r--r--  21117 components-Ky6oE5k4.css
-rw-r--r--  18096 fraunces-latin-600-normal-BFCDtZfi.woff2
-rw-r--r--  22512 fraunces-latin-600-normal-DL5QCzvS.woff
-rw-r--r--  14604 index-BCCAt3yZ.js
-rw-r--r--  17862 index-CePBE3nM.css
-rw-r--r--  23664 inter-latin-400-normal-C38fXH4l.woff2
-rw-r--r--  30696 inter-latin-400-normal-CyCys3Eg.woff
-rw-r--r--  31284 inter-latin-500-normal-BL9OpVg8.woff
-rw-r--r--  24272 inter-latin-500-normal-Cerq10X2.woff2
```

| Chunk | Bytes | Gzip (Phase 1 §4) | On the landing critical path? | Oversized for what it contains? |
| --- | ---: | ---: | --- | --- |
| `SiteFooter-*.js` | 328,964 | 103,956 | **yes** (`modulepreload` + dynamic import from both entries) | **No — but misnamed.** It is React + ReactDOM + motion + shared components, not a footer. Already raised as **P1-1**; not re-raised here. Composition in §6.2. |
| `index-*.js` | 14,604 | 5,667 | yes (entry) | No — this is the landing's own code |
| `index-*.css` | 17,862 | ~4,478 | yes | No (includes +299 B of Tailwind bleed from `audit/*.md` — **P1-5**, not re-raised) |
| `SiteFooter-*.css` | 655 | 256 | yes | Not oversized; it is *undersized* — a separate render-blocking request for three `@font-face` rules. See **P5-13**. |
| `components-*.js` / `.css` | 53,832 / 21,117 | 16,297 / ~5,075 | **no** (`components.html` only; Phase 1 §6 proved the isolation) | No |
| 6 font files | 216,524 | n/a | 66,032 B of it (woff2 only) | See **P5-6** |

### 6.2 What is actually in the 329 KB shared chunk

`motion` is imported by subpath everywhere, never as the whole package:

```
$ grep -rn "from 'motion" src/
src/components/Hero.tsx:2:import { motion, useScroll, useTransform } from 'motion/react'
src/components/HeroClouds.tsx:2:import { motion, useTransform } from 'motion/react'
src/components/Reveal.tsx:2:import { cubicBezier, motion, type MotionProps } from 'motion/react'
src/lib/motion.ts:2:import { cubicBezier, useReducedMotion, type MotionValue } from 'motion/react'
```

So `motion/react`, not `'motion'` — correct as far as entrypoint choice goes. But `motion/react`'s
`motion` component is the *full-featured* one, and it pulls its whole feature set in statically.

Attribution by byte offset of library-unique markers (`grep -abo`, read-only; minified code has no
module boundaries so these are **approximate region edges**, ±1 KB, confirmed by `dd`-ing 160–400
byte windows at each boundary):

| Region | Byte span | ≈ Bytes | Share | Evidence |
| --- | --- | ---: | ---: | --- |
| React + ReactDOM | 0 – ~191,300 | ~191,300 | **58%** | `useSyncExternalStore` @8,557; `Minified React error` @12,491; `onRecoverableError` @141,252–190,156; `createRoot` @189,837; `react.transitional.element` @190,510; window at 190,400 is the JSX runtime |
| Shared app components | ~191,300 – ~197,150 | ~5,900 | 2% | `Binghamton` @191,947; `discord.gg` @193,669; window at 194,800 is `SiteHeader`'s Escape handler; window at 196,000 is the mobile nav |
| **motion** | ~197,150 – ~319,500 | **~122,350** | **37%** | window at 197,200 is `motion-utils` (`clamp`/`noop`); 198,000 cubic-bézier solver; 200,000 the frame loop; `skewX` @216,658; `MotionValue` @221,981; `projection` ×53 @245,644–314,624; `PanSession` @291,083–312,999; window at 315,000 registers `drag`/`ProjectionNode`/`MeasureLayout`; 317,000 is `InViewFeature` |
| Shared app components (cont.) | ~319,500 – 328,964 | ~9,460 | 3% | window at 319,600 is `SnowdriftDivider`'s SVG; 320,200 is `Reveal`; 320,800 is `IntroSection` |

**So the chunk is *not* dominated by motion — React + ReactDOM is 58% of it and motion 37%.**
React 19's DOM client is simply large (`node_modules/react-dom/cjs/react-dom-client.production.js`
is 536,016 B unminified), and there is no lever on it short of not using React.

The motion region *is* addressable, though — see **P5-2**: roughly 265,000 → 315,000
(~50 KB, ~15% of the whole chunk) is layout-projection, drag and pan code the landing page never
uses.

### 6.3 Source maps, manifests, strays in `dist/`

```
$ ls dist/assets/*.map
ls: cannot access 'dist/assets/*.map': No such file or directory
$ ls -la dist/.vite
ls: cannot access 'dist/.vite': No such file or directory
$ find dist -name '*.map' -o -name 'manifest*.json' -o -name '.vite'
(no output)
$ ls -la dist/
artwork/  assets/  brand/  components.html (1,461 B)  index.html (3,578 B)
$ grep -n "sourcemap" vite.config.ts
(not set -> Vite default false)
```

**Clean.** No source maps, no `.vite/manifest.json`, no stray files. `build.sourcemap` is unset,
which is Vite's default `false`. `dist/artwork` + `dist/brand` are the 53 `public/` files copied
verbatim (§3.2). Nothing sensitive is shipped.

---

## 7. `vercel.json` and request routing

### 7.1 Verbatim

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/components", "destination": "/components.html" },
    { "source": "/components/", "destination": "/components.html" },
    { "source": "/((?!components).*)", "destination": "/index.html" }
  ]
}
```

Ten lines. No `redirects`, no `headers`, no `cleanUrls`, no `trailingSlash`, no `functions`,
no `regions`.

### 7.2 Rewrite semantics — what I can state, and what I cannot

**Established (Vercel docs, "Project Configuration → `rewrites`" and "Build Output API v3 →
`routes` / handle phases"):** Vercel's router runs in phases — `redirects` and `headers` first,
then a **filesystem check** against the build output, then `rewrites`, then the `miss`/404 phase.
A `rewrites` entry therefore only fires for a path that did **not** match a static file. The
`handle: "filesystem"` marker that expresses this ordering is a Build Output API construct;
`vercel.json`'s `rewrites` array compiles into the post-filesystem phase and there is no way to
put a rewrite *ahead* of the filesystem check from `vercel.json` alone.

**Per Vercel docs, unverified offline:**

- The exact `path-to-regexp` options Vercel compiles `source` with (in particular whether
  `strict` is false, which would make `/components` also match `/components/` and render rule 2
  redundant). Rule 2 is harmless belt-and-braces either way.
- The default `Cache-Control` Vercel applies to static output files when no `headers` entry
  exists.
- Whether `framework: "vite"` contributes any implicit route of its own on top of the explicit
  `rewrites` (the Vite preset is not an SPA preset; the explicit catch-all is what provides the
  fallback here).

**Established by reading the regex, not by running it:** `source: "/((?!components).*)"` uses
`path-to-regexp`'s unnamed-parameter form, so the group's contents are used as the pattern and
the negative lookahead is evaluated at the position immediately after the leading `/`. Any path
whose first segment *begins with* the literal `components` fails the lookahead — not just
`/components` itself.

### 7.3 The eight-request walk

`dist/` contents relevant to the filesystem phase: `index.html`, `components.html`, `assets/**`,
`artwork/**`, `brand/**` (§3.2). No `404.html` (`ls dist/404.html` → not found).

| # | Request | Filesystem phase | Rewrite phase | **Resolves to** |
| --- | --- | --- | --- | --- |
| 1 | `/` | `dist/index.html` (directory index) | — | **`dist/index.html`, 200.** Even if the index-resolution did not fire, rule 3 matches (`""` passes the lookahead) and rewrites to `/index.html` — same file. |
| 2 | `/components` | no `dist/components` | rule 1 matches exactly → `/components.html` | **`dist/components.html`, 200** |
| 3 | `/components/` | no such file | rule 2 matches exactly → `/components.html` (rule 1 may also match, see §7.2) | **`dist/components.html`, 200** |
| 4 | `/components.html` | **`dist/components.html` exists** → served, rewrites never consulted | n/a | **`dist/components.html`, 200.** Matches README.md:89. |
| 5 | `/componentsfoo` | no such file | rule 1 no (exact), rule 2 no, **rule 3 no** — `(?!components)` fails because `componentsfoo` starts with `components` | **Vercel platform 404.** Contradicts README.md:90. See **P5-4**. |
| 6 | `/artwork/campus/Campus.png` | **`dist/artwork/campus/Campus.png` exists** → served | n/a | **the 2,942,406 B PNG, 200** |
| 7 | `/brand/favicon-32.png` | **`dist/brand/favicon-32.png` exists** → served | n/a | **the 1,824 B PNG, 200** |
| 8 | `/nonexistent` | no such file | rule 3 matches → `/index.html` | **`dist/index.html`, 200** — a soft 404. See **P5-4**. |

Two more worth recording:

| Request | Resolves to | Note |
| --- | --- | --- |
| `/assets/index-BCCAt3yZ.js` | filesystem hit, 200 | hashed assets are never rewritten |
| `/favicon.ico` | no file → rule 3 → **`dist/index.html`, 200 `text/html`** | Browsers use the explicit `<link rel="icon">` at `index.html:11–12` and do not request this, but crawlers and link-preview bots often do, and they get an HTML body with an `.ico` URL. Harmless; noted under §8. |

### 7.4 Against README.md:86–90

```
| Request | Served by |
| --- | --- |
| `/components`, `/components/` | the explicit rewrites in `vercel.json` |
| `/components.html` | the filesystem — Vercel gives it precedence over `rewrites`, and the catch-all excludes `/components*` besides |
| anything else | the catch-all rewrite to `/index.html` |
```

| README row | `file:line` | Verdict |
| --- | --- | --- |
| `/components`, `/components/` → explicit rewrites | README.md:88 | **Correct** (walk rows 2–3) |
| `/components.html` → filesystem, precedence over rewrites | README.md:89 | **Correct** (walk row 4), and the parenthetical "the catch-all excludes `/components*`" is also correct — that is precisely the lookahead's effect |
| "anything else" → catch-all to `/index.html` | README.md:90 | **Incorrect** for any path beginning with `components` — `/componentsfoo` matches no rule and 404s (walk row 5). The README's own line 89 states the exclusion that line 90 then ignores. |

Also unstated in the README: `/components.html` remains reachable as a second URL for the sheet.
That is benign here because `components.html:17` sets `<meta name="robots" content="noindex,
nofollow">`, so there is no duplicate-content exposure; worth a sentence in the routing table
regardless (Phase 6).

---

## 8. Other delivery observations

**Checked and fine:**

- **`preconnect` / `dns-prefetch` are genuinely not needed.** `grep -n "preconnect\|dns-prefetch\|rel=\"prefetch\"\|http-equiv" index.html components.html dist/index.html` → no output, and that is correct: every subresource is same-origin. The only cross-origin URLs in the whole landing source are `<a href>` navigation targets (`src/lib/links.ts:8–39`: `discord.gg`, `hackbu.org`, `github.com`, `linkedin.com`, `facebook.com`, `twitter.com`) plus the absolute `og:image` on the site's own origin. Fonts are self-hosted through `@fontsource`; images come from `public/`. Nothing to preconnect to.
- **No `<meta http-equiv>` caching hints.** Correct — browsers ignore `http-equiv="Cache-Control"` in HTML for the document itself; caching belongs in response headers.
- **No third-party scripts, analytics, tag managers or embeds.** Zero cross-origin script/style/image/font/XHR on either page.
- **`cleanUrls` and `trailingSlash` are both unset** in `vercel.json` (defaults). `cleanUrls: true` would serve the sheet at `/components` natively and 308-redirect `/components.html` → `/components`, replacing both explicit rewrites with one flag and closing the two-URL point in §7.4 — worth considering, but it also changes behaviour for `/index.html`, so it is a design decision rather than a defect. Not raised.
- **No `redirects` and no `functions`** — nothing to audit.
- **`dist/index.html` gzips to 1,627 B** (`3,578` raw), `dist/components.html` to 728 B. 1,921 of the 3,578 raw bytes are the four HTML comment blocks, which Vite does not strip. They are load-bearing documentation and compress well; not raised.

**Raised below:** absent cache headers (**P5-3**), the catch-all's soft-404 behaviour (**P5-4**),
no font preload (**P5-5**), the 655 B second stylesheet (**P5-13**).

**One more for Phase 6 (docs), not perf:** `index.html:67` hardcodes
`https://hackbu-landing.vercel.app/brand/og-image.png`. If the site moves to `hackbu.org` the
social card silently breaks — nothing in the build validates it, and the comment at
`index.html:53–59` explains *why* it is absolute but not that it is deploy-specific.

---

## 9. Findings

### P5-1 — `medium` — Landing page is fully client-rendered, so FCP *and* LCP wait on ~110 KB gzip of JS

**Evidence.** `dist/index.html:75–77` is the whole body:

```html
  <body>
    <div id="root"></div>
  </body>
```

Nothing paints until `/assets/index-BCCAt3yZ.js` (14,604 B / 5,667 gz) plus its
`modulepreload`ed dependency `/assets/SiteFooter-D2vbYzEP.js` (328,964 B / **103,956 gz**) have
downloaded, parsed and executed and React has mounted. The LCP element is the campus `<img>`,
which is created by `src/components/Hero.tsx:201–213` — it does not exist in the HTML response.
The preload at `dist/index.html:39–46` warms the AVIF into the HTTP cache early (and correctly),
but a preloaded image is not an LCP candidate until an element consumes it.

**Expected.** web.dev, "Optimize Largest Contentful Paint": the LCP element should be present and
discoverable in the initial HTML document, and render-blocking JavaScript on the critical path is
the dominant LCP cause on client-rendered pages. Google's own guidance for static marketing pages
is to pre-render rather than hydrate an empty root.

**Fix.** Add a build-time prerender step for both entries (`renderToString` into the HTML
template — the app has no runtime data, no router and no browser-only state above the fold), so
the hero markup and its `<picture>` ship inside `index.html` and the preload scanner can act on
the element itself rather than only on the hint.

---

### P5-2 — `low` — `motion`'s drag/pan/layout-projection features are bundled though the landing uses none of them (~50 KB of the shared chunk)

**Evidence.** Byte offsets inside `dist/assets/SiteFooter-D2vbYzEP.js` (328,964 B):

```
$ for s in layoutDependency isSharedProjectionDirty PanSession dragSnapToOrigin; do
    printf '%-28s first=%-8s last=%-8s\n' "$s" \
      "$(grep -abo "$s" $C | head -1 | cut -d: -f1)" "$(grep -abo "$s" $C | tail -1 | cut -d: -f1)"; done
layoutDependency             first=266349   last=314099
isSharedProjectionDirty      first=267828   last=288406
PanSession                   first=291083   last=312999
dragSnapToOrigin             first=300185   last=308933
$ grep -ao "projection" $C | wc -l
53
$ grep -ao "layoutId" $C | wc -l
18
$ dd if=$C bs=1 skip=315000 count=200 | tr -c '[:print:]' '.'
vu},drag:{Feature:gu,ProjectionNode:Qc,MeasureLayout:xu}};function Cu(e,t,n){let{props:r}=e;…whileHover…
```

The landing's entire motion surface (`grep -rn` over `src/` minus `src/sheet/`) is
`motion.img`/`motion.div`/`motion.ul`/`motion.dl`/`motion.li`, `useScroll`, `useTransform`,
`useReducedMotion`, `cubicBezier`, and `whileInView` + `variants` + `viewport`
(`src/components/Hero.tsx:2,140,150,154,201`; `HeroClouds.tsx:2,720,726,747,752`;
`Reveal.tsx:2,30,71,77,102,109,117,124,151,158`; `src/lib/motion.ts:2,42,54`). **No `drag`, no
`layout`/`layoutId`, no `whileHover`/`whileTap`, no `AnimatePresence`.**

The feature bundles are defined locally and confirm the split:

```
$ cat node_modules/framer-motion/dist/es/render/dom/features-animation.mjs
const domAnimation = { renderer: createDomVisualElement, ...animations, ...gestureAnimations };
$ cat node_modules/framer-motion/dist/es/render/dom/features-max.mjs
const domMax = { ...domAnimation, ...drag, ...layout };
$ cat node_modules/framer-motion/dist/es/motion/features/gestures.mjs
const gestureAnimations = { inView: {…}, tap: {…}, focus: {…}, hover: {…} };
```

`whileInView` lives in `gestureAnimations`, so **`domAnimation` covers everything this page
uses** — `domMax`'s extra `drag` + `layout` is pure dead weight.

**Expected.** Motion for React docs, `LazyMotion` ("Reduce bundle size"): import `m` from
`motion/react-m` (the subpath exists — `node_modules/motion/package.json` `exports` lists
`"./react-m"`) and wrap the tree in `<LazyMotion features={domAnimation}>` so only the declared
feature set is bundled.

**Fix.** Swap `motion` → `m` in the four import sites and wrap `src/App.tsx`'s root in
`<LazyMotion features={domAnimation} strict>`; the saving is the ~265,000–315,000 byte region
above (~50 KB raw, ~15% of the chunk) — **exact figure unverified, it needs a build to confirm.**

---

### P5-3 — `low` — No `headers` block in `vercel.json`: 495 KB of un-hashed image assets get whatever the platform default is

**Evidence.** `vercel.json` (§7.1) has `rewrites` only. Of the 53 files served from `public/`,
**none is content-hashed** — `Campus-1672.avif`, `cloud-1.avif`, `favicon-32.png` and the rest
keep their filenames when their bytes change (`scripts/generate-images.mjs:134–138,148–149`
overwrite in place). The AVIF first-load path is 495,259 B across 13 requests (§2.4). By
contrast `dist/assets/*` **is** content-hashed (`index-BCCAt3yZ.js`, `SiteFooter-D2vbYzEP.js`,
`inter-latin-400-normal-C38fXH4l.woff2`, …) and would be safe to mark immutable — but gets the
same unstated default.

**Expected.** Per Vercel docs ("Headers" configuration / "Edge Network caching"), static build
output is served with a platform default `Cache-Control` unless a `headers` entry overrides it;
the documented pattern is a long `max-age` + `immutable` for fingerprinted paths and a
revalidating policy for paths whose name is stable. **The exact default value is unverified
offline** — this finding is about the *absence of an explicit policy*, not about a measured wrong
value.

**Fix.** Add to `vercel.json`:
`"headers": [{"source": "/assets/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=31536000, immutable"}]}, {"source": "/(artwork|brand)/(.*)", "headers": [{"key": "Cache-Control", "value": "public, max-age=86400, must-revalidate"}]}]`
— then verify the served headers in Phase 7.

---

### P5-4 — `low` — Catch-all rewrite makes every unknown URL a 200 landing page, except `/components*` which 404s — and the page has no client-side router

**Evidence.** `vercel.json:9`:

```json
    { "source": "/((?!components).*)", "destination": "/index.html" }
```

Walk (§7.3): `/nonexistent` → `dist/index.html`, **200** (a soft 404); `/componentsfoo` →
no rule matches (the lookahead rejects it) → **Vercel 404**. Two different outcomes for two
equally nonexistent URLs. `README.md:90` documents only the first: "anything else | the catch-all
rewrite to `/index.html`".

There is no client-side router to justify the fallback: `package.json:14–20` lists only
`@fontsource/*`, `motion`, `react`, `react-dom` — no routing dependency — and `src/App.tsx`
renders one page with in-page anchors. There is no `dist/404.html` or `public/404.html`.

**Expected.** Google Search Central, "Soft 404 errors": returning `200` with a real page for a
URL that does not exist is a soft 404 and is reported as an error in Search Console. An SPA
fallback exists to support client-side routes; with none present it converts every typo and every
stale inbound link into an indexable duplicate of the home page.

**Fix.** Drop rule 3 so unmatched paths 404 honestly (optionally adding a `public/404.html`), or
keep it deliberately and fix `README.md:90` to say "anything else *that does not begin with
`components`*". Either way the README needs the correction.

---

### P5-5 — `low` — No `<link rel="preload">` for the woff2 faces; fonts start only after two stylesheets parse and layout runs

**Evidence.** `dist/index.html:70–73` — the three `@font-face` rules live in a *separate*
stylesheet:

```html
    <script type="module" crossorigin src="/assets/index-BCCAt3yZ.js"></script>
    <link rel="modulepreload" crossorigin href="/assets/SiteFooter-D2vbYzEP.js">
    <link rel="stylesheet" crossorigin href="/assets/SiteFooter-DgSLZxXM.css">
    <link rel="stylesheet" crossorigin href="/assets/index-CePBE3nM.css">
```

so `inter-latin-400-normal-C38fXH4l.woff2` (23,664 B) cannot be requested until that CSS lands
*and* style/layout finds an element using Inter 400 — which, per P5-1, does not happen until
React has mounted. `font-display: swap` (§5.4) then guarantees a fallback→webfont reflow rather
than invisible text. Above-the-fold text on this page is Inter: the fixed header's nav links
(`src/components/Layout.tsx:74`, `font-medium` → Inter 500) and the body default
(`src/App.tsx:27`). All three woff2 files total 66,032 B.

**Expected.** web.dev, "Preload web fonts to improve loading speed": critical, self-hosted
webfonts referenced from CSS should be preloaded so the request starts with the CSS rather than
after it.

**Fix.** Inject `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the Inter 400
(and optionally 500) woff2 at build time — the filenames are content-hashed so this must be a
plugin, not a hand-written tag. **Deliberately not Fraunces:** it is used only by `font-display`
headings, none of which are above the fold (the hero is illustration only, `Hero.tsx:20–28`), so
preloading it would compete with the LCP image for bandwidth.

---

### P5-6 — `note` — Three `.woff` fallbacks (84,492 B) ship in `dist/` and can never be fetched

**Evidence.** `dist/assets/SiteFooter-DgSLZxXM.css` (§5.4) lists woff2 first, woff second, in each
`src:`. Any browser reaching the woff rung is one that does not support woff2 — which means it
also never sees the woff2 rung, so no client ever downloads both. Sizes:
`fraunces-…-DL5QCzvS.woff` 22,512 + `inter-400-…-CyCys3Eg.woff` 30,696 +
`inter-500-…-BL9OpVg8.woff` 31,284 = **84,492 B**.

**Expected.** WOFF2 is Baseline across all current engines; the `.woff` rung reaches IE11 and
Android Browser 4.x only. There is **no runtime cost** — this is deploy-artifact weight, not
transfer weight.

**Fix.** None required. If deploy size matters, replace the `@fontsource` CSS imports with three
hand-written `@font-face` blocks pointing at the woff2 files only (`@fontsource` does not publish
a woff2-only entrypoint).

---

### P5-7 — `note` — Permanent `will-change: transform` on seven elements; four of them stop changing partway through the hero

**Evidence.** `src/components/Hero.tsx:209–211` (campus `<img>`, already conditional on
`reducedMotion`), `src/components/HeroClouds.tsx:749` (× 3 `data-cloud-layer`), `:754` (× 3
`data-cloud-drift`). Full static analysis in §4.4. In short: the three drift tracks animate `x`
with `repeat: Number.POSITIVE_INFINITY` (`HeroClouds.tsx:698`) so their promotion never expires;
the three layer wrappers are at `opacity: 0` by track progress ≤ 0.30
(`HeroClouds.tsx:230,277,324`) and the campus `<img>` stops scaling at 0.75 (`Hero.tsx:87`), yet
all four stay promoted for the life of the document. Each drift track is four viewport widths
wide (`HeroClouds.tsx:754,780`, `SET_COUNT` = 4 at `:485`), clipped by an `overflow-hidden`
ancestor at `:774`.

**Expected.** MDN, `will-change`: "use `will-change` as a last resort … don't apply it to too many
elements … remove `will-change` when the element stops changing", because the promotion holds a
compositing layer and its GPU texture for as long as the property is set.

**Fix.** Drop `will-change-transform` from `data-cloud-layer` (the drift child is already
promoted and is what actually animates continuously) and from the campus `<img>` once
`pan === 1`. **But this is a static reading only — Phase 7 should capture the DevTools Layers
panel and a Performance trace before changing anything, since the compositor may already be
clipping these layers to one viewport and the cost may be nil.**

---

### P5-8 — `note` — The twelve cloud AVIFs (173,219 B) are above-the-fold but undiscoverable until the bundle renders

**Evidence.** `src/components/HeroClouds.tsx:615–625` — the cloud `<img>` carries `decoding="async"`
and no `loading` (so eager, which is correct) and no `fetchpriority`. But the elements are created
by React, and `dist/index.html`'s body is `<div id="root"></div>`, so the preload scanner never
sees them: their requests begin only after ~110 KB gzip of JS has executed. 48 nodes are mounted
(`SET_COUNT` 4 × 3 layers × 4 clouds) sharing 12 distinct URLs, 16 of them intersecting the stage
at 390×844 (`HeroClouds.tsx:176–186`).

**Expected.** This is a consequence of P5-1, not an independent defect. `loading="lazy"` would be
*wrong* here (web.dev, "Browser-level lazy loading": never lazy-load in-viewport images), and
preloading twelve decorative cutouts would compete with the LCP image.

**Fix.** Resolved by P5-1's prerender. Absent that, accept — but **Phase 7 should measure how
long after LCP the cloud layer completes**, and if the gap is large, consider
`fetchpriority="low"` on the cloud `<img>` so they queue behind the campus image explicitly.

---

### P5-9 — `note` — ASSETS.md records `brand-source/icon_discord.png` as having no alpha; the file is RGBA

**Evidence.** sharp metadata (§10): `brand-source/icon_discord.png|732x732|2158148|png|4|true|uchar`
— four channels, `hasAlpha: true`. `ASSETS.md:116`:

```
| `brand-source/icon_discord.png` | 732 × 732 | n/a — opaque tile | `#97F5AC` tile, `#50B536` mark | No (opaque) |
```

Every other alpha claim in the file is correct (Campus.png channels 3 / `hasAlpha false` vs "No";
all twelve cutouts channels 4 / true vs "Yes").

**Expected.** The column is "Alpha". The file has an alpha channel; its contents happen to be
fully opaque. The two are different facts, and the parenthetical shows the author knew — the
cell just states the wrong one.

**Fix.** Reword the cell to "Yes — channel present, fully opaque" (Phase 6). No code change; the
generator flattens it anyway (`generate-images.mjs:216–222`).

---

### P5-10 — `note` — ASSETS.md's mask-rung KB figures use KB = 1000 while the rest of the file uses 1024

**Evidence.** Measured: 1x rungs (`bearcat-mask-64` 3,164 + `wordmark-mask-192` 2,147) = **5,311 B**;
2x rungs (`bearcat-mask-128` 6,941 + `wordmark-mask-384` 4,850) = **11,791 B**. `ASSETS.md:136`
says "**5.3 KB at 1x, 11.7 KB at 2x**". Those are 5,311/1000 and 11,791/1000, truncated. Under
the /1024 convention the same bytes are 5.2 and 11.5. `ASSETS.md:43` uses MiB
(2,942,406 B → "2.81 MiB" = /1024²) and `ASSETS.md:86` uses /1024 ("738 KB" from 755,368).

**Expected.** One unit convention per document. `scripts/generate-images.mjs:225–227` — the
script that produced most of these numbers — divides by 1024.

**Fix.** Phase 6: restate as "5.2 KB at 1x, 11.5 KB at 2x" to match the rest of the file, or
state the convention once at the top.

---

### P5-11 — `note` — "byte-identical" in `index.html`'s preload comment is true of the built HTML, not of the source

**Evidence.** `index.html:28–30`:

> `imagesrcset`/`imagesizes` are byte-identical to the `<picture>` sources in
> src/components/Hero.tsx (via src/lib/images.ts) …

§1.2: `imagesizes` **is** byte-identical, but `imagesrcset` is not — the source attribute is
written across five indented lines while `campusSrcSet('avif')` joins with `', '`. Vite collapses
it, so `dist/index.html:44` **is** byte-identical (proved in §1.2). The functional guarantee the
comment is really making — that the preload and the `<picture>` resolve to the same URL — holds
regardless, because the HTML srcset grammar ignores the whitespace.

**Expected.** A comment that a reader (or an auditor) can verify against the file it sits in.

**Fix.** Phase 6: "…are identical to the `<picture>` sources after srcset whitespace
normalisation (and byte-identical in the built HTML, which is what the browser parses)."

---

### P5-12 — `note` — `og:image` hardcodes the Vercel preview domain

**Evidence.** `index.html:67`: `content="https://hackbu-landing.vercel.app/brand/og-image.png"`.
Nothing in the build validates the origin, and the comment at `index.html:53–59` explains why the
URL must be absolute but not that it is deploy-specific.

**Expected.** An absolute `og:image` is required (the comment is right about that), but the
origin should track the deployment — Vercel exposes `VERCEL_PROJECT_PRODUCTION_URL` /
`VERCEL_URL` to the build.

**Fix.** Phase 6: at minimum, add a line to README.md's deploy section listing this as a thing to
change when the custom domain lands; better, template it from an env var at build time.

---

### P5-13 — `note` — The landing page takes two render-blocking stylesheets, one of which is 655 bytes

**Evidence.** `dist/index.html:72–73`: `SiteFooter-DgSLZxXM.css` (655 B / 256 gz, three
`@font-face` rules and nothing else — §5.4) and `index-CePBE3nM.css` (17,862 B). Both are
`<link rel="stylesheet">` in `<head>`, so both block first paint. The split exists because Vite
emits one CSS file per chunk and the `@fontsource` imports sit in `src/main.tsx:15–17` /
`src/sheet/main.tsx:9–11`, landing them in the shared chunk rather than in either page's own
stylesheet — the same mechanism behind the chunk's misleading name (P1-1).

**Expected.** Over HTTP/2 the extra request costs almost nothing in bytes; the cost is a second
stylesheet that must arrive before first paint, and a critical-path graph that is harder to read.

**Fix.** Move the three `@fontsource` imports into `src/index.css` / `src/landing.css` as
`@import` statements so they fold into each page's own stylesheet, or set
`build.cssCodeSplit: false` in `vite.config.ts`. Low priority; verify with Phase 7's waterfall
before touching it.

---

## 10. Commands run

Every command verbatim, in order. Working directory is the repo root
(`C:/Users/danz3/Downloads/HackBUNew`) throughout; scratchpad is
`C:/Users/danz3/AppData/Local/Temp/claude/C--Users-danz3-Downloads-HackBUNew/3a277e50-bf53-4daa-a1d2-74d9bad28359/scratchpad`.

### 10.1 Reading

```sh
ls -la && echo "--- audit ---" && ls -la audit/
cat audit/01-baseline.md
cat -n index.html
cat -n components.html
cat -n vercel.json
cat -n vite.config.ts
cat -n src/lib/images.ts
cat -n scripts/generate-images.mjs
cat -n ASSETS.md
cat -n src/components/Hero.tsx
cat -n src/components/HeroClouds.tsx
cat -n dist/index.html
cat -n package.json
grep -n "" README.md | sed -n '1,40p'
grep -n -i "rewrite\|vercel\|route\|routing\|/components\|filesystem\|cache\|cleanUrls\|trailingSlash\|404" README.md
awk 'NR>=58 && NR<=95 {printf "%d\t%s\n", NR, $0}' README.md
sed -n '110,185p' src/index.css | cat -n
```

### 10.2 Asset inventory — the sharp metadata script (READ-ONLY)

`<scratchpad>/meta.mjs`, run with `node <scratchpad>/meta.mjs` **from the repo root** so `sharp`
resolves from `node_modules/` (ESM resolves bare specifiers relative to the script file, hence the
`createRequire` shim). It calls only `readdir`, `stat` and `sharp(file).metadata()` — **no `sharp`
output method is ever invoked, so no image can be written**:

```js
/* READ-ONLY: reads image metadata + byte size. Writes nothing to disk. */
import { readdir, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { createRequire } from 'node:module'

const ROOT = process.cwd()
// ESM resolves bare specifiers relative to THIS file, which lives in the
// scratchpad; resolve `sharp` from the repo root instead.
const require = createRequire(join(ROOT, 'package.json'))
const sharp = require('sharp')

const DIRS = [
  join(ROOT, 'public', 'artwork'),
  join(ROOT, 'public', 'brand'),
  join(ROOT, 'artwork'),
  join(ROOT, 'brand-source'),
]

async function walk(dir) {
  const out = []
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else out.push(p)
  }
  return out
}

const rows = []
for (const d of DIRS) {
  for (const f of await walk(d)) {
    const rel = relative(ROOT, f).split(sep).join('/')
    const { size } = await stat(f)
    let dims = '-'
    let fmt = '-'
    let chan = '-'
    let alpha = '-'
    let depth = '-'
    try {
      const m = await sharp(f).metadata()
      dims = `${m.width}x${m.height}`
      fmt = m.format
      chan = String(m.channels)
      alpha = String(m.hasAlpha)
      depth = String(m.depth)
    } catch (err) {
      fmt = `ERR:${err.message.slice(0, 40)}`
    }
    rows.push({ rel, dims, size, fmt, chan, alpha, depth })
  }
}

console.log(
  ['path', 'dims', 'bytes', 'format', 'channels', 'hasAlpha', 'depth'].join('|'),
)
for (const r of rows) {
  console.log([r.rel, r.dims, r.size, r.fmt, r.chan, r.alpha, r.depth].join('|'))
}
console.log(`# ${rows.length} files`)
```

Full output:

```
path|dims|bytes|format|channels|hasAlpha|depth
public/artwork/campus/Campus-1280.avif|1280x720|221649|heif|3|false|uchar
public/artwork/campus/Campus-1280.webp|1280x720|238404|webp|3|false|uchar
public/artwork/campus/Campus-1672.avif|1672x941|322040|heif|3|false|uchar
public/artwork/campus/Campus-1672.webp|1672x941|349538|webp|3|false|uchar
public/artwork/campus/Campus-640.avif|640x360|69508|heif|3|false|uchar
public/artwork/campus/Campus-640.webp|640x360|73812|webp|3|false|uchar
public/artwork/campus/Campus-960.avif|960x540|142171|heif|3|false|uchar
public/artwork/campus/Campus-960.webp|960x540|147568|webp|3|false|uchar
public/artwork/campus/Campus.png|1672x941|2942406|png|3|false|uchar
public/artwork/clouds/cloud-1.avif|429x259|19684|heif|4|true|uchar
public/artwork/clouds/cloud-1.png|429x259|107042|png|4|true|uchar
public/artwork/clouds/cloud-1.webp|429x259|32376|webp|4|true|uchar
public/artwork/clouds/cloud-10.avif|291x167|11849|heif|4|true|uchar
public/artwork/clouds/cloud-10.png|291x167|51509|png|4|true|uchar
public/artwork/clouds/cloud-10.webp|291x167|16230|webp|4|true|uchar
public/artwork/clouds/cloud-11.avif|342x303|22197|heif|4|true|uchar
public/artwork/clouds/cloud-11.png|342x303|115138|png|4|true|uchar
public/artwork/clouds/cloud-11.webp|342x303|33902|webp|4|true|uchar
public/artwork/clouds/cloud-12.avif|238x97|7588|heif|4|true|uchar
public/artwork/clouds/cloud-12.png|238x97|26215|png|4|true|uchar
public/artwork/clouds/cloud-12.webp|238x97|10252|webp|4|true|uchar
public/artwork/clouds/cloud-2.avif|430x194|16555|heif|4|true|uchar
public/artwork/clouds/cloud-2.png|430x194|84998|png|4|true|uchar
public/artwork/clouds/cloud-2.webp|430x194|26518|webp|4|true|uchar
public/artwork/clouds/cloud-3.avif|263x229|13468|heif|4|true|uchar
public/artwork/clouds/cloud-3.png|263x229|67012|png|4|true|uchar
public/artwork/clouds/cloud-3.webp|263x229|20342|webp|4|true|uchar
public/artwork/clouds/cloud-4.avif|266x108|8089|heif|4|true|uchar
public/artwork/clouds/cloud-4.png|266x108|32041|png|4|true|uchar
public/artwork/clouds/cloud-4.webp|266x108|11608|webp|4|true|uchar
public/artwork/clouds/cloud-5.avif|343x253|16828|heif|4|true|uchar
public/artwork/clouds/cloud-5.png|343x253|87093|png|4|true|uchar
public/artwork/clouds/cloud-5.webp|343x253|26830|webp|4|true|uchar
public/artwork/clouds/cloud-6.avif|224x70|5299|heif|4|true|uchar
public/artwork/clouds/cloud-6.png|224x70|17623|png|4|true|uchar
public/artwork/clouds/cloud-6.webp|224x70|7348|webp|4|true|uchar
public/artwork/clouds/cloud-7.avif|413x170|16347|heif|4|true|uchar
public/artwork/clouds/cloud-7.png|413x170|70612|png|4|true|uchar
public/artwork/clouds/cloud-7.webp|413x170|22842|webp|4|true|uchar
public/artwork/clouds/cloud-8.avif|312x294|18690|heif|4|true|uchar
public/artwork/clouds/cloud-8.png|312x294|95464|png|4|true|uchar
public/artwork/clouds/cloud-8.webp|312x294|28750|webp|4|true|uchar
public/artwork/clouds/cloud-9.avif|380x221|16625|heif|4|true|uchar
public/artwork/clouds/cloud-9.png|380x221|83747|png|4|true|uchar
public/artwork/clouds/cloud-9.webp|380x221|25544|webp|4|true|uchar
public/brand/apple-touch-icon.png|180x180|7805|png|3|false|uchar
public/brand/bearcat-mask-128.png|128x134|6941|png|4|true|uchar
public/brand/bearcat-mask-64.png|64x67|3164|png|4|true|uchar
public/brand/favicon-32.png|32x32|1824|png|4|true|uchar
public/brand/favicon-64.png|64x64|4601|png|4|true|uchar
public/brand/og-image.png|732x732|10014|png|3|false|uchar
public/brand/wordmark-mask-192.png|192x27|2147|png|4|true|uchar
public/brand/wordmark-mask-384.png|384x54|4850|png|4|true|uchar
artwork/campus/Campus.png|1672x941|2942406|png|3|false|uchar
artwork/clouds/cloud-1.png|429x259|107042|png|4|true|uchar
artwork/clouds/cloud-10.png|291x167|51509|png|4|true|uchar
artwork/clouds/cloud-11.png|342x303|115138|png|4|true|uchar
artwork/clouds/cloud-12.png|238x97|26215|png|4|true|uchar
artwork/clouds/cloud-2.png|430x194|84998|png|4|true|uchar
artwork/clouds/cloud-3.png|263x229|67012|png|4|true|uchar
artwork/clouds/cloud-4.png|266x108|32041|png|4|true|uchar
artwork/clouds/cloud-5.png|343x253|87093|png|4|true|uchar
artwork/clouds/cloud-6.png|224x70|17623|png|4|true|uchar
artwork/clouds/cloud-7.png|413x170|70612|png|4|true|uchar
artwork/clouds/cloud-8.png|312x294|95464|png|4|true|uchar
artwork/clouds/cloud-9.png|380x221|83747|png|4|true|uchar
artwork/clouds/clouds-all-b.png|2172x724|453487|png|4|true|uchar
brand-source/icon_discord.png|732x732|2158148|png|4|true|uchar
brand-source/icon.png|1920x2033|196106|png|4|true|uchar
brand-source/text.png|7690x1080|189929|png|4|true|uchar
# 70 files
```

### 10.3 Asset inventory — the rest

```sh
find public -type f | sort
find public -type f | wc -l
find public -type f ! -name '*.png' ! -name '*.webp' ! -name '*.avif' | sort

for f in artwork/campus/Campus.png artwork/clouds/cloud-*.png; do
  case "$f" in *clouds-all-b*) continue;; esac
  p="public/$f"
  if cmp -s "$f" "$p"; then echo "IDENTICAL  $f == $p"; else echo "DIFFERS    $f != $p"; fi
done

ls -la public/artwork/clouds/clouds-all-b.png
find public -name 'clouds-all-b*' | wc -l

diff <(cd public && find . -type f | sort) \
     <(cd dist && find artwork brand -type f | sed 's|^|./|' | sort) && echo "IDENTICAL file lists (53)"
ls dist/404.html public/404.html
```

ASSETS.md arithmetic cross-check (`node -e`, verbatim):

```sh
node -e "
const f=require('fs');
const rows=[
 ['Campus.png',2942406],['cloud-6',17623],['cloud-12',26215],['cloud-4',32041],['cloud-10',51509],
 ['cloud-7',70612],['cloud-2',84998],['cloud-9',83747],['cloud-3',67012],['cloud-5',87093],
 ['cloud-1',107042],['cloud-8',95464],['cloud-11',115138]];
const t=rows.reduce((s,r)=>s+r[1],0);
console.log('ASSETS.md inventory total:',t,'  claimed 3,780,900 ->',t===3780900);
const glob=(d,ext)=>f.readdirSync(d).filter(n=>n.endsWith(ext)).map(n=>f.statSync(d+'/'+n).size);
const sum=a=>a.reduce((s,x)=>s+x,0);
const ca=sum(glob('public/artwork/campus','.avif')), cw=sum(glob('public/artwork/campus','.webp'));
const la=sum(glob('public/artwork/clouds','.avif')), lw=sum(glob('public/artwork/clouds','.webp'));
const kb=b=>(b/1024).toFixed(1)+' KB';
console.log('campus avif',ca,kb(ca),'(ASSETS.md: 738 KB)');
console.log('campus webp',cw,kb(cw),'(ASSETS.md: 790 KB)');
console.log('cloud  avif',la,kb(la),'(ASSETS.md: 169 KB)');
console.log('cloud  webp',lw,kb(lw),'(ASSETS.md: 256 KB)');
const top=f.statSync('public/artwork/campus/Campus-1672.avif').size;
console.log('first-load AVIF path =',top,'+',la,'=',top+la,'(ASSETS.md: 495,259 ->',top+la===495259,')');
console.log('brand 1x rungs:', f.statSync('public/brand/bearcat-mask-64.png').size + f.statSync('public/brand/wordmark-mask-192.png').size, 'B (ASSETS.md: 5.3 KB)');
console.log('brand 2x rungs:', f.statSync('public/brand/bearcat-mask-128.png').size + f.statSync('public/brand/wordmark-mask-384.png').size, 'B (ASSETS.md: 11.7 KB)');
const woff2=['fraunces-latin-600-normal-BFCDtZfi.woff2','inter-latin-400-normal-C38fXH4l.woff2','inter-latin-500-normal-Cerq10X2.woff2'].map(n=>f.statSync('dist/assets/'+n).size);
const woff=['fraunces-latin-600-normal-DL5QCzvS.woff','inter-latin-400-normal-CyCys3Eg.woff','inter-latin-500-normal-BL9OpVg8.woff'].map(n=>f.statSync('dist/assets/'+n).size);
console.log('woff2 total (fetched):', sum(woff2), 'B;  woff total (shipped, never fetched by any browser that supports woff2):', sum(woff), 'B');
"
```

### 10.4 Srcset triple-agreement — the comparison script (READ-ONLY)

`<scratchpad>/srcset.mjs`, run with `node <scratchpad>/srcset.mjs` from the repo root:

```js
/* READ-ONLY: compares the three copies of the campus srcset/sizes. Writes nothing. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const read = (p) => readFileSync(join(ROOT, p), 'utf8')

const imagesTs = read('src/lib/images.ts')
const genMjs = read('scripts/generate-images.mjs')
const indexHtml = read('index.html')

const widthsFrom = (src, label) => {
  const m = src.match(/const CAMPUS_WIDTHS = \[([0-9,\s]+)\]/)
  if (!m) throw new Error(`no CAMPUS_WIDTHS in ${label}`)
  return m[1].split(',').map((s) => s.trim()).filter(Boolean).map(Number)
}

const wImages = widthsFrom(imagesTs, 'src/lib/images.ts')
const wScript = widthsFrom(genMjs, 'scripts/generate-images.mjs')

// images.ts:27-31 campusSrcSet(), reproduced exactly.
const campusSrcSet = (widths, ext) =>
  widths.map((w) => `/artwork/campus/Campus-${w}.${ext} ${w}w`).join(', ')

// generate-images.mjs:242-243 srcset(), reproduced exactly.
const scriptSrcSet = (widths, ext) =>
  widths.map((w) => `/artwork/campus/Campus-${w}.${ext} ${w}w`).join(', ')

const attr = (name) => {
  const m = indexHtml.match(new RegExp(`${name}="([^"]*)"`))
  if (!m) throw new Error(`no ${name} in index.html`)
  return m[1]
}
const rawImagesrcset = attr('imagesrcset')
const rawImagesizes = attr('imagesizes')

// HTML srcset parsing (WHATWG HTML 4.8.4.2 "parsing a srcset attribute") splits
// on ASCII whitespace and commas, so leading/trailing/inner whitespace runs are
// not significant. Normalise both sides the same way before comparing.
const normSrcset = (s) =>
  s.split(',').map((part) => part.trim().split(/\s+/).join(' ')).filter(Boolean).join(', ')

const sizesTs = imagesTs.match(/export const CAMPUS_SIZES = '([^']*)'/)[1]

const line = (f, s) => `${f}\n  ${JSON.stringify(s)}`

console.log('--- CAMPUS_WIDTHS ---')
console.log('src/lib/images.ts:25        ', JSON.stringify(wImages))
console.log('scripts/generate-images.mjs:90', JSON.stringify(wScript))
console.log('widths MATCH:', JSON.stringify(wImages) === JSON.stringify(wScript))
console.log()
console.log('--- AVIF srcset ---')
console.log(line('images.ts campusSrcSet("avif")', campusSrcSet(wImages, 'avif')))
console.log(line('generate-images.mjs srcset("avif")', scriptSrcSet(wScript, 'avif')))
console.log(line('index.html imagesrcset (raw)', rawImagesrcset))
console.log(line('index.html imagesrcset (normalised)', normSrcset(rawImagesrcset)))
console.log()
console.log('byte-identical (images.ts vs raw index.html attr):', campusSrcSet(wImages, 'avif') === rawImagesrcset)
console.log('semantically identical (normalised):', normSrcset(campusSrcSet(wImages, 'avif')) === normSrcset(rawImagesrcset))
console.log('generate-images.mjs vs index.html (normalised):', normSrcset(scriptSrcSet(wScript, 'avif')) === normSrcset(rawImagesrcset))
console.log()
console.log('--- WebP srcset (no preload counterpart; images.ts vs script) ---')
console.log(line('images.ts campusSrcSet("webp")', campusSrcSet(wImages, 'webp')))
console.log(line('generate-images.mjs srcset("webp")', scriptSrcSet(wScript, 'webp')))
console.log('MATCH:', campusSrcSet(wImages, 'webp') === scriptSrcSet(wScript, 'webp'))
console.log()
console.log('--- sizes ---')
console.log(line('src/lib/images.ts:57 CAMPUS_SIZES', sizesTs))
console.log(line('index.html:50 imagesizes (raw)', rawImagesizes))
console.log('byte-identical:', sizesTs === rawImagesizes)
```

(Its full output is reproduced in §1.2.) Plus the built-HTML check:

```sh
node -e "
const fs=require('fs');
const html=fs.readFileSync('dist/index.html','utf8');
const src=fs.readFileSync('src/lib/images.ts','utf8');
const widths=src.match(/const CAMPUS_WIDTHS = \[([0-9,\s]+)\]/)[1].split(',').map(s=>Number(s.trim()));
const gen=widths.map(w=>\`/artwork/campus/Campus-\${w}.avif \${w}w\`).join(', ');
const attr=html.match(/imagesrcset=\"([^\"]*)\"/)[1];
console.log('dist/index.html:44 imagesrcset ==', JSON.stringify(attr));
console.log('images.ts campusSrcSet(avif) ==', JSON.stringify(gen));
console.log('BYTE-IDENTICAL in the BUILT html:', attr===gen);
const sizes=src.match(/export const CAMPUS_SIZES = '([^']*)'/)[1];
const asz=html.match(/imagesizes=\"([^\"]*)\"/)[1];
console.log('imagesizes byte-identical:', asz===sizes);
"
```

### 10.5 Image URL enumeration and resolution

```sh
grep -rn "/artwork/\|/brand/" src/ index.html components.html
grep -rnoE "['\"\(][^'\"()]*\.(png|jpe?g|avif|webp|svg|gif|ico)" src/ index.html components.html | sort -u
```

`/tmp/urls.sh`, verbatim — derives the URL set from the source constants rather than a hand-typed
list, so a drift in `CAMPUS_WIDTHS` or the cloud cast changes the output:

```sh
set -u
# --- Build the referenced-URL set from the source constants themselves ---
# Campus: src/lib/images.ts:16 (PNG) + :25 CAMPUS_WIDTHS x :29 template, both formats
echo "/artwork/campus/Campus.png"
for w in $(grep -oE '^const CAMPUS_WIDTHS = \[[0-9, ]+\]' src/lib/images.ts | grep -oE '[0-9]+'); do
  echo "/artwork/campus/Campus-${w}.avif"
  echo "/artwork/campus/Campus-${w}.webp"
done
# Clouds: every `file:` literal in src/components/HeroClouds.tsx, x cloudSources() (images.ts:88-92)
for f in $(grep -oE "file: 'cloud-[0-9]+\.png'" src/components/HeroClouds.tsx | grep -oE 'cloud-[0-9]+'); do
  echo "/artwork/clouds/${f}.png"; echo "/artwork/clouds/${f}.webp"; echo "/artwork/clouds/${f}.avif"
done
# Clouds referenced from the component sheet (src/sheet/parts/HeroPart.tsx)
for f in $(grep -oE "file: 'cloud-[0-9]+\.png'" src/sheet/parts/HeroPart.tsx | grep -oE 'cloud-[0-9]+'); do
  echo "/artwork/clouds/${f}.png"; echo "/artwork/clouds/${f}.webp"; echo "/artwork/clouds/${f}.avif"
done
# Brand mask URLs from src/index.css
grep -oE "url\('(/brand/[^']+)'\)" src/index.css | sed -E "s|url\('||; s|'\)||"
# Every /brand/ or /artwork/ URL appearing in an href/content/imagesrcset in the HTML entries
grep -oE '/(brand|artwork)/[A-Za-z0-9._/-]+\.(png|webp|avif)' index.html components.html | sed 's|^[^:]*:||'
```

```sh
sh /tmp/urls.sh | sed 's#^https\?://[^/]*##' | sort -u > /tmp/urls.txt
wc -l < /tmp/urls.txt
miss=0
while read -r u; do
  if [ -f "public$u" ]; then echo "OK      public$u"; else echo "MISSING public$u"; miss=$((miss+1)); fi
done < /tmp/urls.txt
echo "--- missing: $miss ---"
```

### 10.6 `<picture>`, loading hints, `will-change`

```sh
grep -rn "<img\|<picture\|<source\|loading=\|fetchPriority\|fetchpriority\|decoding=\|aspect-ratio\|aspect-\[" src/ --include=*.tsx --include=*.ts --include=*.css | grep -v "^src/sheet/"
grep -rn "<img\|<picture\|<source\|loading=\|fetchPriority\|decoding=" src/sheet/
grep -rn "will-change" src/
grep -o 'will-change:[^};]*' dist/assets/index-CePBE3nM.css | sort | uniq -c
node -e "console.log('SET_COUNT=4, layers=3, clouds/layer=4 ->', 4*3*4, 'img nodes; distinct URLs =', 12)"
```

### 10.7 Fonts

```sh
grep -rn "fontsource" src/ package.json
grep -n "font-\|@theme\|--font" src/index.css | head -60
grep -rnoE "font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[[0-9]+\])" src/ --include=*.tsx --include=*.css | grep -v "^src/sheet/" | sort -t: -k1,1 -k2,2n
grep -rnoE "font-(display|sans|serif|mono)" src/ --include=*.tsx --include=*.css | grep -v "^src/sheet/" | sort -u
grep -rn "font-weight" src/
grep -rnoE "<(strong|b|em|i)>" src/ --include=*.tsx | grep -v "^src/sheet/"
grep -rncoE "<(strong|b)>" src/sheet/ --include=*.tsx
cat node_modules/@fontsource/inter/latin-400.css
cat node_modules/@fontsource/fraunces/latin-600.css
cat dist/assets/SiteFooter-*.css
```

### 10.8 Bundles

```sh
ls -la dist/assets/
ls -la dist/
ls dist/assets/*.map
ls -la dist/.vite
find dist -name '*.map' -o -name 'manifest*.json' -o -name '.vite'
grep -n "sourcemap" vite.config.ts

grep -rn "from 'motion" src/
grep -rhoE "from '[^.'][^']*'" src/ | sort | uniq -c | sort -rn

C=dist/assets/SiteFooter-D2vbYzEP.js
stat -c%s $C
for s in "react.transitional.element" "react-dom" "Minified React error" "createRoot" "scheduler" \
         "framer" "motion" "useScroll" "willChange" "cubic-bezier" "AnimationPlaybackControls" \
         "MotionValue" "spring" "transformPerspective" "originX" "skewX" "backgroundColor" \
         "Invalid property" "projection" "layoutId" "reduceMotion"; do
  printf '%-30s %s\n' "$s" "$(grep -ac "$s" $C)"
done
for s in "react" "motion" "Motion" "skewX" "transformPerspective"; do
  printf '%-24s %s\n' "$s" "$(grep -ao "$s" $C | wc -l)"
done

for s in "Minified React error" "react.transitional.element" "createRoot" "react-stack-bottom-frame" \
         "onRecoverableError" "transformPerspective" "skewX" "layoutId" "MotionValue" "projection" \
         "framer" "HackBU" "Binghamton" "useSyncExternalStore" "hackbu" "discord.gg" "data-hero" \
         "cloud-1.png" "prefers-reduced-motion" "willChange" "backgroundColor" \
         "createProjectionNode" "measureViewportBox" "sharedLayout" "isSharedProjectionDirty" \
         "resolveRelativeSet" "notifyLayoutUpdate" "PanSession" "dragSnapToOrigin" "_dragX" \
         "layoutDependency" "crossfade" "hasCheckedOptimisedAppear"; do
  f=$(grep -abo "$s" $C | head -1 | cut -d: -f1); l=$(grep -abo "$s" $C | tail -1 | cut -d: -f1)
  n=$(grep -abo "$s" $C | wc -l)
  [ -n "$f" ] && printf '%12s %12s %5s  %s\n' "$f" "$l" "$n" "$s"
done | sort -n

for off in 190400 194800 196000 197200 197600 198000 200000 205000 213000 215600 313000 315000 317000 319600 320200 320800; do
  echo "--- $off ---"; dd if=$C bs=1 skip=$off count=220 2>/dev/null | tr -c '[:print:]' '.'; echo
done

ls -la node_modules/react-dom/cjs/ | head -20
ls -la node_modules/react/cjs/ | head -20
ls -la node_modules/motion/
du -sk node_modules/motion node_modules/framer-motion node_modules/motion-dom node_modules/motion-utils node_modules/react node_modules/react-dom
ls node_modules/motion/react-m node_modules/motion/mini node_modules/motion/react
node -e "const p=require('./node_modules/motion/package.json');console.log(JSON.stringify(Object.keys(p.exports),null,0))"
grep -rn "motion\.\|useScroll\|useTransform\|useReducedMotion\|whileInView\|whileHover\|whileTap\|drag\|layoutId\|AnimatePresence\|LazyMotion\|cubicBezier" src/ --include=*.tsx --include=*.ts | grep -v "^src/sheet/" | grep -v "^\s*\*"

grep -rn "domAnimation\|domMax" node_modules/framer-motion/dist/es/render/dom/features-*.mjs
cat node_modules/framer-motion/dist/es/render/dom/features-animation.mjs
cat node_modules/framer-motion/dist/es/render/dom/features-max.mjs
cat node_modules/framer-motion/dist/es/motion/features/gestures.mjs
cat node_modules/motion/react-m/package.json

D=node_modules/framer-motion/dist/es
find $D -name '*.mjs' ! -name '*.map' -printf '%s\n' | awk '{s+=$1} END{print s}'
M=node_modules/motion-dom/dist/es
find $M -name '*.mjs' -printf '%s\n' | awk '{s+=$1} END{print s}'
find $M/projection -name '*.mjs' -printf '%s\n' | awk '{s+=$1} END{print s+0}'
```

### 10.9 Delivery

```sh
grep -n "preconnect\|dns-prefetch\|rel=\"prefetch\"\|http-equiv" index.html components.html dist/index.html
node -e "
const f=require('fs');const h=f.readFileSync('dist/index.html','utf8');
const c=[...h.matchAll(/<!--[\s\S]*?-->/g)].map(m=>m[0]);
console.log('total file bytes:',Buffer.byteLength(h));
console.log('comment blocks:',c.length,' bytes:',c.reduce((s,x)=>s+Buffer.byteLength(x),0));
"
for f in dist/index.html dist/components.html; do echo "$f raw=$(stat -c%s $f) gz=$(gzip -c $f | wc -c)"; done
grep -rnoE "https?://[a-zA-Z0-9.-]+" src/ index.html components.html | grep -v "^src/sheet" | sort -u
```

### 10.10 Cleanliness

```sh
git status --porcelain public/
git status --porcelain
```

Both produced **no output** — `public/` is byte-identical to `HEAD` and the entire working tree is
clean apart from this new file under `audit/`. No `npm run images`, no `npm install`, no
`npx vercel`, no `npm run dev`/`preview`/`build`, no network access, no git commits. `.env.local`
was never read or printed.

---

## 11. Handover

**Phase 6 (docs)** should pick up: **P5-4** (README.md:90 is wrong about `/components*`),
**P5-9** (ASSETS.md:116 alpha column), **P5-10** (ASSETS.md:136 KB units), **P5-11**
(index.html:28–30 "byte-identical"), **P5-12** (`og:image` hardcoded origin), and the
`/components.html` second-URL note from §7.4.

**Phase 7 (live)** should pick up: **P5-1** (measure FCP/LCP and how much of it is JS
parse+execute), **P5-3** (read the actual `Cache-Control` on `/assets/*` vs `/artwork/*`),
**P5-4** (confirm `/componentsfoo` really returns 404 and `/nonexistent` returns 200 index.html),
**P5-7** (DevTools Layers panel + Performance trace across the pan, at 1440×900 and 390×844 — the
only way to settle the `will-change` cost), **P5-8** (how long after LCP the cloud layer
completes), **P5-13** (waterfall: does the 655 B stylesheet cost a measurable round trip), and
whether the campus `<img>` looks soft at `scale: 3` (raster-scale question from §4.4).
