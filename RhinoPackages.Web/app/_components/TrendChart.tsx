"use client";

import { useState } from "react";
import { nearestIndex, timePositions } from "./chart";
import { formatDay } from "./format";
import type { HistoryPoint } from "./packageModel";

/**
 * A package's download history. The curve and the first-to-last caption are
 * in the exported HTML; pointing, touching or arrowing along the chart swaps
 * the caption for the figure on that day.
 */
export default function TrendChart({ points }: { points: HistoryPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 600;
  const height = 80;
  const values = points.map((p) => p.downloads);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const positions = timePositions(points.map((p) => p.date));
  const coords = values.map((v, i) => ({
    x: positions[i] * width,
    y: height - 4 - ((v - min) / span) * (height - 8),
  }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  // Evenly spaced dates under the curve. The axis is time, not point count
  // (see timePositions), so each tick is the calendar day at that fraction.
  const t0 = new Date(`${first.date}T12:00:00Z`).getTime();
  const t1 = new Date(`${last.date}T12:00:00Z`).getTime();
  const showYear = t1 - t0 > 300 * 86_400_000;
  const tickCount = t1 > t0 ? 4 : 1;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const position = tickCount > 1 ? i / (tickCount - 1) : 0;
    const label = new Date(t0 + (t1 - t0) * position).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      ...(showYear ? { year: "numeric" } : {}),
    });
    return { position, label };
  });

  const track = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActive(nearestIndex(positions, (e.clientX - rect.left) / rect.width));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(points.length - 1);
    else if (step) setActive(Math.min(points.length - 1, Math.max(0, (active ?? points.length - 1) + step)));
    else if (e.key === "Escape") setActive(null);
    else return;
    e.preventDefault();
  };

  const point = active === null ? null : points[active];
  const delta = active === null || active === 0 ? null : values[active] - values[active - 1];

  return (
    <figure className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div
        className="relative touch-pan-y select-none rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:focus-visible:ring-brand-400"
        tabIndex={0}
        role="img"
        aria-label={`Download history, ${first.downloads.toLocaleString("en-US")} on ${formatDay(first.date)} to ${last.downloads.toLocaleString("en-US")} on ${formatDay(last.date)}. Use the arrow keys to step through days.`}
        onPointerDown={track}
        onPointerMove={track}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={onKeyDown}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none" aria-hidden="true">
          {ticks.slice(1, -1).map((tick) => (
            <line
              key={tick.label}
              x1={tick.position * width}
              y1={0}
              x2={tick.position * width}
              y2={height}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="stroke-gray-100 dark:stroke-zinc-800/60"
            />
          ))}
          <path d={`${line} L${width},${height} L0,${height} Z`} className="fill-brand-500/10 dark:fill-brand-400/10" />
          <path d={line} fill="none" strokeWidth="2" vectorEffect="non-scaling-stroke" className="stroke-brand-500 dark:stroke-brand-400" />
          {active !== null && (
            <line
              x1={coords[active].x}
              y1={0}
              x2={coords[active].x}
              y2={height}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              className="stroke-gray-400 dark:stroke-zinc-500"
            />
          )}
        </svg>
        {active !== null && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 ring-2 ring-white dark:bg-brand-400 dark:ring-zinc-900"
            style={{ left: `${positions[active] * 100}%`, top: `${(coords[active].y / height) * 100}%` }}
          />
        )}
      </div>
      <div className="relative mt-1 h-4 text-[10px] tabular-nums text-gray-500 dark:text-zinc-400" aria-hidden="true">
        {ticks.map((tick, i) => (
          <span
            key={tick.label}
            className={`absolute whitespace-nowrap ${i === 0 ? "" : i === ticks.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${tick.position * 100}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 min-h-[2.25rem] text-xs text-gray-500 dark:text-zinc-400" aria-live="polite">
        {point ? (
          <>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">
              {point.downloads.toLocaleString("en-US")} downloads
            </span>{" "}
            on {formatDay(point.date)}
            {delta !== null && delta !== 0 && (
              <>
                {" · "}
                {delta > 0 ? "+" : "−"}
                {Math.abs(delta).toLocaleString("en-US")} since {formatDay(points[active! - 1].date)}
              </>
            )}
          </>
        ) : (
          <>
            {first.downloads.toLocaleString("en-US")} downloads on {formatDay(first.date)} →{" "}
            {last.downloads.toLocaleString("en-US")} on {formatDay(last.date)}
            <span className="hidden sm:inline"> · hover or touch the chart for daily figures</span>
          </>
        )}
      </figcaption>
    </figure>
  );
}
