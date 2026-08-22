/**
 * Snowdrift section dividers — inline SVG, asymmetric hand-placed beziers.
 *
 * Each divider is a band whose background is the colour of the section ABOVE
 * it, with drift shapes painted in the colour of the section BELOW. The
 * `drift-*` variants leave a frost ribbon showing between two cloud shapes, so
 * the boundary reads as a bank of settled snow rather than a rule.
 *
 * Nothing here is symmetric and no edge is straight — that is the point. Add a
 * new variant rather than reusing one twice in a row.
 */

type DriftVariant =
  | 'sky-to-cloud'
  | 'drift-a'
  | 'drift-b'
  | 'drift-c'
  | 'cloud-to-frost'

type Shape = {
  /** Band background = the colour of the section above. */
  background: string
  paths: { d: string; className: string }[]
}

const SHAPES: Record<DriftVariant, Shape> = {
  /*
   * A sky-backed band settling into cloud. Currently unrendered: it was the
   * divider under the hero until Phase 7, when the hero lost its copy and the
   * boundary was re-read against the *finished* pan — whose bottom edge is the
   * snowy plaza, not sky — and moved to `drift-c`. Kept as the one variant that
   * fits a sky section above a cloud one, should the page grow one.
   */
  'sky-to-cloud': {
    background: 'bg-sky',
    paths: [
      {
        className: 'fill-frost',
        d: 'M0,160 V96 C130,74 250,58 400,66 C560,74 640,110 810,108 C950,106 1050,72 1200,64 C1300,59 1370,72 1440,84 V160 Z',
      },
      {
        className: 'fill-cloud',
        d: 'M0,160 V126 C140,106 260,94 410,100 C570,106 660,136 830,132 C970,129 1060,104 1210,100 C1320,97 1380,110 1440,120 V160 Z',
      },
    ],
  },

  // cloud -> cloud, with a frost drift banked between them.
  'drift-a': {
    background: 'bg-frost',
    paths: [
      {
        className: 'fill-cloud',
        d: 'M0,0 H1440 V28 C1320,52 1210,20 1060,34 C900,49 820,66 660,58 C520,51 430,26 300,30 C190,33 90,48 0,40 Z',
      },
      {
        className: 'fill-cloud',
        d: 'M0,160 V138 C110,120 200,104 340,110 C470,116 560,140 700,136 C840,132 930,100 1080,98 C1210,96 1330,118 1440,112 V160 Z',
      },
    ],
  },
  'drift-b': {
    background: 'bg-frost',
    paths: [
      {
        className: 'fill-cloud',
        d: 'M0,0 H1440 V44 C1310,22 1180,52 1030,60 C880,68 780,40 620,38 C480,36 380,60 250,56 C160,53 80,34 0,22 Z',
      },
      {
        className: 'fill-cloud',
        d: 'M0,160 V116 C120,136 210,142 350,132 C490,122 590,98 760,104 C900,109 990,132 1130,128 C1250,125 1350,106 1440,96 V160 Z',
      },
    ],
  },
  'drift-c': {
    background: 'bg-frost',
    paths: [
      {
        className: 'fill-cloud',
        d: 'M0,0 H1440 V20 C1350,44 1240,62 1090,56 C930,50 850,22 690,26 C550,29 470,58 320,62 C210,65 100,50 0,32 Z',
      },
      {
        className: 'fill-cloud',
        d: 'M0,160 V130 C130,112 240,98 390,102 C540,106 620,132 780,130 C920,128 1010,104 1160,100 C1280,97 1360,110 1440,124 V160 Z',
      },
    ],
  },

  // Last content section (cloud) settling into the footer (frost).
  'cloud-to-frost': {
    background: 'bg-cloud',
    paths: [
      {
        className: 'fill-frost',
        d: 'M0,160 V112 C120,92 230,76 380,84 C540,92 620,126 800,124 C940,122 1040,90 1190,86 C1300,83 1370,98 1440,110 V160 Z',
      },
    ],
  },
}

export function SnowdriftDivider({ variant }: { variant: DriftVariant }) {
  const shape = SHAPES[variant]

  return (
    <div
      aria-hidden="true"
      className={`${shape.background} h-24 w-full sm:h-40`}
    >
      <svg
        viewBox="0 0 1440 160"
        preserveAspectRatio="none"
        focusable="false"
        className="block h-full w-full"
      >
        {shape.paths.map((path) => (
          <path key={path.d} d={path.d} className={path.className} />
        ))}
      </svg>
    </div>
  )
}
