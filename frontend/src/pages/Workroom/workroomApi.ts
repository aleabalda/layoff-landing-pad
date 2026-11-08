import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "../../supabaseClient";

// Talks to the `workroom` Edge Function in supabase/functions/workroom.

export type WorkroomPass = { token: string; url: string; crewName: string };
export type WorkroomParticipant = { identity: string; name: string };

async function callWorkroom<T>(crewId: string, action: "join" | "status") {
  const { data, error } = await supabase.functions.invoke<T>("workroom", {
    body: { crewId, action },
  });
  if (error) {
    // The function replies with { error } for problems it understands.
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? error.message);
    }
    throw error;
  }
  return data as T;
}

export const getWorkroomPass = (crewId: string) =>
  callWorkroom<WorkroomPass>(crewId, "join");

export const getWorkroomParticipants = async (crewId: string) =>
  (
    await callWorkroom<{ participants: WorkroomParticipant[] }>(
      crewId,
      "status",
    )
  ).participants;
