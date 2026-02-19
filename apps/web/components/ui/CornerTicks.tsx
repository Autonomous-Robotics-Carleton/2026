interface CornerTicksProps {
  className?: string;
  size?: number;
  label?: string;
}

export default function CornerTicks({
  className = '',
  size = 12,
  label,
}: CornerTicksProps) {
  const s = size;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      {/* Top-left */}
      <svg className="absolute top-0 left-0" width={s} height={s}>
        <line x1="0" y1="0" x2={s} y2="0" stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
        <line x1="0" y1="0" x2="0" y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
      </svg>
      {/* Top-right */}
      <svg className="absolute top-0 right-0" width={s} height={s}>
        <line x1="0" y1="0" x2={s} y2="0" stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
        <line x1={s} y1="0" x2={s} y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
      </svg>
      {/* Bottom-left */}
      <svg className="absolute bottom-0 left-0" width={s} height={s}>
        <line x1="0" y1={s} x2={s} y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
        <line x1="0" y1="0" x2="0" y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
      </svg>
      {/* Bottom-right */}
      <svg className="absolute bottom-0 right-0" width={s} height={s}>
        <line x1="0" y1={s} x2={s} y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
        <line x1={s} y1="0" x2={s} y2={s} stroke="var(--color-bp-cyan)" strokeWidth="1" opacity="0.35" />
      </svg>
      {/* Optional micro-label */}
      {label && (
        <span
          className="absolute top-1 right-3 text-[9px] tracking-widest uppercase"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-bp-cyan)', opacity: 0.3 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
