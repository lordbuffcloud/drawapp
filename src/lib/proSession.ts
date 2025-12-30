import crypto from "node:crypto";
import { getKv, type Kv } from "./kv";
import { hmacSha256Hex } from "./hash";
import { validateLicenseWithLemonSqueezy } from "./lemonSqueezy";

export type ProSessionRecord = {
  licenseKeyHash: string;
  // Stored server-side only to allow revalidation without client-side secrets.
  licenseKey: string;
  validatedAtMs: number;
  revalidateAfterMs: number;
  expiresAtMs: number;
};

export function proSessionKey(sessionToken: string): string {
  return `pro:session:${sessionToken}`;
}

export async function createProSession(opts: { kv?: Kv; licenseKey: string; nowMs?: number }): Promise<string> {
  const kv = opts.kv ?? getKv();
  const nowMs = opts.nowMs ?? Date.now();
  const sessionToken = crypto.randomUUID();

  const salt = process.env.HASH_SALT ?? "test-salt";
  const licenseKeyHash = hmacSha256Hex(opts.licenseKey, salt);

  const record: ProSessionRecord = {
    licenseKeyHash,
    licenseKey: opts.licenseKey,
    validatedAtMs: nowMs,
    revalidateAfterMs: nowMs + 24 * 60 * 60 * 1000,
    expiresAtMs: nowMs + 30 * 24 * 60 * 60 * 1000
  };

  await kv.set(proSessionKey(sessionToken), record, { exSeconds: 30 * 24 * 60 * 60 });
  return sessionToken;
}

export async function getValidProSession(opts: {
  kv?: Kv;
  sessionToken: string;
  nowMs?: number;
}): Promise<{ ok: true; record: ProSessionRecord } | { ok: false }> {
  const kv = opts.kv ?? getKv();
  const nowMs = opts.nowMs ?? Date.now();

  const record = await kv.get<ProSessionRecord>(proSessionKey(opts.sessionToken));
  if (!record) return { ok: false };
  if (nowMs >= record.expiresAtMs) return { ok: false };

  if (nowMs >= record.revalidateAfterMs) {
    const check = await validateLicenseWithLemonSqueezy(record.licenseKey);
    if (!check.ok) {
      await kv.del(proSessionKey(opts.sessionToken));
      return { ok: false };
    }
    const refreshed: ProSessionRecord = {
      ...record,
      validatedAtMs: nowMs,
      revalidateAfterMs: nowMs + 24 * 60 * 60 * 1000
    };
    await kv.set(proSessionKey(opts.sessionToken), refreshed, { exSeconds: 30 * 24 * 60 * 60 });
    return { ok: true, record: refreshed };
  }

  return { ok: true, record };
}


