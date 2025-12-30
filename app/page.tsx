import Link from "next/link";

export default function HomePage() {
  return (
    <section className="hero">
      <h1>drawapp</h1>
      <p className="heroSub">Printable step-by-step drawing tutorial posters.</p>

      <div className="heroActions">
        <Link className="btn btnPrimary" href="/generate">
          Generate
        </Link>
        <Link className="btn btnSecondary" href="/gallery">
          Gallery
        </Link>
        <Link className="btn btnSecondary" href="/pro">
          Go Pro
        </Link>
      </div>
    </section>
  );
}


