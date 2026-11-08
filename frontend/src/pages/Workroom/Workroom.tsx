import "@livekit/components-styles";
import "./workroomTheme.css";
import {
  type LocalUserChoices,
  LiveKitRoom,
  PreJoin,
  VideoConference,
} from "@livekit/components-react";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import AppHeader from "../../components/AppHeader";
import { useProfile } from "../../ProfileProvider";
import WorkroomTimerControls from "./WorkroomTimerControls";
import { type WorkroomPass, getWorkroomPass } from "./workroomApi";

// A crew's video room: camera, mic and screen sharing for anyone in the crew.
// Loaded on its own (see App.tsx), so LiveKit only downloads when someone
// opens a workroom.
function Workroom() {
  const { crewId = "" } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [pass, setPass] = useState<WorkroomPass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choices, setChoices] = useState<LocalUserChoices | null>(null);

  useEffect(() => {
    let isCurrent = true;
    getWorkroomPass(crewId)
      .then((found) => isCurrent && setPass(found))
      .catch(
        (err) =>
          isCurrent &&
          setError(err instanceof Error ? err.message : String(err)),
      );
    return () => {
      isCurrent = false;
    };
  }, [crewId]);

  const backTo = `/crews/${crewId}`;

  return (
    // Laid out like the Messages page: the app header, then cards that fill
    // the rest of the screen. data-lk-theme picks up workroomTheme.css.
    <div
      data-lk-theme="landing-pad"
      className="flex h-dvh flex-col bg-slate-50"
    >
      <AppHeader />

      <main className="flex min-h-0 w-full flex-1 flex-col gap-3 px-4 pb-4 sm:px-6">
        <section
          aria-labelledby="workroom-heading"
          className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm"
        >
          <div className="min-w-0">
            <Link
              to={backTo}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              ← {pass?.crewName ?? "Your crew"}
            </Link>
            <h1
              id="workroom-heading"
              className="truncate text-lg font-semibold tracking-tight text-slate-900"
            >
              Workroom
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Calls aren't recorded. Before sharing your screen, close anything
              private like banking, email or health info.
            </p>
          </div>
          {pass && <WorkroomTimerControls crewId={crewId} />}
        </section>

        <section
          aria-label="Video"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {error ? (
            <Centered>
              <p className="text-slate-700">
                We couldn't open the workroom: {error}
              </p>
              <Link
                to={backTo}
                className="mt-3 text-sm font-medium text-teal-800 underline"
              >
                Back to the crew
              </Link>
            </Centered>
          ) : !pass ? (
            <Centered>
              <p className="text-sm text-slate-500">
                Getting the workroom ready...
              </p>
            </Centered>
          ) : !choices ? (
            // Pick devices and preview before joining. Camera and mic start off.
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Centered>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                  Ready to join?
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Your camera and mic start off. Turn them on now or once you're
                  in.
                </p>
                <div className="mt-4 w-full max-w-lg [&_.lk-username-container]:hidden">
                  <PreJoin
                    defaults={{
                      username: profile?.display_name ?? "Crewmate",
                      videoEnabled: false,
                      audioEnabled: false,
                    }}
                    // Names come from the crew, not this form.
                    onValidate={() => true}
                    onSubmit={setChoices}
                    joinLabel="Join workroom"
                    micLabel="Microphone"
                    camLabel="Camera"
                    persistUserChoices
                  />
                </div>
              </Centered>
            </div>
          ) : (
            <LiveKitRoom
              serverUrl={pass.url}
              token={pass.token}
              connect
              video={
                choices.videoEnabled
                  ? { deviceId: choices.videoDeviceId }
                  : false
              }
              audio={
                choices.audioEnabled
                  ? { deviceId: choices.audioDeviceId }
                  : false
              }
              onDisconnected={() => navigate(backTo)}
              onError={(err) => setError(err.message)}
              className="min-h-0 flex-1"
            >
              <VideoConference />
            </LiveKitRoom>
          )}
        </section>
      </main>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-6 text-center">
      {children}
    </div>
  );
}

export default Workroom;
