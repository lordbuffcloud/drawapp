import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestKv } from "../../../src/lib/kv";
import { createProSession } from "../../../src/lib/proSession";
import { POST } from "./route";

vi.mock("../../../src/lib/openaiMockable", () => ({
  generateStepImages: vi.fn(async () => {
    return [
      { step: 1, pngBase64: "AA==" },
      { step: 2, pngBase64: "AA==" },
      { step: 3, pngBase64: "AA==" },
      { step: 4, pngBase64: "AA==" },
      { step: 5, pngBase64: "AA==" },
      { step: 6, pngBase64: "AA==" },
      { step: 7, pngBase64: "AA==" }
    ];
  })
}));

describe("/api/generate", () => {
  beforeEach(() => {
    resetTestKv();
    process.env.HASH_SALT = "test-salt";
    process.env.TURNSTILE_BYPASS = "1";
    process.env.LEMONSQUEEZY_API_KEY = "test-key";
  });

  it("accepts pro_session cookie and does not require turnstileToken", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ valid: true }), { status: 200 });
      })
    );

    const sessionToken = await createProSession({ licenseKey: "LICENSE-123" });

    const fd = new FormData();
    fd.set("prompt", "draw a cat");
    fd.set("stylePreset", "minimal_ink");
    fd.set("printSize", "letter");
    fd.set("clientDeviceId", "device-1");
    // no turnstileToken

    const req = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        cookie: `pro_session=${sessionToken}`
      },
      body: fd
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { meta?: { isPro?: boolean } };
    expect(json.meta?.isPro).toBe(true);
  });

  it("free tier: requires turnstile, consumes quota, returns URLs, blocks second same day", async () => {
    // Turnstile bypass is enabled in test env via env flag.
    const fd1 = new FormData();
    fd1.set("prompt", "draw a cat");
    fd1.set("stylePreset", "minimal_ink");
    fd1.set("printSize", "letter");
    fd1.set("clientDeviceId", "device-1");
    fd1.set("turnstileToken", "test-ok");

    const req1 = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.9"
      },
      body: fd1
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(200);
    const json1 = (await res1.json()) as { posterPngUrl?: string; posterPdfUrl?: string };
    expect(json1.posterPngUrl).toMatch(/^https:\/\//);
    expect(json1.posterPdfUrl).toMatch(/^https:\/\//);

    const fd2 = new FormData();
    fd2.set("prompt", "draw a cat");
    fd2.set("stylePreset", "minimal_ink");
    fd2.set("printSize", "letter");
    fd2.set("clientDeviceId", "device-1");
    fd2.set("turnstileToken", "test-ok");

    const req2 = new Request("http://localhost/api/generate", {
      method: "POST",
      headers: {
        "x-forwarded-for": "203.0.113.9"
      },
      body: fd2
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(429);
    const json2 = (await res2.json()) as { error?: string };
    expect(json2.error?.toLowerCase()).toContain("quota");
  });
});


