/**
 * Affiliate product registry.
 *
 * Add, disable, or reorder products here. Do not edit the card component for a new product.
 * Leave `active: false` or replace the sample records before launch.
 * Do not invent reviews, star ratings, or discounts. Omit `priceLabel` unless you maintain it.
 * External links must be http(s). Cards add rel="sponsored noopener noreferrer".
 */

export type AffiliatePlacement = "home" | "sidebar" | "results" | "comparison" | "article" | "resources";

export interface AffiliateProduct {
  id: string;
  name: string;
  /** Optional image. Use a real product image you have rights to, or leave the sample SVG. */
  imageUrl: string;
  description: string;
  category: string;
  /** Only set this when you maintain the price. Sample records omit it on purpose. */
  priceLabel?: string;
  merchant: string;
  /** Destination URL, including your affiliate parameters if the network requires them. */
  url: string;
  promoLabel?: string;
  updated?: string;
  active: boolean;
  /** Lower numbers appear first. */
  order: number;
  /** Match calculator category ids, slugs, or guide slugs. */
  tags: string[];
  placements: AffiliatePlacement[];
  /** Sample rows are labelled in the UI so they are not mistaken for endorsements. */
  placeholder?: boolean;
}

export const affiliateConfig = {
  enabled: true,
  disclosure:
    "Some outbound links in these sections are affiliate links. If you use one and later buy, we may earn a commission at no extra cost to you. Calculator results do not depend on these links.",
  /** Optional Amazon Associates tracking ID. Applied only to amazon.* destinations. */
  amazonAssociatesTag: "",
  networkNote: "Any affiliate network works. Paste the destination URL the network gives you.",
} as const;

/**
 * A product renders only when it is actually configured:
 * active, not a placeholder, and pointing at a real https destination
 * (example.com sample URLs are treated as unconfigured).
 */
export function isConfiguredProduct(product: AffiliateProduct): boolean {
  if (!product.active || product.placeholder) return false;
  try {
    const url = new URL(product.url);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (/(^|\.)example\.(com|org|net)$/i.test(url.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export const affiliateProducts: AffiliateProduct[] = [
  {
    id: "sample-budget-book",
    name: "Sample: personal finance workbook",
    imageUrl: "/images/affiliate/book.svg",
    description: "Placeholder for a budgeting book or course you actually recommend. Replace the name, URL, and description before publishing.",
    category: "Financial planning",
    merchant: "Merchant name",
    url: "https://example.com/affiliate-placeholder-finance",
    updated: "2026-03-01",
    active: true,
    order: 1,
    tags: ["finance", "sip-calculator", "retirement-corpus-calculator", "how-compound-interest-works"],
    placements: ["home", "sidebar", "results", "comparison", "article", "resources"],
    placeholder: true,
  },
  {
    id: "sample-scale",
    name: "Sample: kitchen scale",
    imageUrl: "/images/affiliate/scale.svg",
    description: "Placeholder for a scale or measuring tool relevant to nutrition calculators. Do not add a price until you verify it.",
    category: "Fitness and kitchen",
    merchant: "Merchant name",
    url: "https://example.com/affiliate-placeholder-scale",
    updated: "2026-03-01",
    active: true,
    order: 2,
    tags: ["health", "macro-calculator", "protein-intake-calculator"],
    placements: ["results", "sidebar", "resources"],
    placeholder: true,
  },
  {
    id: "sample-tools",
    name: "Sample: measuring tape and home tools",
    imageUrl: "/images/affiliate/tools.svg",
    description: "Placeholder for tools used with paint, tile, and flooring calculators.",
    category: "Home improvement",
    merchant: "Merchant name",
    url: "https://example.com/affiliate-placeholder-tools",
    updated: "2026-03-01",
    active: true,
    order: 3,
    tags: ["home", "paint-calculator", "tile-calculator", "flooring-calculator"],
    placements: ["results", "comparison", "resources"],
    placeholder: true,
  },
  {
    id: "sample-desk",
    name: "Sample: notebook and stationery set",
    imageUrl: "/images/affiliate/desk.svg",
    description: "Placeholder for educational stationery or a calculator accessory. Disable it if it is not relevant.",
    category: "Education",
    merchant: "Merchant name",
    url: "https://example.com/affiliate-placeholder-education",
    updated: "2026-03-01",
    active: true,
    order: 4,
    tags: ["math", "general", "percentage-calculation-examples"],
    placements: ["home", "article", "resources"],
    placeholder: true,
  },
];
