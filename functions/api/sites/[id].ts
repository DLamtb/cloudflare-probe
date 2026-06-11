// /api/sites/:id — PUT update, DELETE remove (auth via _middleware).
import { Env, json } from "../../lib/env";
import { deleteSite, getSite, updateSite } from "../../lib/db";
import { parseSite } from "../../lib/validate";

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return json({ error: "Invalid id" }, 400);
  const existing = await getSite(env, id);
  if (!existing) return json({ error: "Not found" }, 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parseSite(body);
  if (parsed instanceof Response) return parsed;
  await updateSite(env, id, parsed);
  return json({ ok: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, params }) => {
  const id = Number(params.id);
  if (!id || Number.isNaN(id)) return json({ error: "Invalid id" }, 400);
  await deleteSite(env, id);
  return json({ ok: true });
};
