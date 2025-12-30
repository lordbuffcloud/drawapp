export default function ProPage() {
  const checkoutUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? "";
  return (
    <main style={{ padding: 24, maxWidth: 860 }}>
      <h1 style={{ marginTop: 0 }}>Pro</h1>
      <p>
        <a href={checkoutUrl || "#"} aria-disabled={!checkoutUrl}>
          Upgrade
        </a>
      </p>
      <form method="post" action="/api/license/validate" style={{ display: "grid", gap: 12 }}>
        <label>
          Unlock Pro (license key)
          <input name="licenseKey" style={{ width: "100%" }} />
        </label>
        <button type="submit">Unlock</button>
      </form>
      <p style={{ marginTop: 16, color: "#555" }}>
        Note: In this MVP scaffold, the form posts to the API route; tests cover the API behavior. UI polish comes later.
      </p>
    </main>
  );
}


