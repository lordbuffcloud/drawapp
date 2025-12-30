import crypto from "node:crypto";

export function hmacSha256Hex(value: string, salt: string): string {
  return crypto.createHmac("sha256", salt).update(value).digest("hex");
}


