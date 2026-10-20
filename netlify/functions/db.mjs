import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[\w-]{8,64}$/.test(id)) return json({ error: "Code d'espace invalide." }, 400);

  const store = getStore({ name: "sirius", consistency: "strong" });

  if (req.method === "GET") {
    const data = await store.get(id, { type: "json" });
    if (data === null) return json({ error: "Espace introuvable." }, 404);
    return json(data);
  }

  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 4_000_000) return json({ error: "Document trop volumineux." }, 413);
    try {
      const parsed = JSON.parse(text);
      if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    } catch {
      return json({ error: "JSON invalide." }, 400);
    }
    await store.set(id, text);
    return json({ ok: true });
  }

  return json({ error: "Méthode non autorisée." }, 405);
};

export const config = { path: "/api/db" };
