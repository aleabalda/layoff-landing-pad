import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  FINISHED_NOTICE_MS,
  TIMER_MAX_MINUTES,
  TIMER_MIN_MINUTES,
  TIMER_PRESETS,
  type TimerMode,
  formatRemaining,
  modeLabel,
  useCountdown,
  useWorkroomTimer,
} from "./useWorkroomTimer";

// A soft two-note chime when a session ends. Browsers only allow sound after
// someone has interacted with the page, which joining the workroom counts as.
function playChime() {
  try {
    const audio = new AudioContext();
    [660, 880].forEach((frequency, i) => {
      const tone = audio.createOscillator();
      const volume = audio.createGain();
      const start = audio.currentTime + i * 0.25;
      tone.frequency.value = frequency;
      volume.gain.setValueAtTime(0.0001, start);
      volume.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      tone.connect(volume).connect(audio.destination);
      tone.start(start);
      tone.stop(start + 0.6);
    });
    setTimeout(() => audio.close(), 1500);
  } catch {
    // No sound is fine.
  }
}

// How much "+5 min" adds to a running session.
const EXTEND_MINUTES = 5;

// Remembers the last custom length in this browser, just as a convenience.
const CUSTOM_STORAGE_KEY = "workroom-custom-timer";

function readSavedCustom(): { mode: TimerMode; minutes: number } | null {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CUSTOM_STORAGE_KEY) ?? "null",
    );
    if (
      (saved?.mode === "focus" || saved?.mode === "break") &&
      Number.isInteger(saved.minutes)
    ) {
      return saved;
    }
  } catch {
    // Storage can be blocked or empty; the defaults are fine.
  }
  return null;
}

function saveCustom(mode: TimerMode, minutes: number) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify({ mode, minutes }));
  } catch {
    // Not remembering it is fine.
  }
}

// Pick Focus or Break and any length, then start it for everyone.
function CustomTimerForm({
  suggestedMode,
  onStart,
  onCancel,
}: {
  suggestedMode: TimerMode;
  onStart: (mode: TimerMode, minutes: number) => void;
  onCancel: () => void;
}) {
  const [saved] = useState(readSavedCustom);
  const [mode, setMode] = useState<TimerMode>(saved?.mode ?? suggestedMode);
  const [minutes, setMinutes] = useState(
    String(saved?.minutes ?? (suggestedMode === "focus" ? 30 : 10)),
  );

  const value = Number(minutes);
  const isValid =
    Number.isInteger(value) &&
    value >= TIMER_MIN_MINUTES &&
    value <= TIMER_MAX_MINUTES;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    saveCustom(mode, value);
    onStart(mode, value);
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Timer type"
        className="flex rounded-lg border border-slate-200 p-0.5"
      >
        {(["focus", "break"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => setMode(option)}
            className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === option
                ? "bg-teal-700 text-white"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            {option === "focus" ? "🍅 Focus" : "☕ Break"}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-slate-600">
        <input
          type="number"
          inputMode="numeric"
          min={TIMER_MIN_MINUTES}
          max={TIMER_MAX_MINUTES}
          step={1}
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          aria-label="Minutes"
          aria-invalid={!isValid}
          autoFocus
          className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-900 tabular-nums focus:border-teal-600 focus:outline-none aria-invalid:border-red-400"
        />
        min
      </label>
      <button
        type="submit"
        disabled={!isValid}
        className="cursor-pointer rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Start
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="cursor-pointer rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        Cancel
      </button>
      {!isValid && (
        <p className="w-full text-xs text-red-700">
          Pick between {TIMER_MIN_MINUTES} and {TIMER_MAX_MINUTES} minutes.
        </p>
      )}
    </form>
  );
}

// The shared timer inside the workroom. Anyone in the crew can start or stop
// it, and everyone sees the same countdown.
function WorkroomTimerControls({ crewId }: { crewId: string }) {
  const { timer, error, start, stop } = useWorkroomTimer(crewId);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const remaining = useCountdown(timer?.ends_at);
  const isRunning = remaining !== null && remaining > 0;
  const justFinished =
    remaining !== null && remaining <= 0 && remaining > -FINISHED_NOTICE_MS;

  // Chime once per session, only for sessions that end while you're here.
  const chimedFor = useRef<string | null>(null);
  const wasRunning = useRef(false);
  useEffect(() => {
    if (isRunning) wasRunning.current = true;
    if (
      justFinished &&
      wasRunning.current &&
      chimedFor.current !== timer?.ends_at
    ) {
      chimedFor.current = timer?.ends_at ?? null;
      wasRunning.current = false;
      playChime();
    }
  }, [isRunning, justFinished, timer?.ends_at]);

  const buttonClasses =
    "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-colors";

  return (
    <div
      role="group"
      aria-label="Shared timer"
      className="flex flex-wrap items-center gap-2"
    >
      {isRunning && timer ? (
        <>
          <p
            className="text-sm text-slate-700 tabular-nums"
            // Announce changes of session, not every second.
            aria-live="off"
          >
            <span aria-hidden="true">
              {timer.mode === "focus" ? "🍅 " : "☕ "}
            </span>
            <span className="font-semibold text-slate-900">
              {modeLabel(timer.mode)} {formatRemaining(remaining)}
            </span>
            {timer.started_by_name && (
              <span className="text-slate-500">
                {" "}
                · started by {timer.started_by_name}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() =>
              start(
                timer.mode,
                Math.min(
                  TIMER_MAX_MINUTES,
                  Math.ceil(remaining / 60_000) + EXTEND_MINUTES,
                ),
              )
            }
            className={`${buttonClasses} border border-slate-200 text-slate-700 hover:bg-slate-50`}
          >
            +{EXTEND_MINUTES} min
          </button>
          <button
            type="button"
            onClick={stop}
            className={`${buttonClasses} border border-slate-200 text-slate-700 hover:bg-slate-50`}
          >
            Stop
          </button>
        </>
      ) : isCustomizing ? (
        <CustomTimerForm
          suggestedMode={
            justFinished && timer && timer.mode === "focus" ? "break" : "focus"
          }
          onStart={(mode, minutes) => {
            setIsCustomizing(false);
            start(mode, minutes);
          }}
          onCancel={() => setIsCustomizing(false)}
        />
      ) : (
        <>
          <p className="text-sm text-slate-600" aria-live="polite">
            {justFinished && timer
              ? timer.mode === "focus"
                ? "Focus session done. Nice work. Take a break?"
                : "Break's over. Ready to focus?"
              : "Shared timer:"}
          </p>
          {TIMER_PRESETS.filter((preset) =>
            // After a session, suggest the other kind first.
            justFinished && timer ? preset.mode !== timer.mode : true,
          ).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => start(preset.mode, preset.minutes)}
              className={`${buttonClasses} ${
                preset.mode === "focus"
                  ? "bg-teal-700 text-white hover:bg-teal-800"
                  : "border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setIsCustomizing(true)}
            className={`${buttonClasses} border border-dashed border-slate-300 text-slate-700 hover:bg-slate-50`}
          >
            Custom…
          </button>
          {justFinished && timer && (
            <button
              type="button"
              onClick={stop}
              className={`${buttonClasses} text-slate-500 hover:text-slate-900`}
            >
              Dismiss
            </button>
          )}
        </>
      )}
      {error && <p className="text-xs text-red-700">Timer: {error}</p>}
    </div>
  );
}

export default WorkroomTimerControls;
