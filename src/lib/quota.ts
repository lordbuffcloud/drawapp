import { getKv, type Kv } from "./kv";

export type DailyQuotaResult = { ok: true } | { ok: false; reason: "quota_exceeded" };

export function formatUtcDay(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function dailyDeviceKey(day: string, deviceIdHash: string): string {
  return `quota:free:device:${day}:${deviceIdHash}`;
}

export function dailyIpKey(day: string, ipHash: string): string {
  return `quota:free:ip:${day}:${ipHash}`;
}

export async function consumeDailyQuota(opts: {
  kv?: Kv;
  now?: Date;
  deviceIdHash: string;
  ipHash: string;
}): Promise<DailyQuotaResult> {
  const kv = opts.kv ?? getKv();
  const now = opts.now ?? new Date();
  const day = formatUtcDay(now);
  const deviceKey = dailyDeviceKey(day, opts.deviceIdHash);
  const ipKey = dailyIpKey(day, opts.ipHash);

  const [deviceUsed, ipUsed] = await Promise.all([kv.get(deviceKey), kv.get(ipKey)]);
  if (deviceUsed || ipUsed) return { ok: false, reason: "quota_exceeded" };

  // Keep minimal retention: only store a boolean marker; expire after ~2 days to cover timezones.
  await Promise.all([
    kv.set(deviceKey, true, { exSeconds: 60 * 60 * 48 }),
    kv.set(ipKey, true, { exSeconds: 60 * 60 * 48 })
  ]);

  return { ok: true };
}


