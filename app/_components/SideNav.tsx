"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: Array<{ href: string; label: string }> = [
  { href: "/generate", label: "Generate" },
  { href: "/pro", label: "Pro" },
  { href: "/gallery", label: "Gallery" }
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="sideNav" aria-label="Primary">
      <div className="sideNavHeader">
        <Link href="/" className="brand">
          drawapp
        </Link>
      </div>
      <ul className="sideNavList">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href}>
              <Link href={l.href} className={`navLink ${active ? "navLinkActive" : ""}`}>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


