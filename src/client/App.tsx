import { useEffect, useMemo } from "react";
import { Outlet, useLocation } from "react-router";
import { routes } from "wasp/client/router";
import { Toaster } from "../client/components/ui/toaster";
import "./Main.css";
import { NavBar } from "./components/NavBar/NavBar";
import {
  demoNavigationitems,
  marketingNavigationItems,
} from "./components/NavBar/constants";
import { CookieConsentBanner } from "./components/cookie-consent/Banner";

/**
 * use this component to wrap all child components
 * this is useful for templates, themes, and context
 */
export function App() {
  const location = useLocation();
  const isMarketingPage = useMemo(() => {
    return (
      location.pathname === routes.LandingPageRoute.to ||
      location.pathname === routes.PricingPageRoute.to
    );
  }, [location]);

  const navigationItems = isMarketingPage
    ? marketingNavigationItems
    : demoNavigationitems;

  const isFullBleedDarkRoute = useMemo(() => {
    return (
      location.pathname === routes.LandingPageRoute.to ||
      location.pathname === routes.PricingPageRoute.to ||
      location.pathname === routes.LoginRoute.to ||
      location.pathname === routes.SignupRoute.to ||
      location.pathname.startsWith("/studio") ||
      location.pathname.startsWith("/account")
    );
  }, [location]);

  const shouldDisplayAppNavBar = useMemo(() => {
    return isMarketingPage && !isFullBleedDarkRoute;
  }, [isMarketingPage, isFullBleedDarkRoute]);

  const isAdminDashboard = useMemo(() => {
    return location.pathname.startsWith(routes.AdminRoute.to);
  }, [location]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView();
      }
    }
  }, [location]);

  return (
    <>
      <div className="bg-background text-foreground min-h-screen">
        {isAdminDashboard ? (
          <Outlet />
        ) : (
          <>
            {shouldDisplayAppNavBar && (
              <NavBar navigationItems={navigationItems} />
            )}
            <div className={shouldDisplayAppNavBar ? "max-w-(--breakpoint-2xl) mx-auto" : "w-full"}>
              <Outlet />
            </div>
          </>
        )}
      </div>
      <Toaster position="bottom-right" />
      <CookieConsentBanner />
    </>
  );
}
