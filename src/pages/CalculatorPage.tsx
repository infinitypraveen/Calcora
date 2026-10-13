import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdSlot } from "@/components/ads/AdSlot";
import { AffiliateSection } from "@/components/affiliate/AffiliateSection";
import { CalculatorView } from "@/components/calculators/CalculatorView";
import { Seo } from "@/components/seo/Seo";
import { SupportNote } from "@/components/support/SupportBanner";
import { getCategory } from "@/data/categories";
import { getCalculator, relatedCalculators } from "@/data/calculators";
import { breadcrumbJsonLd, calculatorJsonLd } from "@/lib/seo";
import { getFavorites, pushRecent, toggleFavorite } from "@/lib/storage";
import { track } from "@/lib/track";

export function CalculatorPage() {
  const { slug } = useParams();
  const calc = getCalculator(slug);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!calc) return;
    pushRecent(calc.slug);
    setSaved(getFavorites().includes(calc.slug));
    track("calculator_open", { slug: calc.slug, category: calc.category });
  }, [calc?.slug]);
  if (!calc) {
    return (
      <>
        <Seo title="Calculator not found" description="That calculator is not in the directory." path={`/calculators/${slug ?? ""}`} noindex />
        <h1 className="text-3xl">Calculator not found</h1>
        <p className="mt-2 text-[var(--muted)]">It may have been renamed. Browse the <Link to="/directory" className="text-[var(--teal)]">directory</Link>.</p>
      </>
    );
  }
  const category = getCategory(calc.category);
  const path = `/calculators/${calc.slug}`;
  const related = relatedCalculators(calc);
  return (
    <>
      <Seo
        title={`${calc.title} — Free Online Tool`}
        description={calc.description}
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: category?.name ?? calc.category, path: `/category/${calc.category}` },
            { name: calc.title, path },
          ]),
          calculatorJsonLd(calc.title, calc.description, path),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: calc.faqs.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          },
        ]}
      />
      <nav aria-label="Breadcrumb" className="text-sm text-[var(--muted)]">
        <Link to="/">Home</Link> / <Link to={`/category/${calc.category}`}>{category?.name}</Link> / <span aria-current="page">{calc.title}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl">{calc.title}</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">{calc.description}</p>
        </div>
        <button type="button" className="no-print rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => setSaved(toggleFavorite(calc.slug).includes(calc.slug))}>
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article>
          <AdSlot placement="calcTop" page="calculator" />
          {calc.disclaimer ? <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">{calc.disclaimer}</p> : null}
          <CalculatorView calc={calc} />
          <AdSlot placement="calcBelowResults" page="calculator" />
          <section className="mt-8">
            <h2 className="text-2xl">How it is calculated</h2>
            <p className="mt-2 text-[var(--muted)]">{calc.howItWorks}</p>
            <h3 className="mt-4 text-lg">Formula</h3>
            <p className="mt-1 rounded-2xl bg-[var(--card)] p-4 font-mono text-sm">{calc.formula}</p>
            <h3 className="mt-4 text-lg">Steps</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              {calc.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <h3 className="mt-4 text-lg">Worked example</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{calc.example}</p>
            {calc.assumptions?.length ? (
              <>
                <h3 className="mt-4 text-lg">Assumptions</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{calc.assumptions.map((item) => <li key={item}>{item}</li>)}</ul>
              </>
            ) : null}
          </section>
          <AdSlot placement="calcBeforeFaq" page="calculator" />
          <section className="mt-8">
            <h2 className="text-2xl">Questions</h2>
            <div className="mt-3 space-y-2">
              {calc.faqs.map((faq) => (
                <details key={faq.q} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4" open>
                  <summary className="cursor-pointer font-medium">{faq.q}</summary>
                  <p className="mt-2 text-sm text-[var(--muted)]">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
          <p className="mt-6 text-sm"><Link to={`/contact?topic=${encodeURIComponent(calc.title)}`} className="text-[var(--teal)]">Suggest a correction</Link></p>
          <SupportNote />
          <AffiliateSection placement="results" tags={[calc.category, calc.slug, ...(calc.affiliateTags ?? [])]} title="Related resources" />
        </article>
        <aside className="space-y-4">
          <AdSlot placement="calcSidebar" page="calculator" />
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <h2 className="text-lg">Related calculators</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {related.map((item) => <li key={item.slug}><Link to={`/calculators/${item.slug}`}>{item.title}</Link></li>)}
            </ul>
          </div>
          <AffiliateSection placement="sidebar" tags={[calc.category, calc.slug]} title="Sidebar resources" limit={1} />
        </aside>
      </div>
      <AdSlot placement="footerBanner" page="calculator" />
    </>
  );
}
