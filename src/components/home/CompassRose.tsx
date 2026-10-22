// Decorative compass in the corner of the home map (purely visual — hidden from screen readers).
export function CompassRose() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="size-24 text-white/80 drop-shadow-lg">
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <polygon points="50,12 56,50 50,88 44,50" fill="currentColor" />
      <polygon points="12,50 50,44 88,50 50,56" fill="currentColor" opacity="0.7" />
      <circle cx="50" cy="50" r="4" fill="#fbbf24" />
      <text x="50" y="8" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
        N
      </text>
      <text x="50" y="99" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
        S
      </text>
      <text x="96" y="53" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
        E
      </text>
      <text x="4" y="53" textAnchor="middle" fontSize="9" fontWeight="700" fill="currentColor">
        W
      </text>
    </svg>
  );
}
