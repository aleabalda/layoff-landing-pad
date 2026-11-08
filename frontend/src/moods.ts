// The daily check-in moods. Values must match the check on checkins.mood (1-6)
// in the database.
export const MOODS = [
  { value: 1, emoji: "😣", label: "Overwhelmed" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Hopeful" },
  { value: 6, emoji: "🤩", label: "Excited" },
];

export const moodInfo = (value: number | null | undefined) =>
  MOODS.find((mood) => mood.value === value) ?? null;

// Fired after today's check-in is saved, so the calendar can refresh.
export const CHECKIN_CHANGED = "checkin-changed";
