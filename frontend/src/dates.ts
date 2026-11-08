// Dates as YYYY-MM-DD in the person's own time zone. The database clock is
// UTC, so an evening in Alberta would otherwise count as the next day.
export function localDate(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

function parseDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

// Whole days from one YYYY-MM-DD date to another. Counted in UTC so daylight
// saving changes don't shift the result.
export function daysBetween(from: string, to: string) {
  const a = parseDate(from);
  const b = parseDate(to);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) /
      86_400_000,
  );
}

export function addDays(isoDate: string, days: number) {
  const { year, month, day } = parseDate(isoDate);
  return localDate(new Date(year, month - 1, day + days));
}

// For example "Mon, Nov 9".
export function formatWeekdayDate(isoDate: string) {
  const { year, month, day } = parseDate(isoDate);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
