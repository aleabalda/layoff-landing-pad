// Request and response helpers shared by API routes.

// An error whose message is safe to show the person, with the HTTP status to
// send it with. Anything else becomes a generic 500.
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Turns a Supabase error into one that's safe to show. A bad or expired token
// becomes "Please log in again." rather than a raw JWT message.
export function fromDatabaseError(error: { code?: string; message: string }) {
  const isAuthProblem =
    error.code === "PGRST301" || error.code === "PGRST302" || /jwt/i.test(error.message);
  if (isAuthProblem) return new HttpError(401, "Please log in again.");
  console.error("Database error", error);
  return new HttpError(500, "Something went wrong. Please try again.");
}

export function reply(status: number, body: unknown) {
  return Response.json(body, { status });
}

// Runs a route and turns whatever it returns or throws into a JSON response.
export async function handle(
  name: string,
  run: () => Promise<unknown>,
): Promise<Response> {
  try {
    return reply(200, await run());
  } catch (err) {
    if (err instanceof HttpError) return reply(err.status, { error: err.message });
    console.error(`${name} failed`, err);
    return reply(500, { error: "Something went wrong. Please try again." });
  }
}

// The token from an "Authorization: Bearer <token>" header.
export function getBearerToken(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "Please log in again.");
  return token;
}

export async function readJsonBody(request: Request) {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object") return body as Record<string, unknown>;
  } catch {
    // Falls through to the error below.
  }
  throw new HttpError(400, "That request wasn't valid.");
}
