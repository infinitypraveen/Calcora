import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { articles, getArticle } from "@/data/articles";
import { calculators, getCalculator } from "@/data/calculators";
import { categories } from "@/data/categories";
import { searchCalculators } from "@/lib/search";
import { breadcrumbJsonLd } from "@/lib/seo";
import { clearFavorites, clearRecent, getFavorites, getRecent } from "@/lib/storage";
import { site } from "@/config/site";
import { AdSlot } from "@/components/ads/AdSlot";
import { AffiliateSection } from "@/components/affiliate/AffiliateSection";
import { useEffect, useState } from "react";

export function DirectoryPage() {
  const groups = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
    letter,
    items: calculators.filter((calc) => calc.title[0]?.toUpperCase() === letter).sort((a, b) => a.title.localeCompare(b.title)),
  })).filter((group) => group.items.length);
  return (
    <>
      <Seo title="Calculator directory" description="Alphabetical directory of every working calculator on Calcora." path="/directory" />
      <h1 className="text-4xl">Directory</h1>
      <p className="mt-2 text-[var(--muted)]">{calculators.length} calculators, each with its own URL and formula.</p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {groups.map((group) => <a key={group.letter} href={`#letter-${group.letter}`} className="rounded-full border border-[var(--line)] px-2 py-1">{group.letter}</a>)}
      </div>
      {groups.map((group) => (
        <section key={group.letter} id={`letter-${group.letter}`} className="mt-8">
          <h2 className="text-2xl">{group.letter}</h2>
          <ul className="mt-2 columns-1 sm:columns-2">
            {group.items.map((calc) => <li key={calc.slug} className="mb-1"><Link to={`/calculators/${calc.slug}`}>{calc.title}</Link></li>)}
          </ul>
        </section>
      ))}
    </>
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  const results = q.trim() ? searchCalculators(q, calculators) : [];
  return (
    <>
      <Seo title={q ? `Search: ${q}` : "Search calculators"} description="Search calculator names, keywords, and categories." path="/search" noindex={Boolean(q)} />
      <h1 className="text-4xl">Search</h1>
      <form className="mt-4" action="/search" role="search">
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" name="q" defaultValue={q} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3" />
      </form>
      {q && results.length === 0 ? <p className="mt-6">No calculators match “{q}”. Try EMI, BMI, GST, subnet, or percentage.</p> : null}
      <ul className="mt-6 space-y-3">
        {results.map((calc) => (
          <li key={calc.slug}><Link to={`/calculators/${calc.slug}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4"><strong>{calc.title}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{calc.description}</span></Link></li>
        ))}
      </ul>
    </>
  );
}

export function GuidesPage() {
  return (
    <>
      <Seo title="Guides" description="Short explainers for EMI, BMI, SIP, percentages, GST, and compound interest." path="/guides" />
      <h1 className="text-4xl">Guides</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {articles.map((article) => (
          <Link key={article.slug} to={`/guides/${article.slug}`} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
            <h2 className="text-2xl">{article.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">{article.description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}

export function ArticlePage() {
  const { slug } = useParams();
  const article = getArticle(slug);
  if (!article) return <h1 className="text-3xl">Guide not found</h1>;
  return (
    <>
      <Seo title={article.title} description={article.description} path={`/guides/${article.slug}`} jsonLd={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: article.title, path: `/guides/${article.slug}` }])} />
      <nav className="text-sm text-[var(--muted)]"><Link to="/">Home</Link> / <Link to="/guides">Guides</Link> / {article.title}</nav>
      <h1 className="mt-3 text-4xl">{article.title}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Updated {article.updated}. This is an explainer, not advice.</p>
      <div className="mt-6 max-w-3xl space-y-6">
        {article.sections.map((section, index) => (
          <section key={section.heading}>
            <h2 className="text-2xl">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 24)} className="mt-2 text-[var(--muted)]">{paragraph}</p>)}
            {index === 1 ? <AdSlot placement="articleMid" page="article" /> : null}
          </section>
        ))}
      </div>
      <h2 className="mt-8 text-2xl">Use the calculator</h2>
      <ul className="mt-2 list-disc pl-5">{article.calculators.map((id) => {
        const calc = getCalculator(id);
        return calc ? <li key={id}><Link to={`/calculators/${calc.slug}`}>{calc.title}</Link></li> : null;
      })}</ul>
      <AffiliateSection placement="article" tags={[article.slug, "finance", "math"]} title="Further reading" limit={2} />
    </>
  );
}

export function FavoritesPage() {
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    setFavs(getFavorites());
    setRecent(getRecent());
  }, []);
  return (
    <>
      <Seo title="Favourites" description="Calculators you saved on this device." path="/favorites" noindex />
      <h1 className="text-4xl">Favourites</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Only calculator names are stored in this browser. Inputs are not.</p>
      <ul className="mt-4 space-y-2">{favs.map((slug) => {
        const calc = getCalculator(slug);
        return calc ? <li key={slug}><Link to={`/calculators/${slug}`}>{calc.title}</Link></li> : null;
      })}</ul>
      {favs.length === 0 ? <p className="mt-4">No favourites yet. Use Save on a calculator.</p> : <button type="button" className="mt-4 text-sm underline" onClick={() => { clearFavorites(); setFavs([]); }}>Clear favourites</button>}
      <h2 className="mt-8 text-2xl">Recently used</h2>
      <ul className="mt-2 space-y-2">{recent.map((slug) => {
        const calc = getCalculator(slug);
        return calc ? <li key={slug}><Link to={`/calculators/${slug}`}>{calc.title}</Link></li> : null;
      })}</ul>
      {recent.length ? <button type="button" className="mt-4 text-sm underline" onClick={() => { clearRecent(); setRecent([]); }}>Clear recent</button> : null}
    </>
  );
}

export function SitemapPage() {
  return (
    <>
      <Seo title="Sitemap" description="Every public page on Calcora." path="/sitemap" />
      <h1 className="text-4xl">Sitemap</h1>
      <h2 className="mt-6 text-2xl">Categories</h2>
      <ul className="mt-2 list-disc pl-5">{categories.map((c) => <li key={c.id}><Link to={`/category/${c.id}`}>{c.name}</Link></li>)}</ul>
      <h2 className="mt-6 text-2xl">Calculators</h2>
      <ul className="mt-2 columns-1 text-sm sm:columns-2">{calculators.map((c) => <li key={c.slug} className="mb-1"><Link to={`/calculators/${c.slug}`}>{c.title}</Link></li>)}</ul>
      <h2 className="mt-6 text-2xl">Guides and policies</h2>
      <ul className="mt-2 list-disc pl-5">
        {articles.map((a) => <li key={a.slug}><Link to={`/guides/${a.slug}`}>{a.title}</Link></li>)}
        <li><Link to="/about">About</Link></li>
        <li><Link to="/privacy">Privacy</Link></li>
        <li><Link to="/terms">Terms</Link></li>
        <li><Link to="/disclaimer">Disclaimer</Link></li>
        <li><Link to="/affiliate-disclosure">Affiliate disclosure</Link></li>
        <li><Link to="/corrections">Corrections</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Seo title="Page not found" description="That page is not on Calcora." path="/404" noindex />
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-2">Try the <Link to="/directory">directory</Link> or <Link to="/search">search</Link>.</p>
    </>
  );
}

export function AboutPage() {
  return (
    <LegalShell title="About" path="/about" description="What Calcora is, and what it is not.">
      <p>Calcora is a free calculator library. Each tool runs in the browser, shows the formula, and states the assumptions that can change the result.</p>
      <p>The site is published by {site.ownerName}. Contact {site.email}. Address: {site.address}. Replace these placeholders in src/config/site.ts before launch.</p>
      <p>We do not claim medical, tax, legal, or investment authority. Health and pregnancy tools are screening or calendar estimates. Finance tools are arithmetic under the rates you enter.</p>
    </LegalShell>
  );
}

export function ContactPage() {
  const [params] = useSearchParams();
  const topic = params.get("topic") ?? "";
  const mailto = `mailto:${site.email}?subject=${encodeURIComponent(topic ? `Correction: ${topic}` : "Calcora contact")}`;
  return (
    <LegalShell title="Contact" path="/contact" description="How to reach the publisher. Messages are not stored on this site.">
      <p>Email <a className="text-[var(--teal)]" href={`mailto:${site.email}`}>{site.email}</a>. This form opens your email app. Nothing is stored on our servers.</p>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(String(data.get("subject") || "Calcora"))}&body=${encodeURIComponent(String(data.get("message") || ""))}`; }}>
        <label className="block text-sm" htmlFor="subject">Subject</label>
        <input id="subject" name="subject" defaultValue={topic ? `Correction: ${topic}` : ""} className="w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        <label className="block text-sm" htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={5} className="w-full rounded-xl border border-[var(--line)] px-3 py-2" />
        <button className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm text-white" type="submit">Open email</button>
      </form>
      <p className="mt-3 text-sm"><a href={mailto}>Or use this mailto link</a></p>
    </LegalShell>
  );
}

function LegalShell({ title, path, description, children }: { title: string; path: string; description: string; children: ReactNode }) {
  return (
    <>
      <Seo title={title} description={description} path={path} />
      <article className="prose-page max-w-3xl space-y-4">
        <h1 className="text-4xl">{title}</h1>
        <p className="text-sm text-[var(--muted)]">Last updated 21 March 2026. This text is a practical draft, not a lawyer’s opinion, and it has not been independently certified.</p>
        {children}
      </article>
    </>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Privacy policy" path="/privacy" description="What Calcora stores, and what it does not.">
      <p>Calculator inputs, including passwords, salaries, and health measurements, are processed in your browser. They are not sent to {site.legalName} and they are not written to local storage.</p>
      <p>Favourites and recently used tools store only calculator slugs on this device. You can clear them on the favourites page. Theme and consent choices are also stored locally.</p>
      <p>Optional analytics and advertising stay disabled until a measurement ID or AdSense publisher ID is configured and you allow them in the consent bar. Search analytics, if enabled later, should record result counts and selected calculator names, not the raw query, because a query can contain personal numbers.</p>
      <p>If you email us, we receive whatever you put in that email. Do not include passwords or full financial records.</p>
      <p>Visitors in the EEA, UK, and other regions with consent rules should be able to reject non-essential cookies. The banner on this site is a starting point. Have counsel review it for your audience before you enable ads.</p>
      <p>Publisher: {site.ownerName}, {site.email}, {site.address}.</p>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Terms of use" path="/terms" description="The terms for using Calcora calculators.">
      <p>You may use the calculators for personal or internal business arithmetic. You may not present the results as a quote from a bank, a diagnosis, or a tax assessment.</p>
      <p>The site is provided as is. Formulas can be wrong, outdated, or inapplicable to your facts. Tax rules in src/config/taxRules.ts must be checked against the current Finance Act before reliance.</p>
      <p>Do not misuse the site to attack other systems, scrape in a way that degrades service, or misrepresent affiliate links as editorial without the disclosure.</p>
      <p>These terms are a draft for {site.ownerName}. They are not a complete contract for every jurisdiction.</p>
    </LegalShell>
  );
}

export function DisclaimerPage() {
  return (
    <LegalShell title="Disclaimer" path="/disclaimer" description="Limits of the calculators on Calcora.">
      <p>Results are estimates from the inputs and formulas on the page. They are not financial, medical, legal, or tax advice, and they do not create a professional relationship.</p>
      <p>Loan figures omit fees a lender may charge. Investment figures are not forecasts. Health figures are not diagnoses. Pregnancy tools do not confirm pregnancy. Tax figures use maintainable rules that can lag the statute.</p>
      <p>Currency conversion uses only the rate you type. There is no live market feed.</p>
    </LegalShell>
  );
}

export function AffiliatePage() {
  return (
    <LegalShell title="Affiliate disclosure" path="/affiliate-disclosure" description="How affiliate links are labelled on Calcora.">
      <p>Some resource sections contain affiliate links. If you buy through one, we may earn a commission at no extra cost to you. Those links use rel="sponsored". They are not ordinary navigation.</p>
      <p>Sample cards are placeholders until real products are added in src/data/affiliateProducts.ts. We do not invent reviews, star ratings, or discounts. Prices are shown only when maintained.</p>
      <p>Calculator results do not change because an affiliate product is listed nearby.</p>
    </LegalShell>
  );
}

export function CorrectionsPage() {
  return (
    <LegalShell title="Corrections and feedback" path="/corrections" description="How to report a wrong formula or an outdated tax rule.">
      <p>If a formula, example, or tax slab is wrong, email {site.email} or use the correction link on the calculator. Include the calculator name, the inputs, the result you saw, and the result you expected.</p>
      <p>We will correct clear arithmetic errors. Disagreements about which assumption a lender uses are noted on the page rather than hidden. Tax and GST notes should be updated in the config files, not scattered through components.</p>
      <p>This policy is an editorial practice, not a promise of a response time.</p>
    </LegalShell>
  );
}
