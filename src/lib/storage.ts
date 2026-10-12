const RECENT = "calcora.recent";
const FAVORITES = "calcora.favorites";
const CONSENT = "calcora.consent";
const THEME = "calcora.theme";

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string").slice(0, 30);
  } catch {
    return [];
  }
}

function writeList(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values.slice(0, 30)));
  } catch {
    /* Storage may be blocked. The calculators still work. */
  }
}

export function getRecent(): string[] {
  return readList(RECENT);
}

export function pushRecent(slug: string) {
  const next = [slug, ...getRecent().filter((item) => item !== slug)].slice(0, 8);
  writeList(RECENT, next);
}

export function clearRecent() {
  try {
    localStorage.removeItem(RECENT);
  } catch {
    /* ignore */
  }
}

export function getFavorites(): string[] {
  return readList(FAVORITES);
}

export function toggleFavorite(slug: string): string[] {
  const current = getFavorites();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current];
  writeList(FAVORITES, next);
  return next;
}

export function clearFavorites() {
  try {
    localStorage.removeItem(FAVORITES);
  } catch {
    /* ignore */
  }
}

export type ConsentState = "unknown" | "granted" | "denied";

export function getConsent(): ConsentState {
  try {
    const value = localStorage.getItem(CONSENT);
    if (value === "granted" || value === "denied") return value;
  } catch {
    /* ignore */
  }
  return "unknown";
}

export function setConsent(value: ConsentState) {
  try {
    localStorage.setItem(CONSENT, value);
  } catch {
    /* ignore */
  }
}

export function getTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(THEME) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function setTheme(theme: "light" | "dark") {
  try {
    localStorage.setItem(THEME, theme);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}
