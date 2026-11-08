import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatShortTime } from "../../dates";
import { supabase } from "../../supabaseClient";

type PulseKind = "interview" | "offer" | "applications" | "wins" | "joined";

type PulseItem = {
  kind: PulseKind;
  crew_id: string;
  crew_name: string;
  person_name: string | null;
  amount: number | null;
  happened_at: string;
};

const SHOWN = 4;

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`;

// Career milestones only. The database never sends companies, job titles or
// how anyone is feeling.
function describe(item: PulseItem) {
  const name = item.person_name?.trim() || "Someone";
  const amount = item.amount ?? 0;
  switch (item.kind) {
    case "offer":
      return { icon: "🎉", text: `${name} got a job offer!` };
    case "interview":
      return { icon: "🎤", text: `${name} landed an interview` };
    case "applications":
      return {
        icon: "📨",
        text: `${name} sent ${plural(amount, "application")} this week`,
      };
    case "wins":
      return {
        icon: "✅",
        text: `${name} ticked off ${plural(amount, "small win")} this week`,
      };
    case "joined":
      return { icon: "👋", text: `${name} joined ${item.crew_name}` };
  }
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function CrewPulse() {
  const [items, setItems] = useState<PulseItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    supabase.rpc("get_crew_pulse").then(({ data, error }) => {
      if (!isCurrent) return;
      if (error) setError(error.message);
      else setItems(shuffle(data as PulseItem[]));
    });

    return () => {
      isCurrent = false;
    };
  }, []);

  const shown = items?.slice(0, SHOWN) ?? [];

  return (
    <section
      aria-labelledby="crew-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            id="crew-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Crew pulse
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            How people in your crews are getting on this week.
          </p>
        </div>
        {items && items.length > SHOWN && (
          <button
            type="button"
            onClick={() => setItems((current) => current && shuffle(current))}
            className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Show others
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          Couldn't load updates: {error}
        </p>
      )}

      {items === null && !error && (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      )}

      {items?.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No updates yet this week. When people in your crews make progress,
          you'll see it here.{" "}
          <Link to="/crews" className="font-medium text-teal-800 underline">
            Find a crew
          </Link>
        </p>
      )}

      {shown.length > 0 && (
        <ul className="mt-4 space-y-3" aria-live="polite">
          {shown.map((item) => {
            const { icon, text } = describe(item);
            return (
              <li
                key={`${item.kind}-${item.person_name}-${item.crew_id}-${item.happened_at}`}
                className="flex items-start gap-3 text-sm"
              >
                <span aria-hidden="true" className="text-lg leading-5">
                  {icon}
                </span>
                <div className="min-w-0">
                  <p className="text-slate-800">{text}</p>
                  <p className="text-xs text-slate-500">
                    {item.kind !== "joined" && (
                      <>
                        <Link
                          to={`/crews/${item.crew_id}`}
                          className="hover:underline"
                        >
                          {item.crew_name}
                        </Link>
                        {" · "}
                      </>
                    )}
                    {formatShortTime(item.happened_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default CrewPulse;
