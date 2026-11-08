import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import TagPicker, { toggleInList } from "../../components/TagPicker";
import { type Profile, useProfile } from "../../ProfileProvider";
import {
  BIO_MAX_LENGTH,
  EXPERIENCE_LEVELS,
  FIELDS,
  type Option,
  URGENT_NEEDS,
} from "../../profileOptions";
import { supabase } from "../../supabaseClient";

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

function ProfileEditForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth0();
  const { profile, reload } = useProfile();
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.sub) return;

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
    onDone();
  };

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
            onClick={onDone}
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

export default ProfileEditForm;
