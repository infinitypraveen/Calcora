import { parseISODate } from "@/lib/dates";
import { formatNumber, formatPct, InputError, readNumber } from "@/lib/format";
import {
  amortize,
  cagr,
  emi,
  futureValueCompound,
  growingAnnuityPV,
  maxLoanFromEmi,
  rdMaturity,
  savingsPayment,
  simpleInterest,
  sipFutureValue,
  stepUpSip,
  xirr,
} from "@/lib/finance";
import { estimateIncomeTax, taxYears, type AgeBand, type TaxRegime } from "@/config/taxRules";
import { FINANCE_DISCLAIMER, item, pack, type CalcDef } from "../types";
import { formatInr, formatInrExact, makeLoanCalc } from "./factories";

const currency = { id: "currency", label: "Currency label", type: "text" as const, defaultValue: "INR", help: "Used only as a label. The maths does not fetch a rate." };

function money(value: number, code = "INR"): string {
  if (code === "INR") return formatInrExact(value);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${code} ${formatNumber(value, 2)}`;
  }
}

export const financeCalcs: CalcDef[] = [
  {
    slug: "emi-calculator",
    title: "EMI calculator",
    description: "Calculate a fixed monthly instalment, total interest, and a year-by-year split for a reducing-balance loan.",
    category: "finance",
    keywords: ["emi", "equated monthly instalment", "loan emi"],
    synonyms: ["monthly payment", "loan calculator"],
    featured: 1,
    disclaimer: FINANCE_DISCLAIMER,
    affiliateTags: ["finance", "emi-calculator"],
    assumptions: ["Fixed nominal annual rate, compounded monthly.", "No fees, moratorium, or floating-rate resets.", "Display rounding can differ from a lender’s paisa rounding."],
    inputs: [
      { id: "amount", label: "Principal", type: "number", unit: "₹", defaultValue: "1000000", required: true, min: 0 },
      { id: "rate", label: "Annual interest rate", type: "number", unit: "%", defaultValue: "9", required: true, min: 0, step: 0.01 },
      { id: "years", label: "Tenure", type: "number", unit: "years", defaultValue: "20", required: true, min: 1, max: 40 },
    ],
    compute: (v) => {
      const principal = readNumber(v, "amount", "Principal", { min: 1 });
      const rate = readNumber(v, "rate", "Interest rate", { min: 0, max: 40 });
      const years = readNumber(v, "years", "Tenure", { min: 1, max: 40 });
      const months = Math.round(years * 12);
      const schedule = amortize(principal, rate, months);
      return pack([
        item("Monthly EMI", formatInrExact(schedule.emi), true),
        item("Total interest", formatInr(schedule.totalInterest)),
        item("Total payable", formatInr(principal + schedule.totalInterest)),
        item("Interest as a share of payments", formatPct((schedule.totalInterest / (principal + schedule.totalInterest)) * 100, 1)),
      ], {
        table: {
          caption: "Year-by-year split",
          headers: ["Year", "Principal", "Interest", "Balance"],
          rows: schedule.schedule.map((row) => [String(row.year), formatInr(row.principal), formatInr(row.interest), formatInr(row.balance)]),
        },
      });
    },
    formula: "EMI = P × r × (1+r)^n / ((1+r)^n − 1), where r = annual rate / 12 / 100 and n is months. If r is 0, EMI = P / n.",
    howItWorks: "A reducing-balance EMI keeps the payment flat while the interest portion shrinks and the principal portion grows. The formula is the payment that drives the balance to zero after n months. It is not a flat-rate loan, where interest is calculated on the original principal for the whole term and the cost is usually higher.",
    steps: ["Enter the amount you will actually borrow, after any down payment.", "Use the annual nominal rate from the offer, not the flat rate, unless you have converted it.", "Read total interest as well as the monthly figure. A small EMI over a long tenure can cost more."],
    example: "₹10,00,000 at 9% for 20 years is an EMI of about ₹8,997. Total interest is about ₹11.59 lakh.",
    faqs: [
      { q: "Why is my bank’s EMI a few rupees different?", a: "Lenders differ in rounding, in whether fees are financed, and in the exact day-count. A gap of a few rupees on the instalment is common." },
      { q: "Does a prepayment change this EMI?", a: "This page assumes no prepayment. Use the amortization calculator and its extra-payment field to see a shorter tenure." },
    ],
    related: ["home-loan-calculator", "amortization-schedule-calculator", "loan-affordability-calculator"],
  },
  makeLoanCalc({
    slug: "home-loan-calculator",
    title: "Home loan calculator",
    description: "Estimate the EMI on a home price after down payment, plus the loan-to-value ratio.",
    keywords: ["home loan", "mortgage", "housing emi"],
    synonyms: ["house loan", "mortgage calculator"],
    amountLabel: "Property price",
    defaultAmount: "7500000",
    defaultRate: "8.5",
    defaultYears: "20",
    downPayment: true,
    featured: 9,
    howItWorks: "A home loan EMI uses the same reducing-balance formula as any fixed EMI. What changes is the principal: price minus the down payment you actually pay. Lenders also look at loan-to-value, income, and the property. This page only does the arithmetic.",
    example: "A ₹75 lakh home with ₹15 lakh down, at 8.5% for 20 years, finances ₹60 lakh. Enter those figures to see the EMI and interest.",
    faqs: [
      { q: "Does this include stamp duty and registration?", a: "No. Add those costs to your cash plan. Do not assume the lender will finance them." },
      { q: "Is the rate fixed?", a: "The maths assumes the rate you enter stays fixed. A floating rate will change the EMI or the tenure." },
    ],
    related: ["emi-calculator", "loan-eligibility-calculator", "amortization-schedule-calculator"],
    assumptions: ["Down payment is cash, not borrowed.", "Processing fees and insurance are excluded.", "Loan-to-value limits are the lender’s decision, not this page’s."],
  }),
  makeLoanCalc({
    slug: "personal-loan-calculator",
    title: "Personal loan calculator",
    description: "Estimate the EMI and interest on an unsecured personal loan with a fixed rate.",
    keywords: ["personal loan", "unsecured loan emi"],
    synonyms: ["consumer loan"],
    amountLabel: "Loan amount",
    defaultAmount: "300000",
    defaultRate: "14",
    defaultYears: "3",
    howItWorks: "Personal loans are often shorter and more expensive than home loans. The EMI formula is identical; the rate and tenure you type are what make the cost different. A flat-rate quote is not the same as this reducing-balance EMI.",
    example: "₹3,00,000 at 14% for 3 years is a useful comparison point when a lender quotes a flat rate instead of a reducing rate.",
    faqs: [
      { q: "How do I compare a flat rate?", a: "Ask for the reducing-balance APR or the total amount payable. A flat rate applied to the original principal usually costs more than the same number in this calculator." },
      { q: "Are processing fees included?", a: "No. Add them to the amount only if they are financed. Otherwise keep them in your cash budget." },
    ],
    related: ["emi-calculator", "loan-affordability-calculator", "interest-calculator"],
  }),
  makeLoanCalc({
    slug: "car-loan-calculator",
    title: "Car loan calculator",
    description: "Estimate EMI from an on-road price, down payment, rate, and tenure.",
    keywords: ["car loan", "auto loan", "vehicle emi"],
    synonyms: ["car emi"],
    amountLabel: "On-road price",
    defaultAmount: "900000",
    defaultRate: "10",
    defaultYears: "5",
    downPayment: true,
    howItWorks: "The financed amount is the on-road price minus the down payment. Insurance, accessories, and a balloon payment are not guessed. If the lender offers a bullet amount at the end, this flat EMI will not match that structure.",
    example: "₹9,00,000 on-road with ₹2,00,000 down leaves ₹7,00,000 to finance. At 10% for 5 years, compare the EMI with the dealer’s quote.",
    faqs: [
      { q: "Should I enter ex-showroom or on-road?", a: "Enter the amount you need to pay. If the loan does not cover registration, use the amount the lender will finance plus the cash you must find separately." },
      { q: "What about a residual value?", a: "This calculator does not model balloon or residual-value loans. Those need the lender’s schedule." },
    ],
    related: ["two-wheeler-loan-calculator", "emi-calculator", "fuel-cost-calculator"],
  }),
  makeLoanCalc({
    slug: "two-wheeler-loan-calculator",
    title: "Two-wheeler loan calculator",
    description: "Estimate the EMI for a scooter or motorcycle after down payment.",
    keywords: ["two wheeler loan", "bike loan", "scooter emi"],
    synonyms: ["motorcycle loan"],
    amountLabel: "On-road price",
    defaultAmount: "120000",
    defaultRate: "12",
    defaultYears: "3",
    downPayment: true,
    howItWorks: "Two-wheeler loans use the same EMI identity as other fixed loans. Tenures are usually short, so the interest share is smaller than a 20-year home loan even when the rate is higher. Check whether the quote is flat or reducing.",
    example: "A ₹1,20,000 vehicle with ₹20,000 down, financed at 12% for 3 years, can be compared with a dealer EMI in a minute.",
    faqs: [
      { q: "Does a shorter tenure always save money?", a: "It usually reduces total interest and raises the monthly payment. The right tenure is the one you can pay without missing instalments." },
      { q: "Is the down payment included in interest?", a: "No. Interest is calculated on the financed principal only." },
    ],
    related: ["car-loan-calculator", "emi-calculator", "fuel-cost-calculator"],
  }),
  {
    slug: "education-loan-calculator",
    title: "Education loan calculator",
    description: "Estimate an education-loan EMI after a simple interest moratorium, or with interest paid during study.",
    category: "finance",
    keywords: ["education loan", "student loan", "moratorium"],
    synonyms: ["study loan emi"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["During a moratorium, unpaid interest is compounded monthly and added to principal if you choose that option.", "Subsidies and course-specific concessions are not applied.", "Repayment starts the month after the moratorium."],
    inputs: [
      { id: "amount", label: "Amount borrowed", type: "number", unit: "₹", defaultValue: "800000", required: true, min: 1 },
      { id: "rate", label: "Annual interest rate", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
      { id: "study", label: "Moratorium", type: "number", unit: "months", defaultValue: "12", required: true, min: 0, max: 84 },
      { id: "repay", label: "Repayment tenure", type: "number", unit: "years", defaultValue: "7", required: true, min: 1, max: 20 },
      { id: "payInterest", label: "During moratorium", type: "select", defaultValue: "accrue", options: [
        { value: "accrue", label: "Let interest accrue and add it to principal" },
        { value: "pay", label: "Pay interest as it arises" },
      ] },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 1 });
      const rate = readNumber(v, "rate", "Rate", { min: 0, max: 30 });
      const study = readNumber(v, "study", "Moratorium", { min: 0, max: 84, integer: true });
      const years = readNumber(v, "repay", "Repayment", { min: 1, max: 20 });
      const r = rate / 100 / 12;
      const accrued = v.payInterest === "pay" ? 0 : amount * ((1 + r) ** study - 1);
      const principal = amount + accrued;
      const payment = emi(principal, rate, Math.round(years * 12));
      const interestOnly = amount * r;
      return pack([
        item("EMI after moratorium", formatInrExact(payment), true),
        item("Principal at repayment", formatInr(principal)),
        item("Interest accrued during study", formatInr(accrued)),
        item("Monthly interest if paid during study", formatInrExact(interestOnly)),
      ]);
    },
    formula: "Accrued interest ≈ P × ((1+r)^m − 1) if unpaid. EMI is then calculated on principal plus that accrual.",
    howItWorks: "Many education loans do not ask for principal during the course. Unpaid interest still exists. If it is added to the principal, the later EMI is higher. Paying interest during study keeps the principal unchanged. Subsidy schemes can change this; they are not modelled.",
    steps: ["Enter the amount you expect to draw, not the full sanctioned limit if you will not use it.", "Set the moratorium in months.", "Compare the two moratorium choices before assuming the lower EMI is cheaper overall."],
    example: "₹8,00,000 at 10% with 12 months of unpaid interest grows before a 7-year EMI begins.",
    faqs: [
      { q: "Is the accrual simple or compound?", a: "This page compounds monthly during the moratorium. A lender that uses simple interest will show a slightly different figure." },
      { q: "Are tax benefits included?", a: "No. Interest deductions depend on the law and your facts. The tax calculator is separate and is not a filing tool." },
    ],
    related: ["emi-calculator", "loan-eligibility-calculator", "personal-loan-calculator"],
  },
  {
    slug: "loan-eligibility-calculator",
    title: "Loan eligibility estimator",
    description: "Estimate a loan amount from income, existing EMIs, and a FOIR limit you choose.",
    category: "finance",
    keywords: ["loan eligibility", "foir", "how much loan"],
    synonyms: ["home loan eligibility"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["FOIR is a lender policy, not a right to a loan.", "Income here should be the income a lender will count.", "The result ignores credit score, age, and property."],
    inputs: [
      { id: "income", label: "Net monthly income", type: "number", unit: "₹", defaultValue: "120000", required: true, min: 0 },
      { id: "existing", label: "Existing EMIs", type: "number", unit: "₹", defaultValue: "10000", required: true, min: 0 },
      { id: "foir", label: "FOIR limit", type: "number", unit: "%", defaultValue: "50", required: true, min: 10, max: 80 },
      { id: "rate", label: "Expected rate", type: "number", unit: "%", defaultValue: "8.5", required: true, min: 0 },
      { id: "years", label: "Tenure", type: "number", unit: "years", defaultValue: "20", required: true, min: 1, max: 40 },
    ],
    compute: (v) => {
      const income = readNumber(v, "income", "Income", { min: 0 });
      const existing = readNumber(v, "existing", "Existing EMIs", { min: 0 });
      const foir = readNumber(v, "foir", "FOIR", { min: 10, max: 80 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const years = readNumber(v, "years", "Tenure", { min: 1, max: 40 });
      const maxEmi = Math.max(0, income * (foir / 100) - existing);
      const loan = maxLoanFromEmi(maxEmi, rate, Math.round(years * 12));
      return pack([
        item("Indicative loan amount", formatInr(loan), true),
        item("Room left for a new EMI", formatInrExact(maxEmi)),
        item("Income used by existing EMIs", formatPct(income === 0 ? 0 : (existing / income) * 100, 1)),
      ], { notes: ["A lender can approve less, or occasionally structure a loan differently. This is a capacity sketch."] });
    },
    formula: "Maximum EMI = income × FOIR − existing EMIs. Loan = EMI × ((1+r)^n − 1) / (r × (1+r)^n).",
    howItWorks: "Fixed-obligation-to-income ratio is one screen lenders use. If half of net income may go to all EMIs, and some of that half is already committed, the rest can support a new payment. The loan amount is the principal that payment can amortise.",
    steps: ["Use take-home income the lender will recognise.", "Include every existing EMI.", "Try the FOIR the lender published, not an optimistic one."],
    example: "₹1,20,000 income, ₹10,000 existing EMI, 50% FOIR, leaves ₹50,000 for a new EMI before rate and tenure convert that into a principal.",
    faqs: [
      { q: "Is FOIR the same at every bank?", a: "No. Policies differ, and variable income may be counted only in part." },
      { q: "Does a co-applicant change this?", a: "Only if you include their counted income and their obligations. The page has one income field." },
    ],
    related: ["loan-affordability-calculator", "home-loan-calculator", "emi-calculator"],
  },
  {
    slug: "loan-affordability-calculator",
    title: "Loan affordability calculator",
    description: "Turn a comfortable monthly payment into a loan amount and a property budget.",
    category: "finance",
    keywords: ["loan affordability", "how much house", "comfortable emi"],
    synonyms: ["borrowing power"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "payment", label: "Payment you can sustain", type: "number", unit: "₹ / month", defaultValue: "35000", required: true, min: 0 },
      { id: "rate", label: "Interest rate", type: "number", unit: "%", defaultValue: "8.5", required: true, min: 0 },
      { id: "years", label: "Tenure", type: "number", unit: "years", defaultValue: "20", required: true, min: 1, max: 40 },
      { id: "down", label: "Cash for down payment", type: "number", unit: "₹", defaultValue: "1500000", required: true, min: 0 },
    ],
    compute: (v) => {
      const payment = readNumber(v, "payment", "Payment", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const years = readNumber(v, "years", "Tenure", { min: 1, max: 40 });
      const down = readNumber(v, "down", "Down payment", { min: 0 });
      const loan = maxLoanFromEmi(payment, rate, Math.round(years * 12));
      return pack([
        item("Loan the payment supports", formatInr(loan), true),
        item("Price before fees and taxes", formatInr(loan + down)),
        item("Down payment share", formatPct(loan + down === 0 ? 0 : (down / (loan + down)) * 100, 1)),
      ], { notes: ["Keep a cash buffer for fees, moving, and several months of EMI. Affordable on paper is not the same as comfortable."] });
    },
    formula: "Principal = payment × ((1+r)^n − 1) / (r × (1+r)^n). Budget = principal + down payment.",
    howItWorks: "Eligibility asks what a lender might allow. Affordability asks what payment you are willing to carry. Starting from the payment avoids a large loan that clears a FOIR test and still crowds out the rest of life.",
    steps: ["Choose a payment you could make in a thin month.", "Enter a realistic rate.", "Add only the cash you can pay without emptying an emergency fund."],
    example: "₹35,000 a month at 8.5% for 20 years supports a loan a little above ₹40 lakh, before the down payment is added.",
    faqs: [
      { q: "Should I stretch the tenure to borrow more?", a: "A longer tenure raises the principal a payment can support and also raises total interest. Look at both." },
      { q: "Are taxes in the price?", a: "No. Stamp duty, GST on under-construction property, and furnishing are extra." },
    ],
    related: ["loan-eligibility-calculator", "home-loan-calculator", "emi-calculator"],
  },
  {
    slug: "amortization-schedule-calculator",
    title: "Amortization schedule calculator",
    description: "See yearly principal, interest, and the effect of a regular extra payment.",
    category: "finance",
    keywords: ["amortization", "loan schedule", "extra payment"],
    synonyms: ["amortisation schedule"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "amount", label: "Principal", type: "number", unit: "₹", defaultValue: "1000000", required: true, min: 1 },
      { id: "rate", label: "Annual rate", type: "number", unit: "%", defaultValue: "9", required: true, min: 0 },
      { id: "years", label: "Original tenure", type: "number", unit: "years", defaultValue: "20", required: true, min: 1, max: 40 },
      { id: "extra", label: "Extra principal each month", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const principal = readNumber(v, "amount", "Principal", { min: 1 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const years = readNumber(v, "years", "Tenure", { min: 1, max: 40 });
      const extra = readNumber(v, "extra", "Extra payment", { min: 0 });
      const schedule = amortize(principal, rate, Math.round(years * 12), extra);
      return pack([
        item("Contract EMI", formatInrExact(schedule.emi), true),
        item("Months until payoff", formatNumber(schedule.monthsUsed, 0)),
        item("Total interest", formatInr(schedule.totalInterest)),
        item("Interest saved versus no extra payment", extra > 0 ? formatInr(amortize(principal, rate, Math.round(years * 12)).totalInterest - schedule.totalInterest) : "₹0"),
      ], {
        table: {
          caption: "Yearly schedule, including extra principal",
          headers: ["Year", "Principal", "Interest", "Extra", "Balance"],
          rows: schedule.schedule.map((row) => [String(row.year), formatInr(row.principal), formatInr(row.interest), formatInr(row.extra), formatInr(row.balance)]),
        },
      });
    },
    formula: "Each month, interest = balance × monthly rate. Principal paid = EMI − interest. Extra payment reduces balance further.",
    howItWorks: "An amortization schedule shows why early payments are mostly interest: the balance is largest then. A fixed extra amount is applied to principal here, which shortens the tenure rather than cutting the contract EMI. Lenders may have prepayment rules this page cannot see.",
    steps: ["Enter the current principal, not the original amount, if you are already part-way through.", "Use the current rate.", "Add a monthly extra only if the contract allows it without a fee that wipes out the saving."],
    example: "On a ₹10 lakh, 9%, 20-year loan, a modest extra payment shortens the schedule and cuts interest. The table shows the year the balance hits zero.",
    faqs: [
      { q: "Why is the first year mostly interest?", a: "Interest is charged on the outstanding balance. At the start, that balance is the full principal." },
      { q: "Can the extra payment be yearly?", a: "Enter one twelfth of a yearly extra if you want a smooth estimate. A single annual prepayment will differ slightly." },
    ],
    related: ["emi-calculator", "home-loan-calculator", "interest-calculator"],
  },
  {
    slug: "interest-calculator",
    title: "Interest calculator",
    description: "Compare simple and compound interest on the same principal, rate, and time.",
    category: "finance",
    keywords: ["interest", "simple vs compound"],
    synonyms: ["interest comparison"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "principal", label: "Principal", type: "number", defaultValue: "100000", required: true, min: 0 },
      { id: "rate", label: "Annual rate", type: "number", unit: "%", defaultValue: "8", required: true, min: 0 },
      { id: "years", label: "Years", type: "number", defaultValue: "5", required: true, min: 0, max: 100 },
      { id: "n", label: "Compounds per year", type: "number", defaultValue: "4", required: true, min: 1, max: 365 },
      currency,
    ],
    compute: (v) => {
      const p = readNumber(v, "principal", "Principal", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 0, max: 100 });
      const n = readNumber(v, "n", "Frequency", { min: 1, max: 365, integer: true });
      const simple = simpleInterest(p, rate, years);
      const compound = futureValueCompound(p, rate, years, n);
      const code = (v.currency || "INR").toUpperCase();
      return pack([
        item("Compound amount", money(compound, code), true),
        item("Simple amount", money(simple.amount, code)),
        item("Extra from compounding", money(compound - simple.amount, code)),
        item("Effective annual rate", formatPct(((1 + rate / 100 / n) ** n - 1) * 100, 2)),
      ]);
    },
    formula: "Simple: A = P(1 + rt). Compound: A = P(1 + r/n)^(nt).",
    howItWorks: "Simple interest pays only on the original principal. Compound interest pays on accumulated interest as well. The gap is small over a short term and large over decades. The effective annual rate shows the yearly rate after compounding, which is the fair way to compare a quarterly deposit with an annual one.",
    steps: ["Enter principal, rate, and time in the same units the offer uses.", "Set compounding to 1, 2, 4, or 12 to match the product.", "Compare the two amounts before assuming a quoted rate means the same thing in both products."],
    example: "₹1,00,000 at 8% for 5 years is ₹1,40,000 with simple interest and about ₹1,48,595 with quarterly compounding.",
    faqs: [
      { q: "Which one do banks use on deposits?", a: "Most cumulative deposits compound. The frequency should be in the product sheet. This page does not assume a bank’s frequency for you." },
      { q: "Is the effective rate the APR?", a: "It is the effective annual rate from the nominal rate and frequency you entered. Fees can make a loan APR different." },
    ],
    related: ["compound-interest-calculator", "simple-interest-calculator", "fd-calculator"],
  },
  {
    slug: "compound-interest-calculator",
    title: "Compound interest calculator",
    description: "Project a lump sum with a compounding frequency you choose, and show the effective annual rate.",
    category: "finance",
    keywords: ["compound interest", "future value", "compounding"],
    synonyms: ["ci calculator"],
    featured: 7,
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "principal", label: "Principal", type: "number", defaultValue: "100000", required: true, min: 0 },
      { id: "rate", label: "Nominal annual rate", type: "number", unit: "%", defaultValue: "8", required: true, min: 0 },
      { id: "years", label: "Years", type: "number", defaultValue: "10", required: true, min: 0, max: 100 },
      { id: "n", label: "Compounds per year", type: "select", defaultValue: "4", options: [
        { value: "1", label: "Yearly" },
        { value: "2", label: "Half-yearly" },
        { value: "4", label: "Quarterly" },
        { value: "12", label: "Monthly" },
      ] },
    ],
    compute: (v) => {
      const p = readNumber(v, "principal", "Principal", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 0, max: 100 });
      const n = Number(v.n || "4");
      const amount = futureValueCompound(p, rate, years, n);
      return pack([
        item("Future amount", formatInrExact(amount), true),
        item("Interest earned", formatInr(amount - p)),
        item("Growth multiple", formatNumber(p === 0 ? 0 : amount / p, 3)),
        item("Effective annual rate", formatPct(((1 + rate / 100 / n) ** n - 1) * 100, 2)),
      ], { notes: ["The rate is an assumption you typed. It is not a forecast of a deposit, fund, or inflation."] });
    },
    formula: "A = P (1 + r/n)^(nt). Effective annual rate = (1 + r/n)^n − 1.",
    howItWorks: "Compounding frequency changes the effective rate even when the nominal rate is fixed. Quarterly compounding at 8% is a little more than 8% a year. Over long periods the exponent, not the starting principal, does most of the work. That is also why a wrong rate assumption dominates the result.",
    steps: ["Enter the lump sum.", "Use the nominal rate and the compounding frequency from the illustration you are testing.", "Read the effective rate before comparing it with a yearly product."],
    example: "₹1,00,000 at 8% compounded quarterly for 10 years grows to about ₹2,20,804.",
    faqs: [
      { q: "Does this include tax?", a: "No. Tax on interest can be material. The income-tax page is a separate estimator." },
      { q: "Can the rate change each year?", a: "Not on this page. For uneven cash flows, use CAGR or XIRR on the actual amounts." },
    ],
    related: ["simple-interest-calculator", "fd-calculator", "sip-calculator"],
  },
  {
    slug: "simple-interest-calculator",
    title: "Simple interest calculator",
    description: "Calculate simple interest and the amount from principal, annual rate, and time.",
    category: "finance",
    keywords: ["simple interest", "si formula"],
    synonyms: ["I = PRT"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "principal", label: "Principal", type: "number", defaultValue: "50000", required: true, min: 0 },
      { id: "rate", label: "Annual rate", type: "number", unit: "%", defaultValue: "7", required: true, min: 0 },
      { id: "time", label: "Time", type: "number", defaultValue: "3", required: true, min: 0 },
      { id: "unit", label: "Time unit", type: "select", defaultValue: "years", options: [
        { value: "years", label: "Years" },
        { value: "months", label: "Months" },
        { value: "days", label: "Days (360-day year)" },
      ] },
    ],
    compute: (v) => {
      const p = readNumber(v, "principal", "Principal", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const time = readNumber(v, "time", "Time", { min: 0 });
      const years = v.unit === "months" ? time / 12 : v.unit === "days" ? time / 360 : time;
      const result = simpleInterest(p, rate, years);
      return pack([
        item("Interest", formatInrExact(result.interest), true),
        item("Amount", formatInrExact(result.amount)),
        item("Time in years", formatNumber(years, 4)),
      ], { notes: ["Day-count uses a 360-day year because many classroom and commercial simple-interest problems do. A 365-day convention would differ slightly."] });
    },
    formula: "I = P × r × t, with r as a decimal and t in years. A = P + I.",
    howItWorks: "Simple interest does not pay interest on interest. It is still used in some short-term and classroom calculations, and it is the wrong model for a cumulative fixed deposit. The time unit is converted to years before the formula runs.",
    steps: ["Enter principal and the annual rate.", "Choose the time unit so you do not treat months as years.", "Compare with the compound calculator if the product says interest is compounded."],
    example: "₹50,000 at 7% for 3 years earns ₹10,500. The amount is ₹60,500.",
    faqs: [
      { q: "Why 360 days?", a: "It is a common commercial convention and keeps the day fraction tidy. Say so if you copy the result into a contract discussion." },
      { q: "Is this the same as a flat-rate loan?", a: "A flat-rate loan often charges simple interest on the original principal for the whole term, then splits it into EMIs. Ask the lender which method the quote uses." },
    ],
    related: ["compound-interest-calculator", "interest-calculator", "fd-calculator"],
  },
  {
    slug: "sip-calculator",
    title: "SIP calculator",
    description: "Estimate the future value of a monthly investment at a constant expected return. Returns are not guaranteed.",
    category: "finance",
    keywords: ["sip", "systematic investment plan", "mutual fund sip"],
    synonyms: ["monthly investment calculator"],
    featured: 4,
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["The return is a constant expected annual rate, not a promise.", "Contributions are treated as made at the beginning of each month.", "Expenses, taxes, and missed instalments are ignored unless you lower the rate yourself."],
    inputs: [
      { id: "monthly", label: "Monthly investment", type: "number", unit: "₹", defaultValue: "10000", required: true, min: 0 },
      { id: "rate", label: "Expected annual return", type: "number", unit: "%", defaultValue: "12", required: true, min: -50, max: 40 },
      { id: "years", label: "Years", type: "number", defaultValue: "10", required: true, min: 1, max: 50 },
    ],
    compute: (v) => {
      const monthly = readNumber(v, "monthly", "Monthly investment", { min: 0 });
      const rate = readNumber(v, "rate", "Return", { min: -50, max: 40 });
      const years = readNumber(v, "years", "Years", { min: 1, max: 50 });
      const months = Math.round(years * 12);
      const future = sipFutureValue(monthly, rate, months);
      const invested = monthly * months;
      return pack([
        item("Estimated value", formatInr(future), true),
        item("Amount invested", formatInr(invested)),
        item("Estimated gain", formatInr(future - invested)),
      ], { notes: ["12% is an illustration, not an expected market return. Change it. Past fund returns are not this calculation."] });
    },
    formula: "FV = P × [((1+i)^n − 1) / i] × (1+i), where i is the monthly rate and P is the monthly amount.",
    howItWorks: "A SIP future-value formula assumes a smooth return every month. Markets do not behave that way. The formula is still useful for comparing a contribution, a horizon, and a return assumption side by side. The gain is not a forecast you can bank.",
    steps: ["Enter the amount you will actually invest.", "Choose a return assumption you are willing to stress-test. Try a lower rate as well.", "Read invested capital and estimated gain separately."],
    example: "₹10,000 a month for 10 years at a constant 12% grows to about ₹23.23 lakh. You would have invested ₹12 lakh.",
    faqs: [
      { q: "Does this include fund expenses?", a: "Only if you enter a return net of expenses. A 12% gross return with a 1% expense is not a 12% input." },
      { q: "What if I increase the SIP each year?", a: "Use the step-up SIP calculator." },
    ],
    related: ["step-up-sip-calculator", "lump-sum-calculator", "cagr-calculator"],
  },
  {
    slug: "lump-sum-calculator",
    title: "Lump sum investment calculator",
    description: "Project one investment with annual compounding at an expected rate you choose.",
    category: "finance",
    keywords: ["lump sum", "one time investment", "future value"],
    synonyms: ["lumpsum calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "amount", label: "Investment", type: "number", unit: "₹", defaultValue: "200000", required: true, min: 0 },
      { id: "rate", label: "Expected annual return", type: "number", unit: "%", defaultValue: "10", required: true, min: -50, max: 40 },
      { id: "years", label: "Years", type: "number", defaultValue: "8", required: true, min: 0, max: 60 },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Investment", { min: 0 });
      const rate = readNumber(v, "rate", "Return", { min: -50, max: 40 });
      const years = readNumber(v, "years", "Years", { min: 0, max: 60 });
      const future = futureValueCompound(amount, rate, years, 1);
      return pack([
        item("Estimated value", formatInr(future), true),
        item("Estimated gain", formatInr(future - amount)),
        item("Multiple", formatNumber(amount === 0 ? 0 : future / amount, 2)),
      ], { notes: ["Annual compounding is the assumption. It is not a guarantee, a fund factsheet, or a tax-adjusted return."] });
    },
    formula: "FV = P × (1 + r)^t.",
    howItWorks: "A lump sum is exposed to the market on day one. A SIP spreads contributions. This page only compounds the single amount at a constant rate so you can see the exponent. Sequence of returns, which this page ignores, matters in real markets.",
    steps: ["Enter the amount available to invest.", "Pick a rate and also try a lower one.", "Compare with the SIP page if you are choosing between a single investment and monthly contributions."],
    example: "₹2,00,000 at 10% compounded yearly for 8 years is about ₹4,28,717.",
    faqs: [
      { q: "Why can a SIP beat or lose to a lump sum?", a: "It depends on the path of returns. A constant-rate calculator cannot answer that. It can only compare assumptions." },
      { q: "Is the gain taxable?", a: "Often, yes, and the rules depend on the asset and the holding period. See the capital-gains estimator and confirm the current law." },
    ],
    related: ["sip-calculator", "compound-interest-calculator", "cagr-calculator"],
  },
  {
    slug: "mutual-fund-return-calculator",
    title: "Mutual fund return estimator",
    description: "Apply an expected return, net of an expense ratio you enter, to a SIP or a lump sum.",
    category: "finance",
    keywords: ["mutual fund", "expense ratio", "fund return"],
    synonyms: ["mf calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "mode", label: "Investment style", type: "select", defaultValue: "sip", options: [
        { value: "sip", label: "Monthly SIP" },
        { value: "lump", label: "Lump sum" },
      ] },
      { id: "amount", label: "Amount", type: "number", unit: "₹", defaultValue: "5000", required: true, min: 0 },
      { id: "gross", label: "Expected gross annual return", type: "number", unit: "%", defaultValue: "11", required: true },
      { id: "expense", label: "Expense ratio", type: "number", unit: "% / year", defaultValue: "0.8", required: true, min: 0, max: 5 },
      { id: "years", label: "Years", type: "number", defaultValue: "15", required: true, min: 1, max: 50 },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 0 });
      const gross = readNumber(v, "gross", "Gross return");
      const expense = readNumber(v, "expense", "Expense ratio", { min: 0, max: 5 });
      const years = readNumber(v, "years", "Years", { min: 1, max: 50 });
      const net = gross - expense;
      const future = v.mode === "lump" ? futureValueCompound(amount, net, years, 1) : sipFutureValue(amount, net, Math.round(years * 12));
      const invested = v.mode === "lump" ? amount : amount * years * 12;
      return pack([
        item("Value at net expected return", formatInr(future), true),
        item("Net annual assumption", formatPct(net, 2)),
        item("Invested", formatInr(invested)),
        item("Estimated gain", formatInr(future - invested)),
      ], { notes: ["Subtracting the expense ratio from a gross return is a simplification. It is not a forecast and it ignores exit load, tax, and tracking difference."] });
    },
    formula: "Net assumption = gross expected return − expense ratio. Then the SIP or lump-sum future-value formula is applied.",
    howItWorks: "Fund costs are certain; future returns are not. This page makes the cost visible by reducing the return assumption before compounding. A lower expense does not make a fund suitable. It only changes the arithmetic of the assumption you typed.",
    steps: ["Choose SIP or lump sum.", "Enter a gross assumption you can defend, then the expense ratio from the scheme document.", "Do not read the result as the fund’s past or future return."],
    example: "A 11% gross assumption and a 0.8% expense ratio is compounded at 10.2%. Change both numbers rather than trusting the defaults.",
    faqs: [
      { q: "Should I use the fund’s past CAGR here?", a: "You can, as a historical description, if you label it that way. It is not an input the fund owes you in future." },
      { q: "Does a direct plan change the result?", a: "Only through the lower expense ratio you enter." },
    ],
    related: ["sip-calculator", "cagr-calculator", "step-up-sip-calculator"],
  },
  {
    slug: "step-up-sip-calculator",
    title: "Step-up SIP calculator",
    description: "Project a monthly investment that rises by a fixed percentage each year.",
    category: "finance",
    keywords: ["step up sip", "top up sip", "increasing sip"],
    synonyms: ["sip with annual increase"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "monthly", label: "Starting monthly amount", type: "number", unit: "₹", defaultValue: "10000", required: true, min: 0 },
      { id: "step", label: "Annual step-up", type: "number", unit: "%", defaultValue: "10", required: true, min: 0, max: 100 },
      { id: "rate", label: "Expected annual return", type: "number", unit: "%", defaultValue: "12", required: true },
      { id: "years", label: "Years", type: "number", defaultValue: "15", required: true, min: 1, max: 40 },
    ],
    compute: (v) => {
      const monthly = readNumber(v, "monthly", "Monthly amount", { min: 0 });
      const step = readNumber(v, "step", "Step-up", { min: 0, max: 100 });
      const rate = readNumber(v, "rate", "Return");
      const years = readNumber(v, "years", "Years", { min: 1, max: 40, integer: true });
      const future = stepUpSip(monthly, rate, years, step);
      let invested = 0;
      let payment = monthly;
      for (let y = 0; y < years; y++) {
        invested += payment * 12;
        payment *= 1 + step / 100;
      }
      return pack([
        item("Estimated value", formatInr(future), true),
        item("Amount invested", formatInr(invested)),
        item("Final monthly amount", formatInr(payment / (1 + step / 100) * (step === 0 ? 1 : 1)), false),
      ], { notes: ["The step-up is applied at each anniversary to the monthly amount. The return is constant and not guaranteed."] });
    },
    formula: "Each year is a 12-month SIP. The resulting pot is compounded for later years, and the monthly amount rises by the step-up.",
    howItWorks: "A step-up SIP invests more as income grows. The later, larger contributions have less time to compound, so the result is not the same as starting at the final amount. This page makes that path explicit instead of using a single average contribution.",
    steps: ["Enter the SIP you can start now.", "Choose a step-up you could actually fund.", "Compare with a flat SIP of the starting amount to see what the increases add."],
    example: "₹10,000 rising 10% a year is a different investment from ₹10,000 flat. The invested total on this page is the sum of the rising instalments.",
    faqs: [
      { q: "Is the step-up compounded monthly?", a: "No. The amount changes once a year. Inside the year, the monthly amount is constant." },
      { q: "What if I skip a year?", a: "Lower the step-up or the year count. The page cannot know a pause you do not enter." },
    ],
    related: ["sip-calculator", "savings-goal-calculator", "retirement-corpus-calculator"],
  },
  {
    slug: "cagr-calculator",
    title: "CAGR calculator",
    description: "Find the compound annual growth rate between a start value and an end value.",
    category: "finance",
    keywords: ["cagr", "compound annual growth rate"],
    synonyms: ["annualised return"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "start", label: "Start value", type: "number", defaultValue: "100000", required: true },
      { id: "end", label: "End value", type: "number", defaultValue: "180000", required: true },
      { id: "years", label: "Years", type: "number", defaultValue: "5", required: true, min: 0.1 },
    ],
    compute: (v) => {
      const start = readNumber(v, "start", "Start value", { allowZero: false });
      const end = readNumber(v, "end", "End value", { allowZero: false });
      const years = readNumber(v, "years", "Years", { min: 0.1 });
      const rate = cagr(start, end, years);
      return pack([
        item("CAGR", formatPct(rate * 100, 2), true),
        item("Multiple", formatNumber(end / start, 3)),
        item("Absolute change", formatNumber(end - start, 2)),
      ], { notes: ["CAGR smooths the path. It is not the return of any single year, and it ignores cash flows added or removed in between. Use XIRR for those."] });
    },
    formula: "CAGR = (end / start)^(1 / years) − 1.",
    howItWorks: "CAGR is the constant annual rate that links two values. A fund that falls and recovers can have the same CAGR as a smooth fund. The number hides volatility, which is why it should not be the only description of an investment.",
    steps: ["Use values in the same units, such as both NAV or both portfolio values.", "If you added money during the period, CAGR on the portfolio total is the wrong tool. Use XIRR.", "State the years precisely. 18 months is 1.5 years."],
    example: "From 1,00,000 to 1,80,000 in 5 years is a CAGR of about 12.47%.",
    faqs: [
      { q: "Can CAGR be negative?", a: "Yes, if the end value is below the start value and both are positive." },
      { q: "Why are zero and negative values rejected?", a: "A growth rate of this form is not defined for a non-positive start or end." },
    ],
    related: ["xirr-calculator", "lump-sum-calculator", "mutual-fund-return-calculator"],
  },
  {
    slug: "xirr-calculator",
    title: "XIRR calculator",
    description: "Estimate the annualised internal rate of return for irregular cash flows and dates.",
    category: "finance",
    keywords: ["xirr", "irr", "cash flow return"],
    synonyms: ["portfolio xirr"],
    disclaimer: FINANCE_DISCLAIMER,
    live: false,
    submitLabel: "Calculate XIRR",
    inputs: [
      { id: "flows", label: "Cash flows", type: "textarea", rows: 6, required: true, defaultValue: "2024-01-01, -100000\n2024-07-01, -50000\n2026-01-01, 180000", help: "One date and amount per line. Use a negative amount for money you invest and a positive amount for money you receive, including the current value as if redeemed." },
    ],
    compute: (v) => {
      const lines = (v.flows || "").split(/\n/).map((line) => line.trim()).filter(Boolean);
      const flows = lines.map((line, index) => {
        const [dateText, amountText] = line.split(/[,;\s]+/).filter(Boolean);
        if (!dateText || !amountText) throw new InputError(`Line ${index + 1} needs a date and an amount.`);
        return { date: parseISODate(dateText, `date on line ${index + 1}`), amount: Number(amountText) };
      });
      if (flows.some((flow) => !Number.isFinite(flow.amount))) throw new InputError("Every amount must be a number.");
      const rate = xirr(flows);
      return pack([
        item("XIRR", formatPct(rate * 100, 2), true),
        item("Cash flows", formatNumber(flows.length, 0)),
        item("Net of amounts", formatNumber(flows.reduce((s, f) => s + f.amount, 0), 2)),
      ], { notes: ["XIRR is an annualised rate that sets the net present value of the flows to zero, using a 365.25-day year. More than one mathematical rate can exist for unusual sign patterns."] });
    },
    formula: "Find r such that Σ amount_i / (1+r)^(days_i / 365.25) = 0.",
    howItWorks: "CAGR cannot see a contribution made halfway through. XIRR can, because each amount has a date. Money you invest is negative; the value you could take out today is positive. Forgetting the final positive value makes the rate meaningless.",
    steps: ["List each investment as a negative amount on its date.", "Add dividends or redemptions as positive amounts.", "Add today’s value as a positive amount on today’s date if the investment is still held.", "Press calculate. The solver is numerical."],
    example: "Investing 1,00,000, then 50,000, and valuing the holding at 1,80,000 about two years later produces a single annualised rate you can compare with a deposit — not a guarantee.",
    faqs: [
      { q: "Why did it fail to find a rate?", a: "The flows may be all positive, all negative, or too irregular for one clean rate. Check the signs." },
      { q: "Is XIRR the same as a fund’s published return?", a: "Only if the cash flows match. A fund factsheet CAGR is not your personal XIRR." },
    ],
    related: ["cagr-calculator", "sip-calculator", "stock-profit-loss-calculator"],
  },
  {
    slug: "fd-calculator",
    title: "FD calculator",
    description: "Estimate fixed-deposit maturity from a compounding frequency you choose. The rate is your input, not a bank quote.",
    category: "finance",
    keywords: ["fd", "fixed deposit", "fd maturity"],
    synonyms: ["term deposit"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Interest compounds at the frequency you select.", "Premature withdrawal penalties are not applied.", "TDS is optional and is a flat percentage of interest, not a tax-resident determination."],
    inputs: [
      { id: "principal", label: "Deposit", type: "number", unit: "₹", defaultValue: "100000", required: true, min: 0 },
      { id: "rate", label: "Annual rate", type: "number", unit: "%", defaultValue: "7.1", required: true, min: 0 },
      { id: "months", label: "Tenure", type: "number", unit: "months", defaultValue: "12", required: true, min: 1, max: 120 },
      { id: "n", label: "Compounding", type: "select", defaultValue: "4", options: [
        { value: "1", label: "Yearly" },
        { value: "2", label: "Half-yearly" },
        { value: "4", label: "Quarterly" },
        { value: "12", label: "Monthly" },
      ] },
      { id: "tds", label: "Illustrative TDS on interest", type: "select", defaultValue: "0", options: [
        { value: "0", label: "Do not deduct" },
        { value: "10", label: "Deduct 10% of interest" },
      ] },
    ],
    compute: (v) => {
      const principal = readNumber(v, "principal", "Deposit", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const months = readNumber(v, "months", "Tenure", { min: 1, max: 120 });
      const amount = futureValueCompound(principal, rate, months / 12, Number(v.n || "4"));
      const interest = amount - principal;
      const tds = interest * (Number(v.tds || "0") / 100);
      return pack([
        item("Maturity before TDS", formatInrExact(amount), true),
        item("Interest", formatInrExact(interest)),
        item("Illustrative TDS", formatInrExact(tds)),
        item("Amount if that TDS is cut", formatInrExact(amount - tds)),
      ], { notes: ["A bank’s TDS threshold and senior-citizen rate are not applied automatically. Confirm the current rule before treating TDS as exact."] });
    },
    formula: "A = P (1 + r/n)^(n × years).",
    howItWorks: "Cumulative fixed deposits usually compound. The maturity is the compound-interest amount for the tenure. A non-cumulative deposit that pays interest out is closer to simple interest on the same principal. This page is the cumulative case.",
    steps: ["Enter the deposit and the rate from the illustration you are testing.", "Match the compounding frequency to the product.", "Turn on the 10% illustration only if you want to see interest after a flat cut."],
    example: "₹1,00,000 at 7.1% compounded quarterly for 12 months is a little above ₹1,07,290 before tax.",
    faqs: [
      { q: "Is 7.1% the current FD rate?", a: "No. It is a default you should replace. Banks publish their own card rates, and they change." },
      { q: "Does this include a senior-citizen bonus?", a: "Only if you add it to the rate yourself." },
    ],
    related: ["rd-calculator", "compound-interest-calculator", "ppf-calculator"],
  },
  {
    slug: "rd-calculator",
    title: "RD calculator",
    description: "Estimate recurring-deposit maturity with quarterly compounding, the convention many Indian RD formulas use.",
    category: "finance",
    keywords: ["rd", "recurring deposit", "rd maturity"],
    synonyms: ["monthly deposit maturity"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "monthly", label: "Monthly deposit", type: "number", unit: "₹", defaultValue: "5000", required: true, min: 0 },
      { id: "rate", label: "Annual rate", type: "number", unit: "%", defaultValue: "6.5", required: true, min: 0 },
      { id: "months", label: "Months", type: "number", defaultValue: "24", required: true, min: 1, max: 120 },
    ],
    compute: (v) => {
      const monthly = readNumber(v, "monthly", "Monthly deposit", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 });
      const months = readNumber(v, "months", "Months", { min: 1, max: 120, integer: true });
      const maturity = rdMaturity(monthly, rate, months);
      const invested = monthly * months;
      return pack([
        item("Estimated maturity", formatInrExact(maturity), true),
        item("Amount deposited", formatInr(invested)),
        item("Estimated interest", formatInrExact(maturity - invested)),
      ], { notes: ["The formula uses a quarterly rate and treats deposits as monthly. A bank that compounds monthly will differ slightly."] });
    },
    formula: "M = R × [((1+i)^q − 1) / (1 − (1+i)^(−1/3))], where i = annual rate / 400 and q = months / 3.",
    howItWorks: "A recurring deposit is a series of monthly instalments, not a lump sum. Interest is earned on each instalment for a different length of time. The closed-form expression used here is the common quarterly-compounding RD formula. Replace the rate with the card rate you were offered.",
    steps: ["Enter the monthly instalment.", "Enter the annual rate.", "Use whole months. The formula is built on quarters, so a tenure that is not a multiple of three is an approximation."],
    example: "₹5,000 a month for 24 months at 6.5% produces a maturity above the ₹1,20,000 deposited. The gap is the interest.",
    faqs: [
      { q: "Why might the bank’s figure differ?", a: "Day-count, the date of the first instalment, and monthly versus quarterly compounding all move the result." },
      { q: "Is the default rate current?", a: "No. Change it." },
    ],
    related: ["fd-calculator", "sip-calculator", "savings-goal-calculator"],
  },
  {
    slug: "ppf-calculator",
    title: "PPF calculator",
    description: "Project a Public Provident Fund balance from an annual deposit and a rate you can update.",
    category: "finance",
    keywords: ["ppf", "public provident fund"],
    synonyms: ["ppf maturity"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["The deposit is modelled at the start of each year.", "The rate stays constant. The notified PPF rate does not.", "The current annual deposit ceiling is noted, not enforced as a future law."],
    inputs: [
      { id: "annual", label: "Annual deposit", type: "number", unit: "₹", defaultValue: "150000", required: true, min: 0 },
      { id: "rate", label: "Assumed annual rate", type: "number", unit: "%", defaultValue: "7.1", required: true, min: 0 },
      { id: "years", label: "Years", type: "number", defaultValue: "15", required: true, min: 1, max: 50 },
      { id: "opening", label: "Existing balance", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const annual = readNumber(v, "annual", "Deposit", { min: 0 });
      const rate = readNumber(v, "rate", "Rate", { min: 0 }) / 100;
      const years = readNumber(v, "years", "Years", { min: 1, max: 50, integer: true });
      let balance = readNumber(v, "opening", "Opening balance", { min: 0 });
      const rows: string[][] = [];
      for (let year = 1; year <= years; year++) {
        const interest = (balance + annual) * rate;
        balance = balance + annual + interest;
        if (year <= 15 || year === years) rows.push([String(year), formatInr(annual), formatInr(interest), formatInr(balance)]);
      }
      const notes = ["Interest is calculated once a year on the opening balance plus that year’s deposit. EPFO/PPF monthly interest credit can differ."];
      if (annual > 150000) notes.push("The deposit is above the ₹1.5 lakh annual ceiling often cited for PPF. The page still calculates it. Confirm the current ceiling.");
      return pack([
        item("Estimated balance", formatInr(balance), true),
        item("Deposited over the term", formatInr(annual * years)),
      ], { notes, table: { caption: "Yearly sketch", headers: ["Year", "Deposit", "Interest", "Balance"], rows } });
    },
    formula: "End balance = (opening balance + annual deposit) × (1 + rate), repeated each year.",
    howItWorks: "PPF interest is notified and can change. A 15-year projection at today’s rate is a scenario, not the scheme’s promise. Deposits are modelled at the start of the year so they earn that year’s interest, which matches the usual advice to deposit early but not the exact monthly credit rules.",
    steps: ["Enter the annual amount you expect to deposit.", "Replace 7.1% when the notified rate changes.", "Use 15 years for a standard maturity sketch, or more if you are modelling extensions."],
    example: "₹1,50,000 a year at a constant 7.1% for 15 years is a multi-lakh balance. The table shows the path.",
    faqs: [
      { q: "Is 7.1% guaranteed?", a: "No. It is the default assumption in this file and should be edited when the notified rate changes." },
      { q: "Are withdrawals modelled?", a: "No. The balance assumes no withdrawal." },
    ],
    related: ["epf-calculator", "nps-calculator", "fd-calculator"],
  },
  {
    slug: "epf-calculator",
    title: "EPF calculator",
    description: "Sketch an EPF balance from basic wage, a 12% employee contribution, and an interest rate you can change.",
    category: "finance",
    keywords: ["epf", "provident fund", "pf balance"],
    synonyms: ["employee provident fund"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Employee contribution is 12% of the PF wage you set.", "Employer EPS is 8.33% of wage capped at ₹15,000 a month. The rest of the employer 12% goes to EPF.", "Interest is applied once a year to contributions plus opening balance. EPFO’s monthly credit differs."],
    inputs: [
      { id: "basic", label: "Monthly basic + DA", type: "number", unit: "₹", defaultValue: "40000", required: true, min: 0 },
      { id: "rate", label: "Assumed EPF interest", type: "number", unit: "%", defaultValue: "8.25", required: true, min: 0 },
      { id: "years", label: "Years", type: "number", defaultValue: "10", required: true, min: 1, max: 40 },
      { id: "increment", label: "Annual wage growth", type: "number", unit: "%", defaultValue: "5", required: true, min: 0, max: 30 },
      { id: "opening", label: "Current EPF balance", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      let wage = readNumber(v, "basic", "Basic", { min: 0 });
      const rate = readNumber(v, "rate", "Interest", { min: 0 }) / 100;
      const years = readNumber(v, "years", "Years", { min: 1, max: 40, integer: true });
      const increment = readNumber(v, "increment", "Growth", { min: 0, max: 30 }) / 100;
      let balance = readNumber(v, "opening", "Opening balance", { min: 0 });
      let employeeTotal = 0;
      let employerEpfTotal = 0;
      for (let year = 0; year < years; year++) {
        const employee = wage * 0.12 * 12;
        const epsWage = Math.min(wage, 15000);
        const eps = epsWage * 0.0833 * 12;
        const employerEpf = wage * 0.12 * 12 - eps;
        employeeTotal += employee;
        employerEpfTotal += employerEpf;
        balance = (balance + employee + employerEpf) * (1 + rate);
        wage *= 1 + increment;
      }
      return pack([
        item("Estimated EPF balance", formatInr(balance), true),
        item("Employee contributions", formatInr(employeeTotal)),
        item("Employer EPF contributions", formatInr(employerEpfTotal)),
      ], { notes: ["EPS pension is not added to the EPF balance. The ₹15,000 EPS wage ceiling is a stored assumption, not a prediction that the ceiling will stay there."] });
    },
    formula: "Year-end balance ≈ (opening + employee 12% + employer EPF) × (1 + interest rate).",
    howItWorks: "EPF is a contribution plus an interest credit, not a market return. The employer’s 12% is split. A portion goes to the pension scheme on a capped wage and does not raise the EPF lump sum in the same way. This sketch keeps that split visible.",
    steps: ["Enter current basic plus dearness allowance.", "Update the interest rate when EPFO notifies a new one.", "Set wage growth to 0 if you want a flat-wage sketch."],
    example: "A ₹40,000 basic wage, 8.25% interest, and modest wage growth produces a balance well above contributions alone. The split shows how much came from you and from the employer EPF portion.",
    faqs: [
      { q: "Is 8.25% the current EPF rate?", a: "It is a default to edit. Check the latest EPFO notification." },
      { q: "Does this include the pension?", a: "No. EPS is separated and is not turned into a lump sum here." },
    ],
    related: ["ppf-calculator", "salary-calculator", "gratuity-calculator"],
  },
  {
    slug: "nps-calculator",
    title: "NPS retirement calculator",
    description: "Project a National Pension System corpus from contributions and an expected return, then split a 60/40 lump sum and annuity illustration.",
    category: "finance",
    keywords: ["nps", "national pension system", "annuity"],
    synonyms: ["nps corpus"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Expected return is constant and not a scheme return.", "At exit, 40% is illustrated as annuitised and 60% as a lump sum, a common rule of thumb that can differ by exit type.", "Annuity income uses the rate you type. Insurers price annuities in the market."],
    inputs: [
      { id: "monthly", label: "Monthly contribution", type: "number", unit: "₹", defaultValue: "5000", required: true, min: 0 },
      { id: "years", label: "Years to exit", type: "number", defaultValue: "25", required: true, min: 1, max: 45 },
      { id: "rate", label: "Expected annual return", type: "number", unit: "%", defaultValue: "9", required: true },
      { id: "annuity", label: "Assumed annuity rate", type: "number", unit: "%", defaultValue: "6", required: true, min: 0 },
      { id: "current", label: "Current corpus", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const monthly = readNumber(v, "monthly", "Contribution", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 1, max: 45 });
      const rate = readNumber(v, "rate", "Return");
      const annuityRate = readNumber(v, "annuity", "Annuity rate", { min: 0 }) / 100;
      const current = readNumber(v, "current", "Current corpus", { min: 0 });
      const futureContrib = sipFutureValue(monthly, rate, Math.round(years * 12));
      const futureCurrent = futureValueCompound(current, rate, years, 12);
      const corpus = futureContrib + futureCurrent;
      const lump = corpus * 0.6;
      const annuityCorpus = corpus * 0.4;
      return pack([
        item("Estimated corpus", formatInr(corpus), true),
        item("Illustrated lump sum (60%)", formatInr(lump)),
        item("Illustrated annuity corpus (40%)", formatInr(annuityCorpus)),
        item("Illustrated annual annuity", formatInr(annuityCorpus * annuityRate)),
      ], { notes: ["Exit rules, tax on the lump sum, and annuity products change. This is a planning sketch, not an NPS statement."] });
    },
    formula: "Corpus ≈ future value of the monthly contribution + grown current corpus. Annuity illustration = 40% of corpus × annuity rate.",
    howItWorks: "NPS contributions buy units whose value moves. A constant expected return hides that path. The 60/40 split is shown because people ask what might be taken as cash and what might buy an annuity. Your actual exit option can differ.",
    steps: ["Enter the contribution you plan to keep up.", "Use a return you are willing to cut in a second scenario.", "Read the annuity line as income only if an insurer really offers that rate."],
    example: "₹5,000 a month for 25 years at a constant 9% is a large illustrated corpus. Lower the rate before you treat it as a plan.",
    faqs: [
      { q: "Is 40% always annuitised?", a: "Not in every exit. The page labels the split as an illustration of a common rule, not as your entitlement." },
      { q: "Are charges deducted?", a: "No. NPS account charges would reduce the corpus slightly. Lower the return if you want a rough allowance." },
    ],
    related: ["retirement-corpus-calculator", "ppf-calculator", "sip-calculator"],
  },
  {
    slug: "retirement-corpus-calculator",
    title: "Retirement corpus calculator",
    description: "Estimate a corpus that could support an inflating expense, then the monthly saving that might build it.",
    category: "finance",
    keywords: ["retirement corpus", "retirement planning", "pension pot"],
    synonyms: ["how much to retire"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Expenses grow with the inflation rate you enter.", "The corpus earns the post-retirement return you enter, which is not guaranteed.", "Tax, health shocks, and a changing lifestyle are not modelled."],
    inputs: [
      { id: "expense", label: "Current monthly expense to replace", type: "number", unit: "₹", defaultValue: "50000", required: true, min: 0 },
      { id: "age", label: "Current age", type: "number", defaultValue: "32", required: true, min: 18, max: 70 },
      { id: "retire", label: "Retirement age", type: "number", defaultValue: "60", required: true, min: 30, max: 75 },
      { id: "until", label: "Plan until age", type: "number", defaultValue: "85", required: true, min: 50, max: 110 },
      { id: "inflation", label: "Inflation", type: "number", unit: "%", defaultValue: "6", required: true, min: 0 },
      { id: "pre", label: "Expected return before retirement", type: "number", unit: "%", defaultValue: "10", required: true },
      { id: "post", label: "Expected return after retirement", type: "number", unit: "%", defaultValue: "7", required: true },
      { id: "saved", label: "Amount already saved", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const expense = readNumber(v, "expense", "Expense", { min: 0 });
      const age = readNumber(v, "age", "Current age", { min: 18, max: 70 });
      const retire = readNumber(v, "retire", "Retirement age", { min: 30, max: 75 });
      const until = readNumber(v, "until", "Plan-until age", { min: 50, max: 110 });
      if (retire <= age) throw new InputError("Retirement age must be above the current age.");
      if (until <= retire) throw new InputError("The plan-until age must be above retirement age.");
      const inflation = readNumber(v, "inflation", "Inflation", { min: 0 }) / 100;
      const pre = readNumber(v, "pre", "Pre-retirement return") / 100;
      const post = readNumber(v, "post", "Post-retirement return") / 100;
      const saved = readNumber(v, "saved", "Savings", { min: 0 });
      const years = retire - age;
      const drawYears = until - retire;
      const firstAnnual = expense * 12 * (1 + inflation) ** years;
      const corpus = growingAnnuityPV(firstAnnual, inflation, post, drawYears);
      const grown = saved * (1 + pre) ** years;
      const gap = Math.max(0, corpus - grown);
      const monthly = savingsPayment(gap, pre * 100, Math.round(years * 12), 0);
      return pack([
        item("Illustrated corpus at retirement", formatInr(corpus), true),
        item("First-year retirement expense", formatInr(firstAnnual)),
        item("Current savings grown to retirement", formatInr(grown)),
        item("Monthly saving for the gap", formatInr(monthly)),
      ], { notes: ["If the post-retirement return equals inflation, the corpus is about first-year expense × years. A higher return assumption shrinks the corpus and is easy to overstate."] });
    },
    formula: "Future expense = today’s annual expense × (1+inflation)^years. Corpus is the present value of an annuity growing with inflation and discounted at the post-retirement return.",
    howItWorks: "Retirement maths has two stages. Before retirement, savings grow. After retirement, withdrawals must survive inflation. This page inflates today’s expense to the retirement year, prices a growing annuity, then asks what monthly saving fills any gap. Every rate is an assumption.",
    steps: ["Enter the spending you would want to replace, not your entire salary.", "Keep a gap between the post-retirement return and inflation that you can defend.", "Increase the plan-until age if longevity runs in the family. The corpus rises."],
    example: "Replacing ₹50,000 a month after a long stretch of 6% inflation needs a much larger corpus than 12 × ₹50,000. The page shows that inflation effect explicitly.",
    faqs: [
      { q: "Should the expense include EMIs?", a: "Include only costs you expect to continue. A loan that ends before retirement should not be inflated for 25 retirement years." },
      { q: "Is the monthly saving tax-deductible?", a: "Not automatically. Product choice decides that. This page is silent on tax." },
    ],
    related: ["nps-calculator", "savings-goal-calculator", "inflation-calculator"],
  },
  {
    slug: "inflation-calculator",
    title: "Inflation calculator",
    description: "Show the future cost of an amount, or the purchasing power of today’s money, at an inflation rate you choose.",
    category: "finance",
    keywords: ["inflation", "purchasing power", "future cost"],
    synonyms: ["inflation impact"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "amount", label: "Amount", type: "number", unit: "₹", defaultValue: "100000", required: true, min: 0 },
      { id: "rate", label: "Inflation rate", type: "number", unit: "% / year", defaultValue: "6", required: true, min: -5, max: 30 },
      { id: "years", label: "Years", type: "number", defaultValue: "10", required: true, min: 0, max: 60 },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 0 });
      const rate = readNumber(v, "rate", "Inflation", { min: -5, max: 30 }) / 100;
      const years = readNumber(v, "years", "Years", { min: 0, max: 60 });
      const future = amount * (1 + rate) ** years;
      const power = rate <= -1 ? 0 : amount / (1 + rate) ** years;
      return pack([
        item("Future cost of the same basket", formatInr(future), true),
        item("Purchasing power of today’s amount", formatInr(power)),
        item("Price multiple", formatNumber(amount === 0 ? 0 : future / amount, 2)),
      ]);
    },
    formula: "Future cost = amount × (1 + inflation)^years. Purchasing power = amount / (1 + inflation)^years.",
    howItWorks: "Inflation is a measured index, not a single rate that applies to every household. A 6% input is a scenario. The future-cost line answers “what might this cost later?”. The purchasing-power line answers “what could today’s money buy later?”.",
    steps: ["Enter the amount in today’s prices.", "Choose an inflation scenario. Try 4% and 8% as well as 6%.", "Do not treat the result as the CPI print for a future year."],
    example: "₹1,00,000 of today’s goods at 6% for 10 years has a future cost of about ₹1,79,085.",
    faqs: [
      { q: "Which inflation rate should I use?", a: "There is no single correct input. Consumer-price inflation, education inflation, and medical inflation differ. Pick the one that matches the basket." },
      { q: "Does this include investment returns?", a: "No. Pair it with the compound-interest page if you want a real return: roughly nominal return minus inflation, for small rates." },
    ],
    related: ["compound-interest-calculator", "retirement-corpus-calculator", "savings-goal-calculator"],
  },
  {
    slug: "savings-goal-calculator",
    title: "Savings goal calculator",
    description: "Find the monthly saving that reaches a goal, after optional existing savings grow at the same rate.",
    category: "finance",
    keywords: ["savings goal", "monthly saving", "target amount"],
    synonyms: ["goal planner"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "goal", label: "Goal", type: "number", unit: "₹", defaultValue: "1000000", required: true, min: 0 },
      { id: "years", label: "Years", type: "number", defaultValue: "5", required: true, min: 1, max: 40 },
      { id: "rate", label: "Expected annual return", type: "number", unit: "%", defaultValue: "7", required: true, min: 0 },
      { id: "current", label: "Already saved", type: "number", unit: "₹", defaultValue: "50000", required: true, min: 0 },
    ],
    compute: (v) => {
      const goal = readNumber(v, "goal", "Goal", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 1, max: 40 });
      const rate = readNumber(v, "rate", "Return", { min: 0 });
      const current = readNumber(v, "current", "Savings", { min: 0 });
      const months = Math.round(years * 12);
      const monthly = savingsPayment(goal, rate, months, current);
      const grown = current * (rate === 0 ? 1 : (1 + rate / 100 / 12) ** months);
      return pack([
        item("Monthly saving needed", formatInr(monthly), true),
        item("Existing savings grown", formatInr(grown)),
        item("Contributions over the term", formatInr(monthly * months)),
      ], { notes: ["Deposits are modelled at the end of each month. A higher return assumption lowers the monthly saving and may be optimistic."] });
    },
    formula: "Payment = (goal − future value of current savings) × r / ((1+r)^n − 1), with r the monthly rate.",
    howItWorks: "The goal is a future amount. Current savings are grown first. The gap is filled by an ordinary annuity of monthly deposits. If current savings already grow past the goal, the required payment is zero.",
    steps: ["Name a goal in future rupees, or inflate today’s cost first.", "Use a return that matches the vehicle, not a hope.", "If the monthly figure is uncomfortable, extend the years or reduce the goal. Do not only raise the return."],
    example: "A ₹10 lakh goal in 5 years, with ₹50,000 already saved and a 7% assumption, needs a monthly deposit the page will show. Check it against your cash flow.",
    faqs: [
      { q: "Should the goal be in today’s prices?", a: "Only if you also set the return to a real return. Otherwise inflate the goal first." },
      { q: "What if I already have enough?", a: "The monthly saving shows as zero. Extra saving is optional, not required by the formula." },
    ],
    related: ["sip-calculator", "inflation-calculator", "retirement-corpus-calculator"],
  },
  {
    slug: "income-tax-calculator",
    title: "Income tax calculator (India)",
    description: "Estimate tax under the new or old regime for a selected financial year, using slabs stored in one rules file.",
    category: "finance",
    keywords: ["income tax", "new regime", "old regime", "india tax"],
    synonyms: ["income tax calculator india", "87a rebate"],
    disclaimer: `${FINANCE_DISCLAIMER} This is not a tax return and not advice from a tax practitioner.`,
    inputs: [
      { id: "year", label: "Financial year", type: "select", defaultValue: "2026-27", options: taxYears.map((year) => ({ value: year.id, label: `${year.label} (${year.assessmentYear})` })) },
      { id: "regime", label: "Regime", type: "select", defaultValue: "new", options: [
        { value: "new", label: "New regime (default in the statute)" },
        { value: "old", label: "Old regime" },
      ] },
      { id: "age", label: "Age on 31 March", type: "select", defaultValue: "below60", options: [
        { value: "below60", label: "Under 60" },
        { value: "senior", label: "60 to 79" },
        { value: "super", label: "80 or above" },
      ] },
      { id: "income", label: "Gross income", type: "number", unit: "₹", defaultValue: "1200000", required: true, min: 0 },
      { id: "salaried", label: "Income type", type: "select", defaultValue: "yes", options: [
        { value: "yes", label: "Salary — apply standard deduction" },
        { value: "no", label: "Other income — no standard deduction" },
      ] },
      { id: "deductions", label: "Old-regime deductions", type: "number", unit: "₹", defaultValue: "150000", min: 0, help: "80C and similar amounts. Ignored under the new regime." },
      { id: "nps", label: "Employer NPS", type: "number", unit: "₹", defaultValue: "0", min: 0 },
      { id: "basic", label: "Basic salary for NPS cap", type: "number", unit: "₹", defaultValue: "0", min: 0 },
    ],
    compute: (v) => {
      const estimate = estimateIncomeTax({
        yearId: v.year || "2026-27",
        regime: (v.regime || "new") as TaxRegime,
        age: (v.age || "below60") as AgeBand,
        grossIncome: readNumber(v, "income", "Income", { min: 0 }),
        isSalaried: v.salaried !== "no",
        oldRegimeDeductions: readNumber({ ...v, deductions: v.deductions || "0" }, "deductions", "Deductions", { min: 0 }),
        employerNps: readNumber({ ...v, nps: v.nps || "0" }, "nps", "Employer NPS", { min: 0 }),
        basicSalary: readNumber({ ...v, basic: v.basic || "0" }, "basic", "Basic salary", { min: 0 }),
      });
      return pack([
        item("Estimated tax including cess", formatInrExact(estimate.totalTax), true),
        item("Taxable income", formatInr(estimate.taxableIncome)),
        item("Tax before rebate", formatInrExact(estimate.taxBeforeRebate)),
        item("Rebate", formatInrExact(estimate.rebate)),
        item("Surcharge", formatInrExact(estimate.surcharge)),
        item("Cess", formatInrExact(estimate.cess)),
        item("Effective rate on gross income", formatPct(estimate.effectiveRate * 100, 2)),
      ], { notes: estimate.notes });
    },
    formula: "Tax is the sum of slab slices, minus a rebate if the stored rule allows it, plus surcharge and 4% cess.",
    howItWorks: "Slabs, the standard deduction, and the Section 87A limits live in src/config/taxRules.ts so a Finance Act change is an edit to that file, not a hunt through the interface. The new regime is modelled with a rebate up to ₹12 lakh of taxable income and marginal relief just above it. The old regime keeps age-based exemption limits. Surcharge marginal relief is not fully modelled.",
    steps: ["Choose the financial year and regime.", "Enter gross income before the standard deduction.", "Under the old regime, enter deductions you are actually eligible to claim. The new regime will not subtract them."],
    example: "A salaried gross income of ₹12,00,000 under the stored new-regime rules is reduced by the ₹75,000 standard deduction. Tax on the remainder is then tested against the rebate.",
    faqs: [
      { q: "Is this the official tax utility?", a: "No. It is an estimator with disclosed rules. File using the income-tax department’s utility or a qualified preparer." },
      { q: "Which year do the slabs belong to?", a: "The year you select. Both stored years currently share the post-Budget-2025 slab description. Re-read taxRules.ts before relying on a later year." },
    ],
    related: ["salary-calculator", "hra-calculator", "ctc-to-take-home-calculator"],
  },
  {
    slug: "gst-calculator",
    title: "GST calculator",
    description: "Add GST to a price or extract it, and split CGST and SGST or show IGST.",
    category: "finance",
    keywords: ["gst", "cgst", "sgst", "igst"],
    synonyms: ["gst calculator india"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["You choose the rate. The page does not look up an HSN code.", "Intra-state tax is split equally into CGST and SGST. Inter-state tax is shown as IGST.", "Cess on particular goods is not added unless you include it in the rate."],
    inputs: [
      { id: "amount", label: "Amount", type: "number", unit: "₹", defaultValue: "1000", required: true, min: 0 },
      { id: "rate", label: "GST rate", type: "select", defaultValue: "18", options: ["0", "5", "12", "18", "28", "40"].map((rate) => ({ value: rate, label: `${rate}%` })) },
      { id: "mode", label: "Amount is", type: "select", defaultValue: "exclusive", options: [
        { value: "exclusive", label: "Exclusive of GST" },
        { value: "inclusive", label: "Inclusive of GST" },
      ] },
      { id: "supply", label: "Supply", type: "select", defaultValue: "intra", options: [
        { value: "intra", label: "Intra-state (CGST + SGST)" },
        { value: "inter", label: "Inter-state (IGST)" },
      ] },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 0 });
      const rate = Number(v.rate || "18") / 100;
      const exclusive = v.mode === "inclusive" ? amount / (1 + rate) : amount;
      const gst = exclusive * rate;
      const inclusive = exclusive + gst;
      const results = [
        item("GST", formatInrExact(gst), true),
        item("Taxable value", formatInrExact(exclusive)),
        item("Price including GST", formatInrExact(inclusive)),
      ];
      if (v.supply === "inter") results.push(item("IGST", formatInrExact(gst)));
      else {
        results.push(item("CGST", formatInrExact(gst / 2)));
        results.push(item("SGST", formatInrExact(gst / 2)));
      }
      return pack(results, { notes: ["Public summaries of GST changes from September 2025 describe many items moving off 12% and 28% toward 5%, 18%, and a 40% demerit rate. Confirm the rate for the specific goods or services. 12% and 28% remain selectable for older invoices."] });
    },
    formula: "GST = taxable value × rate. Inclusive price = taxable value × (1 + rate). Taxable value = inclusive price / (1 + rate).",
    howItWorks: "GST is a percentage of the taxable value. If a price already includes GST, dividing by 1 + rate removes it. The split between CGST and SGST is equal in this ordinary intra-state illustration. Compensation cess and special valuation rules are outside the page.",
    steps: ["Enter the amount and say whether GST is already inside it.", "Select the rate that applies to the supply, not a favourite rate.", "Choose intra-state or inter-state for the split."],
    example: "₹1,000 exclusive at 18% becomes ₹1,180. GST is ₹180, or ₹90 CGST and ₹90 SGST on an intra-state supply.",
    faqs: [
      { q: "Which rate is correct for my product?", a: "The page cannot know. Check the HSN or SAC and the latest notification." },
      { q: "Is 28% still valid?", a: "It is kept so older invoices can be checked. Do not assume it still applies to a current supply." },
    ],
    related: ["gst-price-calculator", "invoice-tax-calculator", "vat-calculator"],
  },
  {
    slug: "salary-calculator",
    title: "Salary in-hand calculator",
    description: "Estimate monthly in-hand pay from gross salary, provident fund, professional tax, and a tax estimate.",
    category: "finance",
    keywords: ["in-hand salary", "take home", "net salary"],
    synonyms: ["salary calculator india"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "gross", label: "Monthly gross salary", type: "number", unit: "₹", defaultValue: "80000", required: true, min: 0 },
      { id: "pf", label: "Employee PF each month", type: "number", unit: "₹", defaultValue: "4800", required: true, min: 0 },
      { id: "pt", label: "Professional tax each month", type: "number", unit: "₹", defaultValue: "200", required: true, min: 0 },
      { id: "other", label: "Other monthly deductions", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
      { id: "year", label: "Tax year", type: "select", defaultValue: "2026-27", options: taxYears.map((year) => ({ value: year.id, label: year.label })) },
      { id: "regime", label: "Tax regime", type: "select", defaultValue: "new", options: [
        { value: "new", label: "New" },
        { value: "old", label: "Old" },
      ] },
    ],
    compute: (v) => {
      const gross = readNumber(v, "gross", "Gross", { min: 0 });
      const pf = readNumber(v, "pf", "PF", { min: 0 });
      const pt = readNumber(v, "pt", "Professional tax", { min: 0 });
      const other = readNumber(v, "other", "Other deductions", { min: 0 });
      const annual = gross * 12;
      const tax = estimateIncomeTax({
        yearId: v.year || "2026-27",
        regime: (v.regime || "new") as TaxRegime,
        age: "below60",
        grossIncome: annual,
        isSalaried: true,
        oldRegimeDeductions: v.regime === "old" ? pf * 12 : 0,
        employerNps: 0,
        basicSalary: 0,
      });
      const inHand = gross - pf - pt - other - tax.totalTax / 12;
      return pack([
        item("Estimated monthly in-hand", formatInrExact(inHand), true),
        item("Monthly tax estimate", formatInrExact(tax.totalTax / 12)),
        item("Annual tax estimate", formatInrExact(tax.totalTax)),
        item("Annual gross", formatInr(annual)),
      ], { notes: ["In-hand is gross minus the deductions you listed and one twelfth of the annual tax estimate. It is not a payslip. HRA exemption is not calculated here; use the HRA page and lower taxable income yourself if you move to a fuller model."] });
    },
    formula: "In-hand ≈ monthly gross − employee PF − professional tax − other deductions − annual tax / 12.",
    howItWorks: "A payslip starts from gross pay and subtracts statutory and chosen deductions. Tax is an annual amount spread over months, which is why a bonus month looks different. This page annualises the monthly gross, runs the stored tax rules, and subtracts. It does not know your allowances.",
    steps: ["Enter monthly gross before PF and tax.", "Enter the PF and professional tax from a recent payslip.", "Choose the regime. Old-regime PF is treated as an 80C deduction up to the cap in the rules file."],
    example: "₹80,000 gross with ₹4,800 PF and ₹200 professional tax is reduced further by the tax estimate. The in-hand line is the remainder.",
    faqs: [
      { q: "Why is this different from CTC?", a: "CTC includes employer costs you never receive, such as employer PF. Use the CTC calculator to start from cost to company." },
      { q: "Does professional tax vary by state?", a: "Yes. ₹200 is a common monthly figure, not a universal one. Change it." },
    ],
    related: ["ctc-to-take-home-calculator", "income-tax-calculator", "hra-calculator"],
  },
  {
    slug: "ctc-to-take-home-calculator",
    title: "CTC to take-home salary calculator",
    description: "Break annual CTC into basic, HRA, employer PF, gratuity provision, tax, and estimated monthly take-home.",
    category: "finance",
    keywords: ["ctc", "cost to company", "take home from ctc"],
    synonyms: ["ctc calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Basic is a percentage of CTC.", "Employer PF is 12% of PF wage and is part of CTC.", "Gratuity provision, if included, is 4.81% of basic (15/26 of a month).", "Special allowance is the balancing figure."],
    inputs: [
      { id: "ctc", label: "Annual CTC", type: "number", unit: "₹", defaultValue: "1200000", required: true, min: 0 },
      { id: "basicPct", label: "Basic as % of CTC", type: "number", unit: "%", defaultValue: "40", required: true, min: 20, max: 70 },
      { id: "hraPct", label: "HRA as % of basic", type: "number", unit: "%", defaultValue: "40", required: true, min: 0, max: 80 },
      { id: "bonus", label: "Annual bonus inside CTC", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
      { id: "pfcap", label: "PF wage", type: "select", defaultValue: "actual", options: [
        { value: "actual", label: "Actual basic" },
        { value: "cap", label: "Capped at ₹15,000 a month" },
      ] },
      { id: "gratuity", label: "Gratuity provision in CTC", type: "select", defaultValue: "yes", options: [
        { value: "yes", label: "Include 4.81% of basic" },
        { value: "no", label: "Not included" },
      ] },
      { id: "pt", label: "Professional tax", type: "number", unit: "₹ / month", defaultValue: "200", required: true, min: 0 },
      { id: "year", label: "Tax year", type: "select", defaultValue: "2026-27", options: taxYears.map((year) => ({ value: year.id, label: year.label })) },
      { id: "regime", label: "Tax regime", type: "select", defaultValue: "new", options: [
        { value: "new", label: "New" },
        { value: "old", label: "Old" },
      ] },
    ],
    compute: (v) => {
      const ctc = readNumber(v, "ctc", "CTC", { min: 0 });
      const basicPct = readNumber(v, "basicPct", "Basic percent", { min: 20, max: 70 }) / 100;
      const hraPct = readNumber(v, "hraPct", "HRA percent", { min: 0, max: 80 }) / 100;
      const bonus = readNumber(v, "bonus", "Bonus", { min: 0 });
      const pt = readNumber(v, "pt", "Professional tax", { min: 0 });
      const annualBasic = ctc * basicPct;
      const annualHra = annualBasic * hraPct;
      const pfWage = v.pfcap === "cap" ? Math.min(annualBasic / 12, 15000) : annualBasic / 12;
      const employerPf = pfWage * 0.12 * 12;
      const gratuity = v.gratuity === "no" ? 0 : annualBasic * 0.0481;
      const special = ctc - annualBasic - annualHra - employerPf - gratuity - bonus;
      if (special < -1) throw new InputError("The components exceed CTC. Lower basic, HRA, or bonus.");
      const employeePf = pfWage * 0.12 * 12;
      const annualGross = annualBasic + annualHra + Math.max(0, special) + bonus;
      const tax = estimateIncomeTax({
        yearId: v.year || "2026-27",
        regime: (v.regime || "new") as TaxRegime,
        age: "below60",
        grossIncome: annualGross,
        isSalaried: true,
        oldRegimeDeductions: v.regime === "old" ? employeePf : 0,
        employerNps: 0,
        basicSalary: annualBasic,
      });
      const monthly = (annualGross - bonus) / 12 - employeePf / 12 - pt - tax.totalTax / 12;
      return pack([
        item("Estimated monthly take-home", formatInrExact(monthly), true),
        item("Annual basic", formatInr(annualBasic)),
        item("Annual HRA", formatInr(annualHra)),
        item("Special allowance", formatInr(Math.max(0, special))),
        item("Employer PF (inside CTC)", formatInr(employerPf)),
        item("Employee PF", formatInr(employeePf)),
        item("Gratuity provision", formatInr(gratuity)),
        item("Estimated annual tax", formatInrExact(tax.totalTax)),
      ], { notes: ["Offer letters define CTC differently. Match the percentages to your letter. HRA exemption under the old regime is not subtracted beyond the deduction field."] });
    },
    formula: "Special allowance = CTC − basic − HRA − employer PF − gratuity provision − bonus. Take-home starts from cash gross, not from CTC.",
    howItWorks: "Cost to company is not salary. Employer PF and a gratuity provision are costs that may never appear as cash in a month. This page peels those items off, estimates tax with the stored rules, and shows what might be transferred. Your employer’s structure can differ.",
    steps: ["Enter annual CTC from the offer.", "Set basic and HRA percentages from the annexure, not from a guess, if you have them.", "Compare the component list with the offer before trusting the take-home line."],
    example: "A ₹12,00,000 CTC with 40% basic and 40% HRA on basic leaves room for employer PF and a balancing allowance. The take-home is lower than CTC divided by 12.",
    faqs: [
      { q: "Why is take-home not CTC/12?", a: "Because employer contributions, tax, employee PF, and professional tax are not all spendable cash." },
      { q: "What is 4.81%?", a: "15/26 of one month’s basic, spread over 12 months, a common provision for gratuity. It is not the gratuity you have already earned." },
    ],
    related: ["salary-calculator", "gratuity-calculator", "income-tax-calculator"],
  },
  {
    slug: "gratuity-calculator",
    title: "Gratuity calculator",
    description: "Calculate gratuity for an establishment covered by the Payment of Gratuity Act, or the uncovered formula.",
    category: "finance",
    keywords: ["gratuity", "gratuity act", "15/26"],
    synonyms: ["gratuity formula"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "salary", label: "Last drawn basic + DA", type: "number", unit: "₹ / month", defaultValue: "45000", required: true, min: 0 },
      { id: "years", label: "Completed years", type: "number", defaultValue: "7", required: true, min: 0, max: 50 },
      { id: "months", label: "Extra months in the final year", type: "number", defaultValue: "6", required: true, min: 0, max: 11 },
      { id: "covered", label: "Establishment", type: "select", defaultValue: "covered", options: [
        { value: "covered", label: "Covered by the Payment of Gratuity Act" },
        { value: "uncovered", label: "Not covered" },
      ] },
    ],
    compute: (v) => {
      const salary = readNumber(v, "salary", "Salary", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 0, max: 50, integer: true });
      const months = readNumber(v, "months", "Months", { min: 0, max: 11, integer: true });
      const covered = v.covered !== "uncovered";
      const counted = covered && months >= 6 ? years + 1 : years;
      const amount = covered ? (15 * salary * counted) / 26 : (15 * salary * years) / 30;
      return pack([
        item("Estimated gratuity", formatInrExact(amount), true),
        item("Years used in the formula", formatNumber(covered ? counted : years, 0)),
        item("Formula", covered ? "(15 × salary × years) / 26" : "(15 × salary × years) / 30"),
      ], { notes: ["Eligibility, forfeiture, and the tax-exemption ceiling are legal questions. This page calculates the formula amount only. Confirm the current exemption before assuming the amount is tax-free."] });
    },
    formula: "Covered establishments: gratuity = 15 × last drawn salary × years / 26. Six months or more in the final year rounds the year up in this illustration.",
    howItWorks: "Gratuity is a statutory or contractual lump sum linked to service and last drawn salary. The covered formula uses 26 working days as the divisor. The uncovered formula often uses 30. Rounding of the last year is a frequent source of disputes, so the months field is visible.",
    steps: ["Enter last drawn basic plus dearness allowance, not full CTC.", "Enter completed years and the extra months.", "Choose whether the establishment is covered. If you are unsure, ask HR rather than guessing."],
    example: "₹45,000 salary and 8 years (7 years plus 6 months, rounded up) under the covered formula is 15 × 45,000 × 8 / 26.",
    faqs: [
      { q: "Is gratuity payable before five years?", a: "The Act generally requires five years, with exceptions such as death or disablement. This calculator does not decide eligibility." },
      { q: "Is the whole amount tax-free?", a: "Not necessarily. Exemption limits are set by law and change. The page does not compute tax on gratuity." },
    ],
    related: ["ctc-to-take-home-calculator", "epf-calculator", "salary-calculator"],
  },
  {
    slug: "hra-calculator",
    title: "HRA calculator",
    description: "Estimate HRA exemption as the least of actual HRA, rent minus 10% of salary, and 40% or 50% of salary.",
    category: "finance",
    keywords: ["hra", "house rent allowance", "hra exemption"],
    synonyms: ["rent exemption"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Exemption is an old-regime concept in this estimator.", "Salary for the test is basic plus DA.", "Metro means 50% of salary; non-metro means 40%."],
    inputs: [
      { id: "basic", label: "Annual basic + DA", type: "number", unit: "₹", defaultValue: "600000", required: true, min: 0 },
      { id: "hra", label: "Annual HRA received", type: "number", unit: "₹", defaultValue: "240000", required: true, min: 0 },
      { id: "rent", label: "Annual rent paid", type: "number", unit: "₹", defaultValue: "216000", required: true, min: 0 },
      { id: "city", label: "City", type: "select", defaultValue: "metro", options: [
        { value: "metro", label: "Metro (50% of salary)" },
        { value: "other", label: "Non-metro (40% of salary)" },
      ] },
    ],
    compute: (v) => {
      const basic = readNumber(v, "basic", "Salary", { min: 0 });
      const hra = readNumber(v, "hra", "HRA", { min: 0 });
      const rent = readNumber(v, "rent", "Rent", { min: 0 });
      const percent = v.city === "other" ? 0.4 : 0.5;
      const rentMinus = Math.max(0, rent - basic * 0.1);
      const cityLimit = basic * percent;
      const exempt = Math.min(hra, rentMinus, cityLimit);
      return pack([
        item("Estimated exemption", formatInr(exempt), true),
        item("Taxable HRA", formatInr(hra - exempt)),
        item("Actual HRA", formatInr(hra)),
        item("Rent minus 10% of salary", formatInr(rentMinus)),
        item(v.city === "other" ? "40% of salary" : "50% of salary", formatInr(cityLimit)),
      ], { notes: ["The new regime generally does not allow this exemption. Keep rent receipts and the landlord’s details as the law requires. This is not a filing position."] });
    },
    formula: "Exemption = least of (actual HRA, rent paid − 10% of salary, 50% or 40% of salary).",
    howItWorks: "HRA exemption is a three-way minimum. Paying rent is not enough if HRA received is small, and receiving HRA is not enough if rent is below 10% of salary. Metro status changes only the third test.",
    steps: ["Use annual figures, or monthly figures for all three inputs. Do not mix.", "Select metro only if the rented house is in a city the rule treats as a metro.", "Subtract the exemption from HRA received to see the taxable remainder."],
    example: "Salary ₹6,00,000, HRA ₹2,40,000, rent ₹2,16,000 in a metro: the three tests are ₹2,40,000, ₹1,56,000, and ₹3,00,000. The exemption is ₹1,56,000.",
    faqs: [
      { q: "Which cities are metros?", a: "The rule names specific cities and has changed over time. If you are unsure, check the current definition rather than guessing from city size." },
      { q: "Can I claim this in the new regime?", a: "The stored new-regime notes say this exemption is not applied there. Confirm against the current Finance Act." },
    ],
    related: ["income-tax-calculator", "salary-calculator", "ctc-to-take-home-calculator"],
  },
  {
    slug: "capital-gains-calculator",
    title: "Capital gains estimator",
    description: "Estimate tax on a gain using rates you can edit. Defaults follow widely described post-2024 equity rates and must be verified.",
    category: "finance",
    keywords: ["capital gains", "ltcg", "stcg"],
    synonyms: ["shares tax calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Default equity STCG is 20% and default equity LTCG is 12.5% above an exemption you can edit.", "Indexation is not calculated.", "Surcharge and the type of asset can change the rate."],
    inputs: [
      { id: "buy", label: "Cost", type: "number", unit: "₹", defaultValue: "100000", required: true, min: 0 },
      { id: "sell", label: "Sale value", type: "number", unit: "₹", defaultValue: "180000", required: true, min: 0 },
      { id: "kind", label: "Gain type", type: "select", defaultValue: "ltcg", options: [
        { value: "stcg", label: "Short-term equity (default rate 20%)" },
        { value: "ltcg", label: "Long-term equity (default rate 12.5%)" },
        { value: "other", label: "Other — enter the rate" },
      ] },
      { id: "rate", label: "Rate if other, or override", type: "number", unit: "%", defaultValue: "12.5", required: true, min: 0 },
      { id: "exemption", label: "Exemption to apply", type: "number", unit: "₹", defaultValue: "125000", required: true, min: 0 },
    ],
    compute: (v) => {
      const buy = readNumber(v, "buy", "Cost", { min: 0 });
      const sell = readNumber(v, "sell", "Sale value", { min: 0 });
      const gain = sell - buy;
      const exemption = v.kind === "ltcg" ? readNumber(v, "exemption", "Exemption", { min: 0 }) : 0;
      const rate = v.kind === "stcg" ? 20 : v.kind === "ltcg" ? 12.5 : readNumber(v, "rate", "Rate", { min: 0 });
      const taxable = Math.max(0, gain - exemption);
      const tax = taxable * (rate / 100);
      return pack([
        item("Gain", formatInr(gain), true, gain < 0 ? "A loss is not taxed here." : "Before exemption"),
        item("Taxable after exemption", formatInr(taxable)),
        item("Estimated tax before cess", formatInrExact(Math.max(0, tax))),
        item("Rate used", formatPct(rate, 2)),
      ], { notes: ["Add 4% cess yourself if you need a filing sketch, and check surcharge. Holding period decides short-term versus long-term and is not inferred. Verify rates against the current Finance Act."] });
    },
    formula: "Gain = sale − cost. Tax ≈ max(0, gain − exemption) × rate.",
    howItWorks: "Capital-gains tax depends on the asset, the holding period, and the year’s statute. This page does the arithmetic once you classify the gain and accept or edit the rate. It does not decide whether your shares are equity, whether indexation applies, or whether a grandfathering rule changes the cost.",
    steps: ["Enter cost and sale value.", "Classify the gain. Do not use the equity defaults for property or debt without checking.", "Edit the exemption. A long-term equity exemption is not a universal allowance."],
    example: "A ₹80,000 equity gain below a ₹1,25,000 LTCG exemption illustrates as zero taxable gain. A larger gain is taxed only above the exemption, at the rate shown.",
    faqs: [
      { q: "Are the default rates current?", a: "They follow widely published descriptions of the July 2024 changes. Confirm them before you file." },
      { q: "Where is indexation?", a: "Not on this page. If your asset still has an indexation option, compute the indexed cost elsewhere and enter that cost here." },
    ],
    related: ["stock-profit-loss-calculator", "income-tax-calculator", "cagr-calculator"],
  },
  {
    slug: "stock-profit-loss-calculator",
    title: "Stock profit and loss calculator",
    description: "Calculate profit or loss on a share trade before brokerage and charges.",
    category: "finance",
    keywords: ["stock profit", "share pnl", "trade profit"],
    synonyms: ["equity pnl"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "buy", label: "Buy price", type: "number", defaultValue: "250", required: true, min: 0 },
      { id: "sell", label: "Sell price", type: "number", defaultValue: "280", required: true, min: 0 },
      { id: "qty", label: "Quantity", type: "number", defaultValue: "40", required: true, min: 0 },
      { id: "charges", label: "Total charges", type: "number", defaultValue: "0", required: true, min: 0, help: "Brokerage, STT, GST, and stamp duty. Use the brokerage estimator to build this figure." },
    ],
    compute: (v) => {
      const buy = readNumber(v, "buy", "Buy price", { min: 0 });
      const sell = readNumber(v, "sell", "Sell price", { min: 0 });
      const qty = readNumber(v, "qty", "Quantity", { min: 0 });
      const charges = readNumber(v, "charges", "Charges", { min: 0 });
      const gross = (sell - buy) * qty;
      const net = gross - charges;
      return pack([
        item("Net result", formatInrExact(net), true, net >= 0 ? "Profit after charges" : "Loss after charges"),
        item("Gross result", formatInrExact(gross)),
        item("Buy value", formatInrExact(buy * qty)),
        item("Sell value", formatInrExact(sell * qty)),
        item("Return on buy value", formatPct(buy * qty === 0 ? 0 : (net / (buy * qty)) * 100, 2)),
      ]);
    },
    formula: "Net = (sell − buy) × quantity − charges.",
    howItWorks: "A trade’s cash result is the difference in price times quantity, minus costs. Percentage return uses the buy value as the base. Tax is separate and depends on holding period and the year’s rules.",
    steps: ["Enter prices per share and the quantity.", "Add charges, or leave them at zero and label the result as gross.", "Use the capital-gains page if you need a tax sketch."],
    example: "40 shares bought at 250 and sold at 280 make ₹1,200 before charges.",
    faqs: [
      { q: "Does this handle intraday and delivery differently?", a: "Only through the charges and the tax treatment you apply afterwards. The profit identity is the same." },
      { q: "What about dividends?", a: "Add them outside this trade result. They are not part of the price difference." },
    ],
    related: ["brokerage-calculator", "capital-gains-calculator", "cagr-calculator"],
  },
  {
    slug: "brokerage-calculator",
    title: "Brokerage and trading charges estimator",
    description: "Estimate delivery-trade charges from rates you can edit. Defaults are illustrations, not a broker’s tariff.",
    category: "finance",
    keywords: ["brokerage", "stt", "trading charges"],
    synonyms: ["share charges calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    assumptions: ["Defaults approximate common Indian equity delivery charges and are editable.", "STT, exchange, SEBI, stamp, and GST rates change.", "Intraday and F&O tariffs are not the defaults."],
    inputs: [
      { id: "buy", label: "Buy price", type: "number", defaultValue: "250", required: true, min: 0 },
      { id: "sell", label: "Sell price", type: "number", defaultValue: "280", required: true, min: 0 },
      { id: "qty", label: "Quantity", type: "number", defaultValue: "40", required: true, min: 1 },
      { id: "brokerage", label: "Brokerage each side", type: "number", unit: "₹", defaultValue: "0", required: true, min: 0 },
      { id: "stt", label: "STT", type: "number", unit: "% of buy and sell", defaultValue: "0.1", required: true, min: 0 },
      { id: "exchange", label: "Exchange transaction charge", type: "number", unit: "%", defaultValue: "0.00345", required: true, min: 0 },
      { id: "sebi", label: "SEBI charge", type: "number", unit: "%", defaultValue: "0.0001", required: true, min: 0 },
      { id: "stamp", label: "Stamp duty on buy", type: "number", unit: "%", defaultValue: "0.015", required: true, min: 0 },
      { id: "gst", label: "GST on brokerage and some fees", type: "number", unit: "%", defaultValue: "18", required: true, min: 0 },
    ],
    compute: (v) => {
      const buy = readNumber(v, "buy", "Buy price", { min: 0 });
      const sell = readNumber(v, "sell", "Sell price", { min: 0 });
      const qty = readNumber(v, "qty", "Quantity", { min: 1 });
      const brokerage = readNumber(v, "brokerage", "Brokerage", { min: 0 }) * 2;
      const buyValue = buy * qty;
      const sellValue = sell * qty;
      const stt = (buyValue + sellValue) * (readNumber(v, "stt", "STT", { min: 0 }) / 100);
      const exchange = (buyValue + sellValue) * (readNumber(v, "exchange", "Exchange charge", { min: 0 }) / 100);
      const sebi = (buyValue + sellValue) * (readNumber(v, "sebi", "SEBI charge", { min: 0 }) / 100);
      const stamp = buyValue * (readNumber(v, "stamp", "Stamp duty", { min: 0 }) / 100);
      const gst = (brokerage + exchange + sebi) * (readNumber(v, "gst", "GST", { min: 0 }) / 100);
      const total = brokerage + stt + exchange + sebi + stamp + gst;
      return pack([
        item("Estimated charges", formatInrExact(total), true),
        item("Brokerage", formatInrExact(brokerage)),
        item("STT", formatInrExact(stt)),
        item("Exchange + SEBI", formatInrExact(exchange + sebi)),
        item("Stamp duty", formatInrExact(stamp)),
        item("GST", formatInrExact(gst)),
        item("Net profit after charges", formatInrExact((sell - buy) * qty - total)),
      ], { notes: ["Replace every rate with your broker’s current tariff and the latest statutory charges. Delivery STT is not the same as intraday STT."] });
    },
    formula: "Charges = brokerage + STT + exchange + SEBI + stamp + GST on the fee base.",
    howItWorks: "A discount broker’s zero brokerage is not a zero-cost trade. Statutory charges still apply. This page itemises a delivery illustration so you can see which line is large. It will be wrong if you leave stale defaults in place, so the inputs are editable on purpose.",
    steps: ["Enter the trade.", "Replace brokerage with the flat fee your broker charges per order.", "Update statutory percentages from a current contract note before relying on the total."],
    example: "A 40-share delivery trade with zero brokerage still shows STT and a small exchange charge. STT is usually the largest statutory line.",
    faqs: [
      { q: "Are the default percentages official?", a: "They are labelled illustrations. Statutory charges are notified and revised. Do not treat the defaults as a tariff." },
      { q: "Does GST apply to STT?", a: "In this illustration GST is applied to brokerage, exchange charges, and SEBI charges, not to STT or stamp duty." },
    ],
    related: ["stock-profit-loss-calculator", "gst-calculator", "capital-gains-calculator"],
  },
  {
    slug: "investment-break-even-calculator",
    title: "Investment break-even calculator",
    description: "Find how long a steady monthly surplus takes to recover an initial outlay.",
    category: "finance",
    keywords: ["payback period", "break even investment", "recover cost"],
    synonyms: ["payback calculator"],
    disclaimer: FINANCE_DISCLAIMER,
    inputs: [
      { id: "cost", label: "Initial outlay", type: "number", unit: "₹", defaultValue: "240000", required: true, min: 0 },
      { id: "monthly", label: "Net monthly surplus", type: "number", unit: "₹", defaultValue: "8000", required: true },
      { id: "rate", label: "Optional annual discount rate", type: "number", unit: "%", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const cost = readNumber(v, "cost", "Outlay", { min: 0 });
      const monthly = readNumber(v, "monthly", "Monthly surplus");
      const rate = readNumber(v, "rate", "Discount rate", { min: 0 }) / 100 / 12;
      if (monthly <= 0) throw new InputError("The monthly surplus must be positive to recover the outlay.");
      let balance = cost;
      let month = 0;
      while (balance > 0 && month < 1200) {
        balance = balance * (1 + rate) - monthly;
        month += 1;
      }
      if (balance > 0) throw new InputError("The surplus does not recover the outlay within 100 years at this rate.");
      return pack([
        item("Break-even", `${Math.floor(month / 12)} years and ${month % 12} months`, true),
        item("Months", formatNumber(month, 0)),
        item("Undiscounted payback", `${formatNumber(cost / monthly, 1)} months`),
      ], { notes: ["A zero discount rate is simple payback. A positive rate makes later rupees less helpful, so break-even moves later."] });
    },
    formula: "Simple payback = outlay / monthly surplus. Discounted payback compounds the unrecovered balance at the monthly rate.",
    howItWorks: "Payback asks when cash in has matched cash out. It ignores gains after that date, so it is a liquidity test rather than a full investment decision. Discounting recognises that a rupee next year is not a rupee today.",
    steps: ["Enter the cash you must spend up front.", "Enter the monthly net surplus after running costs.", "Leave the discount rate at zero for simple payback."],
    example: "₹2,40,000 recovered by ₹8,000 a month takes 30 months if you do not discount.",
    faqs: [
      { q: "Is a shorter payback always better?", a: "It is safer for cash, not automatically a higher return. A project can pay back slowly and still be valuable." },
      { q: "How is this different from business break-even?", a: "The business page solves for units. This page solves for time on a single outlay." },
    ],
    related: ["roi-calculator", "break-even-calculator", "savings-goal-calculator"],
  },
  {
    slug: "discount-calculator",
    title: "Discount calculator",
    description: "Find the sale price and the amount saved from an original price and a discount percent.",
    category: "finance",
    keywords: ["discount", "sale price", "percent off"],
    synonyms: ["markdown calculator"],
    inputs: [
      { id: "price", label: "Original price", type: "number", defaultValue: "2499", required: true, min: 0 },
      { id: "discount", label: "Discount", type: "number", unit: "%", defaultValue: "20", required: true, min: 0, max: 100 },
      { id: "tax", label: "Tax added after discount", type: "number", unit: "%", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const price = readNumber(v, "price", "Price", { min: 0 });
      const discount = readNumber(v, "discount", "Discount", { min: 0, max: 100 });
      const tax = readNumber(v, "tax", "Tax", { min: 0 });
      const saved = price * (discount / 100);
      const net = price - saved;
      const payable = net * (1 + tax / 100);
      return pack([
        item("You pay", formatNumber(payable, 2), true),
        item("Discount amount", formatNumber(saved, 2)),
        item("Price after discount", formatNumber(net, 2)),
        item("Tax", formatNumber(payable - net, 2)),
      ]);
    },
    formula: "Sale price = original × (1 − discount). Payable = sale price × (1 + tax).",
    howItWorks: "A discount reduces the base. Tax, if it is added after the discount, should be calculated on the reduced price. A tax that was already inside the original price should be handled with the GST or VAT page instead of adding it again.",
    steps: ["Enter the price before the offer.", "Enter the discount percent.", "Add a tax rate only if tax is charged on top of the discounted price."],
    example: "₹2,499 less 20% is ₹1,999.20 before any extra tax.",
    faqs: [
      { q: "What about a second discount?", a: "Use the retail discount calculator, which applies stacked discounts in order." },
      { q: "Is 20% off the same as paying 80%?", a: "Yes. The payable fraction is 1 − 0.20." },
    ],
    related: ["percentage-off-calculator", "retail-discount-calculator", "markup-margin-calculator"],
  },
  {
    slug: "markup-margin-calculator",
    title: "Markup and margin calculator",
    description: "Convert between cost, price, markup, and margin without mixing up the denominator.",
    category: "finance",
    keywords: ["markup", "margin", "gross margin"],
    synonyms: ["markup vs margin"],
    inputs: [
      { id: "mode", label: "I know", type: "select", defaultValue: "cost-markup", options: [
        { value: "cost-markup", label: "Cost and markup %" },
        { value: "cost-margin", label: "Cost and target margin %" },
        { value: "cost-price", label: "Cost and selling price" },
      ] },
      { id: "cost", label: "Cost", type: "number", defaultValue: "400", required: true, min: 0 },
      { id: "percent", label: "Percent", type: "number", unit: "%", defaultValue: "25", showIf: { field: "mode", equals: "cost-markup" }, required: true },
      { id: "margin", label: "Target margin", type: "number", unit: "%", defaultValue: "20", showIf: { field: "mode", equals: "cost-margin" }, required: true, max: 99 },
      { id: "price", label: "Selling price", type: "number", defaultValue: "500", showIf: { field: "mode", equals: "cost-price" }, required: true, min: 0 },
    ],
    compute: (v) => {
      const cost = readNumber(v, "cost", "Cost", { min: 0 });
      let price = 0;
      if (v.mode === "cost-price") price = readNumber(v, "price", "Price", { min: 0 });
      else if (v.mode === "cost-margin") {
        const margin = readNumber(v, "margin", "Margin", { max: 99 });
        if (margin >= 100) throw new InputError("Margin must be below 100%.");
        price = cost / (1 - margin / 100);
      } else price = cost * (1 + readNumber(v, "percent", "Markup") / 100);
      if (price === 0) throw new InputError("Price cannot be zero when margin is calculated.");
      const profit = price - cost;
      return pack([
        item("Selling price", formatNumber(price, 2), true),
        item("Profit", formatNumber(profit, 2)),
        item("Markup on cost", formatPct(cost === 0 ? 0 : (profit / cost) * 100, 2)),
        item("Margin on price", formatPct((profit / price) * 100, 2)),
      ]);
    },
    formula: "Markup = profit / cost. Margin = profit / price. Price = cost / (1 − margin).",
    howItWorks: "Markup and margin use different denominators, so 25% markup is 20% margin. Quoting the wrong one underprices or overprices. This page always shows both once cost and price are known.",
    steps: ["Choose which pair of facts you have.", "Enter cost as the amount you need to recover, including costs you intend to cover.", "Read both percentages before you put the price on a quote."],
    example: "A ₹400 cost with 25% markup prices at ₹500. Profit is ₹100, which is a 20% margin.",
    faqs: [
      { q: "Why is margin always lower than markup for a profitable price?", a: "Because the denominator, price, is larger than cost when there is a profit." },
      { q: "Can margin be 100%?", a: "Only if cost is zero. The target-margin field stops at 99% so the price stays finite." },
    ],
    related: ["markup-calculator", "gross-margin-calculator", "discount-calculator"],
  },
  {
    slug: "currency-converter",
    title: "Currency converter",
    description: "Convert an amount with an exchange rate you supply. This page does not fetch live rates.",
    category: "finance",
    keywords: ["currency converter", "exchange rate", "forex"],
    synonyms: ["usd to inr", "currency calculator"],
    disclaimer: "There is no live exchange-rate feed. Enter a rate from your bank or a dated source. A sample in the worked example is an illustration, not a market quote.",
    inputs: [
      { id: "amount", label: "Amount", type: "number", defaultValue: "100", required: true },
      { id: "from", label: "From currency", type: "text", defaultValue: "USD", required: true },
      { id: "to", label: "To currency", type: "text", defaultValue: "INR", required: true },
      { id: "rate", label: "Units of the target currency per 1 unit of the source", type: "number", required: true, step: "any", help: "Example shape only: if 1 USD buys 83 INR, enter 83. Do not treat any remembered rate as current." },
      { id: "asof", label: "Rate date or source note", type: "text", placeholder: "Bank rate, 21 Mar 2026" },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount");
      const rate = readNumber(v, "rate", "Exchange rate", { allowZero: false });
      const from = (v.from || "FROM").trim().toUpperCase();
      const to = (v.to || "TO").trim().toUpperCase();
      if (!/^[A-Z]{3,5}$/.test(from) || !/^[A-Z]{3,5}$/.test(to)) throw new InputError("Use currency codes such as USD, INR, or EUR.");
      return pack([
        item("Converted amount", `${formatNumber(amount * rate, 2)} ${to}`, true),
        item("Rate used", `1 ${from} = ${formatNumber(rate, 6)} ${to}`),
        item("Inverse", `1 ${to} = ${formatNumber(1 / rate, 6)} ${from}`),
        item("Source note", v.asof?.trim() || "No date entered — do not treat this as a market rate"),
      ], { notes: ["Live rates are not implemented. Add a dated feed later if you need one, and show the timestamp next to the result."] });
    },
    formula: "Target amount = source amount × (target units per 1 source unit).",
    howItWorks: "A conversion is only as good as the rate and the moment it was quoted. This calculator refuses to invent a rate. You type the rate, and the page multiplies. The inverse is shown so you can check that you did not swap the quote direction.",
    steps: ["Enter the amount and the two currency codes.", "Enter how many units of the target currency one unit of the source buys.", "Write the date or the source in the note so the result is not mistaken for a live quote."],
    example: "If a bank’s dated quote were 1 USD = 83 INR, then 100 USD would be 8,300 INR. That 83 is an illustration of the input shape, not a rate from this site.",
    faqs: [
      { q: "Why is there no default rate?", a: "Because a stale default would look like a market quote. Enter the rate you were given." },
      { q: "Does this include bank fees?", a: "No. A bank may give a worse rate or add a fee. Use the rate you can actually transact at." },
    ],
    related: ["percentage-calculator", "inflation-calculator", "unit-converter"],
  },
];
