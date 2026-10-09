// All dates are rendered in US Eastern time so the site reads the same for
// every visitor. The zone (not a fixed "EST" offset) keeps DST correct.
// Kept free of hooks so server components can use it too.
export const TIME_ZONE = "America/New_York";

export function formatDate(value: string | number | Date) {
  return new Date(value).toLocaleDateString("en-US", { timeZone: TIME_ZONE });
}

export function formatDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

/** 7,712 → "7.7K", for counts that only need to be read at a glance. */
export function compactNumber(value: number) {
  return compactFormat.format(value);
}

/**
 * How long ago a date was, in the short form the lists use: "today",
 * "yesterday", "3 days ago", "2 wk ago", "1 mo ago", "2 yr ago". Pair it with
 * the exact formatDate() value (in a <time title>) wherever it is shown.
 */
export function relativeTime(value: string | number | Date, now: number = Date.now()) {
  const days = Math.max(0, Math.floor((now - new Date(value).getTime()) / (1000 * 3600 * 24)));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} wk ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}
