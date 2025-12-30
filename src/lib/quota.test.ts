import { beforeEach, describe, expect, it } from "vitest";
import { getKv, resetTestKv } from "./kv";
import { consumeDailyQuota } from "./quota";

describe("quota", () => {
  beforeEach(() => {
    resetTestKv();
  });

  it("first call consumes daily quota", async () => {
    const kv = getKv();
    const res = await consumeDailyQuota({
      kv,
      now: new Date("2025-01-01T12:00:00Z"),
      deviceIdHash: "dev",
      ipHash: "ip"
    });
    expect(res).toEqual({ ok: true });
  });

  it("second call same day rejects", async () => {
    const kv = getKv();
    const now = new Date("2025-01-01T12:00:00Z");
    await consumeDailyQuota({ kv, now, deviceIdHash: "dev", ipHash: "ip" });
    const res2 = await consumeDailyQuota({ kv, now, deviceIdHash: "dev", ipHash: "ip" });
    expect(res2).toEqual({ ok: false, reason: "quota_exceeded" });
  });

  it("next day allows", async () => {
    const kv = getKv();
    await consumeDailyQuota({
      kv,
      now: new Date("2025-01-01T12:00:00Z"),
      deviceIdHash: "dev",
      ipHash: "ip"
    });
    const res2 = await consumeDailyQuota({
      kv,
      now: new Date("2025-01-02T12:00:00Z"),
      deviceIdHash: "dev",
      ipHash: "ip"
    });
    expect(res2).toEqual({ ok: true });
  });

  it("device+ip enforcement both apply (device change still blocked by ip)", async () => {
    const kv = getKv();
    const now = new Date("2025-01-01T12:00:00Z");
    await consumeDailyQuota({ kv, now, deviceIdHash: "devA", ipHash: "ipX" });
    const res = await consumeDailyQuota({ kv, now, deviceIdHash: "devB", ipHash: "ipX" });
    expect(res).toEqual({ ok: false, reason: "quota_exceeded" });
  });

  it("device+ip enforcement both apply (ip change still blocked by device)", async () => {
    const kv = getKv();
    const now = new Date("2025-01-01T12:00:00Z");
    await consumeDailyQuota({ kv, now, deviceIdHash: "devA", ipHash: "ipX" });
    const res = await consumeDailyQuota({ kv, now, deviceIdHash: "devA", ipHash: "ipY" });
    expect(res).toEqual({ ok: false, reason: "quota_exceeded" });
  });
});


