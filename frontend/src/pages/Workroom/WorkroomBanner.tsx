import { Link } from "react-router";
import TimerBadge from "./TimerBadge";
import {
  describePeople,
  useWorkroomParticipants,
} from "./useWorkroomParticipants";
import { useCountdown, useWorkroomTimer } from "./useWorkroomTimer";

// Shown at the top of a crew's chat while its workroom is in use.
function WorkroomBanner({ crewId }: { crewId: string }) {
  const { people } = useWorkroomParticipants(crewId);
  const { timer } = useWorkroomTimer(crewId);
  const remaining = useCountdown(timer?.ends_at);
  const timerRunning = remaining !== null && remaining > 0;

  if (!people?.length && !timerRunning) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 bg-teal-50 px-4 py-2 text-sm">
      <p className="flex flex-wrap items-center gap-2 text-teal-900">
        <span
          aria-hidden="true"
          className="inline-block size-2 rounded-full bg-teal-600"
        />
        <span>
          <span className="font-medium">Workroom</span>
          {people && people.length > 0 && <> · {describePeople(people)}</>}
        </span>
        <TimerBadge timer={timer} />
      </p>
      <Link
        to={`/crews/${crewId}/workroom`}
        className="rounded-lg bg-teal-700 px-3 py-1 text-xs font-medium text-white hover:bg-teal-800"
      >
        Join
      </Link>
    </div>
  );
}

export default WorkroomBanner;
