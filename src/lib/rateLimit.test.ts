import { beforeEach, describe, expect, it } from "vitest";
import { getKv, resetTestKv } from "./kv";
import { consumeTokenBucket } from "./rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetTestKv();
  });

  it("token bucket blocks after limit", async () => {
    const kv = getKv();
    const nowMs = 1_000_000;
    const capacity = 3;
    const refillPerSecond = 0; // no refill during the test window

    const r1 = await consumeTokenBucket({ kv, key: "ipHashX", nowMs, capacity, refillPerSecond });
    const r2 = await consumeTokenBucket({ kv, key: "ipHashX", nowMs, capacity, refillPerSecond });
    const r3 = await consumeTokenBucket({ kv, key: "ipHashX", nowMs, capacity, refillPerSecond });
    const r4 = await consumeTokenBucket({ kv, key: "ipHashX", nowMs, capacity, refillPerSecond });

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    expect(r3.ok).toBe(true);
    expect(r4).toEqual({ ok: false, reason: "rate_limited" });
  });
});


