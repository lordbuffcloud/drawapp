import { GenerateClient } from "./generateClient";

export default function GeneratePage() {
  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY ?? "";
  const bypassTurnstile = process.env.TURNSTILE_BYPASS === "1";
  return <GenerateClient turnstileSiteKey={turnstileSiteKey} bypassTurnstile={bypassTurnstile} />;
}


