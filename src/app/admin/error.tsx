// src/app/admin/error.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  Copy,
  LayoutDashboard,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Log to your error tracking service (Sentry, etc.) here
    console.error("[admin-error]", error);
  }, [error]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyDetails = async () => {
    const details = [
      `Page: ${pathname}`,
      `Time: ${new Date().toISOString()}`,
      error.digest ? `Error ID: ${error.digest}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
    } catch {
      // clipboard blocked (insecure context or permissions): nothing to do
    }
  };

  return (
    <main className="flex min-h-[70dvh] items-center justify-center p-4 sm:p-6">
      <div
        role="alert"
        className="w-full max-w-lg rounded-3xl border border-brand-border bg-brand-surface p-6 text-center shadow-[0_1px_2px_rgba(23,38,66,0.05),0_20px_40px_-20px_rgba(23,38,66,0.2)] sm:p-9"
      >
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert className="h-7 w-7" strokeWidth={1.8} />
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-brand-primary sm:text-[1.75rem]">
          Something went wrong
        </h1>

        <p className="mx-auto mt-2.5 max-w-sm text-[15px] leading-relaxed text-brand-text-secondary">
          This page hit an unexpected error. Your data is safe. Try again, or
          head back to the dashboard.
        </p>

        {error.digest && (
          <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-brand-navbar px-3.5 py-1.5 text-xs text-brand-text-secondary">
            <span className="font-semibold uppercase tracking-[0.12em]">
              Error ID
            </span>
            <code className="font-mono font-semibold text-brand-text">
              {error.digest}
            </code>
          </p>
        )}

        {/* the real message, development only */}
        {process.env.NODE_ENV === "development" && error.message && (
          <pre className="mt-5 max-h-44 overflow-auto rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-left text-xs leading-relaxed text-destructive">
            {error.message}
          </pre>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-sm font-semibold text-white transition duration-200 hover:bg-brand-primary-dark active:scale-95"
          >
            <RotateCcw className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90" />
            Try again
          </button>

          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-surface px-6 text-sm font-semibold text-brand-primary transition duration-200 hover:bg-brand-navbar active:scale-95"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <button
          type="button"
          onClick={copyDetails}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand-text-secondary transition-colors hover:bg-brand-navbar hover:text-brand-text"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy details for a bug report
            </>
          )}
        </button>
      </div>
    </main>
  );
}
