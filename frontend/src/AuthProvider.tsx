import { Auth0Provider } from "@auth0/auth0-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain="dev-tlkhqn87ejcbzcpl.us.auth0.com"
      clientId="SywSo1q28MUiU8QLwKLBxx5aMPc37Anc"
      authorizationParams={{ redirect_uri: window.location.origin }}
      // Auth0 returns to the site root, so send people on to their home page.
      onRedirectCallback={() => navigate("/home", { replace: true })}
    >
      {children}
    </Auth0Provider>
  );
}

export default AuthProvider;
