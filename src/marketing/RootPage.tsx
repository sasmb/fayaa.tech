import { useEffect } from "react";
import { useNavigate } from "react-router";
import { env } from "wasp/client";
import { useAuth } from "wasp/client/auth";

import { LandingPage } from "../landing-page/LandingPage";

/**
 * "/" of the app. Once the marketing site lives on its own domain
 * (REACT_APP_MARKETING_SITE_URL, e.g. https://fayaa.tech), signed-in users
 * go straight to the studio and everyone else goes to the marketing site.
 * Without the variable, the app keeps serving its own homepage.
 */
export function RootPage() {
  const marketingUrl = env.REACT_APP_MARKETING_SITE_URL;
  if (!marketingUrl) return <LandingPage />;
  return <RootRedirect marketingUrl={marketingUrl} />;
}

function RootRedirect({ marketingUrl }: { marketingUrl: string }) {
  const { data: user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      void navigate("/studio", { replace: true });
    } else {
      window.location.replace(marketingUrl);
    }
  }, [isLoading, user, marketingUrl, navigate]);

  return <div className="min-h-dvh bg-fy-ink" aria-busy="true" />;
}
