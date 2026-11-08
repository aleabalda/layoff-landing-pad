import { useAuth0 } from "@auth0/auth0-react";
import { type ReactNode, Suspense, lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { useProfile } from "./ProfileProvider";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ConfidenceRoom from "./pages/ConfidenceRoom/ConfidenceRoom";
import CrewDetail from "./pages/Crews/CrewDetail";
import Crews from "./pages/Crews/Crews";
import Home from "./pages/Home/Home";
import Jobs from "./pages/Jobs/Jobs";
import Landing from "./pages/Landing/Landing";
import Messages from "./pages/Messages/Messages";
import Onboarding from "./pages/Onboarding/Onboarding";
import Plan from "./pages/Plan/Plan";
import Profile from "./pages/Profile/Profile";

// LiveKit is large, so the workroom only downloads when someone opens one.
const Workroom = lazy(() => import("./pages/Workroom/Workroom"));

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {children}
    </main>
  );
}

// Groups were renamed to crews. Keeps old /groups links working.
function OldGroupLink() {
  const { crewId } = useParams();
  return <Navigate to={crewId ? `/crews/${crewId}` : "/crews"} replace />;
}

function App() {
  const { isLoading, isAuthenticated } = useAuth0(); // The SDK needs to reach Auth0 on load
  const profile = useProfile();

  if (isLoading || (isAuthenticated && profile.isLoading)) {
    return <CenteredMessage>Loading...</CenteredMessage>;
  }

  if (isAuthenticated && profile.error) {
    return (
      <CenteredMessage>
        <p className="text-slate-700">
          We couldn't load your account: {profile.error}
        </p>
        <button
          type="button"
          onClick={profile.reload}
          className="cursor-pointer rounded-lg bg-teal-700 px-4 py-2 font-medium text-white hover:bg-teal-800"
        >
          Try again
        </button>
      </CenteredMessage>
    );
  }

  const isOnboarded = !!profile.profile?.onboarded_at;

  // Signed-in people go to onboarding until they've finished it.
  const signedInHome = isOnboarded ? "/home" : "/onboarding";

  const requireOnboarded = (page: ReactNode) =>
    !isAuthenticated ? (
      <Navigate to="/login" replace />
    ) : !isOnboarded ? (
      <Navigate to="/onboarding" replace />
    ) : (
      page
    );

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/onboarding"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : isOnboarded ? (
            <Navigate to="/home" replace />
          ) : (
            <Onboarding />
          )
        }
      />
      <Route path="/home" element={requireOnboarded(<Home />)} />
      <Route path="/plan" element={requireOnboarded(<Plan />)} />
      <Route
        path="/confidence-room"
        element={requireOnboarded(<ConfidenceRoom />)}
      />
      <Route
        path="/confidence-room/:sessionId"
        element={requireOnboarded(<ConfidenceRoom />)}
      />
      <Route path="/jobs" element={requireOnboarded(<Jobs />)} />
      <Route path="/profile" element={requireOnboarded(<Profile />)} />
      <Route path="/crews" element={requireOnboarded(<Crews />)} />
      <Route path="/groups" element={<OldGroupLink />} />
      <Route path="/groups/:crewId" element={<OldGroupLink />} />
      <Route path="/messages" element={requireOnboarded(<Messages />)} />
      <Route
        path="/messages/:kind/:conversationId"
        element={requireOnboarded(<Messages />)}
      />
      <Route path="/crews/:crewId" element={requireOnboarded(<CrewDetail />)} />
      <Route
        path="/crews/:crewId/workroom"
        element={requireOnboarded(
          <Suspense fallback={<CenteredMessage>Loading...</CenteredMessage>}>
            <Workroom />
          </Suspense>,
        )}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={signedInHome} replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={signedInHome} replace />
          ) : (
            <Register />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
