import { getAuthToken } from "./supabaseClient";

// Calls one of our own API routes (frontend/api/) as the signed-in person.
// Throws an Error with a message that's safe to show them.
export async function postApi<T>(path: string, body: unknown): Promise<T> {
  const token = await getAuthToken();
  if (!token) throw new Error("Please log in again.");

  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  }
  return data;
}
