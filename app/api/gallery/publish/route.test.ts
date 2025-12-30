import { beforeEach, describe, expect, it } from "vitest";
import { getKv, resetTestKv } from "../../../../src/lib/kv";
import { POST } from "./route";

describe("/api/gallery/publish", () => {
  beforeEach(() => {
    resetTestKv();
  });

  it("publishes an existing poster record into the gallery", async () => {
    const kv = getKv();
    await kv.set("poster:poster-1", {
      posterId: "poster-1",
      posterPngUrl: "https://blob.test/poster.png",
      posterPdfUrl: "https://blob.test/poster.pdf",
      thumbnailUrl: "https://blob.test/thumb.png",
      prompt: "Draw a cat",
      stylePreset: "minimal_ink",
      customStyle: "",
      printSize: "letter",
      createdAtMs: 1
    });

    const req = new Request("http://localhost/api/gallery/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        posterId: "poster-1",
        includePromptPublicly: true
      })
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { id?: string };
    expect(json.id).toBeTruthy();
  });
});


