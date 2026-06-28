export default function SealMark({ className = "", size = 88 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="57" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <path
        id="sealTextPath"
        d="M 60,12 A 48,48 0 1 1 59.9,12"
        fill="none"
      />
      <text fontSize="8.5" fill="currentColor" letterSpacing="2.5" fontFamily="var(--font-inter)">
        <textPath href="#sealTextPath" startOffset="2%">
          KANOON MITRA · कानून मित्र · KANOON MITRA · कानून मित्र ·
        </textPath>
      </text>
      <g transform="translate(60,62)">
        <path d="M0,-22 L0,18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-20,-10 L20,-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M-20,-10 L-26,4 L-14,4 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M20,-10 L26,4 L14,4 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
        <path d="M-12,18 L12,18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
