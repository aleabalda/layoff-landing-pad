import { CATEGORY_LABELS, ENERGY_LABELS } from "./planTemplate";
import type { PlanTask } from "./usePlanTasks";

const ENERGY_STYLES: Record<PlanTask["energy_level"], string> = {
  low: "bg-teal-50 text-teal-800",
  medium: "bg-slate-100 text-slate-700",
  high: "bg-amber-50 text-amber-900",
};

function PlanTaskList({
  tasks,
  onToggle,
}: {
  tasks: PlanTask[];
  onToggle: (task: PlanTask) => void;
}) {
  return (
    <ul className="space-y-1">
      {tasks.map((task) => {
        const id = `task-${task.id}`;
        return (
          <li key={task.id} className="flex items-start gap-3 py-2">
            <input
              id={id}
              type="checkbox"
              checked={task.done}
              onChange={() => onToggle(task)}
              className="mt-0.5 size-4 shrink-0 cursor-pointer accent-teal-700"
            />
            <div className="min-w-0">
              <label
                htmlFor={id}
                className={`cursor-pointer text-sm ${
                  task.done ? "text-slate-400 line-through" : "text-slate-800"
                }`}
              >
                {task.title}
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                  {CATEGORY_LABELS[task.category] ?? task.category}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 ${ENERGY_STYLES[task.energy_level] ?? ""}`}
                >
                  {ENERGY_LABELS[task.energy_level] ?? task.energy_level}
                </span>
                {task.personalized_at && (
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800">
                    ✨ Tailored to you
                  </span>
                )}
                {task.link_url && (
                  <a
                    href={task.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-teal-800 underline underline-offset-2"
                  >
                    Open link
                    <span className="sr-only"> (opens in a new tab)</span> ↗
                  </a>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default PlanTaskList;
