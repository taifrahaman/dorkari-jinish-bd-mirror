// src/components/product/ProductDetailSkeleton.tsx

export default function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-48 rounded bg-brand-navbar" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="aspect-square rounded-3xl bg-brand-navbar" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-20 rounded bg-brand-navbar" />
          <div className="h-9 w-3/4 rounded bg-brand-navbar" />
          <div className="h-4 w-40 rounded bg-brand-navbar" />
          <div className="h-24 rounded-2xl bg-brand-navbar" />
          <div className="h-32 rounded-2xl bg-brand-navbar" />
          <div className="h-24 rounded-2xl bg-brand-navbar" />
        </div>
      </div>
    </div>
  );
}
