// src/hooks/use-product-detail.ts

"use client";

import { useEffect, useState } from "react";

import type {
  ProductDetailResponse,
  StorefrontFaq,
  StorefrontProduct,
  StorefrontProductDetail,
  StorefrontReview,
  StorefrontSettings,
} from "@/lib/product/types";

type State = {
  slug: string;
  data: ProductDetailResponse | null | undefined;
  notFound: boolean;
  error: Error | null;
};

export function useProductDetail(slug: string) {
  const [state, setState] = useState<State>(() => ({
    slug,
    data: undefined,
    notFound: false,
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/storefront/products/${slug}`);

        if (cancelled) return;

        if (res.status === 404) {
          setState({ slug, data: null, notFound: true, error: null });
          return;
        }

        if (!res.ok) {
          throw new Error(`Failed to load product (${res.status})`);
        }

        const json = (await res.json()) as {
          success: boolean;
          data: ProductDetailResponse;
        };

        setState({
          slug,
          data: json.data,
          notFound: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          slug,
          data: undefined,
          notFound: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const isCurrent = state.slug === slug;

  const data: ProductDetailResponse | null = isCurrent
    ? (state.data ?? null)
    : null;

  return {
    product: (data?.product ?? null) as StorefrontProductDetail | null,
    faqs: (data?.faqs ?? []) as StorefrontFaq[],
    reviews: (data?.reviews ?? []) as StorefrontReview[],
    settings: (data?.settings ?? null) as StorefrontSettings | null,
    related: (data?.related ?? []) as StorefrontProduct[],
    isLoading: isCurrent ? state.data === undefined && !state.notFound : true,
    notFound: isCurrent ? state.notFound : false,
    error: isCurrent ? state.error : null,
  };
}
