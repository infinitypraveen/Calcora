import { useEffect } from "react";
import { analyticsConfig, analyticsReady } from "@/config/analytics";
import { getConsent } from "@/lib/storage";

/**
 * AdSense is loaded once from the <head> of index.html (see the script tag there).
 * This component only loads optional analytics, and only after consent and a real measurement ID.
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
