import React from "react";
import { Link } from "react-router";
import { routes } from "wasp/client/router";
import { Zap } from "lucide-react";
import { UserDropdown } from "../../user/UserDropdown";

interface StudioHeaderProps {
  user: any;
}

export function StudioHeader({ user }: StudioHeaderProps) {
  return (
    <header className="h-14 border-b border-white/10 bg-[#0d0d11]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand + Navigation Items */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-lime-400 to-emerald-500 flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-lime-500/20">
            ⚡
          </div>
          <span className="font-bold tracking-tight text-base text-white">FAYAA</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm text-neutral-400">
          <Link to="/" className="hover:text-white transition-colors cursor-pointer">Explore</Link>
          <Link to="/studio" className="text-lime-400 font-semibold flex items-center gap-1.5 cursor-pointer">
            <span>Video Studio</span>
            <span className="text-[10px] bg-lime-400/20 text-lime-300 font-bold px-1.5 py-0.5 rounded">
              Genjutsu
            </span>
          </Link>
          <Link to="/pricing" className="hover:text-white transition-colors cursor-pointer">Pricing</Link>
        </nav>
      </div>

      {/* Right: Credits + Upgrade + Profile */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs text-neutral-300">
          <Zap className="w-3.5 h-3.5 text-lime-400 fill-lime-400" />
          <span className="font-semibold text-white">{user ? user.credits : 0}</span>
          <span className="text-neutral-400">credits</span>
          <span className="text-[10px] text-neutral-500 pl-1 border-l border-white/10">30 = $1</span>
        </div>

        <Link
          to={routes.PricingPageRoute.to}
          className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md transition-all"
        >
          <span>🚀 Upgrade</span>
          <span className="bg-white/20 text-[10px] px-1 rounded">30% OFF</span>
        </Link>

        {user ? (
          <UserDropdown user={user} />
        ) : (
          <Link
            to="/login"
            className="bg-white text-black font-semibold text-xs px-3.5 py-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
