/**
 * Optional "support / donate" configuration.
 *
 * Calcora is free. The "free" message always shows. The donate button shows
 * only when `url` is a real https link from your account, for example:
 *   https://buymeacoffee.com/your-handle
 *   https://ko-fi.com/your-handle
 *   https://github.com/sponsors/your-handle
 *   https://razorpay.me/@your-handle   (UPI / India)
 * Leave it empty until you have an account. Never put a guessed link here.
 */
export const supportConfig = {
  enabled: true,
  /** Paste your Buy Me a Coffee, Ko-fi, GitHub Sponsors, or payment link. */
  url: "",
  /** Button text. */
  label: "Buy me a coffee",
  /** Platform name, shown for transparency. */
  platform: "Buy Me a Coffee",
  heading: "Calcora is free, and it stays free",
  message:
    "No sign-up, no paywall, and your inputs never leave your browser. If a calculator saved you time, a small contribution helps cover hosting and keeps new tools coming. It is completely optional.",
} as const;

export function supportUrl(): string | null {
  if (!supportConfig.enabled || !supportConfig.url) return null;
  try {
    const url = new URL(supportConfig.url);
    if (url.protocol !== "https:") return null;
    if (/(^|\.)example\.(com|org|net)$/i.test(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
