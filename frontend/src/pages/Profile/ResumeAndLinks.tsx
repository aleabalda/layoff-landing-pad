import { useAuth0 } from "@auth0/auth0-react";
import { type FormEvent, useEffect, useState } from "react";
import { Card, ErrorNote } from "../../components/Card";
import {
  LinkInputs,
  ResumePicker,
} from "../../components/ResumeAndLinksFields";
import { type Profile, useProfile } from "../../ProfileProvider";
import {
  formatBytes,
  getResumeUrl,
  LINK_FIELDS,
  type LinkKind,
  type Links,
  removeResume,
  saveLinks,
  uploadResume,
  validateLinks,
} from "../../resume";

const linksFrom = (profile: Profile | null): Links => ({
  linkedin: profile?.linkedin_url ?? "",
  github: profile?.github_url ?? "",
  website: profile?.website_url ?? "",
});

// "https://www.linkedin.com/in/ale/" reads better as "linkedin.com/in/ale".
function shortLink(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function formatUploaded(timestamp: string | null) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SECONDARY_BUTTON =
  "shrink-0 cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50";

function ResumeAndLinks() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card labelledBy="resume-links-heading">
      {isEditing ? (
        <EditResumeAndLinks onDone={() => setIsEditing(false)} />
      ) : (
        <ViewResumeAndLinks onEdit={() => setIsEditing(true)} />
      )}
    </Card>
  );
}

function Heading({ title }: { title: string }) {
  return (
    <div>
      <h2
        id="resume-links-heading"
        className="font-semibold tracking-tight text-slate-900"
      >
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600">Only you can see these.</p>
    </div>
  );
}

function ViewResumeAndLinks({ onEdit }: { onEdit: () => void }) {
  const { profile } = useProfile();
  const resumePath = profile?.resume_path ?? null;
  const [resumeUrl, setResumeUrl] = useState<{ path: string; url: string } | null>(
    null,
  );
  const [urlError, setUrlError] = useState<string | null>(null);

  // Private files need a signed link, made fresh whenever the resume changes.
  const uploadedAt = profile?.resume_uploaded_at;
  useEffect(() => {
    if (!resumePath) return;
    let isCurrent = true;

    getResumeUrl(resumePath)
      .then((url) => isCurrent && setResumeUrl({ path: resumePath, url }))
      .catch(
        (err) =>
          isCurrent &&
          setUrlError(err instanceof Error ? err.message : String(err)),
      );

    return () => {
      isCurrent = false;
    };
  }, [resumePath, uploadedAt]);

  const links = LINK_FIELDS.map((field) => ({
    ...field,
    url: linksFrom(profile)[field.kind],
  })).filter((link) => link.url);
  const hasAnything = !!profile?.resume_name || links.length > 0;
  const uploaded = formatUploaded(profile?.resume_uploaded_at ?? null);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <Heading title="Resume and links" />
        <button type="button" onClick={onEdit} className={SECONDARY_BUTTON}>
          {hasAnything ? "Edit" : "Add"}
        </button>
      </div>

      {!hasAnything ? (
        <p className="mt-5 text-sm text-slate-500">
          Nothing here yet.{" "}
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer font-medium text-teal-800 underline"
          >
            Add your resume, LinkedIn, GitHub or website
          </button>
        </p>
      ) : (
        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
            <dt className="text-slate-600">Resume</dt>
            <dd className="min-w-0 text-right">
              {profile?.resume_name ? (
                <>
                  {resumeUrl?.path === resumePath ? (
                    <a
                      href={resumeUrl.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium break-all text-teal-800 underline underline-offset-2"
                    >
                      📄 {profile.resume_name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <span className="break-all text-slate-800">
                      📄 {profile.resume_name}
                    </span>
                  )}
                  {uploaded && (
                    <span className="block text-xs text-slate-500">
                      Added {uploaded}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-400">Not added</span>
              )}
            </dd>
          </div>
          {links.map(({ kind, label, url }) => (
            <div
              key={kind}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5"
            >
              <dt className="text-slate-600">{label}</dt>
              <dd className="min-w-0 text-right">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium break-all text-teal-800 underline underline-offset-2"
                >
                  {shortLink(url)}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <ErrorNote message={urlError && `Couldn't open your resume: ${urlError}`} />
    </>
  );
}

function EditResumeAndLinks({ onDone }: { onDone: () => void }) {
  const { user } = useAuth0();
  const { profile, reload } = useProfile();
  const [links, setLinks] = useState<Links>(() => linksFrom(profile));
  const [linkErrors, setLinkErrors] = useState<Partial<Links>>({});
  const [newResume, setNewResume] = useState<File | null>(null);
  const [removeCurrent, setRemoveCurrent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentName = removeCurrent ? null : (profile?.resume_name ?? null);

  const setLink = (kind: LinkKind, value: string) => {
    setLinks((current) => ({ ...current, [kind]: value }));
    setLinkErrors((current) => ({ ...current, [kind]: undefined }));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user?.sub) return;

    const { urls, errors } = validateLinks(links);
    setLinkErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSaving(true);
    setError(null);

    try {
      await saveLinks(user.sub, urls);
      if (newResume) await uploadResume(user.sub, newResume);
      else if (removeCurrent && profile?.resume_path) {
        await removeResume(user.sub);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsSaving(false);
      // Some of it may have saved, so show what's there now.
      await reload();
      return;
    }

    await reload();
    onDone();
  };

  return (
    <form onSubmit={handleSave}>
      <Heading title="Edit resume and links" />

      <div className="mt-5">
        <ResumePicker
          fileName={newResume?.name ?? currentName}
          fileDetail={
            newResume
              ? `${formatBytes(newResume.size)}, not saved yet`
              : (formatUploaded(profile?.resume_uploaded_at ?? null) ?? undefined)
          }
          onChoose={(file) => {
            setNewResume(file);
            setRemoveCurrent(false);
          }}
          onClear={() =>
            newResume ? setNewResume(null) : setRemoveCurrent(true)
          }
          // Clearing a newly picked file goes back to the saved one, if any.
          clearLabel={newResume && currentName ? "Keep current" : "Remove"}
        />
        {removeCurrent && (
          <p className="mt-2 text-sm text-slate-600">
            Your resume will be deleted when you save.{" "}
            <button
              type="button"
              onClick={() => setRemoveCurrent(false)}
              className="cursor-pointer font-medium text-teal-800 underline"
            >
              Undo
            </button>
          </p>
        )}
      </div>

      <LinkInputs links={links} errors={linkErrors} onChange={setLink} />

      <ErrorNote message={error} />

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onDone}
          disabled={isSaving}
          className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="cursor-pointer rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default ResumeAndLinks;
