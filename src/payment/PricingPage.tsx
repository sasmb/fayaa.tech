import { useEffect } from "react";
import { StudioSubscriptionPanel } from "../video-studio/hf/components/studio/subscription-panel";
import { PaymentPlanId, prettyPaymentPlanName } from "./plans";

interface PaymentPlanCard {
  name: string;
  price: string;
  description: string;
  features: string[];
}

export const paymentPlanCards: Partial<Record<PaymentPlanId, PaymentPlanCard>> = {
  [PaymentPlanId.Hobby]: {
    name: prettyPaymentPlanName(PaymentPlanId.Hobby),
    price: "$49",
    description: "For active video creators, choreographers & UGC marketers",
    features: [
      "1,470 Monthly Credits ($49/mo)",
      "Full Genjutsu Light (6 creds/s) & Pro (12 creds/s) access",
      "Up to 4 Reference Images (Face & Garment lock)",
      "4 Concurrent GPU generation slots",
      "Claude MCP & Cursor Agent API (Coming Soon)",
      "Full commercial usage rights",
    ],
  },
  [PaymentPlanId.Pro]: {
    name: prettyPaymentPlanName(PaymentPlanId.Pro),
    price: "$129",
    description: "For viral studios, agencies & high-volume production",
    features: [
      "3,900 Monthly Credits ($129/mo)",
      "Lowest cost per credit across entire platform",
      "8 Concurrent GPU generation slots",
      "Ultra-priority GPU queue (instant dispatch)",
      "Full Genjutsu Light & Pro Master Recast",
      "Claude MCP, Cursor Agent & API (Coming Soon)",
      "Full commercial monetization license",
    ],
  },
  [PaymentPlanId.Credits10]: {
    name: prettyPaymentPlanName(PaymentPlanId.Credits10),
    price: "$12",
    description: "Instant top-up credits with zero subscription commitment",
    features: [
      "360 Instant Creation Credits",
      "No recurring commitment — pay as you go",
      "Credits never expire with an active account",
      "Usable across FAYAA Genjutsu Web Studio",
    ],
  },
};

export function PricingPage() {
  useEffect(() => {
    const html = document.documentElement;
    const prevTheme = html.getAttribute("data-theme");
    const hadDark = html.classList.contains("dark");
    html.setAttribute("data-theme", "default-dark");
    html.classList.add("dark");
    return () => {
      if (prevTheme) html.setAttribute("data-theme", prevTheme);
      else html.removeAttribute("data-theme");
      if (!hadDark) html.classList.remove("dark");
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <StudioSubscriptionPanel />
    </div>
  );
}
