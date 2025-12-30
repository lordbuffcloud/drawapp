import { beforeEach, describe, expect, it } from "vitest";
import { getKv, resetTestKv } from "./kv";
import { consumeFixedWindow } from "./rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetTestKv();
  });

  it("blocks after threshold, resets after window", async () => {
    const kv = getKv();
    const nowMs = 1_000_000;
    const windowMs = 60_000;
    const limit = 3;

    const r1 = await consumeFixedWindow({ kv, key: "ipHashX", nowMs, windowMs, limit });
    const r2 = await consumeFixedWindow({ kv, key: "ipHashX", nowMs, windowMs, limit });
    const r3 = await consumeFixedWindow({ kv, key: "ipHashX", nowMs, windowMs, limit });
    const r4 = await consumeFixedWindow({ kv, key: "ipHashX", nowMs, windowMs, limit });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
    expect(r4).toEqual({ ok: false, reason: "rate_limited" });

    const afterWindow = await consumeFixedWindow({ kv, key: "ipHashX", nowMs: nowMs + windowMs + 1, windowMs, limit });
    expect(afterWindow.ok).toBe(true);
  });
});


