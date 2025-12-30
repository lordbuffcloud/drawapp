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
});


