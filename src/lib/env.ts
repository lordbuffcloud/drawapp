import { z } from "zod";

const serverEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().min(1).default("gpt-image-1.5"),

  LEMONSQUEEZY_API_KEY: z.string().min(1),
  LEMONSQUEEZY_CHECKOUT_URL: z.string().url(),

  TURNSTILE_SECRET_KEY: z.string().min(1),

  HASH_SALT: z.string().min(16),

  BLOB_READ_WRITE_TOKEN: z.string().min(1)
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL: z.string().url().optional(),
  TURNSTILE_SITE_KEY: z.string().min(1).optional()
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    // Do not print secrets/values.
    throw new Error(`Missing/invalid server env vars: ${missing}`);
  }
  return parsed.data;
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(process.env);
  if (!parsed.success) return {};
  return parsed.data;
}


