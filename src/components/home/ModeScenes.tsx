// Small landscape illustrations drawn in code (SVG), one per game-mode card, in the spirit of the
// reference design: a full little picture (sky, background, foreground, subject) on the right
// side of the card. The card fades them in from the left. Purely decorative (aria-hidden).
// Gradient ids are unique per scene because each scene appears once on the page.

type SceneProps = { className?: string };

const SVG_PROPS = {
  viewBox: "0 0 200 100",
  // Fill the whole box (crop if needed), keeping the bottom-right corner — where the subject is.
  preserveAspectRatio: "xMaxYMax slice",
  "aria-hidden": true,
} as const;

function Pine({ x, y, h, fill = "#14532d" }: { x: number; y: number; h: number; fill?: string }) {
  return <path d={`M${x} ${y - h} L${x + h * 0.38} ${y} L${x - h * 0.38} ${y} Z`} fill={fill} />;
}

// Singleplayer — mountains, a lake and pine forest (explore the world).
export function ExploreScene({ className }: SceneProps) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <defs>
        <linearGradient id="sky-explore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
        <linearGradient id="lake-explore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#sky-explore)" />
      <path d="M40 72 L90 22 L120 50 L150 18 L200 62 V100 H40 Z" fill="#6b8fc7" />
      <path d="M80 32 L90 22 L100 32 L94 30 L90 35 L86 30 Z M140 28 L150 18 L160 28 L154 26 L150 31 L146 26 Z" fill="#f8fafc" />
      <path d="M30 80 Q100 58 200 74 V100 H30 Z" fill="#15803d" />
      <ellipse cx="128" cy="90" rx="62" ry="10" fill="url(#lake-explore)" />
      <Pine x={52} y={84} h={22} />
      <Pine x={64} y={86} h={16} />
      <Pine x={186} y={84} h={24} />
      <Pine x={196} y={88} h={18} />
    </svg>
  );
}

// Ranked — an arena at sunset.
export function ArenaScene({ className }: SceneProps) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <defs>
        <linearGradient id="sky-arena" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#fdba74" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#sky-arena)" />
      <circle cx="80" cy="64" r="14" fill="#fde68a" opacity="0.8" />
      <path d="M86 100 V44 Q140 26 200 40 V100 Z" fill="#d6a274" />
      <path d="M86 58 Q140 42 200 54" stroke="#9a5b33" strokeWidth="2" fill="none" />
      <path d="M86 76 Q140 62 200 72" stroke="#9a5b33" strokeWidth="2" fill="none" />
      {[96, 112, 128, 144, 160, 176, 192].map((x, i) => (
        <g key={x} fill="#7c3f1d" opacity="0.75">
          <rect x={x} y={56 - i * 1.2} width="9" height="11" rx="4.5" />
          <rect x={x} y={76 - i * 1} width="9" height="13" rx="4.5" />
        </g>
      ))}
      <path d="M40 100 Q120 88 200 96 V100 Z" fill="#6b3f2a" />
      <Pine x={60} y={98} h={34} fill="#3f3a2e" />
      <Pine x={72} y={98} h={26} fill="#3f3a2e" />
    </svg>
  );
}

// Unranked — a stormy night over a city skyline.
export function StormScene({ className }: SceneProps) {
  return (
    <svg {...SVG_PROPS} className={className}>
      <defs>
        <linearGradient id="sky-storm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4338ca" />
          <stop offset="1" stopColor="#a5b4fc" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#sky-storm)" />
      <ellipse cx="150" cy="18" rx="40" ry="12" fill="#e0e7ff" opacity="0.7" />
      <ellipse cx="110" cy="24" rx="26" ry="9" fill="#e0e7ff" opacity="0.55" />
      <path d="M150 28 L138 54 L150 54 L142 78 L166 46 L154 46 L162 28 Z" fill="#fde047" />
      <path
        d="M50 100 V78 H62 V70 H74 V82 H86 V64 H100 V80 H112 V72 H126 V86 H140 V68 H156 V78 H170 V60 H184 V76 H200 V100 Z"
        fill="#1e1b4b"
      />
    </svg>
  );
}

// Party — a sunny seaside village.
export function VillageScene({ className }: SceneProps) {
  const house = (x: number, w: number, h: number, wall: string, roof: string) => (
    <g key={x}>
      <rect x={x} y={84 - h} width={w} height={h} fill={wall} />
      <path d={`M${x - 3} ${84 - h} L${x + w / 2} ${72 - h} L${x + w + 3} ${84 - h} Z`} fill={roof} />
      <rect x={x + w / 2 - 3} y={74} width="6" height="10" fill="#365314" opacity="0.7" />
    </g>
  );
  return (
    <svg {...SVG_PROPS} className={className}>
      <defs>
        <linearGradient id="sky-village" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#ecfeff" />
        </linearGradient>
      </defs>
      <rect width="200" height="100" fill="url(#sky-village)" />
      <path d="M40 70 Q100 40 200 52 V100 H40 Z" fill="#4d7c0f" />
      {house(92, 22, 22, "#fef3c7", "#c2410c")}
      {house(120, 20, 32, "#fde68a", "#9a3412")}
      {house(146, 24, 20, "#fffbeb", "#b91c1c")}
      <path d="M182 84 Q184 62 190 52" stroke="#3f2d1a" strokeWidth="3" fill="none" />
      <path d="M190 52 Q178 48 172 56 M190 52 Q200 44 204 54 M190 52 Q192 40 182 38" stroke="#166534" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M40 84 H200 V100 H40 Z" fill="#22d3ee" />
      <path d="M40 84 H200" stroke="#f0fdfa" strokeWidth="2" opacity="0.7" />
    </svg>
  );
}
