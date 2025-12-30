import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getKv } from "../../../../src/lib/kv";

function sanitizePrompt(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, " ");
  return trimmed.slice(0, 200);
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | null
    | { posterId?: string; includePromptPublicly?: boolean };
  const posterId = body?.posterId?.trim();
  const includePromptPublicly = body?.includePromptPublicly !== false;
  if (!posterId) return NextResponse.json({ error: "posterId is required" }, { status: 400 });

  const kv = getKv();
  const poster = await kv.get<{
    posterId: string;
    createdAtMs: number;
    stylePreset: string;
    customStyle: string;
    printSize: string;
    posterPngUrl: string;
    posterPdfUrl: string;
    thumbnailUrl: string;
    prompt: string;
  }>(`poster:${posterId}`);
  if (!poster) return NextResponse.json({ error: "Poster not found" }, { status: 404 });

  const id = crypto.randomUUID();
  const itemKey = `gallery:item:${id}`;
  const indexKey = "gallery:index";

  const record = {
    id,
    createdAtMs: Date.now(),
    posterId: poster.posterId,
    stylePreset: poster.stylePreset,
    customStyle: poster.customStyle,
    printSize: poster.printSize,
    thumbnailUrl: poster.thumbnailUrl,
    posterPngUrl: poster.posterPngUrl,
    posterPdfUrl: poster.posterPdfUrl,
    prompt: includePromptPublicly ? sanitizePrompt(poster.prompt) : null
  };

  const index = (await kv.get<string[]>(indexKey)) ?? [];
  const nextIndex = [id, ...index.filter((x) => x !== id)].slice(0, 500);

  await Promise.all([kv.set(itemKey, record, { exSeconds: 60 * 60 * 24 * 365 }), kv.set(indexKey, nextIndex)]);

  return NextResponse.json({ id });
}


