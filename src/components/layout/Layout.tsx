import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AdScript } from "../ads/AdScript";
import { CookieConsent } from "../ui/CookieConsent";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
