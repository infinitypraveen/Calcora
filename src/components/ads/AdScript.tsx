import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { analyticsConfig, analyticsReady } from "@/config/analytics";
import { getConsent } from "@/lib/storage";

/**
 * Google Analytics route tracking.
 *
 * The Google tag (gtag.js) itself is installed once in index.html <head>, as
 * Google's instructions require. Nothing is injected here, so a page never
 * carries two tags. This component only does what a plain tag cannot: it
 * reports client-side route changes, so every calculator page shows up in
 * reports instead of just the first page loaded.
 *
 * The AdSense loader is also in index.html; ad units are gated in AdSlot.
 */
export function AdScript() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    const allowed = analyticsReady(getConsent());

    // Consent mode: tell the already-loaded tag whether it may store data.
    window.gtag("consent", "update", {
      analytics_storage: allowed ? "granted" : "denied",
      ad_storage: allowed ? "granted" : "denied",
      ad_user_data: allowed ? "granted" : "denied",
      ad_personalization: "denied",
    });
    if (!allowed) return;

    // The head snippet already sent the first page_view. Send the rest.
    if (first.current) {
      first.current = false;
      return;
    }
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      send_to: analyticsConfig.gaMeasurementId,
    });
  }, [pathname]);

  return null;
}
