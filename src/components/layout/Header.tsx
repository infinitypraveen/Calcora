import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { categories } from "@/data/categories";
import { getTheme, setTheme } from "@/lib/storage";
import { SearchBox } from "./SearchBox";

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold text-[var(--ink)]">
      <svg width="32" height="32" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#102033" />
        <rect x="16" y="12" width="32" height="40" rx="6" fill="none" stroke="#2DD4BF" strokeWidth="3" />
        <rect x="21" y="18" width="22" height="8" rx="2" fill="#E8EEF7" />
        <circle cx="25" cy="34" r="2.6" fill="#2DD4BF" />
        <circle cx="32" cy="34" r="2.6" fill="#2DD4BF" />
        <circle cx="39" cy="34" r="2.6" fill="#2DD4BF" />
        <circle cx="25" cy="43" r="2.6" fill="#2DD4BF" />
        <circle cx="32" cy="43" r="2.6" fill="#2DD4BF" />
        <rect x="36.5" y="40.5" width="5.2" height="5.2" rx="1.4" fill="#E8EEF7" />
      </svg>
      <span className="serif text-xl leading-none">Calcora</span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [cats, setCats] = useState(false);
  const [dark, setDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setCats(false);
  }, [location.pathname]);

  useEffect(() => {
    setDark(getTheme() === "dark");
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        document.getElementById("site-search")?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        setCats(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--card)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          <div className="relative">
            <button type="button" className="rounded-full px-3 py-2 text-sm" aria-expanded={cats} onClick={() => setCats((v) => !v)}>
              Categories
            </button>
            {cats ? (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-2 shadow-xl">
                {categories.map((category) => (
                  <Link key={category.id} to={`/category/${category.id}`} className="block rounded-xl px-3 py-2 hover:bg-teal-50 dark:hover:bg-white/5">
                    <span className="font-medium">{category.name}</span>
                    <span className="block text-xs text-[var(--muted)]">{category.blurb}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <NavLink to="/directory" className="rounded-full px-3 py-2 text-sm">Directory</NavLink>
          <NavLink to="/guides" className="rounded-full px-3 py-2 text-sm">Guides</NavLink>
          <NavLink to="/favorites" className="rounded-full px-3 py-2 text-sm">Favourites</NavLink>
          <NavLink to="/support" className="rounded-full px-3 py-2 text-sm">Support</NavLink>
        </nav>
        <div className="ml-auto hidden min-w-0 flex-1 justify-end md:flex">
          <div id="site-search" className="w-full max-w-xs">
            <SearchBox />
          </div>
        </div>
        <button
          type="button"
          className="rounded-full border border-[var(--line)] px-3 py-2 text-sm"
          onClick={() => {
            const next = dark ? "light" : "dark";
            setTheme(next);
            setDark(next === "dark");
          }}
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
        >
          {dark ? "Light" : "Dark"}
        </button>
        <button type="button" className="rounded-full border border-[var(--line)] px-3 py-2 text-sm lg:hidden" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open ? (
        <div className="border-t border-[var(--line)] px-4 py-4 lg:hidden">
          <SearchBox />
          <div className="mt-4 grid gap-2">
            {categories.map((category) => (
              <Link key={category.id} to={`/category/${category.id}`} className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                {category.name}
              </Link>
            ))}
            <Link to="/directory" className="text-sm font-medium">Directory</Link>
            <Link to="/guides" className="text-sm font-medium">Guides</Link>
            <Link to="/favorites" className="text-sm font-medium">Favourites</Link>
            <Link to="/support" className="text-sm font-medium">☕ Support Calcora</Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
