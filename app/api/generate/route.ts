import { NextResponse } from "next/server";
import { getRequestIp } from "../../../src/lib/ip";
import { hmacSha256Hex } from "../../../src/lib/hash";
import { consumeDailyQuota } from "../../../src/lib/quota";
import { consumeFixedWindow } from "../../../src/lib/rateLimit";
import { getValidProSession } from "../../../src/lib/proSession";
import { verifyTurnstileToken } from "../../../src/lib/turnstile";
import { generateStepImages } from "../../../src/lib/openaiMockable";
import { generatePosterAssets, type PrintSize } from "../../../src/lib/posterPipeline";
import { putPublicBlob } from "../../../src/lib/blobStore";
import { getKv } from "../../../src/lib/kv";
import crypto from "node:crypto";

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return rest.join("=") || "";
  }
  return null;
}

export const runtime = "nodejs";

export async function POST(req: Request) {
  const fd = await req.formData();

  const prompt = String(fd.get("prompt") ?? "").trim();
  const stylePreset = String(fd.get("stylePreset") ?? "").trim();
  const customStyle = String(fd.get("customStyle") ?? "").trim() || undefined;
  const printSize = String(fd.get("printSize") ?? "").trim() as PrintSize;
  const turnstileToken = String(fd.get("turnstileToken") ?? "").trim();
  const clientDeviceId = String(fd.get("clientDeviceId") ?? "").trim();

  if (!prompt) return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  if (!stylePreset) return NextResponse.json({ error: "stylePreset is required" }, { status: 400 });
  if (printSize !== "letter" && printSize !== "a4") return NextResponse.json({ error: "invalid printSize" }, { status: 400 });
  if (!clientDeviceId) return NextResponse.json({ error: "clientDeviceId is required" }, { status: 400 });

  const ip = getRequestIp(req);
  const salt = process.env.HASH_SALT ?? "test-salt";
  const ipHash = hmacSha256Hex(ip, salt);
  const deviceIdHash = hmacSha256Hex(clientDeviceId, salt);

  const proSessionToken = getCookie(req, "pro_session");
  let isPro = false;
  if (proSessionToken) {
    const session = await getValidProSession({ sessionToken: proSessionToken });
    isPro = session.ok;
  }

  if (!isPro) {
    if (!turnstileToken) return NextResponse.json({ error: "turnstileToken is required" }, { status: 400 });
    const ok = await verifyTurnstileToken(turnstileToken, ip);
    if (!ok) return NextResponse.json({ error: "Turnstile verification failed." }, { status: 400 });

    const rate = await consumeFixedWindow({
      key: ipHash,
      limit: 5,
      windowMs: 60_000
    });
    if (!rate.ok) return NextResponse.json({ error: "Rate limited." }, { status: 429 });

    const quota = await consumeDailyQuota({ deviceIdHash, ipHash });
    if (!quota.ok) return NextResponse.json({ error: "Daily quota exceeded." }, { status: 429 });
  }

  const stepImages = await generateStepImages({ prompt, stylePreset, customStyle });
  if (stepImages.length !== 7) return NextResponse.json({ error: "Internal generation error." }, { status: 500 });

  const stepPngs = stepImages.map((s) => Buffer.from(s.pngBase64, "base64"));
  const assets = await generatePosterAssets({ stepPngs, printSize });

  const posterId = crypto.randomUUID();
  const posterPngKey = `posters/${posterId}/poster.png`;
  const posterPdfKey = `posters/${posterId}/poster-${printSize}.pdf`;
  const thumbKey = `posters/${posterId}/thumb.png`;

  const [posterPngPut, posterPdfPut, thumbPut] = await Promise.all([
    putPublicBlob(posterPngKey, assets.posterPng, { contentType: "image/png" }),
    putPublicBlob(posterPdfKey, assets.posterPdf, { contentType: "application/pdf" }),
    putPublicBlob(thumbKey, assets.thumbnailPng, { contentType: "image/png" })
  ]);

  const kv = getKv();
  await kv.set(
    `poster:${posterId}`,
    {
      posterId,
      createdAtMs: Date.now(),
      stylePreset,
      customStyle: customStyle ?? "",
      printSize,
      posterPngUrl: posterPngPut.url,
      posterPdfUrl: posterPdfPut.url,
      thumbnailUrl: thumbPut.url,
      // Store prompt here for publishing (avoid logging it elsewhere).
      prompt
    },
    { exSeconds: 60 * 60 * 24 * 30 }
  );

  return NextResponse.json({
    posterId,
    posterPngUrl: posterPngPut.url,
    posterPdfUrl: posterPdfPut.url,
    thumbnailUrl: thumbPut.url,
    meta: { isPro }
  });
}


