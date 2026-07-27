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
