import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router";
import AuthCard from "../../components/AuthCard";

function Register() {
  const { loginWithRedirect, error } = useAuth0();

  return (
    <AuthCard
      title="Create your account"
      subtitle="It only takes a minute to get started."
      actionLabel="Sign up"
      onAction={() =>
        loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })
      }
      error={error}
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-slate-900 underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    />
  );
}

export default Register;
