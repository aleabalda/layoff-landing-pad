import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { ErrorNote } from "../../components/Card";
import { useProfile } from "../../ProfileProvider";
import { supabase } from "../../supabaseClient";

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

export default PrivacyToggle;
