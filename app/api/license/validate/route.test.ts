import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetTestKv } from "../../../../src/lib/kv";
import { POST } from "./route";

describe("/api/license/validate", () => {
  beforeEach(() => {
    resetTestKv();
    process.env.HASH_SALT = "test-salt";
    process.env.LEMONSQUEEZY_API_KEY = "test-key";
  });

  it("sets pro_session cookie on valid license", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(JSON.stringify({ valid: true }), { status: 200 });
      })
    );

    const req = new Request("http://localhost/api/license/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ licenseKey: "LICENSE-123" })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toMatch(/pro_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
  });
});


