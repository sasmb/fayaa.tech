import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { logout, useAuth } from "wasp/client/auth";
import { Coins, FolderOpen, LogOut, Menu, X } from "lucide-react";

import { FayaaLogo, FyLinkButton } from "../../../client/design";
import { cn } from "../../../client/utils";
import { getUserAvatarUrl } from "../../../user/defaultAvatar";
import { trackMarketingEvent } from "../../../marketing/analytics";

const NAV = [
  { label: "Explore", to: "/" },
  { label: "Studio", to: "/studio", badge: "Genjutsu" },
  { label: "Community", to: "/#community-showcase" },
  { label: "Pricing", to: "/pricing" },
];

/**
 * Marketing header: transparent over the hero video, frosted glass once the
 * page scrolls. Shared by the homepage and pricing so they feel like one site.
 */
export function MarketingHeader({ overlay = true }: { overlay?: boolean }) {
  const { data: user } = useAuth();
  const [scrolled, setScrolled] = useState(!overlay);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overlay]);

  const solid = scrolled || menuOpen;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ease-fy-out",
        solid
          ? "border-b border-fy-line bg-fy-ink/75 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <FayaaLogo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors",
                    isActive && !item.to.includes("#")
                      ? "bg-white/10 text-fy-text"
                      : "text-fy-muted hover:bg-white/5 hover:text-fy-text"
                  )
                }
              >
                {item.label}
                {item.badge ? (
                  <span className="rounded-full bg-fy-accent/15 px-1.5 py-px text-[9px] font-bold tracking-wider text-fy-accent-300 uppercase">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/studio"
                className="hidden h-9 items-center gap-1.5 rounded-full border border-fy-line bg-white/5 px-3 text-xs font-semibold text-fy-text transition-colors hover:border-fy-line-strong sm:inline-flex"
              >
                <FolderOpen className="size-3.5 text-fy-muted" />
                Assets
              </Link>
              <Link
                to="/pricing"
                title="Credits"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-fy-accent/30 bg-fy-accent/10 px-3 text-xs font-bold text-fy-accent-300 transition-colors hover:bg-fy-accent/20"
              >
                <Coins className="size-3.5" />
                {(user.credits ?? 0).toLocaleString("en-US")}
              </Link>
              <FyLinkButton to="/studio" size="sm" className="hidden rounded-full sm:inline-flex">
                Open studio
              </FyLinkButton>
              <Link
                to="/account"
                aria-label="Account"
                title={user.email ?? "Account"}
                className="relative ml-1 inline-flex size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-fy-line-strong transition-transform hover:scale-105"
              >
                <img src={getUserAvatarUrl(user)} alt="" className="size-full object-cover" />
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                aria-label="Log out"
                title="Log out"
                className="hidden size-9 items-center justify-center rounded-full text-fy-subtle transition-colors hover:bg-white/5 hover:text-fy-text md:inline-flex"
              >
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden h-9 items-center rounded-full px-3.5 text-sm font-medium text-fy-muted transition-colors hover:text-fy-text sm:inline-flex"
              >
                Log in
              </Link>
              <FyLinkButton
                to="/signup"
                size="sm"
                className="h-9 rounded-full px-4"
                onClick={() => trackMarketingEvent("Signup CTA Click", { placement: "header" })}
              >
                Sign up free
              </FyLinkButton>
            </>
          )}
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex size-9 items-center justify-center rounded-full text-fy-text hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav aria-label="Mobile" className="border-t border-fy-line px-4 pt-2 pb-5 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between border-b border-fy-line py-3.5 font-display text-2xl font-semibold tracking-tight text-fy-text"
            >
              {item.label}
              {item.badge ? (
                <span className="rounded-full bg-fy-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-fy-accent-300 uppercase">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-4 text-sm text-fy-muted"
            >
              Log out
            </button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-4 inline-block text-sm text-fy-muted">
              Already have an account? Log in
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
