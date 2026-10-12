import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculators } from "@/data/calculators";
import { popularSearches, searchCalculators } from "@/lib/search";
import { track } from "@/lib/track";

export function SearchBox({ variant = "header", autoFocus = false }: { variant?: "header" | "hero"; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => (query.trim() ? searchCalculators(query, calculators).slice(0, 8) : []), [query]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(slug?: string) {
    if (slug) {
      track("search_select", { slug });
      navigate(`/calculators/${slug}`);
    } else {
      track("search_submit", { result_count: results.length });
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setOpen(false);
  }

  const hero = variant === "hero";

  return (
    <div ref={boxRef} role="search" className={`relative ${hero ? "w-full" : "w-full max-w-md"}`}>
      <label htmlFor={listId} className="sr-only">
        Search calculators
      </label>
      <input
        id={listId}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        autoFocus={autoFocus}
        value={query}
        placeholder={hero ? "What do you want to calculate?" : "Search calculators"}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((n) => Math.min(n + 1, Math.max(results.length - 1, 0)));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((n) => Math.max(n - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (results[active]) go(results[active].slug);
            else go();
          } else if (event.key === "Escape") setOpen(false);
        }}
        className={`w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] shadow-sm placeholder:text-[var(--muted)] ${hero ? "px-5 py-4 text-lg" : "px-3 py-2 text-sm"}`}
      />
      {open ? (
        <div id={`${listId}-list`} role="listbox" className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-xl">
          {query.trim() && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[var(--muted)]">No calculators match that search. Try EMI, BMI, GST, or percentage.</p>
          ) : null}
          {results.map((calc, index) => (
            <button
              key={calc.slug}
              type="button"
              role="option"
              aria-selected={index === active}
              className={`block w-full px-4 py-3 text-left text-sm ${index === active ? "bg-teal-50 dark:bg-white/5" : ""}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(calc.slug)}
            >
              <span className="font-medium">{calc.title}</span>
              <span className="mt-0.5 block text-xs text-[var(--muted)]">{calc.description}</span>
            </button>
          ))}
          {!query.trim() ? (
            <div className="px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Popular searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button key={term} type="button" className="rounded-full border border-[var(--line)] px-3 py-1 text-xs" onClick={() => { setQuery(term); setOpen(true); }}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
