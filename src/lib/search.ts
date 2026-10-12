import type { CalcDef } from "@/data/types";

export function searchCalculators(query: string, list: CalcDef[]): CalcDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return list
    .map((calc) => {
      const title = calc.title.toLowerCase();
      const keywords = calc.keywords.map((k) => k.toLowerCase());
      const synonyms = (calc.synonyms ?? []).map((k) => k.toLowerCase());
      const description = calc.description.toLowerCase();
      let score = 0;
      if (title === q) score += 120;
      else if (title.startsWith(q)) score += 50;
      else if (title.includes(q)) score += 30;
      if (calc.slug.includes(q.replace(/\s+/g, "-"))) score += 20;
      for (const term of terms) {
        if (title.includes(term)) score += 14;
        if (keywords.some((k) => k.includes(term))) score += 10;
        if (synonyms.some((k) => k.includes(term))) score += 10;
        if (description.includes(term)) score += 4;
        if (calc.category.includes(term)) score += 3;
        const hay = `${title} ${keywords.join(" ")} ${synonyms.join(" ")} ${description}`;
        if (!hay.includes(term)) score -= 8;
      }
      return { calc, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || (a.calc.featured ?? 99) - (b.calc.featured ?? 99) || a.calc.title.localeCompare(b.calc.title))
    .map((row) => row.calc);
}

export const popularSearches = ["EMI", "BMI", "SIP", "GST", "percentage", "age", "compound interest", "home loan", "subnet", "BMI women"];
