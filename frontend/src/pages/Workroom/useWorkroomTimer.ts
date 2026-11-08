import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export type TimerMode = "focus" | "break";

export type WorkroomTimer = {
  mode: TimerMode;
  duration_minutes: number;
  ends_at: string | null;
  started_by_name: string | null;
  updated_at: string;
};

// Must match the check on workroom_timers.duration_minutes in the database.
export const TIMER_MIN_MINUTES = 1;
export const TIMER_MAX_MINUTES = 180;

export const TIMER_PRESETS: {
  mode: TimerMode;
  minutes: number;
  label: string;
}[] = [
  { mode: "focus", minutes: 25, label: "Focus 25" },
  { mode: "focus", minutes: 50, label: "Focus 50" },
  { mode: "break", minutes: 5, label: "Break 5" },
  { mode: "break", minutes: 10, label: "Break 10" },
];

// The crew's shared timer, kept live through Supabase Realtime.
export function useWorkroomTimer(crewId: string) {
  const [timer, setTimer] = useState<WorkroomTimer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .rpc("get_workroom_timer", { target_crew: crewId })
      .maybeSingle<WorkroomTimer>();
    if (error) setError(error.message);
    else {
      setError(null);
      setTimer(data);
    }
  }, [crewId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`workroom-timer:${crewId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workroom_timers",
          filter: `crew_id=eq.${crewId}`,
        },
        // The change itself has no names in it, so fetch the full timer.
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [crewId, load]);

  const start = async (mode: TimerMode, minutes: number) => {
    const { error } = await supabase.rpc("start_workroom_timer", {
      target_crew: crewId,
      new_mode: mode,
      minutes,
    });
    if (error) setError(error.message);
    else await load();
  };

  const stop = async () => {
    const { error } = await supabase.rpc("stop_workroom_timer", {
      target_crew: crewId,
    });
    if (error) setError(error.message);
    else await load();
  };

  return { timer, error, start, stop };
}

// Milliseconds left until endsAt, updated every second. Negative once it has
// finished (how long ago). Null when the timer is stopped.
export function useCountdown(endsAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [endsAt]);

  if (!endsAt) return null;
  return new Date(endsAt).getTime() - now;
}

// 1_125_000 -> "18:45"
export function formatRemaining(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// How long the "session done" message stays up after a timer ends.
export const FINISHED_NOTICE_MS = 15 * 60_000;

export const modeLabel = (mode: TimerMode) =>
  mode === "focus" ? "Focus" : "Break";
