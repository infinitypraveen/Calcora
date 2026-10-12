import { absoluteUrl, site } from "@/config/site";

export interface SeoInput {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function applySeo({ title, description, path, jsonLd, noindex }: SeoInput) {
  const fullTitle = title.includes(site.name) ? title : `${title} | ${site.name}`;
  document.title = fullTitle;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
  const canonical = absoluteUrl(path);
  upsertLink("canonical", canonical);
  upsertMeta("property", "og:title", fullTitle);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", site.legalName);
  upsertMeta("property", "og:image", absoluteUrl("/og-image.jpg"));
  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", fullTitle);
  upsertMeta("name", "twitter:description", description);
  upsertMeta("name", "twitter:image", absoluteUrl("/og-image.jpg"));
  if (site.searchConsoleVerification) upsertMeta("name", "google-site-verification", site.searchConsoleVerification);

  document.querySelectorAll('script[data-seo="jsonld"]').forEach((node) => node.remove());
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  for (const block of blocks) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "jsonld";
    script.textContent = JSON.stringify(block);
    document.head.appendChild(script);
  }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.legalName,
    url: site.url,
    description: site.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.legalName,
    url: site.url,
    email: site.email,
    description: site.description,
  };
}

export function calculatorJsonLd(title: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description,
    url: absoluteUrl(path),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
