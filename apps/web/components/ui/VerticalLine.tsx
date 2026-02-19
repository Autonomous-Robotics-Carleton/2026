'use client';

export default function VerticalLine({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`} aria-hidden="true">
      {/* Top square */}
      <div className="h-3 w-3 border border-accent/30" />
      {/* Line */}
      <div className="w-px flex-1 bg-accent/15" />
      {/* Bottom square */}
      <div className="h-3 w-3 border border-accent/30" />
    </div>
  );
}
