import { daysBetween, formatLongDate, parseISODate } from "@/lib/dates";
import { formatNumber, InputError, readNumber } from "@/lib/format";
import { caloriesFromMet } from "@/lib/health";
import { ENTERTAINMENT_DISCLAIMER, HEALTH_DISCLAIMER, item, pack, type CalcDef } from "../types";

function pickIndex(count: number): number {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / count) * count;
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return value % count;
}

function hashNames(a: string, b: string): number {
  const key = [a, b].map((s) => s.trim().toLowerCase()).sort().join("|");
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const lifestyleCalcs: CalcDef[] = [
  {
    slug: "love-compatibility-calculator",
    title: "Love compatibility calculator",
    description: "A stable, entertainment-only name score. It is not a measure of a relationship.",
    category: "lifestyle",
    keywords: ["love calculator", "compatibility", "name score"],
    synonyms: ["love test"],
    disclaimer: ENTERTAINMENT_DISCLAIMER,
    inputs: [
      { id: "a", label: "First name", type: "text", defaultValue: "Ada", required: true },
      { id: "b", label: "Second name", type: "text", defaultValue: "Alan", required: true },
    ],
    compute: (v) => {
      const a = (v.a || "").trim();
      const b = (v.b || "").trim();
      if (a.length < 2 || b.length < 2) throw new InputError("Enter two names of at least two letters.");
      const score = hashNames(a, b) % 101;
      const line = score > 80 ? "The letters overlap more than most pairs in this toy." : score > 50 ? "A middling toy score, which is all it is." : "A low toy score. It says nothing about the people.";
      return pack([item("Entertainment score", `${score} / 100`, true), item("Note", line)], { notes: ["The score is a hash of the two names, so it does not change if you swap the order. It is not science, not advice, and not a reason to treat anyone differently."] });
    },
    formula: "A FNV-style hash of the sorted, lower-cased names, reduced to 0–100.",
    howItWorks: "Name compatibility tests on the web are games. This one is labelled as a game and uses a published-style hash so the number is stable rather than a new random draw each visit. Stability is not validity.",
    steps: ["Enter two names.", "Read the score as a toy.", "Do not use it to judge a person or a relationship."],
    example: "Ada and Alan produce the same score in either order. The number is entertainment.",
    faqs: [
      { q: "Is a high score meaningful?", a: "No. It means the hash landed high. It does not describe affection, compatibility, or the future." },
      { q: "Why is it the same every time?", a: "So it is obviously a function of the names, not a fortune that changes when you refresh." },
    ],
    related: ["decision-picker", "random-name-picker", "anniversary-calculator"],
  },
  {
    slug: "random-name-picker",
    title: "Random name picker",
    description: "Pick one or more names from a list you paste. The draw stays in the browser.",
    category: "lifestyle",
    keywords: ["random name", "name picker", "raffle"],
    synonyms: ["pick a name"],
    live: false,
    submitLabel: "Pick",
    inputs: [
      { id: "names", label: "Names", type: "textarea", defaultValue: "Amina\nBen\nChioma\nDiego", required: true, rows: 6, help: "One name per line." },
      { id: "count", label: "How many", type: "number", defaultValue: "1", required: true, min: 1, max: 20 },
    ],
    compute: (v) => {
      const names = (v.names || "").split(/\n/).map((n) => n.trim()).filter(Boolean);
      if (names.length < 2) throw new InputError("Enter at least two names.");
      const count = readNumber(v, "count", "Count", { min: 1, max: 20, integer: true });
      if (count > names.length) throw new InputError("You asked for more names than the list contains.");
      const pool = [...names];
      const picked: string[] = [];
      while (picked.length < count) {
        const index = pickIndex(pool.length);
        picked.push(pool.splice(index, 1)[0]);
      }
      return pack([item(count === 1 ? "Picked" : "Picked", picked.join(", "), true)], { notes: ["The draw uses the browser’s cryptographic random source and does not store the names."] });
    },
    formula: "Each remaining name is equally likely. Names are drawn without replacement.",
    howItWorks: "A fair picker should not favour the first or last line. This one uses rejection sampling so the remainder operation does not bias the draw. It is suitable for a classroom raffle, not for a regulated lottery.",
    steps: ["Paste one name per line.", "Choose how many to draw.", "Press Pick again for a new draw."],
    example: "Four names and a count of 1 returns one of them, with no name stored afterwards.",
    faqs: [
      { q: "Can the same name be picked twice?", a: "Not in one draw. A new press can pick anyone again." },
      { q: "Are the names saved?", a: "No." },
    ],
    related: ["decision-picker", "random-number-generator", "love-compatibility-calculator"],
  },
  {
    slug: "decision-picker",
    title: "Decision picker",
    description: "Choose one option at random from a list. Useful when the options are genuinely equal, not when they are not.",
    category: "lifestyle",
    keywords: ["decision", "random choice", "picker"],
    synonyms: ["what should I do"],
    live: false,
    submitLabel: "Choose",
    disclaimer: "A random pick is not advice. Do not use it for a medical, legal, financial, or safety decision.",
    inputs: [{ id: "options", label: "Options", type: "textarea", defaultValue: "Walk\nRead\nCall a friend", required: true, rows: 6 }],
    compute: (v) => {
      const options = (v.options || "").split(/\n/).map((n) => n.trim()).filter(Boolean);
      if (options.length < 2) throw new InputError("Enter at least two options.");
      const choice = options[pickIndex(options.length)];
      return pack([item("Picked", choice, true)], { notes: ["If one option is clearly better, this tool is the wrong tool. It only breaks a tie you have already accepted."] });
    },
    formula: "One line is chosen uniformly from the non-empty lines.",
    howItWorks: "Random choice is a way to stop deliberating when the options are interchangeable. It does not weigh consequences. The disclaimer is part of the result, not a footnote you can ignore for a serious decision.",
    steps: ["List options that you would actually accept.", "Press Choose.", "If you hope for a different answer, the options were not equal. Decide deliberately instead."],
    example: "Walk, Read, and Call a friend are three equally likely lines.",
    faqs: [
      { q: "Can it weigh options?", a: "No. Weighted choice would pretend the page understands your priorities." },
      { q: "Is the result stored?", a: "No." },
    ],
    related: ["random-name-picker", "random-number-generator", "love-compatibility-calculator"],
  },
  {
    slug: "tip-calculator",
    title: "Tip calculator",
    description: "Calculate a tip, the total, and an equal share per person.",
    category: "lifestyle",
    keywords: ["tip", "gratuity", "restaurant bill"],
    synonyms: ["tip percent"],
    inputs: [
      { id: "bill", label: "Bill", type: "number", defaultValue: "86.40", required: true, min: 0 },
      { id: "tip", label: "Tip", type: "number", unit: "%", defaultValue: "15", required: true, min: 0, max: 100 },
      { id: "people", label: "People", type: "number", defaultValue: "2", required: true, min: 1, max: 100 },
    ],
    compute: (v) => {
      const bill = readNumber(v, "bill", "Bill", { min: 0 });
      const tipPct = readNumber(v, "tip", "Tip", { min: 0, max: 100 }) / 100;
      const people = readNumber(v, "people", "People", { min: 1, max: 100, integer: true });
      const tip = bill * tipPct;
      const total = bill + tip;
      return pack([
        item("Tip", formatNumber(tip, 2), true),
        item("Total", formatNumber(total, 2)),
        item("Per person", formatNumber(total / people, 2)),
      ]);
    },
    formula: "Tip = bill × rate. Total = bill + tip. Share = total / people.",
    howItWorks: "A tip percentage is applied to the bill you enter. If tax should be excluded, subtract it before entering the bill. The split is equal. Unequal shares belong on the shared-expense page.",
    steps: ["Enter the amount you want to tip on.", "Choose a percentage. Customs differ by country.", "Divide by the number of people if you are splitting equally."],
    example: "15% of 86.40 is 12.96. Two people pay 49.68 each.",
    faqs: [
      { q: "Should I tip on tax?", a: "Customs differ. Enter the base you intend to use. The page does not remove tax automatically." },
      { q: "Can I round up?", a: "Add a little to the bill or use the rounding calculator on the per-person figure." },
    ],
    related: ["bill-splitter", "shared-expense-calculator", "percentage-calculator"],
  },
  {
    slug: "bill-splitter",
    title: "Bill splitter",
    description: "Split a bill that has tax and a tip, equally among a group.",
    category: "lifestyle",
    keywords: ["split bill", "share of bill", "group bill"],
    synonyms: ["bill split"],
    inputs: [
      { id: "subtotal", label: "Subtotal", type: "number", defaultValue: "120", required: true, min: 0 },
      { id: "tax", label: "Tax", type: "number", unit: "%", defaultValue: "8", required: true, min: 0 },
      { id: "tip", label: "Tip", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
      { id: "people", label: "People", type: "number", defaultValue: "3", required: true, min: 1 },
      { id: "tipBase", label: "Tip is calculated on", type: "select", defaultValue: "after", options: [
        { value: "after", label: "Subtotal plus tax" },
        { value: "before", label: "Subtotal only" },
      ] },
    ],
    compute: (v) => {
      const subtotal = readNumber(v, "subtotal", "Subtotal", { min: 0 });
      const tax = subtotal * (readNumber(v, "tax", "Tax", { min: 0 }) / 100);
      const tipBase = v.tipBase === "before" ? subtotal : subtotal + tax;
      const tip = tipBase * (readNumber(v, "tip", "Tip", { min: 0 }) / 100);
      const people = readNumber(v, "people", "People", { min: 1, integer: true });
      const total = subtotal + tax + tip;
      return pack([
        item("Each person", formatNumber(total / people, 2), true),
        item("Tax", formatNumber(tax, 2)),
        item("Tip", formatNumber(tip, 2)),
        item("Total", formatNumber(total, 2)),
      ]);
    },
    formula: "Total = subtotal + tax + tip. Share = total / people.",
    howItWorks: "The only judgement in a splitter is what the tip is calculated on. This page lets you choose subtotal or subtotal plus tax, then divides the full total equally. It does not track who ordered what.",
    steps: ["Enter the pre-tip subtotal.", "Enter tax and tip percentages.", "Choose the tip base the table agreed on."],
    example: "120 plus 8% tax is 129.60. A 10% tip on that is 12.96. Three people pay 47.52 each.",
    faqs: [
      { q: "What if people ordered different amounts?", a: "Use the shared-expense calculator and enter each share." },
      { q: "Does it round to the cent?", a: "It shows two decimals. A cash split may need a one-cent adjustment so the parts add up." },
    ],
    related: ["tip-calculator", "shared-expense-calculator", "invoice-tax-calculator"],
  },
  {
    slug: "shared-expense-calculator",
    title: "Shared expense calculator",
    description: "Split a cost equally, or check custom shares against the total.",
    category: "lifestyle",
    keywords: ["shared expense", "split cost", "who owes"],
    synonyms: ["expense split"],
    inputs: [
      { id: "total", label: "Total", type: "number", defaultValue: "240", required: true, min: 0 },
      { id: "people", label: "People", type: "number", defaultValue: "4", required: true, min: 1 },
      { id: "shares", label: "Custom shares", type: "textarea", rows: 4, help: "Optional. One amount per line. Leave blank for an equal split." },
    ],
    compute: (v) => {
      const total = readNumber(v, "total", "Total", { min: 0 });
      const people = readNumber(v, "people", "People", { min: 1, integer: true });
      const lines = (v.shares || "").split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        return pack([item("Each person", formatNumber(total / people, 2), true), item("People", formatNumber(people, 0))]);
      }
      const shares = lines.map((line, i) => {
        const n = Number(line);
        if (!Number.isFinite(n) || n < 0) throw new InputError(`Share ${i + 1} is not a valid amount.`);
        return n;
      });
      const sum = shares.reduce((s, n) => s + n, 0);
      if (Math.abs(sum - total) > 0.05) throw new InputError(`The shares add up to ${formatNumber(sum, 2)}, not the total of ${formatNumber(total, 2)}.`);
      return pack(shares.map((share, i) => item(`Person ${i + 1}`, formatNumber(share, 2), i === 0)), { notes: ["Custom shares must add up to the total. The page checks that instead of silently rescaling."] });
    },
    formula: "Equal share = total / people. Custom shares are accepted only when they sum to the total.",
    howItWorks: "An equal split is one division. A custom split is a list that must reconcile. Rescaling a wrong list would hide an arithmetic mistake, so this page reports the gap instead.",
    steps: ["Enter the total.", "Leave shares blank for an equal split.", "Or enter one amount per person and fix the list until it matches the total."],
    example: "240 split four ways is 60 each.",
    faqs: [
      { q: "Can shares be percentages?", a: "Enter amounts. Convert percentages first so the reconciliation is in money." },
      { q: "What if someone already paid?", a: "Enter what each person should bear. Settling who paid whom is a separate subtraction." },
    ],
    related: ["bill-splitter", "tip-calculator", "average-calculator"],
  },
  {
    slug: "fuel-cost-calculator",
    title: "Fuel cost calculator",
    description: "Estimate fuel cost from distance, efficiency, and price per litre.",
    category: "lifestyle",
    keywords: ["fuel cost", "petrol cost", "mileage"],
    synonyms: ["gas cost"],
    inputs: [
      { id: "distance", label: "Distance", type: "number", unit: "km", defaultValue: "450", required: true, min: 0 },
      { id: "efficiency", label: "Efficiency", type: "number", unit: "km/L", defaultValue: "15", required: true, min: 0.1 },
      { id: "price", label: "Price", type: "number", unit: "per litre", defaultValue: "100", required: true, min: 0 },
      { id: "people", label: "People sharing", type: "number", defaultValue: "1", required: true, min: 1 },
    ],
    compute: (v) => {
      const distance = readNumber(v, "distance", "Distance", { min: 0 });
      const efficiency = readNumber(v, "efficiency", "Efficiency", { min: 0.1 });
      const price = readNumber(v, "price", "Price", { min: 0 });
      const people = readNumber(v, "people", "People", { min: 1, integer: true });
      const litres = distance / efficiency;
      const cost = litres * price;
      return pack([
        item("Fuel cost", formatNumber(cost, 2), true),
        item("Litres", formatNumber(litres, 2)),
        item("Per person", formatNumber(cost / people, 2)),
      ]);
    },
    formula: "Litres = distance / km per litre. Cost = litres × price.",
    howItWorks: "Fuel cost is distance divided by efficiency, times price. Real consumption changes with speed, load, and traffic. The result is a planning figure from the efficiency you claim, not a measurement of the trip.",
    steps: ["Enter the driving distance, not the straight-line distance.", "Use the vehicle’s realistic km per litre.", "Update the price. It is an input, not a live fuel price."],
    example: "450 km at 15 km/L uses 30 litres. At 100 per litre the fuel is 3,000.",
    faqs: [
      { q: "How do I enter L/100 km?", a: "Efficiency in km/L is 100 divided by L/100 km. 6 L/100 km is about 16.7 km/L." },
      { q: "Does this include tolls?", a: "No. Add them in the trip cost calculator." },
    ],
    related: ["trip-cost-calculator", "travel-time-calculator", "car-loan-calculator"],
  },
  {
    slug: "trip-cost-calculator",
    title: "Trip cost calculator",
    description: "Add fuel, tolls, lodging, and food into a trip total and a per-person share.",
    category: "lifestyle",
    keywords: ["trip cost", "travel budget", "holiday cost"],
    synonyms: ["vacation cost"],
    inputs: [
      { id: "fuel", label: "Fuel", type: "number", defaultValue: "3000", required: true, min: 0 },
      { id: "tolls", label: "Tolls and tickets", type: "number", defaultValue: "500", required: true, min: 0 },
      { id: "nights", label: "Nights", type: "number", defaultValue: "2", required: true, min: 0 },
      { id: "lodging", label: "Lodging per night", type: "number", defaultValue: "2500", required: true, min: 0 },
      { id: "days", label: "Days of food", type: "number", defaultValue: "3", required: true, min: 0 },
      { id: "food", label: "Food per person per day", type: "number", defaultValue: "800", required: true, min: 0 },
      { id: "people", label: "People", type: "number", defaultValue: "2", required: true, min: 1 },
    ],
    compute: (v) => {
      const people = readNumber(v, "people", "People", { min: 1, integer: true });
      const fuel = readNumber(v, "fuel", "Fuel", { min: 0 });
      const tolls = readNumber(v, "tolls", "Tolls", { min: 0 });
      const lodging = readNumber(v, "nights", "Nights", { min: 0 }) * readNumber(v, "lodging", "Lodging", { min: 0 });
      const food = readNumber(v, "days", "Days", { min: 0 }) * readNumber(v, "food", "Food", { min: 0 }) * people;
      const total = fuel + tolls + lodging + food;
      return pack([
        item("Trip total", formatNumber(total, 2), true),
        item("Per person", formatNumber(total / people, 2)),
        item("Fuel and tolls", formatNumber(fuel + tolls, 2)),
        item("Lodging", formatNumber(lodging, 2)),
        item("Food", formatNumber(food, 2)),
      ]);
    },
    formula: "Total = fuel + tolls + nights × lodging + days × food × people.",
    howItWorks: "A trip budget is a sum of categories you can actually estimate. This page keeps fuel, lodging, and food separate so a cheap fare does not hide an expensive hotel. It does not include insurance, shopping, or a contingency unless you add them to a category.",
    steps: ["Get fuel from the fuel calculator if you have not already.", "Enter lodging per night for the room, not per person, unless that is how you pay.", "Food is per person, so it scales with the group."],
    example: "Two people, 3,000 fuel, 500 tolls, two nights at 2,500, and three days of food at 800 each, total 10,300.",
    faqs: [
      { q: "Is lodging split already?", a: "The lodging line is the room cost you entered times nights. The per-person line splits the whole trip." },
      { q: "Where is a contingency?", a: "Add a percentage with the percentage calculator after you have a base total." },
    ],
    related: ["fuel-cost-calculator", "travel-time-calculator", "shared-expense-calculator"],
  },
  {
    slug: "travel-time-calculator",
    title: "Travel distance and speed calculator",
    description: "Find time from distance and speed, or distance from time and speed.",
    category: "lifestyle",
    keywords: ["travel time", "driving time", "distance speed"],
    synonyms: ["eta calculator"],
    inputs: [
      { id: "mode", label: "Find", type: "select", defaultValue: "time", options: [
        { value: "time", label: "Time from distance and speed" },
        { value: "distance", label: "Distance from time and speed" },
      ] },
      { id: "distance", label: "Distance", type: "number", unit: "km", defaultValue: "240", showIf: { field: "mode", equals: "time" }, required: true, min: 0 },
      { id: "speed", label: "Average speed", type: "number", unit: "km/h", defaultValue: "60", required: true, min: 1 },
      { id: "hours", label: "Hours", type: "number", defaultValue: "4", showIf: { field: "mode", equals: "distance" }, required: true, min: 0 },
    ],
    compute: (v) => {
      const speed = readNumber(v, "speed", "Speed", { min: 1 });
      if (v.mode === "distance") {
        const hours = readNumber(v, "hours", "Hours", { min: 0 });
        return pack([item("Distance", `${formatNumber(speed * hours, 1)} km`, true)]);
      }
      const distance = readNumber(v, "distance", "Distance", { min: 0 });
      const hours = distance / speed;
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return pack([item("Time", `${h} h ${m} min`, true), item("Decimal hours", formatNumber(hours, 2))]);
    },
    formula: "Time = distance / speed. Distance = speed × time.",
    howItWorks: "The result uses the average speed you enter, including stops if you have already reduced the speed to account for them. A speed-limit figure without stops will understate the journey.",
    steps: ["Choose time or distance.", "Use an average speed you have seen on this kind of road.", "Add breaks yourself. They are not guessed."],
    example: "240 km at 60 km/h takes 4 hours.",
    faqs: [
      { q: "Does it include traffic?", a: "Only through the speed you type. There is no live traffic feed." },
      { q: "Can I use miles?", a: "Enter miles and mph and read the number as miles. The labels say km because the default example is metric." },
    ],
    related: ["fuel-cost-calculator", "speed-converter", "pace-calculator"],
  },
  {
    slug: "activity-calorie-calculator",
    title: "Calorie needs by activity calculator",
    description: "Estimate a day’s energy from hours spent at different intensities, using MET values.",
    category: "lifestyle",
    keywords: ["activity calories", "daily activity", "MET day"],
    synonyms: ["calorie needs activity"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true, min: 20, max: 400 },
      { id: "sleep", label: "Sleep", type: "number", unit: "hours", defaultValue: "8", required: true, min: 0, max: 24 },
      { id: "desk", label: "Desk or sitting", type: "number", unit: "hours", defaultValue: "8", required: true, min: 0, max: 24 },
      { id: "walk", label: "Walking", type: "number", unit: "hours", defaultValue: "1", required: true, min: 0, max: 24 },
      { id: "exercise", label: "Moderate exercise", type: "number", unit: "hours", defaultValue: "0.5", required: true, min: 0, max: 24 },
    ],
    compute: (v) => {
      const weight = readNumber(v, "weight", "Weight", { min: 20, max: 400 });
      const blocks = [
        ["Sleep", readNumber(v, "sleep", "Sleep", { min: 0, max: 24 }), 0.95],
        ["Sitting", readNumber(v, "desk", "Sitting", { min: 0, max: 24 }), 1.3],
        ["Walking", readNumber(v, "walk", "Walking", { min: 0, max: 24 }), 3.5],
        ["Exercise", readNumber(v, "exercise", "Exercise", { min: 0, max: 24 }), 6],
      ] as const;
      const hours = blocks.reduce((s, b) => s + b[1], 0);
      if (hours > 24) throw new InputError("The hours add up to more than a day.");
      const rest = 24 - hours;
      let kcal = caloriesFromMet(1.2, weight, rest * 60);
      const rows = blocks.map(([name, h, met]) => {
        const energy = caloriesFromMet(met, weight, h * 60);
        kcal += energy;
        return [name, formatNumber(h, 1), formatNumber(energy, 0)];
      });
      rows.push(["Other light time", formatNumber(rest, 1), formatNumber(caloriesFromMet(1.2, weight, rest * 60), 0)]);
      return pack([item("Estimated day", `${formatNumber(kcal, 0)} kcal`, true)], {
        table: { caption: "Energy by block", headers: ["Block", "Hours", "kcal"], rows },
        notes: ["MET values are averages. This is a day sketch, not a diet. Unused hours are counted as light activity."],
      });
    },
    formula: "kcal = Σ MET × weight × hours, with unused hours at 1.2 MET.",
    howItWorks: "Unlike the TDEE page, which multiplies BMR by one activity factor, this page adds blocks of a day. It is still an estimate. Sleep is near 1 MET, sitting a little higher, walking and exercise higher still. The unused part of the day is not zero.",
    steps: ["Enter weight and the hours you can describe.", "Leave the rest of the day to the light-activity remainder.", "Do not add this total on top of a TDEE. They are alternative sketches."],
    example: "A 68 kg person with 8 hours of sleep, 8 hours sitting, an hour of walking, and half an hour of exercise lands near a typical light-to-moderate day.",
    faqs: [
      { q: "Why is this different from TDEE?", a: "TDEE uses one factor for the whole day. This page uses the hours you describe. Both are estimates." },
      { q: "Should I eat this number?", a: "Not as a prescription. It is a rough energy sketch." },
    ],
    related: ["tdee-calculator", "exercise-calorie-calculator", "daily-calorie-calculator"],
  },
  {
    slug: "savings-challenge-calculator",
    title: "Savings challenge calculator",
    description: "Total a 52-week challenge, its reverse, or a flat monthly save.",
    category: "lifestyle",
    keywords: ["52 week challenge", "savings challenge"],
    synonyms: ["money challenge"],
    inputs: [
      { id: "mode", label: "Challenge", type: "select", defaultValue: "week", options: [
        { value: "week", label: "52-week, increasing" },
        { value: "reverse", label: "52-week, decreasing" },
        { value: "monthly", label: "Fixed monthly amount" },
      ] },
      { id: "increment", label: "Week 1 amount, or monthly amount", type: "number", defaultValue: "10", required: true, min: 0 },
    ],
    compute: (v) => {
      const increment = readNumber(v, "increment", "Amount", { min: 0 });
      if (v.mode === "monthly") {
        return pack([item("Saved in a year", formatNumber(increment * 12, 2), true), item("Per month", formatNumber(increment, 2))]);
      }
      const total = (increment * 52 * 53) / 2;
      const rows = Array.from({ length: 8 }, (_, i) => {
        const week = v.mode === "reverse" ? 52 - i : i + 1;
        return [`Week ${week}`, formatNumber(week * increment, 2)];
      });
      return pack([
        item("Year total", formatNumber(total, 2), true),
        item("Largest week", formatNumber(52 * increment, 2)),
      ], { table: { caption: "First weeks of the pattern", headers: ["Week", "Amount"], rows }, notes: ["The increasing and decreasing challenges total the same. Only the order changes."] });
    },
    formula: "52-week total = increment × 52 × 53 / 2.",
    howItWorks: "The classic challenge saves 1, then 2, then up to 52 units. The sum of the first 52 integers is 1,378, so a 10-unit start saves 13,780. Reversing the order does not change the total. It changes when the large weeks fall.",
    steps: ["Choose the pattern.", "Enter the unit. A unit of 10 means week 1 is 10 in the increasing version.", "Check that the largest week fits the month it lands in."],
    example: "An increment of 10 totals 13,780 over 52 weeks.",
    faqs: [
      { q: "Is the reverse easier?", a: "It starts with the large payments. Some people prefer that; some do not. The mathematics of the total is identical." },
      { q: "Does this include interest?", a: "No. Interest on a small balance would be a rounding error next to the deposits." },
    ],
    related: ["savings-goal-calculator", "sip-calculator", "rd-calculator"],
  },
  {
    slug: "event-countdown",
    title: "Event countdown",
    description: "Count days until a named event, with an optional start date for a progress fraction.",
    category: "lifestyle",
    keywords: ["event countdown", "days to event"],
    synonyms: ["party countdown"],
    inputs: [
      { id: "name", label: "Event", type: "text", defaultValue: "Launch day", required: true },
      { id: "date", label: "Event date", type: "date", defaultValue: "2026-12-01", required: true },
      { id: "from", label: "Count from", type: "date", defaultValue: "2026-03-21", required: true },
      { id: "start", label: "Planning started", type: "date", help: "Optional, for a progress fraction." },
    ],
    compute: (v) => {
      const name = (v.name || "Event").trim();
      const event = parseISODate(v.date || "", "event date");
      const from = parseISODate(v.from || "", "count date");
      const days = daysBetween(from, event);
      const results = [item(name, days >= 0 ? `${formatNumber(days, 0)} days to go` : `${formatNumber(Math.abs(days), 0)} days ago`, true), item("Date", formatLongDate(event))];
      if (v.start) {
        const start = parseISODate(v.start, "start date");
        const span = daysBetween(start, event);
        if (span > 0) results.push(item("Planning elapsed", formatNumber(Math.min(100, Math.max(0, (daysBetween(start, from) / span) * 100)), 0) + "%"));
      }
      return pack(results);
    },
    formula: "Days = event date − count-from date.",
    howItWorks: "A named countdown is the same date arithmetic as the generic countdown, with a label you can read aloud. The optional start date adds a progress fraction so a long plan has a sense of how much calendar has passed.",
    steps: ["Name the event.", "Enter its date and the date you are counting from.", "Add a planning start only if you want the progress line."],
    example: "From 21 March 2026 to 1 December 2026 is 255 days.",
    faqs: [
      { q: "Does it tick every second?", a: "No. It counts calendar days between the dates you enter." },
      { q: "Can the event be in the past?", a: "Yes. The result says how many days ago it was." },
    ],
    related: ["countdown-calculator", "birthday-countdown", "date-calculator"],
  },
  {
    slug: "birthday-countdown",
    title: "Birthday countdown",
    description: "Find the next birthday and how many days remain.",
    category: "lifestyle",
    keywords: ["birthday countdown", "next birthday", "days until birthday"],
    synonyms: ["birthday calculator"],
    inputs: [
      { id: "birth", label: "Date of birth", type: "date", defaultValue: "1998-04-12", required: true },
      { id: "today", label: "Today", type: "date", defaultValue: "2026-03-21", required: true },
    ],
    compute: (v) => {
      const birth = parseISODate(v.birth || "", "date of birth");
      const today = parseISODate(v.today || "", "today");
      let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
      if (next.getMonth() !== birth.getMonth()) next = new Date(next.getFullYear(), next.getMonth(), 0);
      const days = daysBetween(today, next);
      const turning = next.getFullYear() - birth.getFullYear();
      return pack([
        item(days === 0 ? "Today" : "Days until the next birthday", days === 0 ? "It is the birthday" : formatNumber(days, 0), true),
        item("Next birthday", formatLongDate(next)),
        item("Age turning", formatNumber(turning, 0)),
      ]);
    },
    formula: "Next birthday is the birth month and day in the current year, or the next year if that day has passed.",
    howItWorks: "The countdown uses the month and day, not the year of birth, except to say which age is coming. A 29 February birthday is observed on 28 February in a non-leap year so the date exists.",
    steps: ["Enter the date of birth.", "Enter today’s date.", "A zero means the birthday is today."],
    example: "Born 12 April 1998, counted on 21 March 2026, the next birthday is 12 April 2026.",
    faqs: [
      { q: "Do you store the birthday?", a: "No." },
      { q: "What about time zones?", a: "The page uses calendar dates, not a clock time." },
    ],
    related: ["age-calculator", "event-countdown", "anniversary-calculator"],
  },
  {
    slug: "anniversary-calculator",
    title: "Anniversary calculator",
    description: "Find how long two dates have spanned, and when the next anniversary falls.",
    category: "lifestyle",
    keywords: ["anniversary", "years together", "how long ago"],
    synonyms: ["relationship anniversary"],
    inputs: [
      { id: "start", label: "Start date", type: "date", defaultValue: "2019-06-15", required: true },
      { id: "asof", label: "As of", type: "date", defaultValue: "2026-03-21", required: true },
    ],
    compute: (v) => {
      const start = parseISODate(v.start || "", "start date");
      const asOf = parseISODate(v.asof || "", "as-of date");
      if (asOf < start) throw new InputError("The as-of date is before the start date.");
      let years = asOf.getFullYear() - start.getFullYear();
      let months = asOf.getMonth() - start.getMonth();
      let days = asOf.getDate() - start.getDate();
      if (days < 0) {
        months -= 1;
        days += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate();
      }
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      let next = new Date(asOf.getFullYear(), start.getMonth(), start.getDate());
      if (next < asOf) next = new Date(asOf.getFullYear() + 1, start.getMonth(), start.getDate());
      if (next.getMonth() !== start.getMonth()) next = new Date(next.getFullYear(), next.getMonth(), 0);
      return pack([
        item("Together", `${years} years, ${months} months, ${days} days`, true),
        item("Total days", formatNumber(daysBetween(start, asOf), 0)),
        item("Next anniversary", formatLongDate(next)),
        item("Started on", formatLongDate(start)),
      ]);
    },
    formula: "The span is the same calendar difference used by the age calculator: full years, then months, then days.",
    howItWorks: "An anniversary is a date difference with a different story. The page counts completed years, months, and days, and finds the next date with the same month and day. It does not interpret the relationship.",
    steps: ["Enter the start date.", "Enter the date you want the span measured to.", "The next anniversary is the following occurrence of that month and day."],
    example: "15 June 2019 to 21 March 2026 is 6 years, 9 months, and 6 days.",
    faqs: [
      { q: "Does it include the start day?", a: "The years-months-days figure is a completed span. Total days is the gap between the dates." },
      { q: "What if the start was 29 February?", a: "In a non-leap year the next anniversary is shown on 28 February." },
    ],
    related: ["age-calculator", "days-between-dates-calculator", "birthday-countdown"],
  },
];

