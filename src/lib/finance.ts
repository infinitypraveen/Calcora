import { InputError } from "./format";

export function monthlyRate(annualPercent: number): number {
  return annualPercent / 100 / 12;
}

export function emi(principal: number, annualPercent: number, months: number): number {
  if (principal < 0) throw new InputError("Principal cannot be negative.");
  if (months <= 0) throw new InputError("Tenure must be at least 1 month.");
  if (annualPercent < 0) throw new InputError("Interest rate cannot be negative.");
  if (principal === 0) return 0;
  const r = monthlyRate(annualPercent);
  if (r === 0) return principal / months;
  const growth = (1 + r) ** months;
  return (principal * r * growth) / (growth - 1);
}

export function futureValueCompound(principal: number, annualPercent: number, years: number, compoundsPerYear: number): number {
  if (compoundsPerYear <= 0) throw new InputError("Compounding frequency must be at least 1.");
  if (years < 0) throw new InputError("Time cannot be negative.");
  const r = annualPercent / 100;
  return principal * (1 + r / compoundsPerYear) ** (compoundsPerYear * years);
}

export function simpleInterest(principal: number, annualPercent: number, years: number): { interest: number; amount: number } {
  const interest = principal * (annualPercent / 100) * years;
  return { interest, amount: principal + interest };
}

export function sipFutureValue(monthly: number, annualPercent: number, months: number): number {
  if (monthly < 0 || months < 0) throw new InputError("Investment and tenure cannot be negative.");
  const r = monthlyRate(annualPercent);
  if (months === 0) return 0;
  if (r === 0) return monthly * months;
  const growth = (1 + r) ** months;
  return monthly * ((growth - 1) / r) * (1 + r);
}

export function stepUpSip(monthly: number, annualPercent: number, years: number, stepUpPercent: number): number {
  if (years <= 0) throw new InputError("Enter a tenure of at least 1 year.");
  const r = monthlyRate(annualPercent);
  let future = 0;
  let payment = monthly;
  for (let year = 0; year < years; year++) {
    future *= (1 + r) ** 12;
    if (r === 0) future += payment * 12;
    else {
      const growth = (1 + r) ** 12;
      future += payment * ((growth - 1) / r) * (1 + r);
    }
    payment *= 1 + stepUpPercent / 100;
  }
  return future;
}

export function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || end <= 0) throw new InputError("Start and end values must be greater than zero for CAGR.");
  if (years <= 0) throw new InputError("Years must be greater than zero.");
  return (end / start) ** (1 / years) - 1;
}

export interface CashFlow {
  amount: number;
  date: Date;
}

export function xirr(flows: CashFlow[]): number {
  if (flows.length < 2) throw new InputError("Enter at least two cash flows.");
  if (!flows.some((f) => f.amount > 0) || !flows.some((f) => f.amount < 0)) {
    throw new InputError("XIRR needs at least one negative cash flow (money out) and one positive cash flow (money in).");
  }
  const sorted = [...flows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const t0 = sorted[0].date.getTime();
  const years = (date: Date) => (date.getTime() - t0) / (365.25 * 24 * 3600 * 1000);
  const npv = (rate: number) => sorted.reduce((sum, flow) => sum + flow.amount / (1 + rate) ** years(flow.date), 0);
  const derivative = (rate: number) =>
    sorted.reduce((sum, flow) => {
      const t = years(flow.date);
      return sum - (t * flow.amount) / (1 + rate) ** (t + 1);
    }, 0);

  let rate = 0.1;
  for (let i = 0; i < 80; i++) {
    const value = npv(rate);
    const slope = derivative(rate);
    if (!Number.isFinite(value) || !Number.isFinite(slope) || Math.abs(slope) < 1e-12) break;
    const next = rate - value / slope;
    if (Math.abs(next - rate) < 1e-9 && Math.abs(value) < 1e-6) return next;
    rate = next;
    if (rate <= -0.999999) rate = -0.999999;
  }

  let low = -0.9999;
  let high = 10;
  let npvLow = npv(low);
  let npvHigh = npv(high);
  if (npvLow * npvHigh > 0) {
    high = 100;
    npvHigh = npv(high);
  }
  if (npvLow * npvHigh > 0) throw new InputError("A single IRR could not be found for these cash flows. Check the dates and signs.");
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const value = npv(mid);
    if (Math.abs(value) < 1e-7) return mid;
    if (npvLow * value <= 0) {
      high = mid;
      npvHigh = value;
    } else {
      low = mid;
      npvLow = value;
    }
  }
  return (low + high) / 2;
}

export function rdMaturity(monthly: number, annualPercent: number, months: number): number {
  if (months <= 0) throw new InputError("Tenure must be at least 1 month.");
  if (annualPercent === 0) return monthly * months;
  const quarters = months / 3;
  const i = annualPercent / 400;
  const factor = 1 - (1 + i) ** (-1 / 3);
  if (factor === 0) return monthly * months;
  return (monthly * ((1 + i) ** quarters - 1)) / factor;
}

export function maxLoanFromEmi(emiAmount: number, annualPercent: number, months: number): number {
  const r = monthlyRate(annualPercent);
  if (emiAmount <= 0 || months <= 0) return 0;
  if (r === 0) return emiAmount * months;
  const growth = (1 + r) ** months;
  return (emiAmount * (growth - 1)) / (r * growth);
}

export interface AmortizationYear {
  year: number;
  principal: number;
  interest: number;
  extra: number;
  balance: number;
}

export function amortize(principal: number, annualPercent: number, months: number, extraMonthly = 0): {
  emi: number;
  schedule: AmortizationYear[];
  totalInterest: number;
  totalPaid: number;
  monthsUsed: number;
} {
  const payment = emi(principal, annualPercent, months);
  const r = monthlyRate(annualPercent);
  if (payment + extraMonthly <= principal * r && r > 0) {
    throw new InputError("The payment does not cover monthly interest, so the balance would not fall. Increase the payment or reduce the rate.");
  }
  let balance = principal;
  let totalInterest = 0;
  let totalExtra = 0;
  let month = 0;
  const years: AmortizationYear[] = [];
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearExtra = 0;
  const cap = Math.max(months, 1) + 600;
  while (balance > 0.005 && month < cap) {
    const interest = balance * r;
    let principalPaid = payment - interest;
    let extra = extraMonthly;
    if (principalPaid + extra > balance) {
      extra = Math.max(0, balance - principalPaid);
      principalPaid = balance - extra;
    }
    if (principalPaid < 0) principalPaid = 0;
    balance = Math.max(0, balance - principalPaid - extra);
    totalInterest += interest;
    totalExtra += extra;
    yearPrincipal += principalPaid;
    yearInterest += interest;
    yearExtra += extra;
    month += 1;
    if (month % 12 === 0 || balance <= 0.005) {
      years.push({
        year: years.length + 1,
        principal: yearPrincipal,
        interest: yearInterest,
        extra: yearExtra,
        balance,
      });
      yearPrincipal = 0;
      yearInterest = 0;
      yearExtra = 0;
    }
  }
  return {
    emi: payment,
    schedule: years,
    totalInterest,
    totalPaid: principal + totalInterest + totalExtra,
    monthsUsed: month,
  };
}

export function savingsPayment(goal: number, annualPercent: number, months: number, current = 0): number {
  const r = monthlyRate(annualPercent);
  const grown = current * (r === 0 ? 1 : (1 + r) ** months);
  const remaining = goal - grown;
  if (remaining <= 0) return 0;
  if (r === 0) return remaining / months;
  return (remaining * r) / ((1 + r) ** months - 1);
}

export function growingAnnuityPV(firstPayment: number, growthRate: number, discountRate: number, periods: number): number {
  if (periods <= 0) return 0;
  if (Math.abs(discountRate - growthRate) < 1e-9) return (firstPayment * periods) / (1 + discountRate);
  return (firstPayment * (1 - ((1 + growthRate) / (1 + discountRate)) ** periods)) / (discountRate - growthRate);
}
