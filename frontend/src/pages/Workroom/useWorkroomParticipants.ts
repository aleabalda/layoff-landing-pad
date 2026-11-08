import { useEffect, useState } from "react";
import {
  type WorkroomParticipant,
  getWorkroomParticipants,
} from "./workroomApi";

// How often to check who's in, while the page is open and visible.
const REFRESH_MS = 20_000;

export function useWorkroomParticipants(crewId: string) {
  const [people, setPeople] = useState<WorkroomParticipant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const check = () =>
      getWorkroomParticipants(crewId)
        .then((found) => {
          if (!isCurrent) return;
          setPeople(found);
          setError(null);
        })
        .catch((err) => {
          if (isCurrent)
            setError(err instanceof Error ? err.message : String(err));
        });

    check();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, REFRESH_MS);

    return () => {
      isCurrent = false;
      clearInterval(timer);
    };
  }, [crewId]);

  return { people, error };
}

export function describePeople(people: WorkroomParticipant[]) {
  const names = people.map((p) => p.name || "Someone");
  if (names.length === 0) return "Nobody's in right now.";
  if (names.length === 1) return `${names[0]} is in`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are in`;
  return `${names[0]}, ${names[1]} and ${names.length - 2} more are in`;
}
