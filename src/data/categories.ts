import type { CategoryId } from "./types";

export interface Category {
  id: CategoryId;
  name: string;
  short: string;
  description: string;
  blurb: string;
}

export const categories: Category[] = [
  {
    id: "general",
    name: "General & everyday",
    short: "Everyday",
    description: "Percentages, dates, units, averages, and number conversions for daily questions.",
    blurb: "Turn a date, a ratio, or a unit into a number you can check.",
  },
  {
    id: "health",
    name: "Health & fitness",
    short: "Health",
    description: "BMI, calories, pace, heart-rate zones, and pregnancy calendars, with clear limits.",
    blurb: "Screening estimates with the formula and the reason it is not a diagnosis.",
  },
  {
    id: "finance",
    name: "Finance & banking",
    short: "Finance",
    description: "Loans, SIP, interest, salary, GST, and tax estimators with editable assumptions.",
    blurb: "See the schedule and the assumption, not just a single unexplained figure.",
  },
  {
    id: "math",
    name: "Mathematics & education",
    short: "Maths",
    description: "Equations, statistics, geometry, sequences, and a local expression evaluator.",
    blurb: "School and college calculations with the working written out.",
  },
  {
    id: "business",
    name: "Business & marketing",
    short: "Business",
    description: "Margins, discounts, CAC, ROI, break-even, and invoice tax for operators.",
    blurb: "Pricing and marketing maths you can explain to a client or a co-founder.",
  },
  {
    id: "home",
    name: "Home & construction",
    short: "Home",
    description: "Paint, tile, concrete, electricity, solar sizing, and land-area conversions.",
    blurb: "Planning quantities for a room or a small site, with waste factors shown.",
  },
  {
    id: "tech",
    name: "Technology & developer tools",
    short: "Technology",
    description: "Subnets, hashes, JSON, colour, storage units, and other local developer utilities.",
    blurb: "Utilities that run in the browser. Passwords and private text are not uploaded.",
  },
  {
    id: "lifestyle",
    name: "Lifestyle & fun",
    short: "Lifestyle",
    description: "Tips, trip costs, countdowns, and clearly labelled entertainment tools.",
    blurb: "Practical life maths, plus a few tools that are games rather than science.",
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}
