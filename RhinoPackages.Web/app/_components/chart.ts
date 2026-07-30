/** Shared geometry for the hand-rolled charts. */

/**
 * Fractional x positions (0..1) for a series of dated points.
 *
 * The generator only writes a snapshot when a package's counts actually move,
 * so most histories skip days — 1,003 of the 1,160 download histories have at
 * least one gap, the widest 16 days. Spacing points evenly by array index
 * would give a quiet fortnight the same width as a busy day, flattening real
 * plateaus and making gradual growth look like a step. Falls back to even
 * spacing when the dates cannot carry the axis (unparseable, or all equal).
 */
export function timePositions(dates: string[]): number[] {
  const even = dates.map((_, i) => (dates.length > 1 ? i / (dates.length - 1) : 0));

  const times = dates.map((date) => new Date(date).getTime());
  if (times.some((time) => !Number.isFinite(time))) return even;

  const first = times[0];
  const span = times[times.length - 1] - first;
  if (span <= 0) return even;

  return times.map((time) => (time - first) / span);
}

/** Index of the point nearest a fractional position along the axis. */
export function nearestIndex(positions: number[], ratio: number) {
  let nearest = 0;
  for (let i = 1; i < positions.length; i++) {
    if (Math.abs(positions[i] - ratio) < Math.abs(positions[nearest] - ratio)) nearest = i;
  }
  return nearest;
}
