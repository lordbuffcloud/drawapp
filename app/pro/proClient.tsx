"use client";

import { useState } from "react";

export function ProClient({ checkoutUrl }: { checkoutUrl: string }) {
  const [licenseKey, setLicenseKey] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("working");
    const res = await fetch("/api/license/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ licenseKey })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus("error");
      setError(json?.error ?? "Unlock failed.");
      return;
    }
    setStatus("success");
  }

  return (
    <div>
      <h1>Pro</h1>
      <p style={{ margin: "0 0 12px 0", color: "var(--muted)" }}>Unlock Pro to remove free-tier limits.</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a className="btn btnPrimary" href={checkoutUrl || "#"} aria-disabled={!checkoutUrl}>
          Upgrade
        </a>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2>Unlock with license key</h2>
        <form onSubmit={onUnlock} style={{ display: "grid", gap: 12 }}>
          <label>
            License key
            <input value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} />
          </label>
          <button className="primary" type="submit" disabled={!licenseKey.trim() || status === "working"}>
            {status === "working" ? "Unlocking…" : "Unlock Pro"}
          </button>
        </form>
        {status === "success" ? <p role="status">Pro unlocked.</p> : null}
        {status === "error" && error ? (
          <p role="alert" style={{ marginTop: 10 }}>
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}


