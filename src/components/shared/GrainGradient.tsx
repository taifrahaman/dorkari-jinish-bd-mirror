// src/components/shared/GrainGradient.tsx

type GrainGradientProps = {
  /** Unique id prefix so multiple instances don't collide. */
  id: string;
  /** Starting color (top-left). */
  from?: string;
  /** Ending color (bottom-right). */
  to?: string;
  /** Optional middle color for a 3-stop gradient. */
  mid?: string;
  /** Grain frequency. Higher = finer grain. */
  grainFrequency?: number;
  /** Overall opacity of the whole layer. */
  opacity?: number;
  className?: string;
};

export default function GrainGradient({
  id,
  from = "#0f1a2e",
  to = "#599088",
  mid,
  grainFrequency = 0.65,
  opacity = 1,
  className,
}: GrainGradientProps) {
  const gradientId = `${id}-gradient`;
  const grainId = `${id}-grain`;
  const innerShadowId = `${id}-innershadow`;

  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      fill={`url(#${gradientId})`}
      aria-hidden="true"
    >
      <defs>
        {/* Grain: fractal noise → monochrome → hard-light blend */}
        <filter id={grainId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={grainFrequency}
            stitchTiles="stitch"
            result="colorNoise"
          />
          <feColorMatrix
            in="colorNoise"
            type="matrix"
            values="1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 1 0"
            result="monoNoise"
          />
          <feComposite operator="in" in2="SourceGraphic" result="monoNoise" />
          <feBlend in="SourceGraphic" in2="monoNoise" mode="hard-light" />
        </filter>

        {/* Inner shadow: soft white rim from the top-left */}
        <filter id={innerShadowId}>
          <feFlood floodColor="rgba(255,255,255,0.12)" />
          <feComposite operator="out" in2="SourceGraphic" />
          <feMorphology operator="dilate" radius="0" />
          <feGaussianBlur stdDeviation="12" />
          <feOffset dx="-6" dy="-30" />
          <feComposite operator="atop" in2="SourceGraphic" />
        </filter>

        {/* Linear gradient using brand colors */}
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          {mid && <stop offset="55%" stopColor={mid} />}
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>

      {/* The gradient surface with grain + inner shadow applied */}
      <rect
        width="400"
        height="300"
        fill={`url(#${gradientId})`}
        filter={`url(#${grainId}) url(#${innerShadowId})`}
        opacity={opacity}
      />
    </svg>
  );
}
