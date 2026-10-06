// src/components/admin/dashboard/RevenueChart.tsx

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/admin/format";
import type { RevenueSeries, RevenuePoint } from "@/lib/admin/analytics";

/* ============================================================
 * Types
 * ============================================================ */

export type RevenueChartProps = {
  series: RevenueSeries | undefined;
  isLoading?: boolean;
  className?: string;
};

/* ============================================================
 * Component
 * ============================================================ */

export function RevenueChart({
  series,
  isLoading = false,
  className,
}: RevenueChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = series?.points ?? [];

  const maxRevenue = useMemo(() => {
    if (points.length === 0) return 0;
    return Math.max(...points.map((p) => p.revenue));
  }, [points]);

  return (
    <div
      className={cn(
        "rounded-lg border border-brand-border bg-brand-surface",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border px-5 py-4">
        <div>
          <h2 className="font-heading text-sm font-semibold text-brand-primary">
            Revenue
          </h2>
          <p className="mt-0.5 text-xs text-brand-text-secondary">
            {series
              ? `${formatPrice(series.totals.revenue)} total · ${series.granularity}`
              : "—"}
          </p>
        </div>
        {series && (
          <div className="flex items-center gap-4 text-xs">
            <Legend color="bg-brand-accent" label="Revenue" />
            <Legend color="bg-emerald-500" label="Profit" />
          </div>
        )}
      </header>

      <div className="p-5">
        {isLoading && points.length === 0 ? (
          <div className="grid h-64 place-items-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent" />
          </div>
        ) : points.length === 0 ? (
          <EmptyState />
        ) : (
          <ChartCanvas
            points={points}
            maxRevenue={maxRevenue}
            hoverIndex={hoverIndex}
            onHover={setHoverIndex}
          />
        )}
      </div>
    </div>
  );
}

export default RevenueChart;

/* ============================================================
 * SVG chart
 * ============================================================ */

function ChartCanvas({
  points,
  maxRevenue,
  hoverIndex,
  onHover,
}: {
  points: RevenuePoint[];
  maxRevenue: number;
  hoverIndex: number | null;
  onHover: (index: number | null) => void;
}) {
  const W = 800;
  const H = 240;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 32;

  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;

  // Build polyline points
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;

  const toX = (i: number) => PAD_L + i * stepX;
  const toY = (value: number) =>
    PAD_T + innerH - (maxRevenue > 0 ? (value / maxRevenue) * innerH : 0);

  const revenuePts = points
    .map((p, i) => `${toX(i)},${toY(p.revenue)}`)
    .join(" ");

  const profitPts = points
    .map((p, i) => `${toX(i)},${toY(p.profit)}`)
    .join(" ");

  // Area path under the revenue line
  const areaPath = `M ${toX(0)},${PAD_T + innerH} L ${points
    .map((p, i) => `${toX(i)},${toY(p.revenue)}`)
    .join(" L ")} L ${toX(points.length - 1)},${PAD_T + innerH} Z`;

  // X-axis labels: pick ~5 evenly spaced
  const labelStep = Math.max(1, Math.floor(points.length / 5));
  const xLabels = points
    .map((p, i) => ({ i, label: formatXLabel(p.date) }))
    .filter(({ i }) => i % labelStep === 0 || i === points.length - 1);

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-64 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => onHover(null)}
      >
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fba705" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fba705" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD_L}
            x2={W - PAD_R}
            y1={PAD_T + innerH * t}
            y2={PAD_T + innerH * t}
            stroke="rgba(0,0,0,0.05)"
            strokeDasharray="3 4"
          />
        ))}

        {/* Area fill under revenue */}
        <path d={areaPath} fill="url(#revenueArea)" />

        {/* Revenue line */}
        <polyline
          points={revenuePts}
          fill="none"
          stroke="#fba705"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Profit line — dashed, thinner */}
        <polyline
          points={profitPts}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="5 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Hover crosshair */}
        {hoverIndex !== null && (
          <line
            x1={toX(hoverIndex)}
            x2={toX(hoverIndex)}
            y1={PAD_T}
            y2={PAD_T + innerH}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="1"
          />
        )}

        {/* Hover dot */}
        {hoverIndex !== null && (
          <>
            <circle
              cx={toX(hoverIndex)}
              cy={toY(points[hoverIndex].revenue)}
              r="5"
              fill="#fba705"
              stroke="white"
              strokeWidth="2"
            />
            <circle
              cx={toX(hoverIndex)}
              cy={toY(points[hoverIndex].profit)}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}

        {/* X labels */}
        {xLabels.map(({ i, label }) => (
          <text
            key={i}
            x={toX(i)}
            y={H - 10}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(100,116,139,0.9)"
          >
            {label}
          </text>
        ))}

        {/* Invisible hover zones */}
        {points.map((_, i) => (
          <rect
            key={i}
            x={toX(i) - stepX / 2}
            y={0}
            width={stepX || 10}
            height={H}
            fill="transparent"
            onMouseEnter={() => onHover(i)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-brand-border bg-popover px-3 py-2 text-xs shadow-lg"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-medium text-brand-primary">
            {formatPrice(hovered.revenue)}
          </p>
          <p className="text-emerald-700">
            {formatPrice(hovered.profit)} profit
          </p>
          <p className="text-brand-text-secondary">
            {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Legend
 * ============================================================ */

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden="true" />
      <span className="text-brand-text-secondary">{label}</span>
    </span>
  );
}

/* ============================================================
 * Empty state
 * ============================================================ */

function EmptyState() {
  return (
    <div className="grid h-64 place-items-center text-center">
      <p className="text-sm text-brand-text-secondary">
        No sales in this range yet.
      </p>
    </div>
  );
}

/* ============================================================
 * Axis label formatting
 * ============================================================ */

function formatXLabel(key: string): string {
  if (key.includes(" ")) {
    // hourly — "2026-10-06 14:00" → "14:00"
    return key.split(" ")[1]?.slice(0, 5) ?? key;
  }
  const parts = key.split("-");
  if (parts.length === 2) {
    // monthly — "2026-10" → "Oct"
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const m = parseInt(parts[1], 10) - 1;
    return monthNames[m] ?? key;
  }
  if (parts.length === 3) {
    // daily/weekly — "2026-10-06" → "06/10"
    return `${parts[2]}/${parts[1]}`;
  }
  // ISO week — "2026-40" → "W40"
  return key;
}
