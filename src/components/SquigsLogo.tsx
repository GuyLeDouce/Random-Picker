interface SquigsLogoProps {
  compact?: boolean;
}

export function SquigsLogo({ compact = false }: SquigsLogoProps) {
  return (
    <div className={`squigs-logo ${compact ? 'compact' : ''}`} aria-label="Squigs logo">
      <svg viewBox="0 0 920 320" role="img" aria-hidden="true">
        <path
          className="squigs-burst"
          d="M247 24 368 119 493 28 506 142 683 80 613 204 749 252 582 249 523 309 477 224 370 305 319 223 182 261 256 182 111 135 273 141Z"
        />
        <g className="squigs-wordmark">
          <text x="455" y="212" textAnchor="middle">
            SQUIGS
          </text>
          <text x="455" y="212" textAnchor="middle" className="fill">
            SQUIGS
          </text>
        </g>
      </svg>
    </div>
  );
}
