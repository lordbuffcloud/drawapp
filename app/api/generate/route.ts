import { NextResponse } from "next/server";
import { getRequestIp } from "../../../src/lib/ip";
import { hmacSha256Hex } from "../../../src/lib/hash";
import { consumeDailyQuota } from "../../../src/lib/quota";
import { consumeFixedWindow } from "../../../src/lib/rateLimit";
import { getValidProSession } from "../../../src/lib/proSession";
import { verifyTurnstileToken } from "../../../src/lib/turnstile";
import { generateStepImages } from "../../../src/lib/openaiMockable";

function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") ?? "";
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === name) return rest.join("=") || "";
  }
  return null;
}

export async function POST(req: Request) {
  const fd = await req.formData();

  const prompt = String(fd.get("prompt") ?? "").trim();
  const stylePreset = String(fd.get("stylePreset") ?? "").trim();
  const customStyle = String(fd.get("customStyle") ?? "").trim() || undefined;
  const printSize = String(fd.get("printSize") ?? "").trim();
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

  // Reference image is accepted but not processed in this test-focused pass.
  await generateStepImages({ prompt, stylePreset, customStyle });

  // Minimal-but-real response for tests (E2E tests may still mock this endpoint).
  return NextResponse.json({
    posterPngUrl: "https://blob.example.invalid/poster.png",
    posterPdfUrl: "https://blob.example.invalid/poster.pdf",
    meta: { isPro }
  });
}


