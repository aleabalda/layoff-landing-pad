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

// "3:42 PM" today, "Mon" this week, otherwise "Nov 3".
export function formatShortTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (localDate(date) === localDate(now)) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(now.getDate() - 6);
  if (date >= sixDaysAgo) {
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatClockTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// "Today", "Yesterday", or "Monday, November 3".
export function formatDayHeading(iso: string) {
  const day = localDate(new Date(iso));
  if (day === localDate()) return "Today";
  if (day === daysAgo(1)) return "Yesterday";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
