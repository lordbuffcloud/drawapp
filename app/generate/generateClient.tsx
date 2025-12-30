"use client";

import { useEffect, useMemo, useState } from "react";
import { TurnstileWidget } from "./turnstileWidget";

type GenerateResult = {
  posterId: string;
  posterPngUrl: string;
  posterPdfUrl: string;
  thumbnailUrl: string;
};

type ProgressStage = "idle" | "validating" | "generating" | "composing" | "uploading" | "done";

export function GenerateClient({
  turnstileSiteKey,
  bypassTurnstile
}: {
  turnstileSiteKey: string;
  bypassTurnstile: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("minimal_ink");
  const [customStyle, setCustomStyle] = useState("");
  const [printSize, setPrintSize] = useState<"letter" | "a4">("letter");
  const [file, setFile] = useState<File | null>(null);

  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(bypassTurnstile ? "test-bypass" : null);

  const [stage, setStage] = useState<ProgressStage>("idle");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [includePromptPublicly, setIncludePromptPublicly] = useState(true);
  const [publishStatus, setPublishStatus] = useState<"idle" | "working" | "done" | "error">("idle");

  const deviceId = useMemo(() => {
    const key = "drawapp_device_id";
    if (typeof window === "undefined") return "server";
    let v = window.localStorage.getItem(key);
    if (!v) {
      v = window.crypto.randomUUID();
      window.localStorage.setItem(key, v);
    }
    return v;
  }, []);

  useEffect(() => {
    async function loadPro() {
      const res = await fetch("/api/pro/status");
      const json = await res.json().catch(() => null);
      setIsPro(Boolean(json?.isPro));
    }
    void loadPro();
  }, []);

  const canSubmit =
    prompt.trim().length > 0 && (stage === "idle" || stage === "done") && (isPro ? true : Boolean(turnstileToken));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPromptError(null);
    setResult(null);
    setPublishStatus("idle");

    if (!prompt.trim()) {
      setPromptError("Prompt is required.");
      return;
    }
    if (!isPro && !turnstileToken) {
      setError("Complete Turnstile to generate for free.");
      return;
    }

    setStage("validating");

    const fd = new FormData();
    fd.set("prompt", prompt.trim());
    fd.set("stylePreset", stylePreset);
    if (customStyle.trim()) fd.set("customStyle", customStyle.trim());
    fd.set("printSize", printSize);
    fd.set("clientDeviceId", deviceId);
    if (!isPro) fd.set("turnstileToken", turnstileToken ?? "");
    if (file) fd.set("referenceImage", file);

    setStage("generating");
    const t1 = window.setTimeout(() => setStage((s) => (s === "generating" ? "composing" : s)), 1200);
    const t2 = window.setTimeout(() => setStage((s) => (s === "composing" ? "uploading" : s)), 2600);

    const res = await fetch("/api/generate", { method: "POST", body: fd });
    const json = await res.json().catch(() => null);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    if (!res.ok) {
      setStage("idle");
      setError(json?.error ?? "Generation failed.");
      return;
    }
    setResult(json);
    setStage("done");
  }

  async function onPublish() {
    if (!result) return;
    setPublishStatus("working");
    const res = await fetch("/api/gallery/publish", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ posterId: result.posterId, includePromptPublicly })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setPublishStatus("error");
      setError(json?.error ?? "Publish failed.");
      return;
    }
    setPublishStatus("done");
  }

  return (
    <div>
      <h1>Generate</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Prompt
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} required />
        </label>
        {promptError ? (
          <p role="alert" style={{ margin: 0 }}>
            {promptError}
          </p>
        ) : null}

        <label>
          Style preset
          <select value={stylePreset} onChange={(e) => setStylePreset(e.target.value)}>
            <option value="street_art">street_art</option>
            <option value="contemporary">contemporary</option>
            <option value="minimal_ink">minimal_ink</option>
            <option value="manga">manga</option>
            <option value="custom">custom</option>
          </select>
        </label>

        <label>
          Custom style (optional)
          <input value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} />
        </label>

        <label>
          Print size
          <select value={printSize} onChange={(e) => setPrintSize(e.target.value as "letter" | "a4")}>
            <option value="letter">letter</option>
            <option value="a4">a4</option>
          </select>
        </label>

        <label>
          Reference image (optional)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            data-testid="reference-image"
          />
        </label>

        {!bypassTurnstile && isPro === false ? (
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12 }}>
            <p style={{ margin: "0 0 10px 0", color: "var(--muted)", fontSize: 13 }}>
              Free tier requires Turnstile verification.
            </p>
            <TurnstileWidget siteKey={turnstileSiteKey} onToken={(t) => setTurnstileToken(t)} />
          </div>
        ) : null}

        <button className="primary" type="submit" disabled={!canSubmit}>
          {stage === "idle" ? "Generate" : stage === "done" ? "Generate again" : "Working…"}
        </button>
      </form>

      {stage !== "idle" && stage !== "done" ? (
        <p role="status" style={{ marginTop: 16 }}>
          {stage}
        </p>
      ) : null}

      {error ? (
        <p role="alert" data-testid="error-alert" style={{ marginTop: 16 }}>
          {error}{" "}
          {error.toLowerCase().includes("quota") ? (
            <a href="/pro" style={{ marginLeft: 8 }}>
              Upgrade
            </a>
          ) : null}
        </p>
      ) : null}

      {result ? (
        <section style={{ marginTop: 24 }}>
          <h2>Preview</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Poster preview"
            src={result.posterPngUrl}
            style={{ maxWidth: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
            <a className="btn btnPrimary" href={result.posterPngUrl} download data-testid="download-png">
              Download PNG
            </a>
            <a className="btn btnSecondary" href={result.posterPdfUrl} download data-testid="download-pdf">
              Download PDF
            </a>
          </div>

          <div style={{ marginTop: 14, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 14 }}>
            <h2>Publish</h2>
            <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={includePromptPublicly}
                onChange={(e) => setIncludePromptPublicly(e.target.checked)}
                style={{ width: 16, height: 16, marginTop: 0 }}
              />
              <span style={{ color: "var(--muted)", fontSize: 14 }}>Include prompt publicly</span>
            </label>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="primary" onClick={() => void onPublish()} disabled={publishStatus === "working"}>
                {publishStatus === "working" ? "Publishing…" : publishStatus === "done" ? "Published" : "Publish to Gallery"}
              </button>
              {publishStatus === "done" ? (
                <a className="btn btnSecondary" href="/gallery">
                  View Gallery
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}


