import { createClient } from "@supabase/supabase-js";

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;

// Auth0 only exposes its tokens through React, so AuthProvider passes them in.
export function setSupabaseTokenGetter(getter: TokenGetter) {
  getToken = getter;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local. Restart `npm run dev` after adding them.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  accessToken: () => getToken(),
});
