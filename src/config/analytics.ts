import { needsConsentChoice } from "@/lib/geo";

/**
 * Google Analytics 4.
 *
 * TO TURN ON: paste your Measurement ID below. That is the only change needed.
 * Find it in Google Analytics → Admin → Data streams → your web stream.
 * It looks like "G-ABC123XYZ". Do not paste the "GT-" tag ID or the stream ID.
 *
 * Nothing loads while this is empty, so the site is safe to deploy as-is.
 *
 * Privacy: IP anonymisation is on, Google Signals/ad personalisation
 * are off by default here, and calculator inputs are never sent. Only coarse
 * event names reach GA (see src/lib/track.ts).
 */
export const analyticsConfig = {
  enabled: true,
  /** GA4 Measurement ID. Must match the Google tag in index.html <head>. */
  gaMeasurementId: "G-NJJ7ZR937F",
  requireConsent: true,
  /** Ask only visitors in the EEA/UK/CH. Others are measured without a prompt. */
  consentRegionsOnly: true,
} as const;

export function gaIdConfigured(): boolean {
  return /^G-[A-Z0-9]{4,}$/i.test(analyticsConfig.gaMeasurementId);
}

export function analyticsReady(consent: "unknown" | "granted" | "denied"): boolean {
  if (!analyticsConfig.enabled) return false;
  if (!gaIdConfigured()) return false;
  if (!analyticsConfig.requireConsent) return true;
  if (analyticsConfig.consentRegionsOnly && !needsConsentChoice()) return true;
  return consent === "granted";
}
