import type { ReactNode } from "react";
import "./globals.css";
import { SideNav } from "./_components/SideNav";
import Link from "next/link";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <header className="topBar">
            <Link className="brand" href="/">
              drawapp
            </Link>
            <div className="topBarLinks">
              <Link className="navLink" href="/generate">
                Generate
              </Link>
              <Link className="navLink" href="/pro">
                Pro
              </Link>
              <Link className="navLink" href="/gallery">
                Gallery
              </Link>
            </div>
          </header>

          <div className="layout">
            <aside className="sidebar">
              <SideNav />
            </aside>
            <main className="content">
              <div className="contentInner">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}


