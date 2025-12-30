import { beforeEach, describe, expect, it } from "vitest";
import { getKv, resetTestKv } from "../../../../src/lib/kv";
import { GET } from "./route";

describe("/api/gallery/list", () => {
  beforeEach(() => {
    resetTestKv();
  });

  it("lists gallery items with basic pagination", async () => {
    const kv = getKv();
    await kv.set("gallery:index", ["g1", "g2"]);
    await kv.set("gallery:item:g1", { id: "g1", stylePreset: "minimal_ink", prompt: "cat" });
    await kv.set("gallery:item:g2", { id: "g2", stylePreset: "manga", prompt: "dog" });

    const req = new Request("http://localhost/api/gallery/list?page=1&pageSize=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { items?: unknown[]; nextPage?: number | null };
    expect(json.items?.length).toBe(1);
    expect(json.nextPage).toBe(2);
  });
});


