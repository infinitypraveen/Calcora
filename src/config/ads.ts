/**
 * Advertisement configuration.
 *
 * Ads are disabled by default. Placeholders can be previewed without a publisher ID.
 * Never put a guessed publisher ID here. After AdSense approval, set `enabled`, `publisherId`,
 * and each `slotId`, then update the Content-Security-Policy in the hosting headers
 * (see README) so the official AdSense script is allowed.
 *
 * Placements are not all rendered on every page. Each slot lists the page types it belongs to.
 * Sidebar slots are hidden below the `lg` breakpoint in CSS so mobile does not reserve a column.
 */

export type AdPage = "home" | "calculator" | "category" | "article" | "directory" | "legal";

export type AdFormat = "horizontal" | "rectangle" | "in-article" | "fluid";

export interface AdPlacement {
  /** Stable DOM / config id. */
  id: string;
  /** Human label shown on development placeholders. Not shown to users as a call to action. */
  label: string;
  /** Where this slot is allowed to render. */
  pages: AdPage[];
  /** Google ad slot ID. Leave empty until AdSense creates the unit. */
  slotId: string;
  format: AdFormat;
  /** Reserved height in pixels to reduce layout shift. */
  minHeight: number;
  /** Desktop-only column. Hidden on small screens via CSS. */
  desktopOnly?: boolean;
  /** When false, the slot component should not be mounted even if ads are enabled. */
  active: boolean;
}

export const adsConfig = {
  /**
   * Master switch. Keep false in development and until AdSense is approved
   * and slot IDs are filled in.
   */
  enabled: false,
  /**
   * Draw labelled reserved boxes when a slot has no slot ID, so layout can be reviewed.
   * These boxes are not ads and do not load third-party scripts.
   */
  previewPlaceholders: true,
  /** Publisher ID, format ca-pub-xxxxxxxxxxxxxxxx. Leave empty. Do not invent one. */
  publisherId: "",
  /** Wait for advertising consent before injecting the AdSense script or units. */
  requireConsent: true,
  /** How many in-content slots may render on a single page. */
  maxInContentPerPage: 2,
} as const;

export const adPlacements: Record<string, AdPlacement> = {
  homeTop: {
    id: "home-top",
    label: "Homepage leaderboard below the header",
    pages: ["home"],
    slotId: "",
    format: "horizontal",
    minHeight: 90,
    active: true,
  },
  homeSidebar: {
    id: "home-sidebar",
    label: "Homepage desktop sidebar",
    pages: ["home"],
    slotId: "",
    format: "rectangle",
    minHeight: 250,
    desktopOnly: true,
    active: true,
  },
  homeMid: {
    id: "home-mid",
    label: "Homepage in-content break between category groups",
    pages: ["home"],
    slotId: "",
    format: "horizontal",
    minHeight: 100,
    active: true,
  },
  homeGuides: {
    id: "home-guides",
    label: "Between popular tools and educational guides",
    pages: ["home"],
    slotId: "",
    format: "horizontal",
    minHeight: 100,
    active: false,
  },
  articleMid: {
    id: "article-mid",
    label: "Inside a long guide, after the first sections",
    pages: ["article"],
    slotId: "",
    format: "in-article",
    minHeight: 120,
    active: true,
  },
  footerBanner: {
    id: "footer-banner",
    label: "Responsive banner above the footer",
    pages: ["home", "calculator", "category", "article", "directory"],
    slotId: "",
    format: "horizontal",
    minHeight: 90,
    active: true,
  },
  calcTop: {
    id: "calc-top",
    label: "Calculator page, above the tool",
    pages: ["calculator"],
    slotId: "",
    format: "horizontal",
    minHeight: 90,
    active: true,
  },
  calcBelowResults: {
    id: "calc-below-results",
    label: "Calculator page, below the results",
    pages: ["calculator"],
    slotId: "",
    format: "horizontal",
    minHeight: 100,
    active: true,
  },
  calcBeforeFaq: {
    id: "calc-before-faq",
    label: "Between the explanation and the FAQs",
    pages: ["calculator"],
    slotId: "",
    format: "horizontal",
    minHeight: 100,
    active: true,
  },
  calcSidebar: {
    id: "calc-sidebar",
    label: "Calculator page desktop sidebar",
    pages: ["calculator"],
    slotId: "",
    format: "rectangle",
    minHeight: 250,
    desktopOnly: true,
    active: true,
  },
} satisfies Record<string, AdPlacement>;

export type AdPlacementKey = keyof typeof adPlacements;

export function publisherIdConfigured(): boolean {
  return /^ca-pub-\d{10,20}$/.test(adsConfig.publisherId);
}

export function slotReady(placement: AdPlacement): boolean {
  return adsConfig.enabled && publisherIdConfigured() && /^\d{6,20}$/.test(placement.slotId);
}
