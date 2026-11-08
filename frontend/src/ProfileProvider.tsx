import { useAuth0 } from "@auth0/auth0-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabaseClient";

export type Profile = {
  display_name: string | null;
  city: string | null;
  bio: string | null;
  job_end_reason: string | null;
  initial_feeling: string | null;
  urgent_need: string | null;
  field: string | null;
  experience_level: string | null;
  tags: string[];
  discoverable: boolean;
  share_pulse: boolean;
  onboarded_at: string | null;
  plan_start_date: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  resume_path: string | null;
  resume_name: string | null;
  resume_uploaded_at: string | null;
  created_at: string;
};

const PROFILE_COLUMNS =
  "display_name, city, bio, job_end_reason, initial_feeling, urgent_need, field, experience_level, tags, discoverable, share_pulse, onboarded_at, plan_start_date, linkedin_url, github_url, website_url, resume_path, resume_name, resume_uploaded_at, created_at";

type ProfileState = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const ProfileContext = createContext<ProfileState | null>(null);

// Loads the signed-in person's database row, creating it on their first visit.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth0();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    const created = await supabase.rpc("ensure_user");
    if (created.error) throw created.error;

    // Row-level security only returns the signed-in person's own row.
    const { data, error } = await supabase
      .from("users")
      .select(PROFILE_COLUMNS)
      .maybeSingle();
    if (error) throw error;

    return data as Profile | null;
  }, []);

  // Refreshes without the loading screen, so the current page stays put.
  const reload = useCallback(async () => {
    setError(null);
    try {
      setProfile(await fetchProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    setError(null);

    fetchProfile()
      .then((data) => isCurrent && setProfile(data))
      .catch(
        (err) =>
          isCurrent &&
          setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => isCurrent && setIsLoading(false));

    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, fetchProfile]);

  return (
    <ProfileContext.Provider value={{ profile, isLoading, error, reload }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context)
    throw new Error("useProfile must be used inside ProfileProvider");
  return context;
}
