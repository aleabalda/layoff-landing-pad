import { Auth0Provider } from "@auth0/auth0-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      // Auth0 returns to the site root, so send people on to their home page.
      onRedirectCallback={() => navigate("/home", { replace: true })}
    >
      {children}
    </Auth0Provider>
  );
}

export default AuthProvider;
