import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { ErrorNote } from "../../components/Card";
import { supabase } from "../../supabaseClient";

function JoinWithCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;

    setIsJoining(true);
    setError(null);
    const { data, error } = await supabase.rpc("join_crew_by_code", {
      code: code.trim(),
    });
    setIsJoining(false);

    if (error) setError(error.message);
    else navigate(`/crews/${data}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-dashed border-slate-300 bg-white p-5"
    >
      <label
        htmlFor="invite-code"
        className="text-sm font-medium text-slate-900"
      >
        Got an invite code for a private crew?
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="invite-code"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. 4F9A1C27B3"
          autoComplete="off"
          className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tracking-wider text-slate-900 uppercase placeholder:tracking-normal placeholder:normal-case focus:border-teal-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isJoining || !code.trim()}
          className="cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </div>
      <ErrorNote message={error} />
    </form>
  );
}

export default JoinWithCode;
