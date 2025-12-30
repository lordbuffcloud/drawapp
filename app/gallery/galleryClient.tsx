"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryItem = {
  id: string;
  stylePreset: string;
  customStyle: string;
  thumbnailUrl: string;
  posterPngUrl: string;
  posterPdfUrl: string;
  prompt: string | null;
};

export function GalleryClient() {
  const [q, setQ] = useState("");
  const [style, setStyle] = useState("");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selected, setSelected] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useMemo(
    () => ["", "minimal_ink", "manga", "street_art", "contemporary", "custom"],
    []
  );

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (style) params.set("style", style);
    params.set("page", "1");
    params.set("pageSize", "48");
    const res = await fetch(`/api/gallery/list?${params.toString()}`);
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setLoading(false);
      setError(json?.error ?? "Failed to load gallery.");
      return;
    }
    setItems((json.items ?? []) as GalleryItem[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1>Gallery</h1>
      <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 220px" }}>
          <label>
            Search
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by prompt or style…" />
          </label>
          <label>
            Style
            <select value={style} onChange={(e) => setStyle(e.target.value)}>
              {styles.map((s) => (
                <option key={s} value={s}>
                  {s || "all"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="primary" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>
        {error ? (
          <p role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))"
        }}
      >
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setSelected(it)}
            style={{
              textAlign: "left",
              padding: 0,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              overflow: "hidden"
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.thumbnailUrl} alt="" style={{ width: "100%", display: "block" }} />
            <div style={{ padding: 10 }}>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{it.stylePreset}</div>
              {it.prompt ? <div style={{ fontSize: 14, marginTop: 4 }}>{it.prompt}</div> : null}
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            padding: 16,
            zIndex: 50
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              width: "min(980px, 100%)",
              background: "var(--panel)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 16,
              padding: 14
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{selected.stylePreset}</div>
                {selected.prompt ? <div style={{ fontSize: 14 }}>{selected.prompt}</div> : null}
              </div>
              <button onClick={() => setSelected(null)}>Close</button>
            </div>
            <div style={{ marginTop: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.posterPngUrl}
                alt="Poster"
                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}
              />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
              <a className="btn btnPrimary" href={selected.posterPngUrl} download>
                Download PNG
              </a>
              <a className="btn btnSecondary" href={selected.posterPdfUrl} download>
                Download PDF
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


