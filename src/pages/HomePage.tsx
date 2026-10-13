import { Link } from "react-router-dom";
import { AdSlot } from "@/components/ads/AdSlot";
import { AffiliateSection } from "@/components/affiliate/AffiliateSection";
import { SearchBox } from "@/components/layout/SearchBox";
import { SupportBanner } from "@/components/support/SupportBanner";
import { Seo } from "@/components/seo/Seo";
import { categories } from "@/data/categories";
import { articles } from "@/data/articles";
import { calculators, featuredCalculators, getByCategory } from "@/data/calculators";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { getRecent } from "@/lib/storage";
import { site } from "@/config/site";
import { useEffect, useState } from "react";

export function HomePage() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(getRecent()), []);
  const featured = featuredCalculators();
  const recentCalcs = recent.map((slug) => calculators.find((calc) => calc.slug === slug)).filter(Boolean);

  return (
    <>
      <Seo
        title={`${site.name} — Free Online Calculator for EMI, BMI & Percentage`}
        description="Free online calculators for EMI, BMI, percentage, compound interest, GST and SIP. Every calculator shows the formula, assumptions and a worked example."
        path="/"
        jsonLd={[websiteJsonLd(), organizationJsonLd()]}
      />
      <AdSlot placement="homeTop" page="home" />
      <section className="grid items-end gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--teal)]">Free, local, explained</p>
          <h1 className="mt-2 max-w-xl text-4xl leading-tight sm:text-6xl">Free online calculator tools with the working shown</h1>
          <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">EMI calculator, BMI calculator, percentage calculator, compound interest and more. Every estimator shows its formula, assumptions, and a worked example. No account needed.</p>
          <div className="mt-6 max-w-xl">
            <SearchBox variant="hero" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {featured.slice(0, 6).map((calc) => (
              <Link key={calc.slug} to={`/calculators/${calc.slug}`} className="rounded-full border border-[var(--line)] bg-[var(--card)] px-3 py-1">{calc.title.replace(" calculator", "").replace(" Calculator", "")}</Link>
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Sample working</p>
          <p className="serif mt-2 text-2xl">₹10,00,000 · 9% · 20 years</p>
          <p className="num mt-4 text-4xl text-[var(--teal)]">₹8,997</p>
          <p className="text-sm text-[var(--muted)]">Monthly EMI, reducing balance. Interest about ₹11.59 lakh. <Link to="/calculators/emi-calculator" className="font-semibold text-[var(--teal)]">Open the EMI calculator</Link></p>
        </aside>
      </section>
      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [String(calculators.length), "Working calculators"],
          ["8", "Categories"],
          ["0", "Accounts required"],
          ["Local", "Sensitive inputs"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
            <dd className="num mt-1 text-2xl">{value}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-12" id="popular">
        <h2 className="text-3xl">Popular calculator tools</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((calc) => (
            <Link key={calc.slug} to={`/calculators/${calc.slug}`} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 hover:border-[var(--teal)]">
              <h3 className="font-semibold">{calc.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{calc.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <h2 className="text-3xl">Browse by category</h2>
          <div className="mt-4 space-y-8">
            {categories.map((category, index) => (
              <section key={category.id} aria-labelledby={category.id}>
                {index === 4 ? <AdSlot placement="homeMid" page="home" /> : null}
                <div className="flex items-end justify-between gap-3">
                  <h3 id={category.id} className="text-2xl">{category.name}</h3>
                  <Link to={`/category/${category.id}`} className="text-sm font-semibold text-[var(--teal)]">View all</Link>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{category.description}</p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {getByCategory(category.id).slice(0, 6).map((calc) => (
                    <li key={calc.slug}><Link to={`/calculators/${calc.slug}`} className="text-sm underline-offset-2 hover:underline">{calc.title}</Link></li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
        <aside className="space-y-4">
          <AdSlot placement="homeSidebar" page="home" />
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <h2 className="text-lg">Recently used</h2>
            {recentCalcs.length === 0 ? <p className="mt-2 text-sm text-[var(--muted)]">Open a calculator and it will appear here, on this device only.</p> : (
              <ul className="mt-2 space-y-2 text-sm">
                {recentCalcs.map((calc) => calc ? <li key={calc.slug}><Link to={`/calculators/${calc.slug}`}>{calc.title}</Link></li> : null)}
              </ul>
            )}
          </div>
        </aside>
      </div>
      <section className="mt-12">
        <h2 className="text-3xl">Guides</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.slug} to={`/guides/${article.slug}`} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{article.category}</p>
              <h3 className="mt-1 text-xl">{article.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{article.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <AffiliateSection placement="home" title="Recommended resources" />
      <SupportBanner />
      <section className="mt-12">
        <h2 className="text-3xl">Questions people ask first</h2>
        <div className="mt-4 space-y-3">
          {[
            ["Do I need an account?", "No. Every calculator runs in your browser."],
            ["Are the results advice?", "No. Finance and health tools state their assumptions and limits. They are not a lender, a clinician, or a tax filing."],
            ["Do you store what I type?", "Calculator inputs are not stored. Favourites and recent tools store only the calculator name, and you can clear them."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4" open>
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-[var(--muted)]">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <AdSlot placement="footerBanner" page="home" />
    </>
  );
}
