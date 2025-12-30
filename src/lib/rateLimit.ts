import { getKv, type Kv } from "./kv";

export type RateLimitResult = { ok: true } | { ok: false; reason: "rate_limited" };

type FixedWindowState = {
  count: number;
  resetAtMs: number;
};

export async function consumeFixedWindow(opts: {
  kv?: Kv;
  key: string;
  nowMs?: number;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const kv = opts.kv ?? getKv();
  const nowMs = opts.nowMs ?? Date.now();

  const stateKey = `ratelimit:window:${opts.key}`;
  const existing = await kv.get<FixedWindowState>(stateKey);

  const fresh: FixedWindowState = { count: 0, resetAtMs: nowMs + opts.windowMs };
  const prev = existing && existing.resetAtMs > nowMs ? existing : fresh;
  const next: FixedWindowState = { ...prev, count: prev.count + 1 };

  const exSeconds = Math.max(1, Math.ceil((next.resetAtMs - nowMs) / 1000));
  await kv.set(stateKey, next, { exSeconds });

  if (next.count > opts.limit) return { ok: false, reason: "rate_limited" };
  return { ok: true };
}


