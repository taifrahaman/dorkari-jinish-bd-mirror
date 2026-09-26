// src/hooks/use-product-detail.ts

"use client";

import { useEffect, useState } from "react";

import { fetchProductDetail } from "@/lib/product/mock-api";
import type { ProductDetail } from "@/lib/product/types";

type ProductDetailState = {
  slug: string;
  product: ProductDetail | null | undefined;
  error: Error | null;
};

export function useProductDetail(slug: string) {
  const [state, setState] = useState<ProductDetailState>(() => ({
    slug,
    product: undefined,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;

    fetchProductDetail(slug)
      .then((data) => {
        if (cancelled) return;

        setState({
          slug,
          product: data,
          error: null,
        });
      })
      .catch((e) => {
        if (cancelled) return;

        setState({
          slug,
          product: null,
          error: e instanceof Error ? e : new Error(String(e)),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isCurrentRequest = state.slug === slug;

  const product = isCurrentRequest ? state.product : undefined;
  const error = isCurrentRequest ? state.error : null;

  return {
    product: product ?? null,
    isLoading: product === undefined && error === null,
    notFound: product === null && error === null,
    error,
  };
}
