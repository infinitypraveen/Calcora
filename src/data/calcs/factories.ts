import { formatNumber, readNumber } from "@/lib/format";
import { amortize, emi } from "@/lib/finance";
import { convertUnit, dimensions, unitOptions } from "@/lib/units";
import { FINANCE_DISCLAIMER, item, pack, type CalcDef, type CategoryId, type Faq, type FieldDef } from "../types";

export function makeUnitCalc(opts: {
  slug: string;
  title: string;
  description: string;
  dimension: string;
  keywords: string[];
  synonyms?: string[];
  from: string;
  to: string;
  sample?: string;
  formula: string;
  howItWorks: string;
  steps: string[];
  example: string;
  faqs: Faq[];
  related: string[];
  category?: CategoryId;
  assumptions?: string[];
  featured?: number;
}): CalcDef {
  const dimension = dimensions[opts.dimension];
  return {
    slug: opts.slug,
    title: opts.title,
    description: opts.description,
    category: opts.category ?? "general",
    keywords: opts.keywords,
    synonyms: opts.synonyms,
    featured: opts.featured,
    inputs: [
      { id: "value", label: "Value", type: "number", defaultValue: opts.sample ?? "1", required: true, step: "any" },
      { id: "from", label: "From", type: "select", defaultValue: opts.from, options: unitOptions(opts.dimension) },
      { id: "to", label: "To", type: "select", defaultValue: opts.to, options: unitOptions(opts.dimension) },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Value");
      const converted = convertUnit(opts.dimension, value, v.from || opts.from, v.to || opts.to);
      const fromLabel = dimension.units.find((u) => u.id === (v.from || opts.from))?.label ?? "source";
      const toLabel = dimension.units.find((u) => u.id === (v.to || opts.to))?.label ?? "target";
      return pack(
        [
          item("Converted value", `${formatNumber(converted, 8)}`, true, toLabel),
          item("Original", `${formatNumber(value, 8)} ${fromLabel}`),
          item("Base unit", dimension.base),
        ],
        { notes: ["Exact factors are used where the unit is defined by an international standard. Regional land units are labelled with the convention used."] },
      );
    },
    formula: opts.formula,
    howItWorks: opts.howItWorks,
    steps: opts.steps,
    example: opts.example,
    faqs: opts.faqs,
    related: opts.related,
    assumptions: opts.assumptions,
    affiliateTags: ["general"],
  };
}

export function makeLoanCalc(opts: {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  synonyms?: string[];
  amountLabel: string;
  defaultAmount: string;
  defaultRate: string;
  defaultYears: string;
  howItWorks: string;
  example: string;
  faqs: Faq[];
  related: string[];
  featured?: number;
  downPayment?: boolean;
  assumptions?: string[];
}): CalcDef {
  return {
    slug: opts.slug,
    title: opts.title,
    description: opts.description,
    category: "finance",
    keywords: opts.keywords,
    synonyms: opts.synonyms,
    featured: opts.featured,
    affiliateTags: ["finance", opts.slug],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: opts.assumptions ?? [
      "The rate is a fixed nominal annual rate, compounded monthly.",
      "Fees, insurance, and tax are not included unless you add them to the amount yourself.",
      "EMI is rounded for display. A lender may round each instalment differently.",
    ],
    inputs: [
      { id: "amount", label: opts.amountLabel, type: "number", unit: "₹", min: 0, defaultValue: opts.defaultAmount, required: true },
      ...(opts.downPayment
        ? [{ id: "down", label: "Down payment", type: "number", unit: "₹", min: 0, defaultValue: "0" } satisfies FieldDef]
        : []),
      { id: "rate", label: "Annual interest rate", type: "number", unit: "%", min: 0, step: 0.01, defaultValue: opts.defaultRate, required: true },
      { id: "years", label: "Tenure", type: "number", unit: "years", min: 1, max: 40, defaultValue: opts.defaultYears, required: true },
    ] satisfies FieldDef[],
    compute: (v) => {
      const price = readNumber(v, "amount", opts.amountLabel, { min: 0 });
      const down = opts.downPayment ? readNumber({ ...v, down: v.down || "0" }, "down", "Down payment", { min: 0 }) : 0;
      if (down > price) throw new Error("Down payment cannot exceed the price.");
      const principal = price - down;
      const rate = readNumber(v, "rate", "Interest rate", { min: 0, max: 100 });
      const years = readNumber(v, "years", "Tenure", { min: 1, max: 40 });
      const months = Math.round(years * 12);
      const payment = emi(principal, rate, months);
      const schedule = amortize(principal, rate, months);
      return pack(
        [
          item("Monthly EMI", formatInr(payment), true),
          item("Amount financed", formatInr(principal)),
          item("Total interest", formatInr(schedule.totalInterest)),
          item("Total payable", formatInr(principal + schedule.totalInterest)),
          item("Tenure", `${months} months`),
        ],
        {
          notes: [`Interest share of total payable: ${formatNumber((schedule.totalInterest / (principal + schedule.totalInterest || 1)) * 100, 1)}%.`],
          table: {
            caption: "Year-by-year principal and interest",
            headers: ["Year", "Principal", "Interest", "Balance"],
            rows: schedule.schedule.map((row) => [
              String(row.year),
              formatInr(row.principal),
              formatInr(row.interest),
              formatInr(row.balance),
            ]),
          },
        },
      );
    },
    formula: "EMI = P × r × (1 + r)^n / ((1 + r)^n − 1), where r is the monthly rate and n is the number of months.",
    howItWorks: opts.howItWorks,
    steps: [
      "Subtract any down payment from the price to get the principal.",
      "Convert the annual rate to a monthly rate by dividing by 12 and by 100.",
      "Apply the EMI formula for the number of months.",
      "Total interest is EMI × months − principal.",
    ],
    example: opts.example,
    faqs: opts.faqs,
    related: opts.related,
  };
}

export function formatInr(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatInrExact(value: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}
