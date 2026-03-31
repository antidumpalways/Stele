interface SteleLogoMarkProps {
  size?: number;
  className?: string;
}

export function SteleLogoMark({ size = 32, className = "" }: SteleLogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="STELE logo"
    >
      {/* Stone tablet base — represents permanence and the ancient stele */}
      <rect x="4" y="1" width="24" height="30" rx="3" fill="hsl(38,80%,55%)" />

      {/* Subtle inner shadow / depth line at top */}
      <rect x="4" y="1" width="24" height="3" rx="3" fill="hsl(38,60%,42%)" />

      {/* Three inscription lines — text carved into stone */}
      <rect x="9" y="9" width="14" height="2.2" rx="1" fill="hsl(220,15%,10%)" />
      <rect x="9" y="14" width="14" height="2.2" rx="1" fill="hsl(220,15%,10%)" />
      <rect x="9" y="19" width="9" height="2.2" rx="1" fill="hsl(220,15%,10%)" />

      {/* Small dot — represents the cryptographic seal / World ID */}
      <circle cx="22.5" cy="20.1" r="1.8" fill="hsl(220,15%,10%)" />
    </svg>
  );
}

export function SteleWordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold tracking-tight ${className}`}
      style={{ letterSpacing: "-0.02em" }}
    >
      STELE
    </span>
  );
}
