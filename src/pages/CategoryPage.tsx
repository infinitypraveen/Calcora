import { Link, useParams } from "react-router-dom";
import { AdSlot } from "@/components/ads/AdSlot";
import { Seo } from "@/components/seo/Seo";
import { getCategory } from "@/data/categories";
import { getByCategory } from "@/data/calculators";
import { breadcrumbJsonLd } from "@/lib/seo";
import { track } from "@/lib/track";
import { useEffect } from "react";

export function CategoryPage() {
  const { slug } = useParams();
  const category = getCategory(slug ?? "");
  const items = category ? getByCategory(category.id) : [];
  useEffect(() => {
    if (category) track("category_view", { category: category.id });
  }, [category?.id]);
  if (!category) {
    return (
      <>
        <Seo title="Category not found" description="That category is not listed." path={`/category/${slug ?? ""}`} noindex />
        <h1 className="text-3xl">Category not found</h1>
        <Link to="/directory">Browse the directory</Link>
      </>
    );
  }
  return (
    <>
      <Seo title={category.name} description={category.description} path={`/category/${category.id}`} jsonLd={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: category.name, path: `/category/${category.id}` }])} />
      <nav className="text-sm text-[var(--muted)]"><Link to="/">Home</Link> / <span>{category.name}</span></nav>
      <h1 className="mt-3 text-4xl">{category.name}</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">{category.description}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((calc) => (
          <li key={calc.slug}>
            <Link to={`/calculators/${calc.slug}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 hover:border-[var(--teal)]">
              <h2 className="text-lg font-semibold">{calc.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{calc.description}</p>
            </Link>
          </li>
        ))}
      </ul>
      <AdSlot placement="footerBanner" page="category" />
    </>
  );
}
