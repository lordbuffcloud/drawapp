"use client";

import Script from "next/script";
import { useEffect, useId, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export function TurnstileWidget({
  siteKey,
  onToken
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const id = useId();
  const [widgetId, setWidgetId] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey) return;
    const el = document.getElementById(id);
    if (!el) return;
    if (!window.turnstile?.render) return;
    const wId = window.turnstile.render(el, {
      sitekey: siteKey,
      callback: (token: string) => onToken(token)
    });
    setWidgetId(wId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, siteKey]);

  return (
    <div>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div id={id} />
      {widgetId ? null : <p style={{ margin: 0, color: "var(--muted)" }}>Loading Turnstile…</p>}
    </div>
  );
}


