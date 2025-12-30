import type { ReactNode } from "react";
import "./globals.css";
import { SideNav } from "./_components/SideNav";
import { TopNav } from "./_components/TopNav";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="appShell">
          <TopNav />

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


