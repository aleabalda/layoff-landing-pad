import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useState } from "react";
import TagPicker, { toggleInList } from "../../components/TagPicker";
import { type Profile, useProfile } from "../../ProfileProvider";
import {
  ALL_TAGS,
  BIO_MAX_LENGTH,
  EXPERIENCE_LEVELS,
  FIELDS,
  type Option,
  URGENT_NEEDS,
  labelFor,
} from "../../profileOptions";
import { supabase } from "../../supabaseClient";
import { Card, ErrorNote } from "../../components/Card";

type Draft = {
  display_name: string;
  city: string;
  bio: string;
  field: string;
  experience_level: string;
  urgent_need: string;
  tags: string[];
};

const toDraft = (profile: Profile | null): Draft => ({
  display_name: profile?.display_name ?? "",
  city: profile?.city ?? "",
  bio: profile?.bio ?? "",
  field: profile?.field ?? "",
  experience_level: profile?.experience_level ?? "",
  urgent_need: profile?.urgent_need ?? "",
  tags: profile?.tags ?? [],
});

function ProfileDetails() {
  const { user } = useAuth0();
  const { profile, reload } = useProfile();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setError(null);
    setDraft(toDraft(profile));
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => current && { ...current, [key]: value });

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft || !user?.sub) return;

    if (!draft.display_name.trim()) {
      setError("Please add your name.");
      return;
    }

    setIsSaving(true);
    setError(null);

    const { error } = await supabase
      .from("users")
      .update({
        display_name: draft.display_name.trim(),
        city: draft.city.trim() || null,
        bio: draft.bio.trim() || null,
        field: draft.field,
        experience_level: draft.experience_level,
        urgent_need: draft.urgent_need,
        tags: draft.tags,
      })
      .eq("id", user.sub);

    setIsSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    await reload();
    setDraft(null);
  };

  if (draft) {
    return (
      <Card labelledBy="profile-heading">
        <form onSubmit={handleSave}>
          <h1
            id="profile-heading"
            className="text-xl font-semibold tracking-tight text-slate-900"
          >
            Edit your profile
          </h1>

          <TextInput
            id="edit-name"
            label="Name"
            value={draft.display_name}
            onChange={(value) => set("display_name", value)}
            required
          />
          <TextInput
            id="edit-city"
            label="City (optional)"
            value={draft.city}
            onChange={(value) => set("city", value)}
          />

          <div className="mt-5">
            <label
              htmlFor="edit-bio"
              className="text-sm font-medium text-slate-900"
            >
              Bio (optional)
            </label>
            <p className="mt-1 text-sm text-slate-500">
              A few lines about you, what you did, and what you're hoping for
              next.
            </p>
            <textarea
              id="edit-bio"
              rows={4}
              maxLength={BIO_MAX_LENGTH}
              value={draft.bio}
              onChange={(event) => set("bio", event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-slate-500">
              {draft.bio.length}/{BIO_MAX_LENGTH}
            </p>
          </div>

          <SelectInput
            id="edit-field"
            label="Field"
            options={FIELDS}
            value={draft.field}
            onChange={(value) => set("field", value)}
          />
          <SelectInput
            id="edit-experience"
            label="Experience"
            options={EXPERIENCE_LEVELS}
            value={draft.experience_level}
            onChange={(value) => set("experience_level", value)}
          />
          <SelectInput
            id="edit-urgent"
            label="What feels most urgent right now"
            options={URGENT_NEEDS}
            value={draft.urgent_need}
            onChange={(value) => set("urgent_need", value)}
          />

          <h2 className="mt-8 text-sm font-semibold text-slate-900">Tags</h2>
          <p className="mt-1 text-sm text-slate-500">
            We use these to match you with people in a similar spot.
          </p>
          <TagPicker
            selected={draft.tags}
            onToggle={(tag) => set("tags", toggleInList(draft.tags, tag))}
          />

          <ErrorNote message={error} />

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="cursor-pointer rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </Card>
    );
  }

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
          onClick={startEditing}
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
            onClick={startEditing}
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

// Saves as soon as it's switched, so it lives outside the edit form.
function PrivacyToggle({
  setting,
  label,
  hint,
  first = false,
}: {
  setting: "discoverable" | "share_pulse";
  label: string;
  hint: string;
  first?: boolean;
}) {
  const { user } = useAuth0();
  const { profile, reload } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOn = profile?.[setting] ?? true;

  const toggle = async () => {
    if (!user?.sub) return;
    setIsSaving(true);
    setError(null);

    const { error } = await supabase
      .from("users")
      .update({ [setting]: !isOn })
      .eq("id", user.sub);

    if (error) setError(error.message);
    else await reload();
    setIsSaving(false);
  };

  return (
    <div className={first ? "mt-6 border-t border-slate-100 pt-5" : "mt-5"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            id={`${setting}-label`}
            className="text-sm font-medium text-slate-900"
          >
            {label}
          </p>
          <p id={`${setting}-hint`} className="mt-1 text-sm text-slate-500">
            {hint}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-labelledby={`${setting}-label`}
          aria-describedby={`${setting}-hint`}
          disabled={isSaving}
          onClick={toggle}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-60 ${
            isOn ? "bg-teal-600" : "bg-slate-300"
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
              isOn ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
      <ErrorNote message={error} />
    </div>
  );
}

function TextInput({
  id,
  label,
  value,
  onChange,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
      />
    </div>
  );
}

function SelectInput({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-5">
      <label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ProfileDetails;
