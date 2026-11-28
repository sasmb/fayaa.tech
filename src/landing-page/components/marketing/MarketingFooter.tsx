import { Link } from "react-router";

import { FayaaLogo } from "../../../client/design";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Genjutsu Studio", to: "/studio" },
      { label: "Pricing & credits", to: "/pricing" },
      { label: "Community", to: "/#community-showcase" },
      { label: "Templates", to: "/#workflow-templates" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign up", to: "/signup" },
      { label: "Log in", to: "/login" },
      { label: "My account", to: "/account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", to: "/terms" },
      { label: "Privacy", to: "/privacy" },
      { label: "Refunds", to: "/refunds" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-fy-line bg-fy-ink">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div className="flex flex-col gap-4">
          <FayaaLogo />
          <p className="max-w-xs text-sm text-fy-muted">
            The AI video studio for creators. Recast motion, swap anything and restyle every frame.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="fy-eyebrow">{column.title}</span>
            {column.links.map((link) => (
              <Link key={link.label} to={link.to} className="w-fit text-sm text-fy-muted transition-colors hover:text-fy-text">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="fy-display pointer-events-none -mb-[0.18em] select-none text-center text-[22vw] leading-none text-white/[0.035]"
      >
        FAYAA
      </div>
      <div className="border-t border-fy-line">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-6 text-xs text-fy-subtle sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} FAYAA. All rights reserved.</span>
          <span>Made for creators who move.</span>
        </div>
      </div>
    </footer>
  );
}
