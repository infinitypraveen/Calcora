/**
 * Optional analytics. Tracking stays off until an ID is set and the visitor consents.
 * Do not send calculator inputs, passwords, or raw search text.
 */
export const analyticsConfig = {
  enabled: false,
  /** GA4 measurement ID, for example G-XXXXXXXX. Leave empty until you have one. */
  gaMeasurementId: "",
  requireConsent: true,
} as const;

export function analyticsReady(consent: "unknown" | "granted" | "denied"): boolean {
  if (!analyticsConfig.enabled) return false;
  if (!/^G-[A-Z0-9]+$/i.test(analyticsConfig.gaMeasurementId)) return false;
  if (analyticsConfig.requireConsent && consent !== "granted") return false;
  return true;
}
