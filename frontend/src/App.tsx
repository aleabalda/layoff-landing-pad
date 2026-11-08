import { useAuth0 } from "@auth0/auth0-react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useProfile } from "./ProfileProvider";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Home from "./pages/Home/Home";
import Landing from "./pages/Landing/Landing";
import Onboarding from "./pages/Onboarding/Onboarding";
import Profile from "./pages/Profile/Profile";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center text-sm text-slate-500">
      {children}
    </main>
  );
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
          className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
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
      <Route path="/profile" element={requireOnboarded(<Profile />)} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={signedInHome} replace /> : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to={signedInHome} replace /> : <Register />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
