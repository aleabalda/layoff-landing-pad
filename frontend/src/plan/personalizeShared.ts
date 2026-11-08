export type PersonalizeResult = { summary: string; updated: number };

export const PRIMARY_BUTTON =
  "cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";

export const DIALOG_HEADING = "personalize-dialog-heading";

export function describeResult(result: PersonalizeResult) {
  return result.updated
    ? `Updated ${result.updated} ${result.updated === 1 ? "task" : "tasks"} this week.`
    : "Your tasks already fit well, so nothing needed changing.";
}
