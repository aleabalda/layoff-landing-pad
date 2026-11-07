import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import AuthCard from "../../components/AuthCard";

function Login() {
  const { loginWithRedirect, error } = useAuth0();

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to pick up where you left off."
      actionLabel="Log in"
      onAction={() => loginWithRedirect()}
      error={error}
      footer={
        <>
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    />
  );
}

export default Login;
