import { useEffect } from "react";
import { adsConfig, publisherIdConfigured } from "@/config/ads";
import { analyticsConfig, analyticsReady } from "@/config/analytics";
import { getConsent } from "@/lib/storage";

/** Loads third-party ad and analytics scripts once, and only after consent and real IDs. */
export function AdScript() {
  useEffect(() => {
    const consent = getConsent();
    if (adsConfig.enabled && adsConfig.requireConsent && consent !== "granted") return;
    if (!adsConfig.enabled || !publisherIdConfigured()) return;
    if (document.querySelector("script[data-adsense='true']")) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.publisherId}`;
    script.crossOrigin = "anonymous";
    script.dataset.adsense = "true";
    document.head.appendChild(script);
  }, []);

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
