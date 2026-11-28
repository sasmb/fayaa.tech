import React from "react";
import { Link } from "react-router";
import { routes } from "wasp/client/router";
import { ChevronLeft, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  activePath: "/terms" | "/privacy" | "/refunds";
  children: React.ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  activePath,
  children,
}: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#09090a] text-white flex flex-col font-sans selection:bg-fy-accent selection:text-black">
      {/* Header Bar */}
      <header className="h-14 border-b border-[#1c1c22] bg-[#09090a]/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fy-amber via-fy-accent to-fy-rose flex items-center justify-center font-black text-black text-sm shadow-[0_0_15px_rgba(255,91,31,0.3)] transition-transform group-hover:scale-105">
              ⚡
            </div>
            <span className="font-bold tracking-tight text-sm text-white group-hover:text-fy-accent transition-colors">
              FAYAA
            </span>
          </Link>

          <span className="text-[#32323e]">/</span>

          <nav className="flex items-center gap-3 text-xs">
            <Link
              to="/terms"
              className={`transition-colors ${
                activePath === "/terms"
                  ? "text-white font-semibold"
                  : "text-[#8e8e96] hover:text-white"
              }`}
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className={`transition-colors ${
                activePath === "/privacy"
                  ? "text-white font-semibold"
                  : "text-[#8e8e96] hover:text-white"
              }`}
            >
              Privacy
            </Link>
            <Link
              to="/refunds"
              className={`transition-colors ${
                activePath === "/refunds"
                  ? "text-white font-semibold"
                  : "text-[#8e8e96] hover:text-white"
              }`}
            >
              Refunds
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/studio"
            className="text-xs bg-[#16161c] hover:bg-[#202027] border border-[#2b2b38] text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Launch Studio
          </Link>
        </div>
      </header>

      {/* Main Legal Content Container */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-1">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-[#8e8e96] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="border-b border-[#1c1c24] pb-8 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-fy-accent bg-fy-accent/10 border border-fy-accent/20 px-2 py-0.5 rounded">
              Legal Documentation
            </span>
            <span className="text-xs text-[#71717a]">
              Last Updated: {lastUpdated}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#8e8e96] mt-2 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Document Body */}
        <div className="prose prose-invert prose-neutral max-w-none space-y-8 text-sm text-[#d4d4d8] leading-relaxed">
          {children}
        </div>

        {/* Merchant of Record & Contact Footer Card */}
        <div className="mt-16 p-6 rounded-2xl bg-gradient-to-br from-[#121217] to-[#0c0c10] border border-[#23232e] text-xs text-[#8e8e96] space-y-3 shadow-lg">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShieldCheck className="w-4 h-4 text-fy-accent" />
            <span>Merchant of Record & Business Identification</span>
          </div>
          <p>
            FAYAA is operated by <strong>nexusbizz</strong> (Legal Name), offering AI-powered video synthesis and motion transfer tools.
          </p>
          <p>
            Our order process and billing are conducted by our online reseller and Merchant of Record, <strong>Paddle.com</strong>, who also handles customer payment processing, VAT/tax compliance, and invoice inquiries.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4 text-white">
            <a
              href="mailto:sam@nepocommerce.com"
              className="flex items-center gap-1.5 text-fy-accent hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>sam@nepocommerce.com</span>
            </a>
            <span className="text-[#32323e]">•</span>
            <a
              href="https://paddle.net"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#8e8e96] hover:text-white transition-colors"
            >
              <span>Paddle Buyer Support (paddle.net)</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-[#16161d] py-6 px-6 text-center text-xs text-[#52525b]">
        <p>© {new Date().getFullYear()} FAYAA (nexusbizz). All rights reserved.</p>
      </footer>
    </div>
  );
}

