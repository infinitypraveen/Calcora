export interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export interface Article {
  slug: string;
  title: string;
  description: string;
  category: string;
  updated: string;
  calculators: string[];
  sections: ArticleSection[];
}

export const articles: Article[] = [
  {
    slug: "how-emi-is-calculated",
    title: "How EMI is calculated",
    description: "The reducing-balance formula behind a fixed monthly instalment, and the assumptions a lender may not share.",
    category: "Finance",
    updated: "2026-03-21",
    calculators: ["emi-calculator", "home-loan-calculator", "amortization-schedule-calculator"],
    sections: [
      {
        heading: "What the payment is trying to do",
        paragraphs: [
          "An equated monthly instalment is the fixed payment that pays interest and principal so the balance reaches zero at the end of the term. The payment stays flat. The split inside it does not. Early months are mostly interest because the balance is largest then.",
          "The standard formula uses a monthly rate, which is the annual nominal rate divided by 12 and by 100. If the annual rate is 9%, the monthly rate is 0.0075. For a principal P and n months, EMI = P × r × (1+r)^n / ((1+r)^n − 1). If the rate is zero, the payment is simply P / n.",
        ],
      },
      {
        heading: "A worked number",
        paragraphs: [
          "Borrow ₹10,00,000 at 9% for 20 years, which is 240 months. The formula gives an EMI of about ₹8,997. Multiply by 240 and subtract the principal and the interest is about ₹11.59 lakh. A smaller EMI from a longer tenure is not automatically cheaper. It is often the opposite.",
          "A flat-rate quote is a different product. Flat interest is calculated on the original principal for the whole term, then split into instalments. The same headline rate costs more than the reducing-balance EMI on this site. Ask which method the offer uses before comparing two numbers.",
        ],
      },
      {
        heading: "What the formula leaves out",
        paragraphs: [
          "Fees, insurance, a moratorium, and a floating rate are not inside the basic formula. A prepayment reduces the balance and usually the interest, but a lender may charge for it or may cut the EMI instead of the tenure. The amortization page on this site applies a regular extra payment to principal and shortens the schedule. That is one policy, not every policy.",
          "Rounding is another quiet difference. A bank may round each instalment to a rupee and adjust the last payment. A gap of a few rupees is not evidence that the formula is wrong.",
        ],
      },
    ],
  },
  {
    slug: "bmi-formula-and-limitations",
    title: "BMI formula and limitations",
    description: "How body mass index is calculated, what the adult ranges mean, and why the number is not a diagnosis.",
    category: "Health",
    updated: "2026-03-21",
    calculators: ["bmi-calculator", "waist-to-height-calculator", "body-fat-calculator"],
    sections: [
      {
        heading: "The arithmetic is the easy part",
        paragraphs: [
          "BMI is weight in kilograms divided by height in metres squared. A person who weighs 68 kg and is 1.68 m tall has a BMI of 68 / 1.68², about 24.1. The adult World Health Organization bands often cited are under 18.5, 18.5 to 24.9, 25 to 29.9, and 30 or above.",
          "Those bands are screening cut-offs for populations. They were not built as a personal diagnosis, and they were not built for children, pregnancy, or many athletes. The formula itself does not contain age, muscle, or fat.",
        ],
      },
      {
        heading: "What the number cannot see",
        paragraphs: [
          "Two people with the same BMI can have different amounts of muscle, bone, and fat. A waist measurement, or a waist-to-height ratio, looks at a different question and has its own limits. A circumference equation such as the US Navy method is still an estimate, not a scan.",
          "A high or low BMI is a reason to ask a better question, not a verdict. Illness, medication, and ageing change what a weight means. This site’s health tools say that on the page because a clean number is easy to over-read.",
        ],
      },
      {
        heading: "How to use the calculator",
        paragraphs: [
          "Enter kilograms and centimetres, or convert first. Do not mix pounds with centimetres. Read the category as a label for the adult cut-offs, then read the limitation. If you are making a decision about diet, training, or medicine, the right next step is a clinician, not a second website.",
        ],
      },
    ],
  },
  {
    slug: "sip-returns-explained",
    title: "SIP returns explained",
    description: "What the SIP future-value formula assumes, and why a smooth 12% is not a fund’s promise.",
    category: "Finance",
    updated: "2026-03-21",
    calculators: ["sip-calculator", "step-up-sip-calculator", "cagr-calculator"],
    sections: [
      {
        heading: "The formula",
        paragraphs: [
          "A systematic investment plan, in the calculator sense, is a monthly amount compounded at a constant rate. With a monthly rate i and n months, the future value used here is P × [((1+i)^n − 1) / i] × (1+i). The final (1+i) treats each contribution as made at the start of the month.",
          "₹10,000 a month for 10 years at a constant 12% becomes about ₹23.23 lakh. You would have invested ₹12 lakh. The gap is the assumption, not a result the market owes you.",
        ],
      },
      {
        heading: "What a constant rate hides",
        paragraphs: [
          "Markets do not return 1% every month. A fund that averages 12% can spend years below that path and years above it. The order of those years matters if you are withdrawing, and it matters less in a simple accumulation formula. Either way, the calculator is a comparison tool. Change the rate and see how the picture moves.",
          "Expenses matter too. A 12% gross assumption with a 1% expense ratio is not a 12% input. The mutual-fund page subtracts an expense ratio you type. It still does not forecast a scheme.",
        ],
      },
      {
        heading: "SIP, step-up, and XIRR",
        paragraphs: [
          "A step-up SIP raises the monthly amount once a year. Later, larger contributions have less time to compound, so you cannot replace them with the final amount. If you already have a statement with irregular dates, CAGR between two totals is the wrong tool. XIRR uses each cash flow and its date.",
          "None of these pages is a recommendation to invest. They show arithmetic under assumptions you can edit.",
        ],
      },
    ],
  },
  {
    slug: "percentage-calculation-examples",
    title: "Percentage calculation examples",
    description: "Three percentage questions that look alike and are not: a share, a ratio, and a change.",
    category: "Everyday",
    updated: "2026-03-21",
    calculators: ["percentage-calculator", "percentage-change-calculator", "discount-calculator"],
    sections: [
      {
        heading: "A share of a total",
        paragraphs: [
          "“What is 18% of 2,500?” means 18/100 × 2,500, which is 450. The 2,500 is the base. The 18 is the rate. Swap them and you have asked a different question.",
        ],
      },
      {
        heading: "A ratio written as a percent",
        paragraphs: [
          "“450 is what percent of 2,500?” is 450/2,500 × 100, which is 18%. The denominator is the reference, not the part. A result over 100% is allowed. 150 is 150% of 100. That is arithmetic, not an error.",
        ],
      },
      {
        heading: "A change",
        paragraphs: [
          "A rise from 80 to 100 is (100 − 80) / 80 × 100, a 25% increase. A fall from 100 to 80 is a 20% decrease. The percentages differ because the base differs. Percentage points are another language: a rate moving from 10% to 12% has risen by 2 percentage points and by 20% relative to the old rate.",
          "Discounts are a decrease from a price. Twenty percent off and then ten percent off is not thirty percent off, because the second cut applies to the reduced price. The retail discount page shows the equivalent single discount.",
        ],
      },
    ],
  },
  {
    slug: "gst-inclusive-prices",
    title: "How to calculate GST-inclusive prices",
    description: "Add GST to a net price, extract it from a gross price, and keep margin out of the tax.",
    category: "Finance",
    updated: "2026-03-21",
    calculators: ["gst-calculator", "gst-price-calculator", "invoice-tax-calculator"],
    sections: [
      {
        heading: "Exclusive and inclusive",
        paragraphs: [
          "If a price is exclusive, GST is price × rate. At 18%, ₹1,000 becomes ₹1,180. If a price is inclusive, the taxable value is price / (1 + rate). ₹1,180 inclusive at 18% contains ₹180 of GST, not 18% of 1,180.",
          "Multiplying an inclusive price by the rate is the usual mistake. It treats tax as if it were charged on tax.",
        ],
      },
      {
        heading: "The split",
        paragraphs: [
          "On an ordinary intra-state supply, the GST amount is split equally into CGST and SGST. An inter-state supply is shown as IGST. This site does not look up an HSN code. You choose the rate. Public summaries of the September 2025 GST changes describe many items moving away from 12% and 28%. Those rates remain selectable so an older invoice can still be checked. Confirm the rate that applies to the actual supply.",
        ],
      },
      {
        heading: "Pricing without calling tax profit",
        paragraphs: [
          "A margin belongs on the tax-exclusive price. One clean sequence is: start from cost, apply the margin to get the exclusive price, then add GST. A 500 cost, a 20% margin, and 18% GST become an exclusive price of 625 and an inclusive price of 737.50. The GST is not part of the 125 profit.",
        ],
      },
    ],
  },
  {
    slug: "how-compound-interest-works",
    title: "How compound interest works",
    description: "Why frequency changes the effective rate, and how simple interest differs.",
    category: "Finance",
    updated: "2026-03-21",
    calculators: ["compound-interest-calculator", "simple-interest-calculator", "fd-calculator"],
    sections: [
      {
        heading: "Interest on interest",
        paragraphs: [
          "Simple interest pays only on the original principal: I = P × r × t. Compound interest adds each interest credit to the balance, so later credits are larger. The amount is P × (1 + r/n)^(n×t), where n is the number of compounds per year.",
          "₹1,00,000 at 8% for 5 years is ₹1,40,000 with simple interest. Compounded quarterly it is about ₹1,48,595. The gap is the interest that itself earned interest.",
        ],
      },
      {
        heading: "Nominal and effective",
        paragraphs: [
          "An 8% rate compounded quarterly is not an 8% effective annual rate. The effective rate is (1 + 0.08/4)^4 − 1, about 8.24%. Comparing a quarterly deposit with a yearly deposit on the nominal rate alone is an unfair comparison. The interest calculator shows both.",
          "Over long periods the exponent dominates the starting amount. That is also why a wrong rate assumption dominates a long projection. A retirement sketch that quietly uses 12% after inflation has assumed a lot.",
        ],
      },
      {
        heading: "Deposits are not the formula alone",
        paragraphs: [
          "A cumulative fixed deposit is close to the compound formula if you match the frequency. A recurring deposit is a series of deposits, so the lump-sum formula overstates it. Tax can reduce what you keep. None of the default rates on this site is a bank’s current card rate. They are inputs.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string | undefined): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
