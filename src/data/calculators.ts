import { businessCalcs } from "./calcs/business";
import { financeCalcs } from "./calcs/finance";
import { generalCalcs } from "./calcs/general";
import { healthCalcs } from "./calcs/health";
import { homeCalcs } from "./calcs/home";
import { lifestyleCalcs } from "./calcs/lifestyle";
import { mathCalcs } from "./calcs/math";
import { techCalcs } from "./calcs/tech";
import type { CalcDef, CategoryId } from "./types";

export const calculators: CalcDef[] = [
  ...generalCalcs,
  ...healthCalcs,
  ...financeCalcs,
  ...mathCalcs,
  ...businessCalcs,
  ...homeCalcs,
  ...techCalcs,
  ...lifestyleCalcs,
];

const bySlug = new Map<string, CalcDef>();
for (const calc of calculators) {
  if (bySlug.has(calc.slug)) {
    console.error(`Duplicate calculator slug skipped: ${calc.slug}`);
    continue;
  }
  bySlug.set(calc.slug, calc);
}

export function getCalculator(slug: string | undefined): CalcDef | undefined {
  if (!slug) return undefined;
  return bySlug.get(slug);
}

export function getByCategory(category: CategoryId | string): CalcDef[] {
  return calculators
    .filter((calc) => calc.category === category)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function featuredCalculators(): CalcDef[] {
  return calculators
    .filter((calc) => typeof calc.featured === "number")
    .sort((a, b) => (a.featured ?? 99) - (b.featured ?? 99));
}

export function relatedCalculators(calc: CalcDef): CalcDef[] {
  return calc.related.map((slug) => bySlug.get(slug)).filter((item): item is CalcDef => Boolean(item));
}

export function allSlugs(): string[] {
  return calculators.map((calc) => calc.slug);
}
