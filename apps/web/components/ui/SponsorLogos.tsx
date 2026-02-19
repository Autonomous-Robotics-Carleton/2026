import { type ReactNode } from 'react';

const FILL = 'currentColor';

/** Vercel — simple upward-pointing triangle */
export function VercelLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Vercel">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill={FILL} />
    </svg>
  );
}

/** Notion — rounded square with cut-out "N" shape */
export function NotionLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Notion">
      <path
        d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z"
        fill={FILL}
      />
      <path
        d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V17.64c0-1.937-.58-2.723-2.467-4.117L76.167 1.14C72.193-1.673 70.447-2.063 63.65-1.48l-2.3.18V.227z"
        fill={FILL}
      />
      <path
        d="M28.45 16.7c-5.1.387-6.267.477-9.167-1.913L12.107 9.18C11.14 8.407 10.75 7.83 10.75 7.07c0-1.163.777-1.747 2.72-1.94l49.98-3.657c4.47-.383 6.7 1.167 8.44 2.527l8.367 6.08c.387.29.967 1.163.967 1.747 0 1.163-.967 1.94-2.527 2.047l-51.867 3.11v-.283z"
        fill="var(--color-bp-blue)"
      />
      <path
        d="M22.477 88.817V31.393c0-2.527.777-3.693 3.107-3.883l56.053-3.303c2.137-.193 3.11 1.163 3.11 3.69v56.843c0 2.527-.39 4.67-3.887 4.86l-53.76 3.11c-3.5.193-4.623-1.163-4.623-3.887v-2.003-.003z"
        fill="var(--color-bp-blue)"
      />
      <path
        d="M71.24 34.5c.387 1.74 0 3.5-1.747 3.693l-2.72.58v42.023c-2.333 1.257-4.47 1.94-6.22 1.94-2.917 0-3.69-.97-5.83-3.5L38.637 51.76v25.683l5.63 1.26s0 3.5-4.86 3.5l-13.397.77c-.387-.77 0-2.723 1.357-3.11l3.497-.967V42.573l-4.86-.387c-.387-1.74.58-4.277 3.3-4.47l14.367-.967 17.273 26.457V39.74l-4.667-.58c-.387-2.14 1.163-3.69 3.11-3.887l13.5-.773z"
        fill={FILL}
      />
    </svg>
  );
}

/** Styled text logo for brands without SVG */
function TextLogo({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span
      className={`text-sm font-bold uppercase tracking-[0.15em] ${className}`}
      style={{ fontFamily: 'var(--font-heading)', color: 'currentColor' }}
    >
      {name}
    </span>
  );
}

/** All sponsor logos indexed by name */
export function getSponsorLogo(name: string): ReactNode {
  const logoClass = 'h-full w-auto fill-current';
  switch (name) {
    case 'Vercel':
      return <VercelLogo className={logoClass} />;
    case 'Notion':
      return <NotionLogo className={logoClass} />;
    default:
      return <TextLogo name={name} />;
  }
}
