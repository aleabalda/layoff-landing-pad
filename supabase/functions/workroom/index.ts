// Crew workrooms: hands out LiveKit passes and lists who's in a room.
//
// POST { crewId, action: "join" | "status" } with the person's Auth0 token in
// the Authorization header (supabase.functions.invoke does this).
//
// Membership is checked by calling get_workroom_identity() *as the person*,
// so the database's own rules decide who gets in. The Auth0 token is checked
// by the database (Supabase third-party auth), which is why this function is
// deployed with --no-verify-jwt: the Edge gateway only understands Supabase's
// own tokens.
//
// Secrets (supabase secrets set ...): LIVEKIT_URL (wss://...),
// LIVEKIT_API_KEY, LIVEKIT_API_SECRET. SUPABASE_URL and SUPABASE_ANON_KEY are
// provided automatically.

import { createClient } from "npm:@supabase/supabase-js@2.119.0";
import { AccessToken, RoomServiceClient } from "npm:livekit-server-sdk@2.19.2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A pass lasts long enough for a working session; rejoining gets a new one.
const PASS_TTL = "4h";

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

const roomName = (crewId: string) => `crew-${crewId}`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (request.method !== "POST") return reply(405, { error: "Use POST" });

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply(401, { error: "Not signed in" });

  let crewId: unknown;
  let action: unknown;
  try {
    ({ crewId, action } = await request.json());
  } catch {
    return reply(400, { error: "Send JSON" });
  }
  if (typeof crewId !== "string" || !UUID.test(crewId)) {
    return reply(400, { error: "crewId must be a crew's id" });
  }
  if (action !== "join" && action !== "status") {
    return reply(400, { error: 'action must be "join" or "status"' });
  }

  try {
    // Acts as the person, so row-level security and membership checks apply.
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data, error } = await supabase
      .rpc("get_workroom_identity", { target_crew: crewId })
      .single<{ user_id: string; display_name: string; crew_name: string }>();
    if (error || !data) {
      return reply(403, { error: error?.message ?? "Not allowed" });
    }

    const livekitUrl = env("LIVEKIT_URL");
    const apiKey = env("LIVEKIT_API_KEY");
    const apiSecret = env("LIVEKIT_API_SECRET");
    const room = roomName(crewId);

    if (action === "status") {
      const rooms = new RoomServiceClient(
        livekitUrl.replace(/^ws/, "http"),
        apiKey,
        apiSecret,
      );
      // A room only exists while someone is in it.
      const participants = await rooms.listParticipants(room).catch(() => []);
      return reply(200, {
        participants: participants.map((p) => ({ identity: p.identity, name: p.name })),
      });
    }

    const pass = new AccessToken(apiKey, apiSecret, {
      identity: data.user_id,
      name: data.display_name,
      ttl: PASS_TTL,
    });
    pass.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    return reply(200, {
      token: await pass.toJwt(),
      url: livekitUrl,
      crewName: data.crew_name,
    });
  } catch (err) {
    console.error(err);
    return reply(500, { error: "The workroom isn't available right now." });
  }
});
