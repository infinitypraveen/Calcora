import { Link } from "react-router-dom";
import { categories } from "@/data/categories";
import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--card)]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="serif text-2xl">Calcora</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{site.tagline} Inputs stay in your browser. Formulas are shown with the result.</p>
          <p className="mt-3 text-sm font-medium">Free forever. No sign-up.</p>
          <Link to="/support" className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1.5 text-sm font-semibold text-[#102033] hover:bg-amber-200">
            ☕ Support Calcora
          </Link>
        </div>
        <nav aria-label="Footer categories">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Categories</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}><Link to={`/category/${category.id}`}>{category.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer explore">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/directory">All calculators</Link></li>
            <li><Link to="/guides">Guides</Link></li>
            <li><Link to="/search">Search</Link></li>
            <li><Link to="/favorites">Favourites</Link></li>
            <li><Link to="/sitemap">HTML sitemap</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer about and policies">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">About</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/privacy">Privacy policy</Link></li>
            <li><Link to="/terms">Terms of use</Link></li>
            <li><Link to="/disclaimer">Disclaimer</Link></li>
            <li><Link to="/affiliate-disclosure">Affiliate disclosure</Link></li>
            <li><Link to="/corrections">Corrections</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-[var(--line)] px-4 py-4 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} {site.legalName}. Estimates, not advice. Replace the owner details in src/config/site.ts before launch.
      </div>
    </footer>
  );
}
