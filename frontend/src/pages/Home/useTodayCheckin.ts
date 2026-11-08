import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { localDate } from "../../dates";
import { CHECKIN_CHANGED } from "../../moods";
import { supabase } from "../../supabaseClient";

// Today's check-in, saved to the checkins table (one per person per day, in
// their own time zone). Only they can read it.
export function useTodayCheckin() {
  const { user } = useAuth0();
  const [today] = useState(() => localDate());
  const [mood, setMoodState] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    supabase
      .from("checkins")
      .select("mood, note")
      .eq("date", today)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) setError(error.message);
        else if (data) {
          setMoodState(data.mood);
          setNote(data.note ?? "");
          setSavedNote(data.note ?? "");
        }
      });
    return () => {
      isCurrent = false;
    };
  }, [today]);

  const save = async (newMood: number, newNote: string) => {
    if (!user?.sub) return;
    setError(null);
    const { error } = await supabase.from("checkins").upsert(
      {
        user_id: user.sub,
        date: today,
        mood: newMood,
        note: newNote.trim() || null,
      },
      { onConflict: "user_id,date" },
    );
    if (error) setError("Couldn't save your check-in. Please try again.");
    else {
      setSavedNote(newNote);
      window.dispatchEvent(new Event(CHECKIN_CHANGED));
    }
  };

  const setMood = (value: number) => {
    setMoodState(value);
    save(value, note);
  };

  // Saves the note when they leave the field, only if it changed.
  const saveNote = () => {
    if (mood !== null && note !== savedNote) save(mood, note);
  };

  return { mood, setMood, note, setNote, saveNote, error };
}
