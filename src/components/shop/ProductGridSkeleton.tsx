// src/components/shop/ProductGridSkeleton.tsx

import ProductCardSkeleton from "@/components/shared/ProductCardSkeleton";

type ProductGridSkeletonProps = {
  count?: number;
  className?: string;
};

const PALETTES = ["cream", "sage", "neutral"] as const;

export default function ProductGridSkeleton({
  count = 8,
  className = "",
}: ProductGridSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`grid grid-cols-1 content-start gap-5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="min-w-0">
          <ProductCardSkeleton palette={PALETTES[i % PALETTES.length]} />
        </div>
      ))}
    </div>
  );
}
