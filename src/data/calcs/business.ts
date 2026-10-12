import { formatNumber, formatPct, InputError, readNumber } from "@/lib/format";
import { item, pack, type CalcDef } from "../types";

function money(n: number): string {
  return formatNumber(n, 2);
}

export const businessCalcs: CalcDef[] = [
  {
    slug: "profit-loss-calculator",
    title: "Profit and loss calculator",
    description: "Turn revenue and cost into profit, loss, margin, and markup.",
    category: "business",
    keywords: ["profit and loss", "pnl", "profit margin"],
    synonyms: ["p&l"],
    inputs: [
      { id: "revenue", label: "Revenue", type: "number", defaultValue: "150000", required: true, min: 0 },
      { id: "cost", label: "Cost", type: "number", defaultValue: "110000", required: true, min: 0 },
    ],
    compute: (v) => {
      const revenue = readNumber(v, "revenue", "Revenue", { min: 0 });
      const cost = readNumber(v, "cost", "Cost", { min: 0 });
      const profit = revenue - cost;
      return pack([
        item(profit >= 0 ? "Profit" : "Loss", money(Math.abs(profit)), true),
        item("Margin on revenue", revenue === 0 ? "—" : formatPct((profit / revenue) * 100, 2)),
        item("Markup on cost", cost === 0 ? "—" : formatPct((profit / cost) * 100, 2)),
      ]);
    },
    formula: "Profit = revenue − cost. Margin = profit / revenue. Markup = profit / cost.",
    howItWorks: "Profit is what remains after the costs you chose to include. If those costs are only goods, the result is a gross-style figure. If they include overhead, it is closer to operating profit. The page cannot know which costs you typed, so the label stays profit or loss.",
    steps: ["Enter revenue and the costs that belong in the comparison.", "Read the sign before the margin.", "Use markup when you set a price from cost, and margin when you describe profit as a share of sales."],
    example: "Revenue 150,000 and cost 110,000 leave a profit of 40,000, a 26.67% margin, and a 36.36% markup.",
    faqs: [
      { q: "Should tax be in cost?", a: "Only if you are measuring profit after that tax. Say which figure you used." },
      { q: "Can revenue be zero?", a: "Yes. Margin is then undefined and shown as a dash." },
    ],
    related: ["gross-margin-calculator", "net-margin-calculator", "markup-margin-calculator"],
  },
  {
    slug: "gross-margin-calculator",
    title: "Gross profit margin calculator",
    description: "Calculate gross profit and gross margin from revenue and cost of goods sold.",
    category: "business",
    keywords: ["gross margin", "cogs", "gross profit"],
    synonyms: ["gross profit calculator"],
    inputs: [
      { id: "revenue", label: "Revenue", type: "number", defaultValue: "80000", required: true, min: 0 },
      { id: "cogs", label: "Cost of goods sold", type: "number", defaultValue: "50000", required: true, min: 0 },
    ],
    compute: (v) => {
      const revenue = readNumber(v, "revenue", "Revenue", { min: 0 });
      const cogs = readNumber(v, "cogs", "COGS", { min: 0 });
      const gross = revenue - cogs;
      if (revenue === 0) throw new InputError("Revenue must be greater than zero to state a margin.");
      return pack([item("Gross profit", money(gross), true), item("Gross margin", formatPct((gross / revenue) * 100, 2))]);
    },
    formula: "Gross profit = revenue − COGS. Gross margin = gross profit / revenue.",
    howItWorks: "Gross margin isolates the cost of producing or buying what you sold. Rent, salaries, and ads are not COGS. Mixing them in makes the margin look worse and no longer comparable with other gross margins.",
    steps: ["Use net revenue if returns have already been removed.", "Enter only product or service delivery costs.", "Compare the margin with a peer only if they define COGS the same way."],
    example: "80,000 revenue and 50,000 COGS give 30,000 gross profit and a 37.5% gross margin.",
    faqs: [
      { q: "Is shipping COGS?", a: "Inbound freight often is. Outbound shipping is often an operating cost. Follow one policy and keep it." },
      { q: "Can gross profit be negative?", a: "Yes. Selling below direct cost produces a negative margin." },
    ],
    related: ["net-margin-calculator", "profit-loss-calculator", "markup-calculator"],
  },
  {
    slug: "net-margin-calculator",
    title: "Net profit margin calculator",
    description: "Calculate net profit and net margin after all expenses you include.",
    category: "business",
    keywords: ["net margin", "net profit", "bottom line"],
    synonyms: ["profit margin calculator"],
    inputs: [
      { id: "revenue", label: "Revenue", type: "number", defaultValue: "200000", required: true, min: 0 },
      { id: "expenses", label: "Total expenses", type: "number", defaultValue: "172000", required: true, min: 0 },
    ],
    compute: (v) => {
      const revenue = readNumber(v, "revenue", "Revenue", { min: 0, allowZero: false });
      const expenses = readNumber(v, "expenses", "Expenses", { min: 0 });
      const net = revenue - expenses;
      return pack([item("Net profit", money(net), true), item("Net margin", formatPct((net / revenue) * 100, 2))]);
    },
    formula: "Net profit = revenue − total expenses. Net margin = net profit / revenue.",
    howItWorks: "Net margin is what remains after the expenses you listed, divided by revenue. It is only as complete as that list. Interest and tax may or may not be inside it; say so when you share the number.",
    steps: ["Enter revenue.", "Enter every expense that belongs in the version of profit you want.", "A small margin on large revenue can still be a large sum. Read both lines."],
    example: "200,000 revenue and 172,000 expenses leave 28,000 profit and a 14% net margin.",
    faqs: [
      { q: "How is this different from gross margin?", a: "Gross margin stops at COGS. Net margin continues through the rest of the costs you include." },
      { q: "Should I use this for a single product?", a: "Only if you can assign the expenses honestly. Shared overhead needs an allocation rule this page does not invent." },
    ],
    related: ["gross-margin-calculator", "profit-loss-calculator", "break-even-calculator"],
  },
  {
    slug: "vat-calculator",
    title: "VAT and sales tax calculator",
    description: "Add VAT to a net price or extract VAT from a gross price.",
    category: "business",
    keywords: ["vat", "value added tax", "vat inclusive"],
    synonyms: ["vat calculator"],
    inputs: [
      { id: "amount", label: "Amount", type: "number", defaultValue: "120", required: true, min: 0 },
      { id: "rate", label: "VAT rate", type: "number", unit: "%", defaultValue: "20", required: true, min: 0 },
      { id: "mode", label: "Amount is", type: "select", defaultValue: "inclusive", options: [
        { value: "inclusive", label: "VAT-inclusive" },
        { value: "exclusive", label: "VAT-exclusive" },
      ] },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 0 });
      const rate = readNumber(v, "rate", "VAT rate", { min: 0 }) / 100;
      const net = v.mode === "inclusive" ? amount / (1 + rate) : amount;
      const vat = net * rate;
      return pack([item("VAT", money(vat), true), item("Net", money(net)), item("Gross", money(net + vat))]);
    },
    formula: "VAT = net × rate. Net = gross / (1 + rate).",
    howItWorks: "VAT is usually quoted inside the shelf price. Extracting it means dividing by one plus the rate, not multiplying the gross price by the rate. That second method overstates the tax.",
    steps: ["Confirm whether the amount already includes VAT.", "Enter the rate for that supply.", "Use the GST page for Indian CGST and SGST splits."],
    example: "A £120 price with 20% VAT inside it contains £20 of VAT and £100 of net.",
    faqs: [
      { q: "Is 20% the right rate?", a: "It is a common example, not a lookup. Reduced and zero rates exist. Change the field." },
      { q: "Does this handle VAT on VAT?", a: "No. Enter the rate that actually applies." },
    ],
    related: ["sales-tax-calculator", "gst-calculator", "invoice-tax-calculator"],
  },
  {
    slug: "gst-price-calculator",
    title: "GST-inclusive and GST-exclusive price calculator",
    description: "Build a shelf price from a net price and a margin, then show the GST inside it.",
    category: "business",
    keywords: ["gst inclusive", "gst exclusive", "shelf price"],
    synonyms: ["price plus gst"],
    inputs: [
      { id: "cost", label: "Net cost or net price", type: "number", defaultValue: "500", required: true, min: 0 },
      { id: "margin", label: "Margin on the GST-exclusive price", type: "number", unit: "%", defaultValue: "20", required: true, max: 90 },
      { id: "rate", label: "GST rate", type: "number", unit: "%", defaultValue: "18", required: true, min: 0 },
    ],
    compute: (v) => {
      const cost = readNumber(v, "cost", "Cost", { min: 0 });
      const margin = readNumber(v, "margin", "Margin", { max: 90 }) / 100;
      const rate = readNumber(v, "rate", "GST", { min: 0 }) / 100;
      if (margin >= 1) throw new InputError("Margin must be below 100%.");
      const exclusive = cost / (1 - margin);
      const gst = exclusive * rate;
      return pack([
        item("GST-inclusive price", money(exclusive + gst), true),
        item("GST-exclusive price", money(exclusive)),
        item("GST", money(gst)),
        item("Profit before GST", money(exclusive - cost)),
      ], { notes: ["Margin is applied to the tax-exclusive price. GST is then added. Confirm the rate for the HSN or SAC."] });
    },
    formula: "Exclusive price = cost / (1 − margin). Inclusive price = exclusive price × (1 + GST rate).",
    howItWorks: "A pricing worksheet should not treat GST as profit. This page builds the exclusive price from cost and margin, then puts GST on top so the tax and the margin stay separate.",
    steps: ["Enter the cost you need to recover.", "Enter the margin you want on the exclusive price.", "Add the GST rate that applies. The inclusive line is the shelf price."],
    example: "Cost 500, 20% margin, and 18% GST give an exclusive price of 625 and an inclusive price of 737.50.",
    faqs: [
      { q: "Is this the same as the GST calculator?", a: "The GST calculator splits a known amount. This page builds a price from cost and margin first." },
      { q: "What if my margin is on the inclusive price?", a: "That is a different definition. Remove GST first, then measure profit against the exclusive price." },
    ],
    related: ["gst-calculator", "markup-calculator", "invoice-tax-calculator"],
  },
  {
    slug: "markup-calculator",
    title: "Markup calculator",
    description: "Set a selling price from cost and a markup percentage.",
    category: "business",
    keywords: ["markup", "selling price", "cost plus"],
    synonyms: ["mark up calculator"],
    inputs: [
      { id: "cost", label: "Cost", type: "number", defaultValue: "40", required: true, min: 0 },
      { id: "markup", label: "Markup", type: "number", unit: "%", defaultValue: "50", required: true },
    ],
    compute: (v) => {
      const cost = readNumber(v, "cost", "Cost", { min: 0 });
      const markup = readNumber(v, "markup", "Markup") / 100;
      const price = cost * (1 + markup);
      return pack([
        item("Selling price", money(price), true),
        item("Profit", money(price - cost)),
        item("Margin", price === 0 ? "—" : formatPct(((price - cost) / price) * 100, 2)),
      ]);
    },
    formula: "Price = cost × (1 + markup). Margin = markup / (1 + markup).",
    howItWorks: "Markup is a percentage of cost. A 50% markup does not leave a 50% margin. The page shows the margin that the markup implies so a quote does not use the wrong denominator.",
    steps: ["Enter the full cost you intend to mark up.", "Enter the markup percent.", "Read the margin before you compare it with a target margin."],
    example: "Cost 40 with a 50% markup prices at 60. Profit is 20, which is a 33.33% margin.",
    faqs: [
      { q: "How do I hit a target margin instead?", a: "Use the markup and margin calculator and choose the margin mode." },
      { q: "Does markup include tax?", a: "Not unless you put tax inside the cost. Prefer to add tax after the price is set." },
    ],
    related: ["markup-margin-calculator", "retail-discount-calculator", "gross-margin-calculator"],
  },
  {
    slug: "retail-discount-calculator",
    title: "Retail discount calculator",
    description: "Apply up to two discounts in sequence and show the final price.",
    category: "business",
    keywords: ["stacked discount", "retail discount", "successive discount"],
    synonyms: ["double discount"],
    inputs: [
      { id: "price", label: "Original price", type: "number", defaultValue: "2000", required: true, min: 0 },
      { id: "first", label: "First discount", type: "number", unit: "%", defaultValue: "20", required: true, min: 0, max: 100 },
      { id: "second", label: "Second discount", type: "number", unit: "%", defaultValue: "10", required: true, min: 0, max: 100 },
    ],
    compute: (v) => {
      const price = readNumber(v, "price", "Price", { min: 0 });
      const first = readNumber(v, "first", "First discount", { min: 0, max: 100 }) / 100;
      const second = readNumber(v, "second", "Second discount", { min: 0, max: 100 }) / 100;
      const afterFirst = price * (1 - first);
      const finalPrice = afterFirst * (1 - second);
      const equivalent = price === 0 ? 0 : (1 - finalPrice / price) * 100;
      return pack([
        item("Final price", money(finalPrice), true),
        item("After first discount", money(afterFirst)),
        item("Total saved", money(price - finalPrice)),
        item("Equivalent single discount", formatPct(equivalent, 2)),
      ]);
    },
    formula: "Final = price × (1 − d1) × (1 − d2). Equivalent discount = 1 − (1 − d1)(1 − d2).",
    howItWorks: "Successive discounts multiply. Twenty percent off and then ten percent off is not thirty percent off. The second discount applies to the already reduced price, so the equivalent single discount is smaller than the sum.",
    steps: ["Enter the ticket price.", "Enter the discounts in the order the offer applies them.", "Use the equivalent line if you want one number for a comparison."],
    example: "2,000 less 20% is 1,600. Less another 10% is 1,440. The equivalent discount is 28%, not 30%.",
    faqs: [
      { q: "Does order matter?", a: "Not for two pure percentage discounts. It matters if one offer is a fixed amount. This page is percentage only." },
      { q: "Where is a single discount?", a: "Use the discount calculator or the percentage-off calculator." },
    ],
    related: ["percentage-off-calculator", "discount-calculator", "markup-calculator"],
  },
  {
    slug: "percentage-off-calculator",
    title: "Percentage-off calculator",
    description: "See the reduced price, the saving, and the fraction you still pay.",
    category: "business",
    keywords: ["percent off", "percentage off", "sale"],
    synonyms: ["% off"],
    inputs: [
      { id: "price", label: "Price", type: "number", defaultValue: "79", required: true, min: 0 },
      { id: "off", label: "Percent off", type: "number", unit: "%", defaultValue: "15", required: true, min: 0, max: 100 },
    ],
    compute: (v) => {
      const price = readNumber(v, "price", "Price", { min: 0 });
      const off = readNumber(v, "off", "Percent off", { min: 0, max: 100 });
      const saving = price * (off / 100);
      return pack([
        item("Price after discount", money(price - saving), true),
        item("You save", money(saving)),
        item("You still pay", formatPct(100 - off, 2)),
      ]);
    },
    formula: "Reduced price = price × (1 − percent off / 100).",
    howItWorks: "Percent off is a discount from the original price. The fraction you still pay is 100 minus the offer. That second number is useful when a sign is easier to misread than the final price.",
    steps: ["Enter the original price.", "Enter the advertised percent off.", "Pay the reduced price, not the saving."],
    example: "15% off 79 is a saving of 11.85 and a price of 67.15.",
    faqs: [
      { q: "Is 15% off the same as a 15% margin?", a: "No. Percent off describes a reduction from a previous price. Margin describes profit as a share of the selling price." },
      { q: "What if tax is extra?", a: "Add it after the discount with the invoice or VAT calculator." },
    ],
    related: ["discount-calculator", "retail-discount-calculator", "percentage-calculator"],
  },
  {
    slug: "commission-calculator",
    title: "Commission calculator",
    description: "Calculate a flat commission, with an optional higher rate above a threshold.",
    category: "business",
    keywords: ["commission", "sales commission", "tiered commission"],
    synonyms: ["broker commission"],
    inputs: [
      { id: "sales", label: "Sales", type: "number", defaultValue: "80000", required: true, min: 0 },
      { id: "rate", label: "Base rate", type: "number", unit: "%", defaultValue: "5", required: true, min: 0 },
      { id: "threshold", label: "Threshold for a higher rate", type: "number", defaultValue: "50000", required: true, min: 0 },
      { id: "higher", label: "Rate above the threshold", type: "number", unit: "%", defaultValue: "8", required: true, min: 0 },
    ],
    compute: (v) => {
      const sales = readNumber(v, "sales", "Sales", { min: 0 });
      const rate = readNumber(v, "rate", "Base rate", { min: 0 }) / 100;
      const threshold = readNumber(v, "threshold", "Threshold", { min: 0 });
      const higher = readNumber(v, "higher", "Higher rate", { min: 0 }) / 100;
      const base = Math.min(sales, threshold) * rate;
      const extra = Math.max(0, sales - threshold) * higher;
      return pack([
        item("Commission", money(base + extra), true),
        item("On the first band", money(base)),
        item("Above the threshold", money(extra)),
      ], { notes: ["The higher rate applies only to sales above the threshold, not to the whole amount."] });
    },
    formula: "Commission = min(sales, threshold) × base rate + max(0, sales − threshold) × higher rate.",
    howItWorks: "A tiered commission should say whether the higher rate applies to all sales or only the slice above the quota. This page uses the slice, which is the usual accelerator. If a contract pays the higher rate on everything once the quota is hit, do not use this split.",
    steps: ["Enter sales for the period.", "Enter the base rate and the threshold.", "Set the higher rate equal to the base rate if there is no accelerator."],
    example: "80,000 sales, 5% up to 50,000 and 8% above, pays 2,500 + 2,400 = 4,900.",
    faqs: [
      { q: "Are returns deducted?", a: "Enter net sales if the plan deducts returns. The page does not know the plan." },
      { q: "Is tax withheld?", a: "Not here. Commission tax depends on the worker’s status and the country." },
    ],
    related: ["revenue-growth-calculator", "percentage-calculator", "roi-calculator"],
  },
  {
    slug: "sales-tax-calculator",
    title: "Sales tax calculator",
    description: "Add a sales tax that is charged on top of a price, or recover the pre-tax price.",
    category: "business",
    keywords: ["sales tax", "tax added", "pre-tax price"],
    synonyms: ["sales tax rate"],
    inputs: [
      { id: "amount", label: "Amount", type: "number", defaultValue: "49.99", required: true, min: 0 },
      { id: "rate", label: "Sales tax", type: "number", unit: "%", defaultValue: "8.25", required: true, min: 0 },
      { id: "mode", label: "Amount is", type: "select", defaultValue: "before", options: [
        { value: "before", label: "Before tax" },
        { value: "after", label: "After tax" },
      ] },
    ],
    compute: (v) => {
      const amount = readNumber(v, "amount", "Amount", { min: 0 });
      const rate = readNumber(v, "rate", "Sales tax", { min: 0 }) / 100;
      const before = v.mode === "after" ? amount / (1 + rate) : amount;
      const tax = before * rate;
      return pack([item("Sales tax", money(tax), true), item("Before tax", money(before)), item("After tax", money(before + tax))]);
    },
    formula: "Tax = pre-tax price × rate. Pre-tax price = after-tax price / (1 + rate).",
    howItWorks: "US-style sales tax is often added at the till rather than included in the shelf price. The arithmetic is the same as VAT. The labelling is different, and the rate is local, so the field is editable.",
    steps: ["Enter the amount and whether tax is already included.", "Enter the combined state and local rate.", "Round to the cent only when you record a receipt."],
    example: "49.99 plus 8.25% tax is 54.11, with 4.12 of tax, before a till’s rounding rule.",
    faqs: [
      { q: "Where do I find the rate?", a: "From the jurisdiction of the sale. This page does not look up postal codes." },
      { q: "Is this VAT?", a: "The maths matches an added tax. Use the VAT page if the price is customarily inclusive." },
    ],
    related: ["vat-calculator", "invoice-tax-calculator", "gst-calculator"],
  },
  {
    slug: "revenue-growth-calculator",
    title: "Revenue growth calculator",
    description: "Measure growth between two periods and the compound rate if the gap is more than a year.",
    category: "business",
    keywords: ["revenue growth", "sales growth", "yoy"],
    synonyms: ["growth rate"],
    inputs: [
      { id: "old", label: "Earlier revenue", type: "number", defaultValue: "90000", required: true },
      { id: "next", label: "Later revenue", type: "number", defaultValue: "117000", required: true },
      { id: "years", label: "Years between the figures", type: "number", defaultValue: "1", required: true, min: 0.1 },
    ],
    compute: (v) => {
      const oldValue = readNumber(v, "old", "Earlier revenue", { allowZero: false });
      const next = readNumber(v, "next", "Later revenue");
      const years = readNumber(v, "years", "Years", { min: 0.1 });
      const change = ((next - oldValue) / oldValue) * 100;
      const cagr = ((next / oldValue) ** (1 / years) - 1) * 100;
      return pack([
        item("Total change", formatPct(change, 2), true),
        item("Compound annual rate", formatPct(cagr, 2)),
        item("Absolute change", money(next - oldValue)),
      ]);
    },
    formula: "Change = (later − earlier) / earlier. CAGR = (later / earlier)^(1/years) − 1.",
    howItWorks: "A two-year doubling is not 100% a year. The compound rate is the constant annual rate that links the two revenues. It hides everything that happened in between, including a bad middle year.",
    steps: ["Use comparable revenue, such as both net of returns.", "Set years to 1 for a simple year-on-year figure.", "Quote the compound rate only when the gap is longer than a year."],
    example: "90,000 to 117,000 in one year is 30% growth.",
    faqs: [
      { q: "What if earlier revenue is negative?", a: "A percentage change from a negative base is easy to misread. The page requires a non-zero earlier figure and you should explain a loss-making base in words." },
      { q: "Is this customer growth?", a: "Only if you enter customer counts instead of money. The formula does not care about the unit." },
    ],
    related: ["cagr-calculator", "percentage-change-calculator", "roi-calculator"],
  },
  {
    slug: "cac-calculator",
    title: "Customer acquisition cost calculator",
    description: "Divide sales and marketing cost by the new customers those costs acquired.",
    category: "business",
    keywords: ["cac", "customer acquisition cost"],
    synonyms: ["cost per acquisition"],
    inputs: [
      { id: "spend", label: "Sales and marketing cost", type: "number", defaultValue: "24000", required: true, min: 0 },
      { id: "customers", label: "New customers", type: "number", defaultValue: "80", required: true, min: 1 },
    ],
    compute: (v) => {
      const spend = readNumber(v, "spend", "Cost", { min: 0 });
      const customers = readNumber(v, "customers", "Customers", { min: 1 });
      return pack([item("CAC", money(spend / customers), true), item("Customers", formatNumber(customers, 0))]);
    },
    formula: "CAC = sales and marketing cost / new customers acquired.",
    howItWorks: "CAC is only meaningful if the numerator and the denominator cover the same period and the same effort. Including salaries and tools raises CAC and is often the more honest figure. Excluding them makes acquisition look cheaper than it was.",
    steps: ["Choose a period.", "Add the costs that existed to acquire customers in that period.", "Count only new customers from that effort."],
    example: "24,000 spent to acquire 80 customers is a CAC of 300.",
    faqs: [
      { q: "Should I include salaries?", a: "If those people spent the period on acquisition, yes. Say what you included." },
      { q: "Is CAC the same as CPA?", a: "CPA is cost per acquisition of a chosen action. CAC usually means a paying customer. Use the denominator that matches the name." },
    ],
    related: ["clv-calculator", "roas-calculator", "conversion-rate-calculator"],
  },
  {
    slug: "clv-calculator",
    title: "Customer lifetime value estimator",
    description: "Estimate a simple customer lifetime value from purchase value, frequency, and lifespan.",
    category: "business",
    keywords: ["clv", "ltv", "customer lifetime value"],
    synonyms: ["lifetime value"],
    inputs: [
      { id: "value", label: "Average purchase value", type: "number", defaultValue: "40", required: true, min: 0 },
      { id: "frequency", label: "Purchases per year", type: "number", defaultValue: "6", required: true, min: 0 },
      { id: "years", label: "Expected years", type: "number", defaultValue: "3", required: true, min: 0 },
      { id: "margin", label: "Gross margin", type: "number", unit: "%", defaultValue: "60", required: true, min: 0, max: 100 },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Purchase value", { min: 0 });
      const frequency = readNumber(v, "frequency", "Frequency", { min: 0 });
      const years = readNumber(v, "years", "Years", { min: 0 });
      const margin = readNumber(v, "margin", "Margin", { min: 0, max: 100 }) / 100;
      const revenue = value * frequency * years;
      return pack([
        item("Margin-adjusted CLV", money(revenue * margin), true),
        item("Lifetime revenue", money(revenue)),
        item("Annual revenue", money(value * frequency)),
      ], { notes: ["This is a simple historical-style CLV. It is not discounted and it is not a prediction that the customer will stay."] });
    },
    formula: "CLV ≈ average purchase × purchases per year × years × gross margin.",
    howItWorks: "Lifetime value compares what a customer contributes with what it cost to acquire them. The simple formula multiplies three averages. It ignores discounting, refunds, and the chance the relationship ends early. Use it as a planning ratio next to CAC, not as a valuation.",
    steps: ["Use averages from a defined cohort.", "Enter a margin so revenue is not mistaken for profit.", "Compare CLV with CAC. A thin gap leaves little room for error."],
    example: "40 × 6 × 3 × 60% = 432 of margin-adjusted value.",
    faqs: [
      { q: "Should I discount future purchases?", a: "A fuller model would. This one does not. Short horizons make the omission smaller." },
      { q: "What CLV-to-CAC ratio is good?", a: "There is no universal number. A ratio near 1 leaves no room for overhead. Context matters more than a slogan." },
    ],
    related: ["cac-calculator", "roi-calculator", "gross-margin-calculator"],
  },
  {
    slug: "roi-calculator",
    title: "Return on investment calculator",
    description: "Calculate ROI from an investment and the gain or final value.",
    category: "business",
    keywords: ["roi", "return on investment"],
    synonyms: ["return calculator"],
    inputs: [
      { id: "invested", label: "Amount invested", type: "number", defaultValue: "5000", required: true, min: 0 },
      { id: "returned", label: "Amount returned", type: "number", defaultValue: "6500", required: true, min: 0 },
    ],
    compute: (v) => {
      const invested = readNumber(v, "invested", "Invested", { min: 0, allowZero: false });
      const returned = readNumber(v, "returned", "Returned", { min: 0 });
      const gain = returned - invested;
      return pack([item("ROI", formatPct((gain / invested) * 100, 2), true), item("Gain", money(gain)), item("Returned", money(returned))]);
    },
    formula: "ROI = (returned − invested) / invested.",
    howItWorks: "ROI is a ratio, not a rate per year. A 30% ROI over three years is not a 30% annual return. Pair it with CAGR or XIRR when time matters. The denominator must be the capital actually put at risk.",
    steps: ["Enter the cash invested.", "Enter the cash that came back, including any remaining value you could realise.", "Do not call the result annual unless the period was a year."],
    example: "5,000 invested and 6,500 returned is a 30% ROI and a 1,500 gain.",
    faqs: [
      { q: "Does ROI include time?", a: "Not by itself. Use CAGR for a start and end value over several years, or XIRR for irregular cash flows." },
      { q: "Can ROI be negative?", a: "Yes. A return below the investment is a negative ROI." },
    ],
    related: ["roas-calculator", "cagr-calculator", "investment-break-even-calculator"],
  },
  {
    slug: "roas-calculator",
    title: "Return on ad spend calculator",
    description: "Divide attributed revenue by ad spend.",
    category: "business",
    keywords: ["roas", "return on ad spend", "ads"],
    synonyms: ["ad roi"],
    inputs: [
      { id: "revenue", label: "Attributed revenue", type: "number", defaultValue: "9000", required: true, min: 0 },
      { id: "spend", label: "Ad spend", type: "number", defaultValue: "2000", required: true, min: 0 },
    ],
    compute: (v) => {
      const revenue = readNumber(v, "revenue", "Revenue", { min: 0 });
      const spend = readNumber(v, "spend", "Spend", { min: 0, allowZero: false });
      return pack([
        item("ROAS", formatNumber(revenue / spend, 2), true, "Revenue per 1 unit of spend"),
        item("Revenue minus spend", money(revenue - spend)),
      ], { notes: ["ROAS is not profit. It ignores cost of goods, fees, and the ads that were not attributed."] });
    },
    formula: "ROAS = attributed revenue / ad spend.",
    howItWorks: "A ROAS of 4 means four units of attributed revenue per unit of spend. It can still lose money if the product margin is thin. Attribution is a model, so the numerator is only as good as the tracking rule.",
    steps: ["Use revenue the ad platform or your analytics attributed, and say which.", "Enter spend including agency fees if you want a fuller cost.", "Compare ROAS with the margin before calling a campaign profitable."],
    example: "9,000 attributed revenue on 2,000 spend is a ROAS of 4.5.",
    faqs: [
      { q: "Is ROAS the same as ROI?", a: "No. ROI subtracts the investment in the numerator. ROAS divides revenue by spend." },
      { q: "What ROAS should I target?", a: "One that clears product cost, fees, and overhead. A universal target would ignore your margin." },
    ],
    related: ["roi-calculator", "cac-calculator", "conversion-rate-calculator"],
  },
  {
    slug: "conversion-rate-calculator",
    title: "Conversion rate calculator",
    description: "Divide conversions by visits or sessions and show the gap to a target rate.",
    category: "business",
    keywords: ["conversion rate", "cvr", "visits to sales"],
    synonyms: ["conversion calculator"],
    inputs: [
      { id: "conversions", label: "Conversions", type: "number", defaultValue: "36", required: true, min: 0 },
      { id: "visits", label: "Visits or sessions", type: "number", defaultValue: "1200", required: true, min: 1 },
      { id: "target", label: "Target rate", type: "number", unit: "%", defaultValue: "4", required: true, min: 0 },
    ],
    compute: (v) => {
      const conversions = readNumber(v, "conversions", "Conversions", { min: 0 });
      const visits = readNumber(v, "visits", "Visits", { min: 1 });
      const target = readNumber(v, "target", "Target", { min: 0 }) / 100;
      const rate = conversions / visits;
      return pack([
        item("Conversion rate", formatPct(rate * 100, 2), true),
        item("Target conversions", formatNumber(visits * target, 1)),
        item("Gap", formatNumber(visits * target - conversions, 1)),
      ]);
    },
    formula: "Conversion rate = conversions / visits.",
    howItWorks: "A conversion rate is a ratio of two counts that must describe the same funnel. Mixing orders with sessions from a different date range, or counting the same person twice, changes the rate without changing the business.",
    steps: ["Define a conversion before counting it.", "Use the same period for both numbers.", "The gap line shows how many more conversions the target would have required."],
    example: "36 conversions from 1,200 visits is a 3% rate. A 4% target would have been 48 conversions.",
    faqs: [
      { q: "Should I use users or sessions?", a: "Either, if you label it. Do not compare a user rate with a session rate." },
      { q: "Is a higher rate always better?", a: "Not if it comes from fewer, more expensive visits. Read it next to volume and CAC." },
    ],
    related: ["cac-calculator", "roas-calculator", "percentage-calculator"],
  },
  {
    slug: "break-even-calculator",
    title: "Break-even point calculator",
    description: "Find the units and revenue needed to cover fixed costs.",
    category: "business",
    keywords: ["break even", "contribution margin", "fixed costs"],
    synonyms: ["breakeven units"],
    inputs: [
      { id: "fixed", label: "Fixed costs", type: "number", defaultValue: "12000", required: true, min: 0 },
      { id: "price", label: "Price per unit", type: "number", defaultValue: "40", required: true, min: 0 },
      { id: "variable", label: "Variable cost per unit", type: "number", defaultValue: "25", required: true, min: 0 },
    ],
    compute: (v) => {
      const fixed = readNumber(v, "fixed", "Fixed costs", { min: 0 });
      const price = readNumber(v, "price", "Price", { min: 0 });
      const variable = readNumber(v, "variable", "Variable cost", { min: 0 });
      const contribution = price - variable;
      if (contribution <= 0) throw new InputError("Price must exceed variable cost. Otherwise more units deepen the loss.");
      const units = fixed / contribution;
      return pack([
        item("Break-even units", formatNumber(units, 2), true),
        item("Break-even revenue", money(units * price)),
        item("Contribution per unit", money(contribution)),
        item("Contribution margin", formatPct((contribution / price) * 100, 2)),
      ]);
    },
    formula: "Break-even units = fixed costs / (price − variable cost per unit).",
    howItWorks: "Each unit contributes price minus variable cost toward fixed costs. Break-even is the unit count that covers those fixed costs and nothing more. It is not a profit target, and it assumes price and variable cost stay constant.",
    steps: ["List costs that do not change with the next unit as fixed.", "Keep only per-unit costs as variable.", "If contribution is zero or negative, fix the price or the variable cost before looking for a unit count."],
    example: "12,000 of fixed costs and a 15 contribution per unit break even at 800 units, or 32,000 of revenue.",
    faqs: [
      { q: "What about a profit target?", a: "Add the target profit to fixed costs and run the same formula. That unit count covers costs and the profit." },
      { q: "Is this the investment payback page?", a: "No. That page solves for time. This one solves for units." },
    ],
    related: ["investment-break-even-calculator", "gross-margin-calculator", "markup-calculator"],
  },
  {
    slug: "inventory-turnover-calculator",
    title: "Inventory turnover calculator",
    description: "Divide cost of goods sold by average inventory and show days of inventory.",
    category: "business",
    keywords: ["inventory turnover", "days inventory", "stock turns"],
    synonyms: ["stock turnover"],
    inputs: [
      { id: "cogs", label: "Cost of goods sold", type: "number", defaultValue: "480000", required: true, min: 0 },
      { id: "inventory", label: "Average inventory", type: "number", defaultValue: "80000", required: true, min: 0 },
      { id: "days", label: "Days in the period", type: "number", defaultValue: "365", required: true, min: 1 },
    ],
    compute: (v) => {
      const cogs = readNumber(v, "cogs", "COGS", { min: 0 });
      const inventory = readNumber(v, "inventory", "Inventory", { min: 0, allowZero: false });
      const days = readNumber(v, "days", "Days", { min: 1 });
      const turns = cogs / inventory;
      return pack([
        item("Inventory turnover", formatNumber(turns, 2), true),
        item("Days of inventory", formatNumber(days / turns, 1)),
      ]);
    },
    formula: "Turnover = COGS / average inventory. Days = period length / turnover.",
    howItWorks: "Turnover says how many times inventory was sold and replaced. Using sales instead of COGS mixes a retail price with a cost and inflates the ratio. Average inventory is usually the opening and closing stock divided by two, not a single day.",
    steps: ["Use COGS for the same period as the inventory average.", "Enter average inventory at cost.", "Read days of inventory as the time stock sits, under that average."],
    example: "480,000 COGS and 80,000 average inventory is a turnover of 6, or about 61 days.",
    faqs: [
      { q: "Is a higher turnover always better?", a: "It can mean lean stock or stockouts. Read it with missed sales, not alone." },
      { q: "What if inventory is seasonal?", a: "A two-point average can miss the peak. Use more points if you have them." },
    ],
    related: ["gross-margin-calculator", "break-even-calculator", "revenue-growth-calculator"],
  },
  {
    slug: "hourly-wage-calculator",
    title: "Hourly wage calculator",
    description: "Convert a salary into an hourly rate, or an hourly rate into a period total.",
    category: "business",
    keywords: ["hourly wage", "salary to hourly", "pay rate"],
    synonyms: ["hourly rate"],
    inputs: [
      { id: "mode", label: "I know", type: "select", defaultValue: "salary", options: [
        { value: "salary", label: "An annual salary" },
        { value: "hourly", label: "An hourly rate" },
      ] },
      { id: "salary", label: "Annual salary", type: "number", defaultValue: "60000", showIf: { field: "mode", equals: "salary" }, required: true, min: 0 },
      { id: "hourly", label: "Hourly rate", type: "number", defaultValue: "30", showIf: { field: "mode", equals: "hourly" }, required: true, min: 0 },
      { id: "hours", label: "Hours per week", type: "number", defaultValue: "40", required: true, min: 1, max: 80 },
      { id: "weeks", label: "Paid weeks per year", type: "number", defaultValue: "52", required: true, min: 1, max: 52 },
    ],
    compute: (v) => {
      const hours = readNumber(v, "hours", "Hours", { min: 1, max: 80 });
      const weeks = readNumber(v, "weeks", "Weeks", { min: 1, max: 52 });
      if (v.mode === "hourly") {
        const hourly = readNumber(v, "hourly", "Hourly rate", { min: 0 });
        return pack([item("Annual pay", money(hourly * hours * weeks), true), item("Weekly pay", money(hourly * hours))]);
      }
      const salary = readNumber(v, "salary", "Salary", { min: 0 });
      const hourly = salary / (hours * weeks);
      return pack([item("Hourly rate", money(hourly), true), item("Weekly pay", money(salary / weeks)), item("Paid hours", formatNumber(hours * weeks, 0))]);
    },
    formula: "Hourly = annual salary / (hours per week × paid weeks).",
    howItWorks: "A salary hides the hour count. Dividing by 2,080 assumes 40 hours and 52 weeks. If unpaid leave reduces paid weeks, the hourly equivalent of the same salary rises. This page makes that denominator visible.",
    steps: ["Choose salary or hourly.", "Set the hours you actually work or are paid for.", "Use paid weeks, not calendar weeks, if some weeks are unpaid."],
    example: "60,000 over 40 hours and 52 weeks is about 28.85 an hour.",
    faqs: [
      { q: "Does this include overtime?", a: "No. It spreads the salary across the hours you enter. Overtime premiums need a separate line." },
      { q: "Are taxes deducted?", a: "No. This is a gross conversion." },
    ],
    related: ["freelance-rate-calculator", "salary-calculator", "time-duration-calculator"],
  },
  {
    slug: "freelance-rate-calculator",
    title: "Freelance rate calculator",
    description: "Build an hourly and day rate from income, expenses, tax, and billable time.",
    category: "business",
    keywords: ["freelance rate", "day rate", "billable hours"],
    synonyms: ["consulting rate"],
    inputs: [
      { id: "income", label: "Desired annual take-home", type: "number", defaultValue: "60000", required: true, min: 0 },
      { id: "expenses", label: "Business expenses", type: "number", defaultValue: "8000", required: true, min: 0 },
      { id: "tax", label: "Tax and reserve share", type: "number", unit: "%", defaultValue: "25", required: true, min: 0, max: 60 },
      { id: "weeks", label: "Working weeks", type: "number", defaultValue: "46", required: true, min: 1, max: 52 },
      { id: "hours", label: "Billable hours per week", type: "number", defaultValue: "25", required: true, min: 1, max: 60 },
      { id: "day", label: "Hours in a billed day", type: "number", defaultValue: "7", required: true, min: 1, max: 12 },
    ],
    compute: (v) => {
      const income = readNumber(v, "income", "Income", { min: 0 });
      const expenses = readNumber(v, "expenses", "Expenses", { min: 0 });
      const tax = readNumber(v, "tax", "Tax share", { min: 0, max: 60 }) / 100;
      if (tax >= 1) throw new InputError("The tax share must be below 100%.");
      const weeks = readNumber(v, "weeks", "Weeks", { min: 1, max: 52 });
      const hours = readNumber(v, "hours", "Billable hours", { min: 1, max: 60 });
      const day = readNumber(v, "day", "Day length", { min: 1, max: 12 });
      const needed = (income + expenses) / (1 - tax);
      const billable = weeks * hours;
      const hourly = needed / billable;
      return pack([
        item("Hourly rate", money(hourly), true),
        item("Day rate", money(hourly * day)),
        item("Revenue to bill", money(needed)),
        item("Billable hours", formatNumber(billable, 0)),
      ], { notes: ["The tax field is a reserve share of revenue, not a tax calculation. Replace it with advice for your jurisdiction."] });
    },
    formula: "Revenue needed = (take-home + expenses) / (1 − tax share). Hourly = revenue / billable hours.",
    howItWorks: "A freelance rate has to fund leave, admin, expenses, and tax as well as the desired income. Using every working hour as billable underprices the work. This page asks for billable hours only, which is why 25 is the default rather than 40.",
    steps: ["Enter the take-home you want and the business costs you must pay.", "Set a tax reserve you can defend. This is not the income-tax calculator.", "Count only hours you can invoice."],
    example: "60,000 take-home, 8,000 expenses, and a 25% reserve require about 90,667 of billings. Over 46 × 25 hours that is about 79 an hour.",
    faqs: [
      { q: "Why not divide salary by 2,000 hours?", a: "Because freelancers are not paid for every hour, and the employer is not covering leave and tax." },
      { q: "Should I publish this rate?", a: "It is a floor for planning. A quote can be higher. Quoting below it means the inputs are no longer true." },
    ],
    related: ["hourly-wage-calculator", "invoice-tax-calculator", "break-even-calculator"],
  },
  {
    slug: "invoice-tax-calculator",
    title: "Invoice tax calculator",
    description: "Build an invoice total from a subtotal, a discount, a tax rate, and shipping.",
    category: "business",
    keywords: ["invoice", "invoice tax", "subtotal"],
    synonyms: ["bill calculator"],
    inputs: [
      { id: "subtotal", label: "Subtotal", type: "number", defaultValue: "1500", required: true, min: 0 },
      { id: "discount", label: "Discount", type: "number", unit: "%", defaultValue: "0", required: true, min: 0, max: 100 },
      { id: "tax", label: "Tax", type: "number", unit: "%", defaultValue: "18", required: true, min: 0 },
      { id: "shipping", label: "Shipping", type: "number", defaultValue: "0", required: true, min: 0 },
      { id: "shipTax", label: "Tax shipping?", type: "select", defaultValue: "no", options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
      ] },
    ],
    compute: (v) => {
      const subtotal = readNumber(v, "subtotal", "Subtotal", { min: 0 });
      const discount = readNumber(v, "discount", "Discount", { min: 0, max: 100 }) / 100;
      const taxRate = readNumber(v, "tax", "Tax", { min: 0 }) / 100;
      const shipping = readNumber(v, "shipping", "Shipping", { min: 0 });
      const discounted = subtotal * (1 - discount);
      const taxable = discounted + (v.shipTax === "yes" ? shipping : 0);
      const tax = taxable * taxRate;
      const total = discounted + shipping + tax;
      return pack([
        item("Invoice total", money(total), true),
        item("After discount", money(discounted)),
        item("Tax", money(tax)),
        item("Shipping", money(shipping)),
      ]);
    },
    formula: "Taxable base = subtotal × (1 − discount) + taxable shipping. Total = base + non-taxed shipping + tax.",
    howItWorks: "An invoice should show the discount before the tax if the tax is charged on the discounted amount. Shipping is taxed only if you say so, because that rule is not universal. The page does not create a legal invoice; it calculates the lines.",
    steps: ["Enter the sum of line items.", "Apply the discount percent.", "Choose whether shipping is inside the tax base."],
    example: "A 1,500 subtotal with no discount and 18% tax is 1,770 before shipping.",
    faqs: [
      { q: "Can I list several tax rates?", a: "Not on one base. Split the invoice and add the totals if lines have different rates." },
      { q: "Is this a GST invoice?", a: "It can use a GST rate, but it does not print GSTIN fields or a CGST/SGST split. Use the GST calculator for the split." },
    ],
    related: ["gst-calculator", "vat-calculator", "sales-tax-calculator"],
  },
];
