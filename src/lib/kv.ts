export type KvValue = string | number | boolean | null | object;

export interface Kv {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T extends KvValue>(key: string, value: T, opts?: { exSeconds?: number }): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<void>;
}

class InMemoryKv implements Kv {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const v = this.store.get(key);
    if (!v) return null;
    if (typeof v.expiresAt === "number" && Date.now() > v.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return v.value as T;
  }

  async set<T extends KvValue>(key: string, value: T, opts?: { exSeconds?: number }): Promise<void> {
    const expiresAt = opts?.exSeconds ? Date.now() + opts.exSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async incr(key: string): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + 1;
    await this.set(key, next);
    return next;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export function getKv(): Kv {
  if (process.env.NODE_ENV === "test") {
    const g = globalThis as unknown as { __drawapp_kv__?: Kv };
    if (!g.__drawapp_kv__) g.__drawapp_kv__ = new InMemoryKv();
    return g.__drawapp_kv__;
  }

  // Lazy import so unit tests don't require KV env vars.
  return {
    async get<T = unknown>(key: string) {
      const { kv } = await import("@vercel/kv");
      return (await kv.get<T>(key)) ?? null;
    },
    async set<T extends KvValue>(key: string, value: T, opts?: { exSeconds?: number }) {
      const { kv } = await import("@vercel/kv");
      if (opts?.exSeconds) {
        await kv.set(key, value, { ex: opts.exSeconds });
        return;
      }
      await kv.set(key, value);
    },
    async incr(key: string) {
      const { kv } = await import("@vercel/kv");
      return await kv.incr(key);
    },
    async del(key: string) {
      const { kv } = await import("@vercel/kv");
      await kv.del(key);
    }
  };
}

export function resetTestKv(): void {
  if (process.env.NODE_ENV !== "test") return;
  const g = globalThis as unknown as { __drawapp_kv__?: Kv };
  delete g.__drawapp_kv__;
}


