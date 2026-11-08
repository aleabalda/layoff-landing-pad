import {
  type WorkroomTimer,
  formatRemaining,
  modeLabel,
  useCountdown,
} from "./useWorkroomTimer";

// "🍅 Focus · 18:45 left". Shows nothing unless a timer is running.
function TimerBadge({ timer }: { timer: WorkroomTimer | null }) {
  const remaining = useCountdown(timer?.ends_at);
  if (!timer || remaining === null || remaining <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-800 tabular-nums ring-1 ring-slate-200">
      <span aria-hidden="true">{timer.mode === "focus" ? "🍅" : "☕"}</span>
      {modeLabel(timer.mode)} · {formatRemaining(remaining)} left
    </span>
  );
}

export default TimerBadge;
