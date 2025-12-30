import { describe, expect, it, vi } from "vitest";
import { createProSession } from "../../../../src/lib/proSession";
import { resetTestKv } from "../../../../src/lib/kv";
import { GET } from "./route";

describe("/api/pro/status", () => {
  it("returns isPro false without cookie", async () => {
    const req = new Request("http://localhost/api/pro/status");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ isPro: false });
  });

  it("returns isPro true with valid cookie", async () => {
    resetTestKv();
    process.env.HASH_SALT = "test-salt";

    const token = await createProSession({ licenseKey: "LICENSE-123" });
    const req = new Request("http://localhost/api/pro/status", {
      headers: { cookie: `pro_session=${token}` }
    });
    const res = await GET(req);
    expect(await res.json()).toEqual({ isPro: true });
  });
});


