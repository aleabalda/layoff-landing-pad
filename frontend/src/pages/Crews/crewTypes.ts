export type Visibility = "public" | "private";
export type CrewRole = "owner" | "member";

export type CrewSummary = {
  id: string;
  name: string;
  description: string | null;
  visibility: Visibility;
  tags: string[];
  member_count: number;
  my_role: CrewRole | null;
  created_at: string;
};

// Only filled in for the owner.
export type CrewDetails = CrewSummary & { invite_code: string | null };

export type CrewMember = {
  user_id: string;
  display_name: string | null;
  field: string | null;
  experience_level: string | null;
  city: string | null;
  role: CrewRole;
  joined_at: string;
};

export type CrewValues = {
  name: string;
  description: string;
  visibility: Visibility;
  tags: string[];
};

// Must match the checks in supabase/migrations/20261108020000_groups.sql
// (the tables were renamed to crews in 20261108060000_groups_become_crews.sql).
export const CREW_NAME_MIN = 3;
export const CREW_NAME_MAX = 60;
export const CREW_DESCRIPTION_MAX = 1000;
export const CREW_TAGS_MAX = 5;
