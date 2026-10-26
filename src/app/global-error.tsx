// src/app/global-error.tsx

"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Last-resort error boundary.
 *
 * Only rendered when `src/app/layout.tsx` itself throws. Because that
 * layout failed, none of its dependencies loaded:
 *
 *   - No globals.css → no Tailwind, no CSS vars
 *   - No next/font → Geist / Space Grotesk / Atma / Hind Siliguri are absent
 *   - No <html> element → we render our own below
 *
 * So this file is intentionally self-contained: inline styles, system
 * fonts, brand colors hardcoded. No imports beyond React itself.
 */

const COLORS = {
  bg: "#faf8f5", // brand-background
  surface: "#ffffff", // brand-surface
  navy: "#172642", // brand-primary
  navyDark: "#0f1a2e", // brand-primary-dark
  amber: "#fba705", // brand-accent
  amberHover: "#e09400",
  text: "#0f172a", // brand-text
  textSecondary: "#334155",
  border: "#e2e8f0",
  destructive: "#dc2626",
};

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry / logging service hook would go here. For now, log to console.
    console.error("[global-error]", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: `radial-gradient(circle at top, ${COLORS.surface} 0%, ${COLORS.bg} 100%)`,
          color: COLORS.text,
          fontFamily: FONT_STACK,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "560px",
            padding: "40px 32px",
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "16px",
            boxShadow:
              "0 1px 2px rgba(23,38,66,0.05), 0 20px 40px -16px rgba(23,38,66,0.18)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "999px",
              background: `${COLORS.destructive}14`,
              color: COLORS.destructive,
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
            aria-hidden="true"
          >
            !
          </div>

          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "24px",
              lineHeight: 1.25,
              fontWeight: 700,
              color: COLORS.navy,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              margin: "0 0 4px",
              fontSize: "15px",
              lineHeight: 1.5,
              color: COLORS.textSecondary,
            }}
          >
            We hit an unexpected error. Please try again.
          </p>

          <p
            style={{
              margin: "0 0 24px",
              fontSize: "14px",
              lineHeight: 1.5,
              color: COLORS.textSecondary,
            }}
          >
            একটি অপ্রত্যাশিত ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </p>

          {error.digest && (
            <p
              style={{
                margin: "0 0 24px",
                padding: "8px 12px",
                borderRadius: "8px",
                background: `${COLORS.border}80`,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "12px",
                color: COLORS.textSecondary,
              }}
            >
              Error ID: <strong>{error.digest}</strong>
            </p>
          )}

          {isDev && error.message && (
            <pre
              style={{
                margin: "0 0 24px",
                padding: "12px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: `1px solid ${COLORS.destructive}40`,
                color: COLORS.destructive,
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "12px",
                lineHeight: 1.5,
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "auto",
                maxHeight: "200px",
              }}
            >
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                appearance: "none",
                cursor: "pointer",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "999px",
                border: "none",
                background: COLORS.navy,
                color: "#ffffff",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.navyDark;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.navy;
              }}
            >
              Try again
            </button>

            <Link
              href="/"
              style={{
                appearance: "none",
                display: "inline-block",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "999px",
                textDecoration: "none",
                border: `1px solid ${COLORS.navy}`,
                color: COLORS.navy,
                background: "transparent",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.amber;
                e.currentTarget.style.borderColor = COLORS.amberHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = COLORS.navy;
              }}
            >
              Go to home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
