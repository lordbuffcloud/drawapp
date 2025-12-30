import { getKv, type Kv } from "./kv";

export type RateLimitResult = { ok: true } | { ok: false; reason: "rate_limited" };

type TokenBucketState = {
  tokens: number;
  lastRefillMs: number;
};

export async function consumeTokenBucket(opts: {
  kv?: Kv;
  key: string;
  nowMs?: number;
  capacity: number;
  refillPerSecond: number;
}): Promise<RateLimitResult> {
  const kv = opts.kv ?? getKv();
  const nowMs = opts.nowMs ?? Date.now();

  const stateKey = `ratelimit:bucket:${opts.key}`;
  const existing = await kv.get<TokenBucketState>(stateKey);
  const prev: TokenBucketState = existing ?? { tokens: opts.capacity, lastRefillMs: nowMs };

  const elapsedSec = Math.max(0, (nowMs - prev.lastRefillMs) / 1000);
  const refilledTokens = Math.min(opts.capacity, prev.tokens + elapsedSec * opts.refillPerSecond);
  const next: TokenBucketState = { tokens: refilledTokens, lastRefillMs: nowMs };

  if (next.tokens < 1) {
    await kv.set(stateKey, next, { exSeconds: 60 * 10 });
    return { ok: false, reason: "rate_limited" };
  }

  next.tokens = next.tokens - 1;
  await kv.set(stateKey, next, { exSeconds: 60 * 10 });
  return { ok: true };
}


