import { useParams } from "react-router";
import AppHeader from "../../components/AppHeader";
import InterviewRoom from "./InterviewRoom";
import RoomHome from "./RoomHome";
import SetupWizard from "./SetupWizard";

// The Confidence Room: mock interviews with an AI coach.
//   /confidence-room           past sessions and a way to start
//   /confidence-room/new       set up a new mock interview
//   /confidence-room/:id       practise one session's questions
function ConfidenceRoom() {
  const { sessionId } = useParams();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        {!sessionId ? (
          <RoomHome />
        ) : sessionId === "new" ? (
          <SetupWizard />
        ) : (
          // Keyed so switching sessions starts fresh.
          <InterviewRoom key={sessionId} sessionId={sessionId} />
        )}
      </main>
    </div>
  );
}

export default ConfidenceRoom;
