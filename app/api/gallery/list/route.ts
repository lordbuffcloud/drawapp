import { NextResponse } from "next/server";
import { getKv } from "../../../../src/lib/kv";

function parseIntParam(v: string | null, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.floor(n));
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = parseIntParam(url.searchParams.get("page"), 1);
  const pageSize = Math.min(48, parseIntParam(url.searchParams.get("pageSize"), 24));
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const style = (url.searchParams.get("style") ?? "").trim();

  const kv = getKv();
  const ids = (await kv.get<string[]>("gallery:index")) ?? [];

  const itemsRaw = await Promise.all(ids.map((id) => kv.get<Record<string, unknown>>(`gallery:item:${id}`)));
  const items = itemsRaw.filter(Boolean) as Array<Record<string, unknown> & { id: string }>;

  const filtered = items.filter((it) => {
    const stylePreset = String(it.stylePreset ?? "");
    const prompt = String(it.prompt ?? "");
    if (style && stylePreset !== style) return false;
    if (q) {
      const hay = `${stylePreset} ${prompt}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const slice = filtered.slice(start, end);
  const nextPage = end < filtered.length ? page + 1 : null;

  return NextResponse.json({ items: slice, nextPage });
}


