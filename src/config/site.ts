/**
 * Site-wide branding and contact details.
 * Replace the placeholder owner fields and domain before launch.
 */
export const site = {
  name: "Calcora",
  legalName: "Calcora Calculators",
  tagline: "Calculators with the working shown.",
  description:
    "Free online calculators for finance, health, maths, home, and everyday decisions. Every tool shows the formula, assumptions, and a worked example. Inputs stay in your browser.",
  url: "https://example.com",
  locale: "en",
  themeColor: "#102033",
  ownerName: "[Site owner legal name]",
  email: "hello@example.com",
  address: "[Street address, City, Region, Postal code, Country]",
  phone: "",
  foundingYear: "2026",
  /** Paste the Search Console HTML tag content value here, or leave blank. */
  searchConsoleVerification: "",
  social: {
    twitter: "",
  },
} as const;

export function absoluteUrl(path = "/"): string {
  const base = site.url.replace(/\/$/, "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}
