"use client";

import { useState } from "react";

type GenerateResult = {
  posterPngUrl: string;
  posterPdfUrl: string;
};

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("minimal_ink");
  const [customStyle, setCustomStyle] = useState("");
  const [printSize, setPrintSize] = useState<"letter" | "a4">("letter");
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);

  function getClientDeviceId(): string {
    // Avoid touching localStorage during render (Next can pre-render client components).
    const key = "drawapp_device_id";
    if (typeof window === "undefined") return "server";
    let v = window.localStorage.getItem(key);
    if (!v) {
      v = window.crypto.randomUUID();
      window.localStorage.setItem(key, v);
    }
    return v;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPromptError(null);
    setResult(null);
    setStatus("validating");

    if (!prompt.trim()) {
      setStatus(null);
      setPromptError("Prompt is required.");
      return;
    }

    const fd = new FormData();
    fd.set("prompt", prompt);
    fd.set("stylePreset", stylePreset);
    if (customStyle.trim()) fd.set("customStyle", customStyle.trim());
    fd.set("printSize", printSize);
    fd.set("clientDeviceId", getClientDeviceId());
    fd.set("turnstileToken", "test-bypass");
    if (file) fd.set("referenceImage", file);

    setStatus("generating");
    const res = await fetch("/api/generate", { method: "POST", body: fd });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus(null);
      setError(json?.error ?? "Generation failed.");
      return;
    }
    setResult(json);
    setStatus(null);
  }

  return (
    <div>
      <h1>Generate</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            required
          />
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

        <button className="primary" type="submit" disabled={!prompt.trim() || status !== null}>
          {status ? "Working…" : "Generate"}
        </button>
      </form>

      {status ? (
        <p role="status" style={{ marginTop: 16 }}>
          {status}
        </p>
      ) : null}

      {error ? (
        <p role="alert" data-testid="error-alert" style={{ marginTop: 16, color: "crimson" }}>
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
          <img
            alt="Poster preview"
            src={result.posterPngUrl}
            style={{ maxWidth: "100%", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <a href={result.posterPngUrl} download data-testid="download-png">
              Download PNG
            </a>
            <a href={result.posterPdfUrl} download data-testid="download-pdf">
              Download PDF
            </a>
          </div>
        </section>
      ) : null}
    </div>
  );
}


