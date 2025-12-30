export type LemonValidateResult =
  | { ok: true; licenseKey: string }
  | { ok: false; error: string };

export async function validateLicenseWithLemonSqueezy(licenseKey: string): Promise<LemonValidateResult> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("Missing LEMONSQUEEZY_API_KEY");

  const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({ license_key: licenseKey })
  });

  if (!res.ok) {
    return { ok: false, error: "License validation failed." };
  }

  const json = (await res.json()) as { valid?: boolean };
  if (!json.valid) return { ok: false, error: "Invalid license key." };
  return { ok: true, licenseKey };
}


