/**
 * Region detection for consent purposes.
 *
 * Uses the IANA time zone reported by the browser. No network request, no IP
 * address, no third-party service, nothing sent anywhere.
 *
 * Visitors whose zone maps to the EEA, UK, or Switzerland are shown a consent
 * choice (GDPR and Google's EU User Consent Policy). Everyone else is not
 * asked, and ads serve immediately.
 *
 * This is a heuristic. A visitor using a VPN may appear in another region.
 * For a fully Google-certified solution, use Google Privacy & Messaging
 * (formerly Funding Choices) — see the README.
 */

const CONSENT_TIME_ZONES = new Set([
  // European Union
  "Europe/Vienna", "Europe/Brussels", "Europe/Sofia", "Europe/Zagreb",
  "Asia/Nicosia", "Europe/Nicosia", "Europe/Prague", "Europe/Copenhagen",
  "Europe/Tallinn", "Europe/Helsinki", "Europe/Paris", "Europe/Berlin",
  "Europe/Athens", "Europe/Budapest", "Europe/Dublin", "Europe/Rome",
  "Europe/Riga", "Europe/Vilnius", "Europe/Luxembourg", "Europe/Malta",
  "Europe/Amsterdam", "Europe/Warsaw", "Europe/Lisbon", "Atlantic/Azores",
  "Atlantic/Madeira", "Europe/Bucharest", "Europe/Bratislava",
  "Europe/Ljubljana", "Europe/Madrid", "Atlantic/Canary", "Africa/Ceuta",
  "Europe/Stockholm",
  // EEA (non-EU)
  "Atlantic/Reykjavik", "Europe/Vaduz", "Europe/Oslo",
  // United Kingdom and Crown Dependencies
  "Europe/London", "Europe/Guernsey", "Europe/Jersey", "Europe/Isle_of_Man",
  "Europe/Gibraltar",
  // Switzerland
  "Europe/Zurich",
]);

/** Micro-states and territories that use a neighbour's zone. */
const CONSENT_ZONE_PREFIXES = ["Europe/"];

/**
 * True when the visitor is in a region where a consent choice is required.
 * Returns true when the zone cannot be determined, which is the cautious
 * default and affects a very small share of browsers.
 */
export function needsConsentChoice(): boolean {
  let zone: string | null = null;
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    zone = null;
  }
  if (!zone) return true;
  if (CONSENT_TIME_ZONES.has(zone)) return true;
  // Europe/ prefix catches zones not listed explicitly, but excludes the
  // non-EEA zones that share the prefix (Istanbul, Moscow, Kyiv, Minsk).
  if (CONSENT_ZONE_PREFIXES.some((prefix) => zone.startsWith(prefix))) {
    return /^(Vienna|Brussels|Sofia|Zagreb|Prague|Copenhagen|Tallinn|Helsinki|Paris|Berlin|Athens|Budapest|Dublin|Rome|Riga|Vilnius|Luxembourg|Malta|Amsterdam|Warsaw|Lisbon|Bucharest|Bratislava|Ljubljana|Madrid|Stockholm|Vaduz|Oslo|London|Guernsey|Jersey|Isle_of_Man|Gibraltar|Zurich|Nicosia|Monaco|Andorra|San_Marino|Vatican|Belgrade|Sarajevo|Podgorica|Skopje|Tirane)$/.test(
      zone.replace("Europe/", ""),
    );
  }
  return false;
}

/** Exposed for debugging and for the settings link in the footer. */
export function detectedTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}
