// Small general-purpose utilities.

export const DAYS_PER_WEEK = 7;

// Whole days from one YYYY-MM-DD date to another. Counted in UTC so daylight
// saving changes don't shift the result.
export function daysBetween(from: string, to: string) {
  const toUtc = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtc(to) - toUtc(from)) / 86_400_000);
}

export const PLAN_WEEK_COUNT = 4;

// Which week of the plan a date falls in, from 1 to PLAN_WEEK_COUNT, or null
// once the plan is over. A start date a day ahead (time zones) counts as week 1.
export function planWeekOn(startDate: string, today: string) {
  const dayNumber = Math.max(1, daysBetween(startDate, today) + 1);
  const week = Math.ceil(dayNumber / DAYS_PER_WEEK);
  return week <= PLAN_WEEK_COUNT ? week : null;
}

// Text squashed onto one line: control characters (like newlines) and runs of
// whitespace become single spaces.
export function toSingleLine(text: string) {
  return text
    .replace(/\p{Cc}+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function blobToBase64(blob: Blob) {
  return Buffer.from(await blob.arrayBuffer()).toString("base64");
}
