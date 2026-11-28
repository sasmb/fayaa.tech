import { ReactNode, useEffect, useState } from "react";
import { type AuthUser } from "wasp/auth";
import { Link, routes } from "wasp/client/router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface Props {
  user: AuthUser;
  children?: ReactNode;
}

export function DefaultLayout({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The owner console always uses the FAYAA dark palette. Applied to <html>
  // so menus and dialogs rendered in portals match too.
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains("dark");
    html.classList.add("dark", "fy-admin");
    return () => {
      html.classList.remove("fy-admin");
      if (!hadDark) html.classList.remove("dark");
    };
  }, []);

  if (!user.isAdmin) {
    return <Link to={routes.LandingPageRoute.to} replace />;
  }

  return (
    <div className="relative bg-fy-ink text-fy-text antialiased">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-48 right-0 h-[420px] w-[720px] rounded-full bg-fy-accent/10 blur-[140px]"
      />
      <div className="flex h-screen overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <Header
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            user={user}
          />
          <main>
            <div className="max-w-(--breakpoint-2xl) mx-auto p-4 md:p-6 2xl:p-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
