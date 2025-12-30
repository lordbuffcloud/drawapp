import { getServerEnv } from "./env";

export async function putPublicBlob(
  key: string,
  data: Uint8Array | Buffer,
  opts: { contentType: string }
): Promise<{ url: string }> {
  const env = getServerEnv();
  const { put } = await import("@vercel/blob");
  const body = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const res = await put(key, body, {
    access: "public",
    contentType: opts.contentType,
    token: env.BLOB_READ_WRITE_TOKEN
  });
  return { url: res.url };
}


