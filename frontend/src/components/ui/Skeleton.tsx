'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-7 w-32" />
    </div>
  );
}

export function SkeletonRow({ cols = 6 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <Skeleton className="h-3.5 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
}
