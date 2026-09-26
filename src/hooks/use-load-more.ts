// src/hooks/use-load-more.ts

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Progressive rendering: show `pageSize` items and reveal more as the sentinel
 * nears the viewport. Resets to the first page whenever `resetKey` changes.
 */
export function useLoadMore<T>(items: T[], resetKey: string, pageSize = 24) {
  const [state, setState] = useState({ key: resetKey, limit: pageSize });
  const limit = state.key === resetKey ? state.limit : pageSize;
  const hasMore = limit < items.length;
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting)
          setState({ key: resetKey, limit: limit + pageSize });
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, limit, resetKey, pageSize]);

  const visible = useMemo(() => items.slice(0, limit), [items, limit]);

  return { visible, hasMore, sentinelRef };
}
