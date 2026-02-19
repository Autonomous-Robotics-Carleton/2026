import Link from 'next/link';

type ButtonProps = {
  href?: string;
  variant?: 'primary' | 'outline';
  children: React.ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  href,
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center gap-2 px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all duration-200 bp-focus';
  const variants = {
    primary: 'bg-accent text-bp-blue-dark hover:bg-bp-cyan bp-glow',
    outline: 'border border-bp-line text-fg hover:border-accent/40 hover:bg-accent/5 bp-glow-hover',
  };
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
