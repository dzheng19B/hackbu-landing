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
