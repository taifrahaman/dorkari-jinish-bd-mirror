// src/components/providers/QueryProvider.tsx

"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import { isAbortError } from "@/lib/admin/api";

/* ============================================================
 * Defaults
 * ============================================================ */

function buildConfig(): QueryClientConfig {
  return {
    queryCache: new QueryCache({
      onError: (error) => {
        // Silently ignore aborts — they're cancellations, not failures.
        if (isAbortError(error)) return;
        // Non-abort query errors are surfaced by the component's
        // `isError` state (or a route-level error boundary).
        // We don't toast them globally because every page handles
        // its own error UI.
      },
    }),

    mutationCache: new MutationCache({
      onError: (error) => {
        if (isAbortError(error)) return;
        // Non-abort mutation errors are handled per-hook (toast).
      },
    }),

    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          // Never retry cancellations
          if (isAbortError(error)) return false;
          // Don't retry client errors (4xx)
          const status = (error as { status?: number })?.status ?? 0;
          if (status >= 400 && status < 500) return false;
          return failureCount < 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  };
}

/* ============================================================
 * Provider
 * ============================================================ */

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient(buildConfig()));

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: "font-body",
        }}
      />
    </QueryClientProvider>
  );
}
