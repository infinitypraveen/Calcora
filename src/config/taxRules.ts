/**
 * Indian income-tax estimator rules.
 * Update this file when the Finance Act changes slabs, rebates, or deductions.
 * Do not scatter these numbers through calculator components.
 *
 * Sources to re-check before relying on a result:
 * - The Finance Act for the relevant year
 * - Income Tax Department notifications and the official tax utility
 *
 * The figures below follow widely published descriptions of the new regime
 * (nil to ₹4 lakh, then 5%, 10%, 15%, 20%, 25%, 30%) and the Section 87A
 * rebate up to ₹60,000 for taxable income up to ₹12 lakh, plus a ₹75,000
 * standard deduction for salary under the new regime. Budget commentary
 * available in 2026 described no slab change for FY 2026-27 versus FY 2025-26.
 * Confirm before use. This is not tax advice.
 */

export type AgeBand = "below60" | "senior" | "super";
export type TaxRegime = "new" | "old";

export interface Slab {
  /** Inclusive upper bound of this band. Use Number.POSITIVE_INFINITY for the top band. */
  upto: number;
  rate: number;
}

export interface SurchargeBand {
  above: number;
  rate: number;
}

export interface TaxYearRules {
  id: string;
  label: string;
  assessmentYear: string;
  notes: string[];
  cessRate: number;
  newRegime: {
    standardDeduction: number;
    rebateIncomeLimit: number;
    rebateMax: number;
    /** If taxable income exceeds the rebate limit, tax before cess is capped at the excess. */
    marginalReliefOnRebate: boolean;
    slabs: Slab[];
    surcharge: SurchargeBand[];
    employerNpsCapRate: number;
  };
  oldRegime: {
    standardDeduction: number;
    rebateIncomeLimit: number;
    rebateMax: number;
    slabsByAge: Record<AgeBand, Slab[]>;
    surcharge: SurchargeBand[];
    employerNpsCapRate: number;
    section80cCap: number;
  };
}

const newSlabs: Slab[] = [
  { upto: 400_000, rate: 0 },
  { upto: 800_000, rate: 0.05 },
  { upto: 1_200_000, rate: 0.1 },
  { upto: 1_600_000, rate: 0.15 },
  { upto: 2_000_000, rate: 0.2 },
  { upto: 2_400_000, rate: 0.25 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const oldBelow60: Slab[] = [
  { upto: 250_000, rate: 0 },
  { upto: 500_000, rate: 0.05 },
  { upto: 1_000_000, rate: 0.2 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const oldSenior: Slab[] = [
  { upto: 300_000, rate: 0 },
  { upto: 500_000, rate: 0.05 },
  { upto: 1_000_000, rate: 0.2 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const oldSuper: Slab[] = [
  { upto: 500_000, rate: 0 },
  { upto: 1_000_000, rate: 0.2 },
  { upto: Number.POSITIVE_INFINITY, rate: 0.3 },
];

const newSurcharge: SurchargeBand[] = [
  { above: 5_000_000, rate: 0.1 },
  { above: 10_000_000, rate: 0.15 },
  { above: 20_000_000, rate: 0.25 },
];

const oldSurcharge: SurchargeBand[] = [
  { above: 5_000_000, rate: 0.1 },
  { above: 10_000_000, rate: 0.15 },
  { above: 20_000_000, rate: 0.25 },
  { above: 50_000_000, rate: 0.37 },
];

function year(id: string, label: string, ay: string): TaxYearRules {
  return {
    id,
    label,
    assessmentYear: ay,
    notes: [
      "New regime is modelled as the default regime, with a ₹75,000 standard deduction for salary and a Section 87A rebate for taxable income up to ₹12 lakh.",
      "Old regime standard deduction is modelled at ₹50,000. Section 80C is capped at ₹1.5 lakh in this estimator.",
      "Surcharge marginal relief is not fully modelled near threshold incomes. Treat those results as approximate.",
      "Health and education cess is applied at 4% after tax and surcharge.",
    ],
    cessRate: 0.04,
    newRegime: {
      standardDeduction: 75_000,
      rebateIncomeLimit: 1_200_000,
      rebateMax: 60_000,
      marginalReliefOnRebate: true,
      slabs: newSlabs,
      surcharge: newSurcharge,
      employerNpsCapRate: 0.14,
    },
    oldRegime: {
      standardDeduction: 50_000,
      rebateIncomeLimit: 500_000,
      rebateMax: 12_500,
      slabsByAge: {
        below60: oldBelow60,
        senior: oldSenior,
        super: oldSuper,
      },
      surcharge: oldSurcharge,
      employerNpsCapRate: 0.1,
      section80cCap: 150_000,
    },
  };
}

export const taxYears: TaxYearRules[] = [
  year("2025-26", "FY 2025-26", "AY 2026-27"),
  year("2026-27", "FY 2026-27", "AY 2027-28"),
];

export function getTaxYear(id: string): TaxYearRules {
  return taxYears.find((y) => y.id === id) ?? taxYears[taxYears.length - 1];
}

export function taxFromSlabs(taxable: number, slabs: Slab[]): number {
  if (taxable <= 0) return 0;
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (taxable <= prev) break;
    const top = Math.min(taxable, slab.upto);
    tax += (top - prev) * slab.rate;
    prev = slab.upto;
  }
  return tax;
}

export function surchargeRate(income: number, bands: SurchargeBand[]): number {
  let rate = 0;
  for (const band of bands) {
    if (income > band.above) rate = band.rate;
  }
  return rate;
}

export interface TaxEstimateInput {
  yearId: string;
  regime: TaxRegime;
  age: AgeBand;
  /** Gross salary / total income before standard deduction and Chapter VI-A deductions. */
  grossIncome: number;
  isSalaried: boolean;
  /** Old-regime deductions the user believes are allowable (80C, 80D, and similar), before the 80C cap is applied. */
  oldRegimeDeductions: number;
  /** Employer NPS contribution. Capped using basic salary when basic is provided. */
  employerNps: number;
  basicSalary: number;
}

export interface TaxEstimate {
  taxableIncome: number;
  taxBeforeRebate: number;
  rebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  notes: string[];
  year: TaxYearRules;
}

export function estimateIncomeTax(input: TaxEstimateInput): TaxEstimate {
  const yearRules = getTaxYear(input.yearId);
  const notes = [...yearRules.notes];
  const gross = Math.max(0, input.grossIncome);
  let taxable = gross;
  let npsDeduction = Math.max(0, input.employerNps);

  if (input.regime === "new") {
    if (input.isSalaried) taxable -= yearRules.newRegime.standardDeduction;
    if (input.basicSalary > 0) {
      const cap = input.basicSalary * yearRules.newRegime.employerNpsCapRate;
      if (npsDeduction > cap) {
        notes.push(
          `Employer NPS deduction was capped at ${Math.round(yearRules.newRegime.employerNpsCapRate * 100)}% of basic salary under the new-regime rule stored in taxRules.ts.`,
        );
        npsDeduction = cap;
      }
    } else if (npsDeduction > 0) {
      notes.push("Basic salary was not entered, so the employer NPS cap was not checked.");
    }
    taxable -= npsDeduction;
    if (input.oldRegimeDeductions > 0) {
      notes.push(
        "Section 80C, 80D, HRA, and most other old-regime deductions were not subtracted. They are not applied under the new regime in this estimator.",
      );
    }
  } else {
    if (input.isSalaried) taxable -= yearRules.oldRegime.standardDeduction;
    const capped80c = Math.min(Math.max(0, input.oldRegimeDeductions), yearRules.oldRegime.section80cCap);
    if (input.oldRegimeDeductions > yearRules.oldRegime.section80cCap) {
      notes.push("Old-regime deductions were capped at the Section 80C limit stored in taxRules.ts. 80D and other sections are not itemised separately.");
    }
    taxable -= capped80c;
    if (input.basicSalary > 0) {
      const cap = input.basicSalary * yearRules.oldRegime.employerNpsCapRate;
      if (npsDeduction > cap) {
        notes.push("Employer NPS deduction was capped at 10% of basic salary under the old-regime rule in taxRules.ts.");
        npsDeduction = cap;
      }
    }
    taxable -= npsDeduction;
  }

  taxable = Math.max(0, taxable);
  const regime = input.regime === "new" ? yearRules.newRegime : yearRules.oldRegime;
  const slabs = input.regime === "new" ? yearRules.newRegime.slabs : yearRules.oldRegime.slabsByAge[input.age];
  let tax = taxFromSlabs(taxable, slabs);
  const taxBeforeRebate = tax;
  let rebate = 0;

  if (input.regime === "new" && yearRules.newRegime.marginalReliefOnRebate) {
    if (taxable <= yearRules.newRegime.rebateIncomeLimit) {
      rebate = Math.min(tax, yearRules.newRegime.rebateMax);
      tax -= rebate;
    } else {
      const excess = taxable - yearRules.newRegime.rebateIncomeLimit;
      if (tax > excess) {
        rebate = tax - excess;
        tax = excess;
        notes.push("Marginal relief was applied so tax before cess does not exceed income above the ₹12 lakh rebate threshold.");
      }
    }
  } else if (taxable <= regime.rebateIncomeLimit) {
    rebate = Math.min(tax, regime.rebateMax);
    tax -= rebate;
  }

  tax = Math.max(0, tax);
  const sRate = surchargeRate(taxable, regime.surcharge);
  const surcharge = tax * sRate;
  const cess = (tax + surcharge) * yearRules.cessRate;
  const totalTax = tax + surcharge + cess;

  return {
    taxableIncome: taxable,
    taxBeforeRebate,
    rebate,
    surcharge,
    cess,
    totalTax,
    effectiveRate: gross > 0 ? totalTax / gross : 0,
    notes,
    year: yearRules,
  };
}
