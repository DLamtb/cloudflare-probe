// POST /api/auth/logout — destroy session.
import { Env, json } from "../../lib/env";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)probe_session=([^;]*)/);
  const token = match?.[1];

  if (token) {
    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": "probe_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0",
    },
  );
};
