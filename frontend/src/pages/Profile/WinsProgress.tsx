import { useEffect, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import { daysAgo, formatDate, localDate } from "../../dates";
import { supabase } from "../../supabaseClient";

type Win = { date: string; title: string };

// Consecutive days with at least one win, counting back from today. A streak
// that ended yesterday still counts, so it doesn't reset first thing in the
// morning.
function currentStreak(winDays: Set<string>) {
  let offset = winDays.has(localDate()) ? 0 : 1;
  let streak = 0;
  while (winDays.has(daysAgo(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

function WinsProgress() {
  const [wins, setWins] = useState<Win[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("wins")
      .select("date, title")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else setWins(data);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const winDays = new Set(wins?.map((win) => win.date));
  const weekStart = daysAgo(6);
  const stats = [
    { label: "Small wins", value: wins?.length ?? 0 },
    {
      label: "This week",
      value: wins?.filter((win) => win.date >= weekStart).length ?? 0,
    },
    { label: "Day streak", value: currentStreak(winDays) },
  ];

  return (
    <Card labelledBy="wins-progress-heading">
      <h3
        id="wins-progress-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        Small wins
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Every task you tick off on your Today page counts.
      </p>

      <ErrorNote message={error} />

      {wins === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {wins && (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-slate-50 px-3 py-3">
                <dt className="text-xs text-slate-600">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {wins.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              Nothing yet. Your first win is waiting on the Today page, and rest
              counts too.
            </p>
          ) : (
            <>
              <h4 className="mt-6 text-sm font-medium text-slate-900">
                Recent
              </h4>
              <ul className="mt-2 divide-y divide-slate-100 text-sm">
                {wins.slice(0, 6).map((win) => (
                  <li
                    key={`${win.date}-${win.title}`}
                    className="flex justify-between gap-4 py-2"
                  >
                    <span className="text-slate-800">✓ {win.title}</span>
                    <span className="shrink-0 text-slate-500">
                      {formatDate(win.date)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Card>
  );
}

export default WinsProgress;
