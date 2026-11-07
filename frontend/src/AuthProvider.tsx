import {
  Auth0Provider,
  type Auth0ContextInterface,
  useAuth0,
} from "@auth0/auth0-react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { setSupabaseTokenGetter } from "./supabaseClient";

const EXPIRY_MARGIN_MS = 60_000;

// Supabase needs the ID token because that's where the Auth0 Action puts the
// `role` claim. Reading the claims doesn't renew an expired one.
async function getFreshIdToken({
  getAccessTokenSilently,
  getIdTokenClaims,
}: Auth0ContextInterface) {
  let claims = await getIdTokenClaims();

  if (claims?.exp && claims.exp * 1000 < Date.now() + EXPIRY_MARGIN_MS) {
    await getAccessTokenSilently({ cacheMode: "off" });
    claims = await getIdTokenClaims();
  }

  return claims?.__raw ?? null;
}

function SupabaseTokenBridge({ children }: { children: ReactNode }) {
  const auth0 = useAuth0();

  // Set during render, not in an effect, because child effects run first and
  // they may already be querying Supabase.
  setSupabaseTokenGetter(() => getFreshIdToken(auth0));

  return children;
}

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
      <SupabaseTokenBridge>{children}</SupabaseTokenBridge>
    </Auth0Provider>
  );
}

export default AuthProvider;
