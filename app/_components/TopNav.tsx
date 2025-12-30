"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<{ href: string; label: string }> = [
  { href: "/generate", label: "Generate" },
  { href: "/pro", label: "Pro" },
  { href: "/gallery", label: "Gallery" }
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="topBar">
      <Link className="brand" href="/">
        drawapp
      </Link>
      <nav className="topBarLinks" aria-label="Primary">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link key={l.href} className={`navLink ${active ? "navLinkActive" : ""}`} href={l.href}>
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}


