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
 *
 * Consent: `consentRegionsOnly` asks only visitors in the EEA, UK, and Switzerland,
 * detected from the browser time zone (no IP, no network call). Everyone else is
 * served ads without a prompt. Set it false to gate every visitor behind the banner.
 */

import { needsConsentChoice } from "@/lib/geo";
import { getConsent } from "@/lib/storage";

export type AdPage = "home" | "calculator" | "category" | "article" | "directory" | "legal";

export type AdFormat = "horizontal" | "rectangle" | "vertical" | "in-article" | "fluid";

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
  /**
   * What to click in AdSense "Create new ad unit" for this slot.
   * Documentation only — rendering is driven by `format` in AdSlot.tsx.
   * Display units: pick Responsive; shape is constrained by data-ad-format.
   */
  createAs: string;
  /** Reserved height in pixels to reduce layout shift. */
  minHeight: number;
  /** Desktop-only column. Hidden on small screens via CSS. */
  desktopOnly?: boolean;
  /** When false, the slot component should not be mounted even if ads are enabled. */
  active: boolean;
}

export const adsConfig = {
  /**
   * Master switch for ad units. The loader script itself lives in index.html
   * (standard Google integration, loaded once). Set slot IDs in adPlacements
   * below to start showing units; placeholders show until then.
   */
  enabled: true,
  /**
   * Draw labelled reserved boxes when a slot has no slot ID, so layout can be reviewed.
   * These boxes are not ads and do not request creative.
   * Off in production: every active slot has a real unit. Set true to preview layout.
   */
  previewPlaceholders: false,
  /** Publisher ID, format ca-pub-xxxxxxxxxxxxxxxx. Must match the client in index.html. */
  publisherId: "ca-pub-9505925327648300",
  /**
   * Wait for advertising consent before pushing ad units. When
   * `consentRegionsOnly` is true this applies only to the EEA/UK/CH.
   */
  requireConsent: true,
  /**
   * Ask only visitors in the EEA, UK, and Switzerland. Everyone else is served
   * ads immediately, because no consent is required for them.
   */
  consentRegionsOnly: true,
  /** How many in-content slots may render on a single page. */
  maxInContentPerPage: 2,
} as const;

export const adPlacements: Record<string, AdPlacement> = {
  homeTop: {
    id: "home-top",
    label: "Homepage leaderboard below the header",
    pages: ["home"],
    slotId: "7331028745",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (leaderboard 728×90 desktop / 320×100 mobile)",
    minHeight: 90,
    active: true,
  },
  homeSidebar: {
    id: "home-sidebar",
    label: "Homepage desktop sidebar",
    pages: ["home"],
    slotId: "7985634869",
    format: "rectangle",
    createAs: "Display ads → Responsive → Square/Rectangle (300×250 medium rectangle in the 300px sidebar)",
    minHeight: 250,
    desktopOnly: true,
    active: true,
  },
  homeMid: {
    id: "home-mid",
    label: "Homepage in-content break between category groups",
    pages: ["home"],
    slotId: "5359471526",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (in-content banner)",
    minHeight: 100,
    active: true,
  },
  homeGuides: {
    id: "home-guides",
    label: "Between popular tools and educational guides",
    pages: ["home"],
    slotId: "",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (spare slot, currently off)",
    minHeight: 100,
    active: false,
  },
  articleMid: {
    id: "article-mid",
    label: "Inside a long guide, after the first sections",
    pages: ["article"],
    slotId: "9673376191",
    format: "in-article",
    createAs: "In-article ads → Fluid (native, blends with guide text — the only non-Display unit)",
    minHeight: 120,
    active: true,
  },
  footerBanner: {
    id: "footer-banner",
    label: "Responsive banner above the footer",
    pages: ["home", "calculator", "category", "article", "directory"],
    slotId: "8464147019",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (full-width banner)",
    minHeight: 90,
    active: true,
  },
  calcTop: {
    id: "calc-top",
    label: "Calculator page, above the tool",
    pages: ["calculator"],
    slotId: "5499072323",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (above the calculator)",
    minHeight: 90,
    active: true,
  },
  calcBelowResults: {
    id: "calc-below-results",
    label: "Calculator page, below the results",
    pages: ["calculator"],
    slotId: "1232524251",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (below the results panel)",
    minHeight: 100,
    active: true,
  },
  calcBeforeFaq: {
    id: "calc-before-faq",
    label: "Between the explanation and the FAQs",
    pages: ["calculator"],
    slotId: "2142281249",
    format: "horizontal",
    createAs: "Display ads → Responsive → Horizontal (mid-content banner)",
    minHeight: 100,
    active: true,
  },
  calcSidebar: {
    id: "calc-sidebar",
    label: "Calculator page desktop sidebar",
    pages: ["calculator"],
    slotId: "1559827319",
    format: "rectangle",
    createAs: "Display ads → Responsive → Square/Rectangle (300×250 medium rectangle in the 300px sidebar)",
    minHeight: 250,
    desktopOnly: true,
    active: true,
  },
} satisfies Record<string, AdPlacement>;

export type AdPlacementKey = keyof typeof adPlacements;

export function publisherIdConfigured(): boolean {
  return /^ca-pub-\d{10,20}$/.test(adsConfig.publisherId);
}

/**
 * Whether an ad unit may be requested. The single gate used by AdSlot and
 * AdScript. Consent is required only for the EEA/UK/CH when
 * `consentRegionsOnly` is on; other visitors are never blocked.
 */
export function adsAllowed(): boolean {
  if (!adsConfig.enabled || !publisherIdConfigured()) return false;
  if (!adsConfig.requireConsent) return true;
  if (adsConfig.consentRegionsOnly && !needsConsentChoice()) return true;
  return getConsent() === "granted";
}

export function slotReady(placement: AdPlacement): boolean {
  return adsConfig.enabled && publisherIdConfigured() && /^\d{6,20}$/.test(placement.slotId);
}
