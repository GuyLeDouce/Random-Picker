import squigsReloadedLogo from '../assets/squigs-reloaded-logo.png';

interface SquigsLogoProps {
  compact?: boolean;
}

export function SquigsLogo({ compact = false }: SquigsLogoProps) {
  return (
    <img
      className={`squigs-logo ${compact ? 'compact' : ''}`}
      src={squigsReloadedLogo}
      alt="Squigs Reloaded logo"
    />
  );
}
