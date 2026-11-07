import { useAuth0 } from "@auth0/auth0-react";
import { Navigate, Route, Routes } from "react-router";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Home from "./pages/Home/Home";
import Landing from "./pages/Landing/Landing";

function App() {
  const { isLoading, isAuthenticated } = useAuth0(); // The SDK needs to reach Auth0 on load

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading...
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/home"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/home" replace /> : <Register />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
