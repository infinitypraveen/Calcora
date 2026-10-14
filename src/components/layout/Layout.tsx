import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { AdScript } from "../ads/AdScript";
import { CookieConsent } from "../ui/CookieConsent";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Netlify serves prerendered pages at trailing-slash URLs (e.g. /support/),
  // while sitemap/canonical URLs have no trailing slash. Normalize client-side
  // so deep links, bookmarks, and the static files always land on the matching
  // app route (this never hits the server, so it can't loop with the 301).
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return <Navigate to={`${pathname.replace(/\/+$/, "")}${search}${hash}`} replace />;
  }

  return (
    <>
      <a className="skip-link" href="#content">Skip to content</a>
      <Header />
      <main id="content" className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
      <AdScript />
      <p className="sr-only">
        <Link to="/calculators/emi-calculator">EMI calculator</Link>
      </p>
    </>
  );
}
