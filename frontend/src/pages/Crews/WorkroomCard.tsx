import { Link } from "react-router";
import { Card } from "../../components/Card";
import TimerBadge from "../Workroom/TimerBadge";
import {
  describePeople,
  useWorkroomParticipants,
} from "../Workroom/useWorkroomParticipants";
import { useWorkroomTimer } from "../Workroom/useWorkroomTimer";

// Shown to crew members on the crew page.
function WorkroomCard({ crewId }: { crewId: string }) {
  const { people, error } = useWorkroomParticipants(crewId);
  const { timer } = useWorkroomTimer(crewId);

  return (
    <Card labelledBy="workroom-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="workroom-heading"
            className="font-semibold tracking-tight text-slate-900"
          >
            Workroom
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Drop in to job hunt side by side. Share your screen, turn your
            camera on, or just listen.
          </p>
        </div>
        <Link
          to={`/crews/${crewId}/workroom`}
          className="shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Join workroom
        </Link>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-slate-500">
          Couldn't check who's in: {error}
        </p>
      ) : people === null ? (
        <p className="mt-4 text-sm text-slate-500">Checking who's in...</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {people.length > 0 && (
            <ul aria-hidden="true" className="flex -space-x-2">
              {people.slice(0, 5).map((p) => (
                <li
                  key={p.identity}
                  className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-800 ring-2 ring-white"
                >
                  {(p.name || "?").charAt(0).toUpperCase()}
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-slate-700">
            {people.length > 0 && (
              <span
                aria-hidden="true"
                className="mr-1.5 inline-block size-2 rounded-full bg-teal-600 align-middle"
              />
            )}
            {people.length > 0
              ? `${describePeople(people)} now.`
              : describePeople(people)}
          </p>
          <TimerBadge timer={timer} />
        </div>
      )}
    </Card>
  );
}

export default WorkroomCard;
