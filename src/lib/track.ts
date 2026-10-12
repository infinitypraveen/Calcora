import { analyticsReady } from "@/config/analytics";
import { getConsent } from "./storage";

/** Event names and coarse parameters only. Never pass calculator inputs or raw search text. */
export function track(event: string, params?: Record<string, string | number>) {
  if (!analyticsReady(getConsent())) return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
