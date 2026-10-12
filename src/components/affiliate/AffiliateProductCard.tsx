import { affiliateConfig, type AffiliateProduct } from "@/data/affiliateProducts";
import { safeExternalUrl } from "@/lib/safeUrl";
import { track } from "@/lib/track";

export function affiliateHref(product: AffiliateProduct): string | null {
  const safe = safeExternalUrl(product.url);
  if (!safe) return null;
  const url = new URL(safe);
  if (affiliateConfig.amazonAssociatesTag && /(^|\.)amazon\./i.test(url.hostname)) {
    url.searchParams.set("tag", affiliateConfig.amazonAssociatesTag);
  }
  return url.toString();
}

export function AffiliateProductCard({ product }: { product: AffiliateProduct }) {
  const href = affiliateHref(product);
  if (!href) return null;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <img src={product.imageUrl} alt="" className="mb-3 h-28 w-full rounded-xl object-cover" />
      <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{product.merchant}</p>
      <h3 className="mt-1 font-semibold text-[var(--ink)]">{product.name}</h3>
      <p className="mt-2 flex-1 text-sm text-[var(--muted)]">{product.description}</p>
      {product.priceLabel ? <p className="mt-2 text-sm font-medium">{product.priceLabel}</p> : null}

      <a
        href={href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="mt-3 inline-flex text-sm font-semibold text-[var(--teal)]"
        onClick={() => track("affiliate_click", { product_id: product.id, merchant: product.merchant })}
      >
        View at {product.merchant}
        <span className="sr-only"> (affiliate link, opens in a new tab)</span>
      </a>
    </article>
  );
}
