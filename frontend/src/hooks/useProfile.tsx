import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "../lib/supabase";

export function useProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth0();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.sub)
      .maybeSingle() // returns null instead of an error if no row
      .then(({ data }) => {
        setProfile(data);
        setLoading(false);
      });
  }, [authLoading, isAuthenticated, user]);

  return { profile, setProfile, loading };
}
