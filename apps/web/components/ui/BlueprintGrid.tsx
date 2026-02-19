'use client';

type Variant = 'hero' | 'section' | 'minimal';

interface BlueprintGridProps {
  variant?: Variant;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  hero: 'bp-grid bp-noise bp-vignette',
  section: 'bp-grid bp-noise',
  minimal: 'bp-grid-dense',
};

export default function BlueprintGrid({
  variant = 'section',
  className = '',
}: BlueprintGridProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}
