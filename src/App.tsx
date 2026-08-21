/**
 * Phase 1 placeholder.
 *
 * The only job of this component right now is to prove the toolchain is wired:
 * Tailwind v4 tokens resolve, and both font families are loaded and distinct.
 * Page content, the hero pan, and all real sections land in later phases.
 */
export default function App() {
  return (
    <main className="min-h-screen bg-cloud font-sans text-pine">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium tracking-[0.2em] text-haze uppercase">
            Phase 1 scaffold
          </p>
          <h1 className="font-display text-5xl leading-tight text-pine">
            HackBU
          </h1>
        </header>

        {/* Tailwind verification target: bg-sky + text-pine */}
        <div
          data-testid="tailwind-check"
          className="bg-sky text-pine rounded-lg p-6"
        >
          <p className="font-display text-2xl">Fraunces — display serif</p>
          <p className="font-sans text-base">Inter — body sans</p>
          <p className="mt-2 font-mono text-xs">
            bg-sky #4A96D2 · text-pine #3C5C48
          </p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ['sky', 'bg-sky'],
              ['horizon', 'bg-horizon'],
              ['cloud', 'bg-cloud'],
              ['frost', 'bg-frost'],
              ['brick', 'bg-brick'],
              ['stone', 'bg-stone'],
              ['pine', 'bg-pine'],
              ['haze', 'bg-haze'],
            ] as const
          ).map(([name, cls]) => (
            <li
              key={name}
              className="border-frost overflow-hidden rounded-md border"
            >
              <div className={`h-12 ${cls}`} />
              <span className="text-pine block px-2 py-1 text-xs">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
