import { useEffect } from "react";
import { analyticsConfig, analyticsReady } from "@/config/analytics";
import { getConsent } from "@/lib/storage";

/**
 * Loads optional analytics once, after a real ID exists and consent is given.
 *
 * The AdSense loader is not injected here. It lives in index.html <head> as
 * Google's standard snippet, which is what AdSense asks for and guarantees the
 * script loads exactly once on every page. Ad units themselves are gated in
 * AdSlot via adsAllowed(), so consent still controls what is served.
 */
export function AdScript() {
  useEffect(() => {
    const consent = getConsent();
    if (!analyticsReady(consent)) return;
    if (document.querySelector("script[data-ga='true']")) return;
    const id = analyticsConfig.gaMeasurementId;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.dataset.ga = "true";
    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
      window.gtag("js", new Date());
      window.gtag("config", id, { anonymize_ip: true });
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
