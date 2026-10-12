import { affiliateConfig, affiliateProducts, isConfiguredProduct, type AffiliatePlacement } from "@/data/affiliateProducts";
import { AffiliateProductCard } from "./AffiliateProductCard";

export function AffiliateSection({
  placement,
  tags,
  title = "Tools and resources",
  limit = 3,
}: {
  placement: AffiliatePlacement;
  tags?: string[];
  title?: string;
  limit?: number;
}) {
  if (!affiliateConfig.enabled) return null;
  // Sections stay hidden until at least one real product is configured.
  const products = affiliateProducts
    .filter((product) => isConfiguredProduct(product) && product.placements.includes(placement))
    .filter((product) => !tags?.length || product.tags.some((tag) => tags.includes(tag)))
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
  if (products.length === 0) return null;
  return (
    <section className="no-print mt-8" aria-labelledby={`aff-${placement}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2 id={`aff-${placement}`} className="text-xl text-[var(--ink)]">{title}</h2>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Affiliate</p>
      </div>
      <p className="mb-4 max-w-3xl text-sm text-[var(--muted)]">{affiliateConfig.disclosure}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <AffiliateProductCard key={product.id} product={product} />
        ))}
      </div>
      {placement === "comparison" && products.length > 1 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <caption className="mb-2 text-left text-sm font-medium">Comparison of listed resources</caption>
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Merchant</th>
                <th className="py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-[var(--line)]">
                  <td className="py-2 pr-3">{product.name}</td>
                  <td className="py-2 pr-3">{product.category}</td>
                  <td className="py-2 pr-3">{product.merchant}</td>
                  <td className="py-2">{product.priceLabel ?? "Not listed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
