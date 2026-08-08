/** Animated "chassi fingerprint" — visual signature of the verification system */
export function ChassisFingerprint({ chassi, size = 120 }: { chassi: string; size?: number }) {
  // Derive deterministic offsets from chassi characters so each chassi gets a unique fingerprint
  const seed = chassi.split("").reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) % 997, 7);
  const offset = (seed % 8) - 4;

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-full bg-primary/5"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-secondary"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const r = 18 + i * 6 + (offset * i) / 10;
          const startAngle = (seed * (i + 1)) % 360;
          const sweep = 220 + ((seed >> i) % 100);
          const endAngle = startAngle + sweep;
          const start = polar(60, 60, r, startAngle);
          const end = polar(60, 60, r, endAngle);
          const largeArc = sweep > 180 ? 1 : 0;
          return (
            <path
              key={i}
              className="fingerprint-path"
              style={{ animationDelay: `${i * 0.08}s` }}
              d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            />
          );
        })}
        <circle cx="60" cy="60" r="3" className="fill-accent stroke-none fingerprint-pulse" />
      </svg>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
