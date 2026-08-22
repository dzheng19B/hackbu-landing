# Phase 2 — Source code audit (`src/` minus `src/sheet/`, plus `index.html` and `vite.config.ts`)

Read-only. Nothing outside `audit/` was created or modified.

## Snapshot

The repo changed **during** this phase, twice. `git rev-parse --short HEAD` went
`b7d66f0` (the value in the Phase 1 handoff) → `1126c73` ("audit: phase 1 report") →
**`9a5a72d`** ("Clouds: add six new cutouts across the three depth layers; tidy repo"),
which rewrote the 6-cloud artwork to 12 clouds and touched `ASSETS.md`, `README.md`,
`scripts/generate-images.mjs`, `src/components/Hero.tsx`, `src/components/HeroClouds.tsx`
and `src/sheet/parts/HeroPart.tsx`. **Every line number below was re-verified against the
on-disk file after both moves**, at `HEAD = 9a5a72d` with a clean working tree.

> ⚠️ **For the orchestrator: `audit/01-baseline.md` was deleted by commit `9a5a72d`.**
> `git show --stat 9a5a72d -- audit/` reports `audit/01-baseline.md | 329 ---------` ,
> "1 file changed, 329 deletions(-)". The commit message is about cloud cutouts, so this
> looks like collateral from its "tidy repo" half rather than an intent to drop Phase 1's
> report. It is recoverable with `git show 1126c73:audit/01-baseline.md`. I did not restore
> it — committing and repo-level repair are the orchestrator's, and I only write new files
> under `audit/`.

Checksums of the files the citations depend on, so drift stays detectable:

```
772c9db989ade981b15a4f07399ec463 *src/components/Hero.tsx
0070d98ab11a763524ed7dc38f2487fe *src/components/HeroClouds.tsx
a72dd999be6a9d9b52ab8be373dd63cf *README.md
bf7bd1cbdfeed0061839dc94e668fd63 *index.html
b24bbbf1809bcf6a9d2f2f35b19e2219 *vite.config.ts
842dda960b2d3b123fed4cb067f87675 *src/lib/links.ts
f6b16a6cd3ee566cddd095610ca5e3e4 *src/main.tsx
```

If a checker opens a cited line and the file's md5 no longer matches, the file moved under
both of us — re-grep for the quoted text rather than trusting the number.

---

## 1. Hero invariants — PASS

| Invariant | README rule | Actual | Verdict |
| --- | --- | --- | --- |
| `PAN_START_SCALE` floor | `README.md:125` — "the start scale must stay above `1 / 0.351 ≈ 2.86`" | `3` at `src/components/Hero.tsx:74` | **PASS** (3 ≥ 2.86, 0.14 of headroom) |
| campus `object-position` | `README.md:128` — "(currently `52% 0%`) … leave it at `0%`" | `object-[52%_0%]` at `src/components/Hero.tsx:131`, applied at `src/components/Hero.tsx:209` | **PASS** |
| `transform-origin: top` | `README.md:131` — "together with `transform-origin: top`, is what keeps the framing correct on ultra-wide displays" | `origin-top` at `src/components/Hero.tsx:209` | **PASS** |

Verbatim:

```
$ sed -n '74p;131p;209p' src/components/Hero.tsx
const PAN_START_SCALE = 3
const CAMPUS_OBJECT_POSITION = 'object-[52%_0%]'
                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${

$ sed -n '125p;128p;131p' README.md
  the start scale must stay above `1 / 0.351 ≈ 2.86`. Measure where buildings begin in the new
- **`object-position`** on the campus `<img>` (currently `52% 0%`). The horizontal value
  `transform-origin: top`, is what keeps the framing correct on ultra-wide displays; leave
```

I also confirmed the two arbitrary utilities survive Tailwind's scanner even though they
reach the `className` through template interpolation — if they had not, the hero would
silently lose its pan and its top pin. Both are in the shipped stylesheet:

```
$ grep -oE '[^}]{0,30}object-position:52%[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
.object-\[52\%_0\%\]{object-position:52% 0%}
$ grep -oE '\.origin-top\{[^}]*\}' dist/assets/index-hTiJsblS.css
.origin-top{transform-origin:top}
$ grep -oE '[^}]{0,30}260dvh[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
.h-\[260dvh\]{height:260dvh}
```

## 2. Scroll handling — no listeners, rule holds

`README.md:29` states: "There are no `scroll` event listeners."

```
$ grep -rnE "addEventListener|onScroll|onscroll|window\.scrollY|scrollTop|scrollY|requestAnimationFrame|pageYOffset|IntersectionObserver|getBoundingClientRect" src --include='*.ts' --include='*.tsx' --include='*.css' | grep -v '^src/sheet/'
src/components/Hero.tsx:138:  // hand-rolled `addEventListener('scroll', ...)` anywhere in src/. Everything
src/components/Hero.tsx:140:  const { scrollYProgress: progress } = useScroll({
src/components/HeroClouds.tsx:198: * with `document.hidden`, so `requestAnimationFrame` never fires and motion's
src/components/sections/IntroSection.tsx:28: * restores scroll to it, IntersectionObserver delivers an initial observation
src/components/SiteHeader.tsx:42:    window.addEventListener('keydown', handleKeyDown)
```

Five hits, and none of them is a scroll listener: three are prose inside comments
(`Hero.tsx:138`, `HeroClouds.tsx:198`, `IntroSection.tsx:28`), one is motion's own
`useScroll` (`Hero.tsx:140`), and one is a `keydown` listener with a matching removal
(`SiteHeader.tsx:42`/`:43`). No `onScroll` prop, no `window.scrollY`, no `scrollTop`, no
`requestAnimationFrame` loop. **The README's claim is accurate.**

## 3. TypeScript escape hatches — two, both benign

```
$ grep -rnP '[A-Za-z0-9_\)\]]!(?!=)' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/'
src/main.tsx:28:createRoot(document.getElementById('root')!).render(

$ grep -rnE '(\bany\b|@ts-ignore|@ts-expect-error|as unknown as)' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | grep -vE ':[0-9]+: *(\*|//)'
src/components/sections/IntroSection.tsx:46:            hackathon once a year. You don’t need any programming experience to

$ grep -rnE '\bas\b' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | grep -vE ':[0-9]+: *(\*|//)' | grep -vE '\bas const\b'
src/components/HeroClouds.tsx:130:  /** How far the layer lifts (as a % of stage height) while it fades out. */
src/components/HeroClouds.tsx:780:      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}
src/components/Layout.tsx:66:  as: Tag = 'p',
src/components/Layout.tsx:70:  as?: 'p' | 'h2'
src/components/Reveal.tsx:90:  as = 'div',
src/components/Reveal.tsx:94:  as?: 'div' | 'ul' | 'dl'
src/components/Reveal.tsx:107:  if (as === 'ul') {
src/components/Reveal.tsx:115:  if (as === 'dl') {
src/components/Reveal.tsx:137:  as = 'div',
src/components/Reveal.tsx:141:  as?: 'div' | 'li'
src/components/Reveal.tsx:149:  if (as === 'li') {
src/components/sections/AboutSection.tsx:39:      <RevealGroup as="ul" className="mt-14 grid gap-6 md:grid-cols-2 md:gap-8">
src/components/sections/AboutSection.tsx:42:            as="li"
src/components/sections/QuestionsSection.tsx:41:      <RevealGroup as="dl" className="border-frost mt-12 border-t">
src/components/SiteFooter.tsx:60:      <Eyebrow as="h2">{title}</Eyebrow>
```

Complete inventory, landing code only:

- `any` — **zero.** The single grep hit is the English word "any" in body copy.
- `@ts-ignore` / `@ts-expect-error` / `as unknown as` — **zero.**
- non-null `!` — **one**, `src/main.tsx:28` (P2-5).
- `as` type assertions other than `as const` — **one**, `src/components/HeroClouds.tsx:780` (P2-6). Every other `as` hit is the polymorphic `as` **prop** on `<Eyebrow>` / `<RevealGroup>` / `<RevealItem>`, or the word inside a doc comment.

The non-null assertion does real work: TypeScript 6.0.3 turns `strict` on by default even
when the config never mentions it (verified — see P2-3), so `getElementById` is typed
`HTMLElement | null` here.

---

## Findings

### P2-1 — `low` — `lib/links.ts` re-types three URLs it already exports as constants

**Evidence.** The module's own rule, `src/lib/links.ts:5`:

```
 * reuse these constants rather than re-typing hrefs.
```

but `src/lib/links.ts:10` exports the resources URL and `src/lib/links.ts:18` and
`src/lib/links.ts:25` each re-type the same string literal:

```
$ sed -n '5p;10p;18p;25p;35p' src/lib/links.ts
 * reuse these constants rather than re-typing hrefs.
export const RESOURCES_URL = 'https://hackbu.org/resources'
  { label: 'Resources', href: 'https://hackbu.org/resources' },
  { label: 'Resources', href: 'https://hackbu.org/resources' },
  { label: 'Discord', href: DISCORD_URL },
```

Counted across the file: `https://hackbu.org/resources` appears 3x,
`https://hackbu.org/schedule` 2x, `https://hackbu.org/hackathons` 2x. `SOCIAL_LINKS`
(`:35`) shows the intended pattern — it references `DISCORD_URL` rather than re-typing it —
so the file is internally inconsistent, not uniformly literal.

**Expected.** The file's own docstring (`src/lib/links.ts:5`) and the README's
`links.ts  every off-site URL, centralised` layout note.

**Failure mode.** Changing `RESOURCES_URL` updates the contact section but silently leaves
the header nav and the footer pointing at the old path.

**Fix.** Hoist each repeated path to a `const` and reference it from `NAV_LINKS` /
`SITE_PAGES`, the way `SOCIAL_LINKS` already does.

---

### P2-2 — `low` — `index.html` ships Open Graph image metadata with no `og:title`, `og:type` or `og:url`

**Evidence.**

```
$ grep -nE "og:|twitter:|<title>|name=\"description\"" index.html
53:      name="description"
58:      Social preview. og:image has to be an absolute URL for the scrapers that
63:      Title and description come from <title> and the description above.
66:      property="og:image"
69:    <meta property="og:image:width" content="732" />
70:    <meta property="og:image:height" content="732" />
71:    <meta property="og:image:alt" content="The HackBU bearcat logo" />
72:    <meta name="twitter:card" content="summary" />
74:    <title>HackBU</title>
```

Four `og:` properties are declared (`index.html:66`, `:69`, `:70`, `:71`) and all four are
`og:image*`; the fifth `og:` hit above (`:58`) is prose inside the `<!-- Social preview -->`
comment, not a property. The Open Graph protocol
(ogp.me, "Basic Metadata") names four required properties: `og:title`, `og:type`,
`og:image`, `og:url`. Three of the four are absent.

**Assessment, honestly scoped.** The comment at `index.html:63` is right that Facebook's
scraper falls back to `<title>` and `<meta name="description">` when `og:title`/
`og:description` are missing, so the card is not broken. What is genuinely undeclared is
`og:type` and `og:url` — consumers that do not fall back get no canonical URL for the
share, and `<title>HackBU</title>` (`:74`) is a bare wordmark, which is a weaker card
headline than a purpose-written `og:title` would be.

**No duplicate or contradictory meta tags were found:** `charset` (`:4`), `viewport`
(`:21`) and `description` (`:53`) each appear exactly once, and `twitter:card=summary`
(`:72`) is consistent with the square 732x732 image declared at `:69`/`:70`.

**Fix.** Add `og:title`, `og:type="website"` and `og:url` next to the existing `og:image`
block. (Hand to the docs/SEO phase; this is metadata, not behaviour.)

---

### P2-3 — `low` — `tsconfig.app.json` never declares `"strict"`; strictness is inherited from a TypeScript-version default

**Evidence.** The effective compiler options carry no `strict` key:

```
$ npx --no-install tsc -p tsconfig.app.json --showConfig
{
    "compilerOptions": {
        ...
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "erasableSyntaxOnly": true,
        "noFallthroughCasesInSwitch": true,
        "isolatedModules": true,
        "preserveConstEnums": true
    },
```

Strict checks are nonetheless active, because TypeScript 6 defaults them on. Verified by
running the *same* option set (minus `strict`) over a probe file in the scratchpad:

```
$ npx --no-install tsc -v
Version 6.0.3
$ npx --no-install tsc -p <scratchpad>/tstest/tsconfig.json
t.ts(1,14): error TS2322: Type 'null' is not assignable to type 'string'.
t.ts(2,19): error TS7006: Parameter 'a' implicitly has an 'any' type.
```

(probe file: `export const x: string = null;` / `export function f(a) { return a; }`)

**Expected.** TS handbook, "Strictness": projects should opt in explicitly; `strict` is a
config flag whose default is version-dependent, not a guarantee.

**Failure mode.** `package.json:30` pins `"typescript": "~6.0.2"`, so this is safe today.
Anything that moves the project back to TypeScript 5.x turns `strictNullChecks` and
`noImplicitAny` off *silently* — the build keeps exiting 0 and every null check in the
codebase (including the reason `src/main.tsx:28` needs its `!`) stops being enforced.

**Fix.** Add `"strict": true` to `tsconfig.app.json` and `tsconfig.node.json` so the
intent is written down rather than inherited.

---

### P2-4 — `low` — the skip link's target is not focusable

**Evidence.**

```
$ grep -nE 'href="#main"|<main id="main">' src/App.tsx
29:        href="#main"
37:      <main id="main">
```

`<main id="main">` at `src/App.tsx:37` carries no `tabIndex={-1}`.

**Expected.** WCAG 2.4.1 technique G1 as commonly implemented: the bypass link's target
needs to be able to receive focus, or activating the link moves the scroll position without
moving keyboard focus.

**Assessment.** Impact is partial, not total — Chrome, Firefox and Safari all set the
*sequential focus navigation starting point* on fragment navigation, so Tab continues from
`<main>` in current browsers. It fails on older engines and does not move a screen reader's
virtual cursor. Handing to Phase 4 (a11y), which owns the verdict.

**Fix.** `<main id="main" tabIndex={-1}>`.

---

### P2-5 — `note` — non-null assertion on the React root element

**Evidence.**

```
$ sed -n '28p' src/main.tsx
createRoot(document.getElementById('root')!).render(
```

`#root` is guaranteed by `index.html:77` (`<div id="root"></div>`), so the assertion cannot
fire in this app. It is the stock Vite React-TS template line. Listed because the phase
brief asks for a complete inventory of TS escape hatches, not because it is a defect.

**Fix (optional).** Throw an explicit error if the node is missing, so a future HTML edit
fails loudly instead of at `createRoot`.

**Expected.** No rule is asserted. TypeScript handbook ("Non-null Assertion Operator")
describes `!` as an unchecked assertion; the project's own `tsconfig` strictness (P2-3)
is the only convention in play, and it permits `!`. Inventory item, not a defect.

---

### P2-6 — `note` — `as CSSProperties` assertion to smuggle a CSS custom property

**Evidence.**

```
$ sed -n '780p' src/components/HeroClouds.tsx
      style={{ '--cloud-sets': SET_COUNT } as CSSProperties}
```

**Expected.** React's `CSSProperties` has no index signature for `--*` keys, so this
assertion is the standard workaround; there is no non-assertion spelling.

**Verified safe.** Two things that could have gone wrong here did not:

1. React does **not** append `px` to numeric custom properties — `react-dom` 19.2.8
   routes them through `style.setProperty(styleName, value)` verbatim
   (`node_modules/react-dom/cjs/react-dom-client.development.js:2727`), so the emitted
   value is `4`, not `4px`, and the `calc()` below stays valid.
2. Both derived-width utilities reach the shipped stylesheet:
   ```
   $ grep -oE '[^}]{0,40}var\(--cloud-sets\)[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
   r\(--cloud-sets\)\)\]{width:calc(100% * var(--cloud-sets))}
   r\(--cloud-sets\)\)\]{width:calc(100% / var(--cloud-sets))}
   ```

**Fix.** None needed; a module-level `type CustomProps = CSSProperties & Record<'--cloud-sets', number>` would trade one assertion for one type alias.

---

### P2-7 — `note` — `CloudLayer` builds two scroll-linked motion values the reduced-motion branch never reads

**Evidence.**

```
$ sed -n '720,731p' src/components/HeroClouds.tsx
  const opacity = useTransform(
    progress,
    (p) => layer.opacity * (1 - rangeProgress(p, layer.fadeStart, layer.fadeEnd)),
  )

  /** Scroll-linked lift, over the whole fade. Nearer layers travel further. */
  const y = useTransform(
    progress,
    (p) => `${-layer.rise * rangeProgress(p, 0, layer.fadeEnd)}%`,
  )

  if (reducedMotion) {
```

`opacity` and `y` are created at `:720` and `:726`; the reduced-motion branch returns at
`:731` and consumes neither. They stay subscribed to `progress` and recompute on every
scroll frame for the life of the page.

**Expected.** The Rules of Hooks forbid moving these below the branch, so the code as
written is *correct* — this is the only legal shape for a single component. Nothing is
rendered from them, so `HeroClouds.tsx:732-734`'s claim of "no scroll-linked movement at
all" is true of the output.

**Fix (optional).** Split `CloudLayer` into `DriftingCloudLayer` / `RestingCloudLayer` and
branch at the call site, so the resting build never mounts the transforms.

---

### P2-8 — `note` — `will-change: transform` is applied permanently to seven elements

**Evidence.**

```
$ sed -n '209,211p' src/components/Hero.tsx
                className={`h-full w-full origin-top ${CAMPUS_OBJECT_POSITION} object-cover select-none ${
                  reducedMotion ? '' : 'will-change-transform'
                }`}
$ sed -n '749p;754p' src/components/HeroClouds.tsx
      className="absolute inset-0 will-change-transform"
        className="absolute inset-y-0 left-0 w-[calc(100%*var(--cloud-sets))] will-change-transform"
```

`HeroClouds.tsx:749` and `:754` are inside `CloudLayer`, which renders once per layer for
three layers — six elements — plus the campus `<img>` at `Hero.tsx:210`, for seven
permanently promoted elements.

**Expected.** MDN's `will-change` guidance: it is a last resort, should not be applied to
many elements, and the hint should be removed once the element stops changing.

**Assessment.** Defensible on the six cloud elements — the drift loops are
`repeat: Infinity` and genuinely never stop. Weaker on the campus `<img>`, whose pan is
finished by 0.75 of the track. Cannot demonstrate a dropped frame from a static read, so
it is a `note`; **Phase 6 (perf) should measure the compositor-memory cost** rather than
take this as a finding.

**Fix.** Drop `will-change-transform` from the campus `<img>` once the pan completes
(e.g. swap the class on a `useMotionValueEvent` at progress ≥ 0.75), or leave as-is pending
Phase 6 measurement. Leave the six cloud elements alone.

---

### P2-9 — `note` — the lint config has no exhaustive-deps rule

> **Superseded by P6-11** (`audit/06-docs-hygiene.md`): `npx oxlint --print-config` shows
> `react/exhaustive-deps: "warn"` arriving from the react plugin's `correctness` defaults, so the
> rule *is* enabled. The residual gap is enforcement — see P6-15. Kept for the record; WITHDRAWN.

**Evidence.**

```
$ cat .oxlintrc.json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

`react/rules-of-hooks` is on; nothing checks dependency arrays.

**Expected.** `eslint-plugin-react-hooks` ships `exhaustive-deps` alongside
`rules-of-hooks` as the conventional guardrail for stale closures (React docs, "Rules of
Hooks" → "ESLint plugin"); oxlint's `react` plugin exposes it as `react/exhaustive-deps`.

**Assessment.** No bug follows from it *today* — the landing code has exactly one
`useEffect` and one `useMemo`, and I checked both by hand:

- `src/components/SiteHeader.tsx:33-44`: deps `[menuOpen]`, and `menuOpen` is the only
  outer value the handler reads. Cleanup present at `:43`.
- `src/components/Hero.tsx:159-162`: deps `[progress, reducedMotion]`, which is the exact
  set the memo closes over; `progress` is a stable `MotionValue`.

**Fix.** Enable `"react/exhaustive-deps": "warn"` in `.oxlintrc.json`, or record in the
README a deliberate decision not to.

Listed so a later phase knows the guardrail is absent, not that a rule was violated.

---

## What was checked and found clean

**No stale closures in the `useTransform` callbacks.** `src/components/Hero.tsx:150-152`
closes over `reducedMotion`, and `src/components/HeroClouds.tsx:720-729` closes over
`layer`. This is only safe if motion re-subscribes the transform on every render — it does:
`node_modules/framer-motion/dist/es/value/use-combine-values.mjs` builds a fresh
`updateValue` closure each render and re-subscribes inside a `useIsomorphicLayoutEffect`
with **no dependency array**, so the newest closure always wins. Verified by reading the
installed source (motion 13.1.1).

**`src/lib/motion.ts:38-39`'s claim about `useReducedMotion` is accurate.** It says motion
"reads the media query once at mount and does not re-subscribe". Confirmed:
`node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs` is
`const [shouldReduceMotion] = useState(prefersReducedMotion.current)` — the setter is
discarded, and the upstream file even carries a `TODO See if people miss automatically
updating shouldReduceMotion setting`. So a mid-session OS change really does take effect on
next load, exactly as documented.

**No hooks-order hazards.** Every hook call in every landing component sits above any
conditional return. The one component with an early return (`CloudLayer`,
`src/components/HeroClouds.tsx:731`) calls all three of its hooks first.

**Effects and cleanup.** One effect in the whole landing tree
(`src/components/SiteHeader.tsx:33`), with a matching `removeEventListener` at `:43`.

**No dead exports.** All 46 exported symbols outside `src/sheet/` are imported somewhere.
Every one is used by the landing tree itself, so there are no sheet-only exports to flag.
`CAMPUS_SIZES`, `BEARCAT_MARK` and `WORDMARK_MARK` are the only three the sheet does *not*
also import; all three are consumed by `Hero.tsx` / `Wordmark.tsx`.

**No raw off-site anchors.** Exactly two `<a>` elements exist in landing source, both
inside `ExternalLink.tsx`:

```
$ grep -rn '<a ' --include='*.tsx' src | grep -v '^src/sheet/'
src/components/ExternalLink.tsx:52:    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
src/components/ExternalLink.tsx:67:    <a {...rest} href={`mailto:${email}`}>
```

Every other `href=` in the tree either goes through `ExternalLink`/`ButtonLink`/`MailLink`
or is a same-page fragment (`#main` at `App.tsx:29`, `#top` at `SiteHeader.tsx:50`). The
spread order at `:52` is hardened correctly: `{...rest}` comes *first*, so a caller cannot
override `href`, `target` or `rel`. Same at `:67` for `MailLink`.

**`src/lib/links.ts` URLs are well-formed.** All 19 literals, printed between markers so
whitespace is visible:

```
$ grep -oE "'[^']*'" src/lib/links.ts | grep -E "https?:|@" | sed 's/^/[/;s/$/]/'
['https://discord.gg/Xka5uUh']
['hello@hackbu.org']
['https://hackbu.org/resources']
['https://hackbu.org/mailing-list']
['https://hackbu.org/schedule']
['https://hackbu.org/resources']
['https://hackbu.org/hackathons']
['https://hackbu.org/schedule']
['https://hackbu.org/resources']
['https://hackbu.org/hackathons']
['https://hackbu.org/registration']
['https://hackbu.org/blog']
['https://hackbu.org/photos']
['https://hackbu.org/organizers']
['https://hackbu.org/sponsors']
['https://github.com/HackBinghamton/HackBU']
['https://www.linkedin.com/groups/8427110']
['https://www.facebook.com/HackBinghamton']
['https://twitter.com/HackBinghamton']
```

Every URL carries an explicit `https:` scheme, none has leading or trailing whitespace
inside the quotes, and `hello@hackbu.org` is a valid addr-spec composed into `mailto:` at
`ExternalLink.tsx:67`. Only remaining note is the duplication in P2-1.
(`https://twitter.com/HackBinghamton` still resolves via redirect; whether to update it to
`x.com` is a content call for the docs phase, not a defect.)

**No duplicate DOM ids.** `main`, `top`, `primary-menu`, the five section ids
(`intro`, `about`, `get-involved`, `questions`, `contact`) and the five heading ids
(`*-title`) are each declared once, and every `aria-labelledby` has a matching heading id.

**`vite.config.ts` matches the README's build description.** README (component-sheet
section) says two entry points declared in `vite.config.ts` with the sheet excluded from
the landing bundle. `vite.config.ts:24-27` declares `index` and `components`;
`components.html` exists at the repo root. The landing/sheet CSS split that
`src/landing.css:20-22` promises also holds in the built output — `dist/index.html` pulls
`SiteFooter-DgSLZxXM.css` (655 bytes, `@font-face` declarations only) and
`index-hTiJsblS.css` (17,502 bytes), and the sheet-only utilities appear in the sheet's
stylesheet and not the landing one (`grid-cols-5`: 0 hits in `index-*.css`, 1 in
`components-*.css`). The dead `.transition` rule that `src/index.css:10` blocklists is also
genuinely absent from `index-*.css`.

**Preload / srcset agreement (Phase 5 owns; noted because I saw it).** `index.html:44-50`
carries widths `640, 960, 1280, 1672` and `imagesizes` `(min-aspect-ratio: 1672/941) 100vw,
177.68vh`; `src/lib/images.ts:25` has the same four widths and `:57` the same sizes string.
Two of the three copies agree. I did not check `scripts/generate-images.mjs` — Phase 5's.
The `href`-less preload at `index.html:39-51` is valid HTML: with an `imagesrcset`
containing only `w` descriptors, `href` may be omitted.

**Cloud artwork derivatives all exist.** `HeroClouds` now references `cloud-1..12`, and all
36 files (`.png`/`.webp`/`.avif` × 12) are present under `public/artwork/clouds/`. Worth
stating because `<picture>` does *not* fall back on a 404 — a missing `.avif` would have
rendered as a broken image rather than degrading to PNG. Checked because the 6→12 artwork
change landed mid-phase.

**Animated properties.** Only `transform` (`scale`, `x`, `y`) and `opacity` are animated,
matching the README's animation convention. No animated `top`/`left`/`width`/`height`/
`background-position` anywhere in landing source.

**Semantics of the polymorphic reveal wrappers.** `RevealGroup as="ul"` +
`RevealItem as="li"` (`AboutSection.tsx:39`/`:42`) and `RevealGroup as="dl"` +
`RevealItem` default `div` wrapping `<dt>`/`<dd>` (`QuestionsSection.tsx:41-51`) are both
valid — HTML explicitly permits a `<div>` grouping wrapper inside `<dl>`.

---

## Coverage table

24 files: the 22 under `src/` excluding `src/sheet/`, plus `index.html` and
`vite.config.ts`. (`find src -type f -not -path 'src/sheet/*' | wc -l` → `22`.)

| # | File | Read | Result |
| --- | --- | --- | --- |
| 1 | `src/App.tsx` | full (75 lines) | Skip link, landmark order, divider variants. Ids unique, `<main>` present. **P2-4** (skip-link target not focusable, `:29`/`:37`). |
| 2 | `src/main.tsx` | full (32 lines) | Three font imports, `landing.css` root, `StrictMode`. **P2-5** (non-null `!` at `:28`). |
| 3 | `src/index.css` | full (178 lines) | `@theme` tokens, type scale, `.brand-mark-*` masks, `@source not inline("transition")` (verified effective in `dist`). Nothing. (`--color-horizon` is defined and unused, but the README already documents that and it is Phase 3's call.) |
| 4 | `src/landing.css` | full (22 lines) | `@import './index.css'` + `@source not "./sheet"`. Verified against built CSS: the exclusion works. Nothing. |
| 5 | `src/lib/images.ts` | full (94 lines) | Srcset/sizes/alt constants, brand ink boxes, `cloudSources()`. All exports used. Nothing. |
| 6 | `src/lib/links.ts` | full (40 lines) | All 19 URLs well-formed, no whitespace, all `https:`. **P2-1** (three URLs re-typed instead of referencing the exported constant). |
| 7 | `src/lib/motion.ts` | full (118 lines) | `usePrefersReducedMotion`, `rangeProgress`/`clamp01`, `HeroScrollContext`, `useHeroScroll` throw-guard. The `:38-39` claim about motion's media-query behaviour verified accurate against installed source. Nothing. |
| 8 | `src/components/Hero.tsx` | full (225 lines) | Hero invariants **PASS** (`:74`, `:131`, `:209`). One `useScroll`, two `useTransform`, one `useMemo` with correct deps (`:159`). No stale closure. **P2-8** (permanent `will-change`, `:210`). |
| 9 | `src/components/HeroClouds.tsx` | full (787 lines) | Loop geometry (`measureTileOverhang` → `SET_COUNT`) re-derived and correct: the vw term is the true worst case over all viewport widths, crossover at `REFERENCE_WIDTH / SHRINK_BELOW` = 720px, as the comment claims. Hooks ordered above the early return. **P2-6** (`:780`), **P2-7** (`:720`/`:726` unused on the resting branch), **P2-8** (`:749`/`:754`). |
| 10 | `src/components/Layout.tsx` | full (106 lines) | `Container`/`Section`/`Eyebrow`/`SectionHeader`. Polymorphic `as` is a union, not a generic — no unsound spread. Nothing. |
| 11 | `src/components/Reveal.tsx` | full (162 lines) | `Reveal`/`RevealGroup`/`RevealItem`; reduced-motion branch drops motion props entirely so the element paints at rest on frame 1 — matches the README's animation rule. Nothing. |
| 12 | `src/components/SiteHeader.tsx` | full (144 lines) | The tree's only `useEffect` (`:33-44`) — correct deps, cleanup at `:43`. Panel stays mounted with `hidden`, so `aria-controls` resolves and closed links leave the tab order. Nothing. |
| 13 | `src/components/SiteFooter.tsx` | full (72 lines) | Frost-surface link treatment, `SITE_PAGES` split 4/4, `new Date().getFullYear()` (`:43`) — safe, no SSR hydration to mismatch. Nothing. |
| 14 | `src/components/SnowdriftDivider.tsx` | full (99 lines) | Four variants, `Record<DriftVariant, Shape>` so no missing key is possible. `aria-hidden` on the wrapper. Nothing. |
| 15 | `src/components/ButtonLink.tsx` | full (61 lines) | Single treatment, three sizes, delegates to `ExternalLink`. `{...rest}` is only `onClick`. Nothing. |
| 16 | `src/components/ExternalLink.tsx` | full (71 lines) | `LINK_ON_CLOUD` / `LINK_ON_FROST` are the only two link treatments and both are used; spread order hardened at `:52` and `:67`. Nothing. |
| 17 | `src/components/Wordmark.tsx` | full (61 lines) | Masked spans, `aspect-ratio` from `BEARCAT_MARK`/`WORDMARK_MARK`, `role="img"` + label. Nothing. |
| 18 | `src/components/sections/IntroSection.tsx` | full (61 lines) | Page's only `<h1>` (`:38`), first heading in the document. Nothing. |
| 19 | `src/components/sections/AboutSection.tsx` | full (57 lines) | `ul`/`li` reveal group; `PILLARS` `as const`. Nothing. |
| 20 | `src/components/sections/GetInvolvedSection.tsx` | full (70 lines) | Frost card, so the mailing-list link correctly takes `LINK_ON_FROST` (`:60`). Only use of `Reveal delay`. Nothing. |
| 21 | `src/components/sections/QuestionsSection.tsx` | full (56 lines) | `dl` group with `div`-wrapped `dt`/`dd` — valid HTML. Nothing. |
| 22 | `src/components/sections/ContactSection.tsx` | full (55 lines) | Cloud surface, so `LINK_ON_CLOUD` (`:9`); `MailLink` renders the address as its own label. Nothing. |
| 23 | `index.html` | full (80 lines) | No duplicate/contradictory meta tags; `href`-less preload is valid. **P2-2** (`og:title`/`og:type`/`og:url` absent, `:65-72`). |
| 24 | `vite.config.ts` | full (30 lines) | Two entry points (`:24-27`), `outDir: 'dist'`; consistent with the README. Nothing. |

---

## Commands run

Working directory `C:\Users\danz3\Downloads\HackBUNew` throughout; `LC_ALL=C.UTF-8` was
exported before the `-P` greps (Git Bash refuses PCRE under the default locale).

**1. Inventory**

```
$ find src -type f | sort
(29 paths: the 22 in scope plus 7 under src/sheet/)
$ find src -type f -not -path 'src/sheet/*' | wc -l
22
$ wc -l index.html vite.config.ts README.md
  80 index.html
  30 vite.config.ts
 242 README.md
```

**2. Scroll listeners** — full output in §2 above.

```
$ grep -rnE "addEventListener|onScroll|onscroll|window\.scrollY|scrollTop|scrollY|requestAnimationFrame|pageYOffset|IntersectionObserver|getBoundingClientRect" src --include='*.ts' --include='*.tsx' --include='*.css' | grep -v '^src/sheet/'
→ 5 hits, none a scroll listener (3 comments, 1 useScroll, 1 keydown)
```

**3. TS escape hatches** — full output in §3 above.

```
$ grep -rnP '[A-Za-z0-9_\)\]]!(?!=)' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/'
→ 1 hit: src/main.tsx:28
$ grep -rnE '(\bany\b|@ts-ignore|@ts-expect-error|as unknown as)' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | grep -vE ':[0-9]+: *(\*|//)'
→ 1 hit, prose only: src/components/sections/IntroSection.tsx:46
$ grep -rnE '\bas\b' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | grep -vE ':[0-9]+: *(\*|//)' | grep -vE '\bas const\b'
→ 15 hits: 1 real assertion (HeroClouds.tsx:780), 13 `as` props, 1 comment
```

**4. Anchors and URLs**

```
$ grep -rn '<a ' --include='*.tsx' src | grep -v '^src/sheet/'
src/components/ExternalLink.tsx:52:    <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
src/components/ExternalLink.tsx:67:    <a {...rest} href={`mailto:${email}`}>

$ grep -rnE "(https?:|mailto:)" --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | grep -v '^src/lib/links.ts'
src/components/ExternalLink.tsx:47: * hardening can never be forgotten. mailto: links use MailLink instead — a
src/components/ExternalLink.tsx:67:    <a {...rest} href={`mailto:${email}`}>
(no hard-coded off-site URL anywhere outside lib/links.ts)

$ grep -oE "https?://[^']+" src/lib/links.ts | sort | uniq -c | sort -rn
      3 https://hackbu.org/resources
      2 https://hackbu.org/schedule
      2 https://hackbu.org/hackathons
      1 https://www.linkedin.com/groups/8427110
      1 https://www.facebook.com/HackBinghamton
      1 https://twitter.com/HackBinghamton
      1 https://hackbu.org/sponsors
      1 https://hackbu.org/registration
      1 https://hackbu.org/photos
      1 https://hackbu.org/organizers
      1 https://hackbu.org/mailing-list
      1 https://hackbu.org/blog
      1 https://github.com/HackBinghamton/HackBU
      1 https://discord.gg/Xka5uUh

$ grep -nP '[^\x20-\x7e\t]' src/lib/links.ts
4: * These are the canonical live URLs taken from hackbu.org — later phases should
(one em dash, in a comment; no control characters in any literal)
```

**5. Export usage** — a shell loop over the 38 shared/library symbols, checking each
against `grep -rlw <name>` over `src/` (excluding the defining file) and separately over
`src/sheet/`. Every symbol had at least one landing-tree importer; the summary is in "What
was checked and found clean". The remaining 8 exports are the page-composition components
`App` (default), the five `*Section`s, `SiteFooter` and `SiteHeader`, all imported by
`src/App.tsx:1-9` and `src/main.tsx:26`. Exports enumerated with:

```
$ grep -rnE '^export ' --include='*.ts' --include='*.tsx' src | grep -v '^src/sheet/' | wc -l
46
```

**6. Duplicate ids**

```
$ grep -rnoE 'id="[^"]+"|id=\{[^}]+\}|titleId="[^"]+"|labelledBy="[^"]+"' --include='*.tsx' src index.html | grep -v '^src/sheet/'
→ 20 lines, all unique after resolving Layout.tsx's id={id} / id={titleId} pass-throughs
```

**7. Built-output cross-checks** (reading `dist/` from the Phase 1 build; no build was run)

```
$ grep -oE '(href|src)="/assets/[^"]+"' dist/index.html
src="/assets/index-9cS8iK_z.js"
href="/assets/SiteFooter-D2vbYzEP.js"
href="/assets/SiteFooter-DgSLZxXM.css"
href="/assets/index-hTiJsblS.css"

$ ls -l dist/assets/*.css | awk '{print $5, $9}'
655 dist/assets/SiteFooter-DgSLZxXM.css
20781 dist/assets/components-V_S1l_xU.css
17502 dist/assets/index-hTiJsblS.css

$ head -c 300 dist/assets/SiteFooter-DgSLZxXM.css
@font-face{font-family:Fraunces;font-style:normal;font-display:swap;font-weight:600;src:url(...)}...
(the shared CSS chunk is @font-face only — no sheet utilities leak to the landing page)

$ grep -c 'grid-cols-5' dist/assets/index-hTiJsblS.css ; grep -c 'grid-cols-5' dist/assets/components-V_S1l_xU.css
0
1

$ grep -oE '(^|})\.transition\{[^}]*\}' dist/assets/index-hTiJsblS.css
(no output — the blocklisted dead rule is absent)

$ grep -oE '\.origin-top\{[^}]*\}' dist/assets/index-hTiJsblS.css
.origin-top{transform-origin:top}
$ grep -oE '[^}]{0,30}object-position:52%[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
.object-\[52\%_0\%\]{object-position:52% 0%}
$ grep -oE '[^}]{0,30}260dvh[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
.h-\[260dvh\]{height:260dvh}
$ grep -oE '[^}]{0,40}var\(--cloud-sets\)[^}]{0,20}\}' dist/assets/index-hTiJsblS.css
r\(--cloud-sets\)\)\]{width:calc(100% * var(--cloud-sets))}
r\(--cloud-sets\)\)\]{width:calc(100% / var(--cloud-sets))}
```

**8. Library-behaviour verification** (reading `node_modules/`, no install)

```
$ node -e "console.log(require('./node_modules/motion/package.json').version)"
13.1.1
$ node -e "console.log(require('./node_modules/react-dom/package.json').version, require('./node_modules/react/package.json').version)"
19.2.8 19.2.8
$ cat node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs
→ const [shouldReduceMotion] = useState(prefersReducedMotion.current)   (no setter; never re-renders)
$ cat node_modules/framer-motion/dist/es/value/use-combine-values.mjs
→ useIsomorphicLayoutEffect(...) with NO dependency array  ⇒ transform closures are re-subscribed every render
$ sed -n '2710,2740p' node_modules/react-dom/cjs/react-dom-client.development.js
→ isCustomProperty ? style.setProperty(styleName, value) : ... value + "px"
   (custom properties never get a px suffix)
```

**9. TypeScript strictness probe** (probe files written to the session scratchpad, not the repo)

```
$ npx --no-install tsc -v
Version 6.0.3
$ npx --no-install tsc -p tsconfig.app.json --showConfig
→ no "strict" key in the effective options
$ npx --no-install tsc -p <scratchpad>/tstest/tsconfig.json     # same options, minus strict
t.ts(1,14): error TS2322: Type 'null' is not assignable to type 'string'.
t.ts(2,19): error TS7006: Parameter 'a' implicitly has an 'any' type.
→ TypeScript 6 defaults strict on; the project is strict by inheritance, not declaration
```

**10. Artwork existence** (no `npm run images` was run)

```
$ ls -1 public/artwork/clouds/ | wc -l
36
$ for n in $(grep -oE "cloud-[0-9]+" src/components/HeroClouds.tsx | sort -u); do for ext in png webp avif; do [ -f "public/artwork/clouds/$n.$ext" ] && echo "$n.$ext OK" || echo "$n.$ext MISSING"; done; done
→ 36 × OK, 0 × MISSING
```

**11. Drift bookkeeping**

Mid-phase, with the 12-cloud change still uncommitted:

```
$ git rev-parse --short HEAD
1126c73
$ git status --porcelain src README.md index.html vite.config.ts
 M README.md
 M src/components/Hero.tsx
 M src/components/HeroClouds.tsx
 M src/sheet/parts/HeroPart.tsx
$ git diff --stat
 ASSETS.md                     |  80 +++++++++----
 README.md                     |  15 ++-
 scripts/generate-images.mjs   |  16 ++-
 src/components/Hero.tsx       |   2 +-
 src/components/HeroClouds.tsx | 271 ++++++++++++++++++++++++++++++++----------
 src/sheet/parts/HeroPart.tsx  |  49 +++++---
 6 files changed, 320 insertions(+), 113 deletions(-)
```

End of phase, after that work was committed:

```
$ git log --oneline -3
9a5a72d Clouds: add six new cutouts across the three depth layers; tidy repo
1126c73 audit: phase 1 report
b7d66f0 Clouds: slow all layers 1.5x by raising the drift anchor to 90s

$ git show --stat 9a5a72d -- audit/
 audit/01-baseline.md | 329 ---------------------------------------------------
 1 file changed, 329 deletions(-)

$ git status --porcelain
?? audit/
```

The only working-tree entry at the end of this phase is the untracked `audit/` directory
containing this report. `audit/` shows as wholly untracked because `9a5a72d` deleted the
one file it had tracked (see the warning at the top). `src/components/HeroClouds.tsx`'s md5
changed across the commit purely from LF→CRLF normalisation — the file is still 787 lines
and every cited line re-verified byte-for-byte afterwards.

No command in this phase wrote to any path outside `audit/` or the session scratchpad.
