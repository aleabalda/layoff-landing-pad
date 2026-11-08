import { Card } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import {
  ALL_TAGS,
  EXPERIENCE_LEVELS,
  FIELDS,
  URGENT_NEEDS,
  labelFor,
} from "../../profileOptions";
import PrivacyToggle from "./PrivacyToggle";

function ProfileSummary({ onEdit }: { onEdit: () => void }) {
  const { profile } = useProfile();

  const details = [
    labelFor(FIELDS, profile?.field),
    labelFor(EXPERIENCE_LEVELS, profile?.experience_level),
    profile?.city,
  ].filter(Boolean);
  const tags = ALL_TAGS.filter((tag) => profile?.tags.includes(tag.value));
  const urgentNeed = labelFor(URGENT_NEEDS, profile?.urgent_need);

  return (
    <Card labelledBy="profile-heading">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xl font-semibold text-teal-800"
          >
            {profile?.display_name?.trim().charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h1
              id="profile-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900"
            >
              {profile?.display_name}
            </h1>
            {details.length > 0 && (
              <p className="mt-1 text-sm text-slate-600">
                {details.join(" · ")}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit
        </button>
      </div>

      {profile?.bio ? (
        <p className="mt-5 text-sm whitespace-pre-line text-slate-700">
          {profile.bio}
        </p>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          No bio yet.{" "}
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer font-medium text-teal-800 underline"
          >
            Add a few lines about yourself
          </button>
        </p>
      )}

      {urgentNeed && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Focusing on:</span>{" "}
          {urgentNeed}
        </p>
      )}

      {tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
          {tags.map(({ value, label }) => (
            <li
              key={value}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
            >
              {label}
            </li>
          ))}
        </ul>
      )}

      <PrivacyToggle
        first
        setting="discoverable"
        label="Suggest me to people in a similar spot"
        hint="Others see your name, field, experience, city, bio and tags. How your job ended and how you're feeling stay private."
      />
      <PrivacyToggle
        setting="share_pulse"
        label="Share my milestones with my crews"
        hint="Crewmates see things like “landed an interview” or “sent 3 applications this week” in their Crew pulse. Never company names, job titles or how you're feeling."
      />
    </Card>
  );
}

export default ProfileSummary;
