export type CategoryId =
  | "general"
  | "health"
  | "finance"
  | "math"
  | "business"
  | "home"
  | "tech"
  | "lifestyle";

export type FieldType = "number" | "text" | "textarea" | "select" | "date" | "time" | "password";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number | string;
  defaultValue?: string;
  options?: FieldOption[];
  help?: string;
  required?: boolean;
  showIf?: { field: string; equals: string };
  rows?: number;
  sensitive?: boolean;
}

export interface ResultItem {
  label: string;
  value: string;
  detail?: string;
  emphasize?: boolean;
}

export interface CalcTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface CalcResult {
  results: ResultItem[];
  notes?: string[];
  table?: CalcTable;
  error?: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface CalcDef {
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  keywords: string[];
  synonyms?: string[];
  featured?: number;
  inputs: FieldDef[];
  compute: (values: Record<string, string>) => CalcResult;
  formula: string;
  howItWorks: string;
  steps: string[];
  example: string;
  faqs: Faq[];
  related: string[];
  assumptions?: string[];
  disclaimer?: string;
  affiliateTags?: string[];
  widget?: "basic" | "scientific" | "json" | "hash" | "typing" | "color";
  live?: boolean;
  submitLabel?: string;
}

export function item(label: string, value: string, emphasize = false, detail?: string): ResultItem {
  return { label, value, emphasize, detail };
}

export function pack(results: ResultItem[], extra?: Partial<CalcResult>): CalcResult {
  return { results, ...extra };
}

export const HEALTH_DISCLAIMER =
  "This is a general estimate for education, not a diagnosis, diet prescription, or training plan. Age, pregnancy, medication, and medical conditions change what is safe. Ask a qualified clinician before using a result to change how you eat, train, or take medicine.";

export const PREGNANCY_DISCLAIMER =
  "This is a calendar estimate only. It does not confirm pregnancy, date a pregnancy as accurately as an ultrasound, or replace prenatal care. Pain, bleeding, or a missed period are reasons to contact a clinician or local health service, not a website.";

export const FINANCE_DISCLAIMER =
  "Figures are estimates from the assumptions on this page. They are not a loan offer, tax return, or a forecast of investment returns. Fees, taxes, and rates change. Check the result with your lender, fund, employer, or a qualified adviser before you rely on it.";

export const ENTERTAINMENT_DISCLAIMER =
  "This result is entertainment. It is not scientific, psychological, or relationship advice, and it should not be used to judge a person.";
