import { timeZones, addDays, addMonths, addYears, ageParts, countWorkingDays, daysBetween, durationFromMs, formatISODate, formatInZone, formatLongDate, parseISODate, zonedWallTimeToUtc } from "@/lib/dates";
import { InputError, formatInt, formatNumber, parseNumberList, readNumber, readOptionalNumber } from "@/lib/format";
import { mean, median, modes, range, roundToStep } from "@/lib/mathx";
import { convertBase, formatFraction, fromRoman, numberToWords, parseFraction, simplifyFraction, toFraction, toRoman } from "@/lib/text";
import { convertUnit, dimensions } from "@/lib/units";
import { item, pack, type CalcDef } from "../types";
import { makeUnitCalc } from "./factories";

const zoneOptions = timeZones.map((zone) => ({ value: zone.id, label: zone.label }));

function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (range <= 0) throw new InputError("The maximum must be at least the minimum.");
  const limit = Math.floor(0x1_0000_0000 / range) * range;
  const buf = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(buf);
    value = buf[0];
  } while (value >= limit);
  return min + (value % range);
}

const unitPages: CalcDef[] = [
  makeUnitCalc({
    slug: "length-converter",
    title: "Length converter",
    description: "Convert millimetres, centimetres, metres, kilometres, inches, feet, yards, and miles with exact international factors.",
    dimension: "length",
    keywords: ["length", "cm to inches", "km to miles", "feet to metres"],
    synonyms: ["distance converter", "cm to m"],
    from: "cm",
    to: "in",
    sample: "180",
    formula: "target = value × (from-factor ÷ to-factor), with the metre as the base.",
    howItWorks: "Each length is converted to metres, then into the unit you chose. Inch and foot factors follow the international yard and pound agreement: 1 inch = 25.4 mm exactly.",
    steps: ["Choose the source and target units.", "Multiply by the source factor to reach metres.", "Divide by the target factor."],
    example: "180 cm = 180 × 0.01 / 0.0254 = 70.866 inches.",
    faqs: [
      { q: "Is a mile the statute mile?", a: "Yes. This page uses the international statute mile of 1,609.344 metres, not a nautical mile. Nautical miles are a separate unit." },
      { q: "Why do some answers look long?", a: "The conversion is exact. Display rounding does not change the stored factor. Round the result to the precision your measuring tool can actually support." },
    ],
    related: ["unit-converter", "feet-inches-converter", "area-converter"],
  }),
  makeUnitCalc({
    slug: "weight-converter",
    title: "Weight converter",
    description: "Convert milligrams, grams, kilograms, pounds, ounces, and stone using the international avoirdupois pound.",
    dimension: "weight",
    keywords: ["weight", "kg to lb", "grams to ounces", "stone to kg"],
    synonyms: ["mass converter", "pounds to kilograms"],
    from: "kg",
    to: "lb",
    sample: "70",
    formula: "target = value × (from-factor ÷ to-factor), with the kilogram as the base.",
    howItWorks: "Mass units are converted through the kilogram. One avoirdupois pound is 0.45359237 kg exactly. Stone is 14 pounds. These are mass units; everyday speech often calls them weight.",
    steps: ["Enter the mass.", "Pick the units you have and the units you want.", "Read the converted mass. Round to a sensible number of decimals."],
    example: "70 kg = 70 / 0.45359237 ≈ 154.324 pounds.",
    faqs: [
      { q: "Does this convert cooking ounces to fluid ounces?", a: "No. Ounces here are mass. Fluid ounces are volume and live on the volume converter." },
      { q: "Is a tonne 1,000 kilograms?", a: "Yes. This page uses the metric tonne. It is not the US short ton of 2,000 pounds." },
    ],
    related: ["unit-converter", "bmi-calculator", "volume-converter"],
  }),
  makeUnitCalc({
    slug: "area-converter",
    title: "Area converter",
    description: "Convert square metres, square feet, acres, hectares, and other area units.",
    dimension: "area",
    keywords: ["area", "square feet", "acres", "hectares"],
    synonyms: ["sq ft to sq m", "acre to hectare"],
    from: "ft2",
    to: "m2",
    sample: "1000",
    formula: "target = value × (from-factor ÷ to-factor), with the square metre as the base.",
    howItWorks: "Area factors are the square of the matching length factors. An acre is 4,046.8564224 square metres. A hectare is 10,000 square metres.",
    steps: ["Enter the area.", "Select both units.", "Use the result in quotes and plans, and keep an extra decimal if you will convert again."],
    example: "1,000 square feet × 0.09290304 = 92.90304 square metres.",
    faqs: [
      { q: "Is this the same as the land-area converter?", a: "The factors for international units match. The land-area page adds regional units such as guntha and bigha, which do not have one worldwide definition." },
      { q: "Should I round before ordering flooring?", a: "Round up after adding waste, not before. The flooring calculator does that explicitly." },
    ],
    related: ["square-feet-to-square-metres", "land-area-converter", "room-area-calculator"],
  }),
  makeUnitCalc({
    slug: "volume-converter",
    title: "Volume converter",
    description: "Convert litres, millilitres, cubic metres, US cups, and gallons.",
    dimension: "volume",
    keywords: ["volume", "litres to gallons", "ml to cups", "cubic feet"],
    synonyms: ["capacity converter", "liquid converter"],
    from: "l",
    to: "gal",
    sample: "10",
    formula: "target = value × (from-factor ÷ to-factor), with the cubic metre as the base.",
    howItWorks: "One litre is exactly 0.001 cubic metres. US cups, fluid ounces, and gallons follow US customary definitions. UK gallons are listed separately because they are larger.",
    steps: ["Enter the volume.", "Check whether you need a US or UK gallon.", "Convert, then round to the precision of the container."],
    example: "10 litres ≈ 2.64172 US gallons.",
    faqs: [
      { q: "Why are there two gallons?", a: "A US gallon is 3.785411784 litres. A UK gallon is 4.54609 litres. Mixing them is a common source of recipe and fuel errors." },
      { q: "Are cups exact?", a: "The US legal cup used here is 236.5882365 millilitres. A recipe cup in another country may differ." },
    ],
    related: ["tank-volume-calculator", "unit-converter", "weight-converter"],
  }),
  makeUnitCalc({
    slug: "temperature-converter",
    title: "Temperature converter",
    description: "Convert Celsius, Fahrenheit, and kelvin, including the offset that a simple ratio cannot express.",
    dimension: "temperature",
    keywords: ["temperature", "celsius to fahrenheit", "kelvin"],
    synonyms: ["c to f", "f to c"],
    from: "C",
    to: "F",
    sample: "37",
    formula: "°F = °C × 9/5 + 32. K = °C + 273.15.",
    howItWorks: "Temperature conversion is affine, not a simple scale factor. Zero Celsius is 32 Fahrenheit, and a Celsius degree is larger than a Fahrenheit degree. Kelvin uses the same size degree as Celsius but starts at absolute zero.",
    steps: ["Convert the reading to Celsius if it is not already.", "Apply the target formula.", "Keep one decimal for body or weather readings unless the instrument is more precise."],
    example: "37°C = 37 × 9/5 + 32 = 98.6°F.",
    faqs: [
      { q: "Is 98.6°F the definition of a normal body temperature?", a: "No. 37°C converts to 98.6°F, but healthy body temperature varies by person, time of day, and how it is measured." },
      { q: "Can kelvin be negative?", a: "Not on the absolute scale. A negative kelvin entry is kept only so you can see the arithmetic; it is not a physical temperature." },
    ],
    related: ["unit-converter", "scientific-unit-converter", "energy-converter"],
  }),
  makeUnitCalc({
    slug: "speed-converter",
    title: "Speed converter",
    description: "Convert metres per second, kilometres per hour, miles per hour, and knots.",
    dimension: "speed",
    keywords: ["speed", "km/h to mph", "knots", "pace"],
    synonyms: ["velocity converter", "mph to kmh"],
    from: "kmh",
    to: "mph",
    sample: "100",
    formula: "target = value × (from-factor ÷ to-factor), with metres per second as the base.",
    howItWorks: "One kilometre per hour is 1/3.6 metres per second. A mile per hour is 0.44704 m/s. A knot is one nautical mile per hour, 0.514444 m/s.",
    steps: ["Enter the speed.", "Choose both units.", "For running, the pace calculator is usually clearer than a raw speed."],
    example: "100 km/h = 62.137 mph.",
    faqs: [
      { q: "Is a knot a nautical mile per hour?", a: "Yes. It is not a statute mile per hour." },
      { q: "Does this include wind or current?", a: "No. It converts the number you type. It does not estimate travel time. Use the travel time calculator for distance and speed together." },
    ],
    related: ["pace-calculator", "running-speed-calculator", "travel-time-calculator"],
  }),
  makeUnitCalc({
    slug: "pressure-converter",
    title: "Pressure converter",
    description: "Convert pascals, bar, atmospheres, psi, and millimetres of mercury.",
    dimension: "pressure",
    keywords: ["pressure", "psi", "bar", "mmHg", "kPa"],
    synonyms: ["bar to psi", "blood pressure units"],
    from: "bar",
    to: "psi",
    sample: "1",
    formula: "target = value × (from-factor ÷ to-factor), with the pascal as the base.",
    howItWorks: "One bar is 100,000 pascals exactly. One standard atmosphere is 101,325 pascals. Tyre and engineering pressures are often quoted in bar or psi; clinical blood pressure uses millimetres of mercury.",
    steps: ["Confirm the unit on the gauge.", "Convert through pascals.", "Do not treat a converted blood-pressure number as a medical reading from this page."],
    example: "1 bar = 14.5038 psi.",
    faqs: [
      { q: "Is bar the same as atmosphere?", a: "No. They are close, but 1 bar is about 0.987 atmospheres." },
      { q: "Can I use this for blood pressure?", a: "Only as a unit conversion. It does not interpret whether a reading is healthy." },
    ],
    related: ["scientific-unit-converter", "unit-converter", "energy-converter"],
    category: "math",
  }),
  makeUnitCalc({
    slug: "energy-converter",
    title: "Energy converter",
    description: "Convert joules, calories, kilocalories, watt-hours, and BTU.",
    dimension: "energy",
    keywords: ["energy", "calories to joules", "kWh", "BTU"],
    synonyms: ["kcal to kj", "watt hours"],
    from: "kcal",
    to: "kj",
    sample: "500",
    formula: "target = value × (from-factor ÷ to-factor), with the joule as the base.",
    howItWorks: "The thermochemical calorie used here is 4.184 joules. A food kilocalorie is 1,000 of those calories, also called a Calorie with a capital C on some labels. A kilowatt-hour is 3.6 million joules.",
    steps: ["Check whether the source says cal, kcal, or kJ.", "Convert.", "Food-label energy is an estimate of metabolisable energy, not a laboratory measurement of your meal."],
    example: "500 kcal = 2,092 kJ.",
    faqs: [
      { q: "Are food calories kilocalories?", a: "On most nutrition labels, yes. 1 food Calorie = 1 kcal = 4.184 kJ using the thermochemical calorie." },
      { q: "Does this estimate calories burned?", a: "No. Use the exercise calorie estimator, which uses MET values and body weight." },
    ],
    related: ["scientific-unit-converter", "exercise-calorie-calculator", "electricity-consumption-calculator"],
    category: "math",
  }),
];

export const generalCalcs: CalcDef[] = [
  {
    slug: "basic-calculator",
    title: "Basic calculator",
    description: "A keyboard-friendly calculator for addition, subtraction, multiplication, division, and percentages.",
    category: "general",
    keywords: ["basic calculator", "add", "subtract", "multiply", "divide"],
    synonyms: ["desk calculator", "simple calculator"],
    featured: 8,
    widget: "basic",
    inputs: [],
    compute: () => pack([]),
    formula: "The keypad applies ordinary arithmetic, with × and ÷ before + and − only when you press equals after each operator, as a desktop calculator does.",
    howItWorks: "This is an immediate calculator, not an expression line. Pressing an operator stores the displayed number and the operator. The next equals applies that operator. Percent divides the current entry by 100, or takes a percent of the stored number when an operator is pending.",
    steps: ["Type a number or use the keypad.", "Choose an operator.", "Type the next number and press equals.", "Use C to clear and ⌫ to delete the last digit."],
    example: "200 + 10% on a desktop-style percent key is often 220, because 10% of 200 is added. Try 200, +, 10, % to see that behaviour.",
    faqs: [
      { q: "Does it follow order of operations across a long sum?", a: "No. Like a basic desk calculator, it applies one operator at a time. For expressions such as 2+3×4, use the scientific calculator." },
      { q: "Are my keystrokes uploaded?", a: "No. The keypad runs entirely in your browser." },
    ],
    related: ["scientific-calculator", "percentage-calculator", "algebra-calculator"],
  },
  {
    slug: "scientific-calculator",
    title: "Scientific calculator",
    description: "Evaluate arithmetic, powers, roots, logarithms, and trigonometry in your browser. Nothing is sent to a server.",
    category: "general",
    keywords: ["scientific calculator", "sin", "log", "power", "trigonometry"],
    synonyms: ["engineering calculator", "expression calculator"],
    featured: 11,
    widget: "scientific",
    inputs: [],
    compute: () => pack([]),
    formula: "Expressions are parsed locally. sin, cos, and tan honour the degree or radian mode. log is base 10 unless you write log(value, base).",
    howItWorks: "The scientific keypad builds an expression and evaluates it with a small parser. It does not use JavaScript eval. Functions include sin, cos, tan, asin, acos, atan, ln, log, sqrt, cbrt, abs, and factorial for whole numbers up to 170.",
    steps: ["Choose degrees or radians.", "Build an expression with the keypad or keyboard.", "Press equals.", "Ans recalls the previous result."],
    example: "sin(30) in degree mode is 0.5. 2^10 is 1,024. log(1000) is 3.",
    faqs: [
      { q: "Can it solve an equation symbolically?", a: "No. It evaluates numbers. For ax²+bx+c=0, use the quadratic equation solver. For ax+b=0, use the linear solver." },
      { q: "Why was my factorial rejected?", a: "Factorial here is limited to whole numbers from 0 to 170 so the result stays inside ordinary floating-point range." },
    ],
    related: ["algebra-calculator", "trigonometry-calculator", "logarithm-calculator"],
  },
  {
    slug: "percentage-calculator",
    title: "Percentage calculator",
    description: "Find a percentage of a number, the percentage one number is of another, or the result of adding and subtracting a percent.",
    category: "general",
    keywords: ["percentage", "percent of", "what percent"],
    synonyms: ["% calculator", "percent calculator"],
    featured: 3,
    inputs: [
      { id: "mode", label: "What do you want?", type: "select", defaultValue: "of", options: [
        { value: "of", label: "What is X% of Y?" },
        { value: "ratio", label: "X is what percent of Y?" },
        { value: "change", label: "Add or subtract X% from Y" },
      ] },
      { id: "x", label: "X", type: "number", defaultValue: "18", required: true, step: "any" },
      { id: "y", label: "Y", type: "number", defaultValue: "2500", required: true, step: "any" },
      { id: "direction", label: "Direction", type: "select", defaultValue: "add", showIf: { field: "mode", equals: "change" }, options: [
        { value: "add", label: "Add the percent" },
        { value: "subtract", label: "Subtract the percent" },
      ] },
    ],
    compute: (v) => {
      const x = readNumber(v, "x", "X");
      const y = readNumber(v, "y", "Y");
      if (v.mode === "ratio") {
        if (y === 0) throw new InputError("Y cannot be zero when you ask what percent X is of Y.");
        const pct = (x / y) * 100;
        return pack([item("Percentage", `${formatNumber(pct, 4)}%`, true), item("Fraction", `${formatNumber(x, 4)} / ${formatNumber(y, 4)}`)]);
      }
      if (v.mode === "change") {
        const next = v.direction === "subtract" ? y * (1 - x / 100) : y * (1 + x / 100);
        return pack([
          item("Result", formatNumber(next, 4), true),
          item("Change", formatNumber(next - y, 4)),
          item("Base", formatNumber(y, 4)),
        ]);
      }
      const part = (x / 100) * y;
      return pack([item(`${formatNumber(x, 4)}% of ${formatNumber(y, 4)}`, formatNumber(part, 4), true), item("Remaining", formatNumber(y - part, 4))]);
    },
    formula: "X% of Y = (X / 100) × Y. X is what percent of Y = (X / Y) × 100.",
    howItWorks: "A percent is a fraction with denominator 100. The three modes cover the questions people usually mean by “percentage”: a share of a total, a ratio written as a percent, and a percent added to or taken off a base.",
    steps: ["Choose the question that matches your wording.", "Enter X and Y. Units should match in the ratio mode.", "Read the result and, if money is involved, round to the smallest currency unit at the end."],
    example: "18% of 2,500 = 0.18 × 2,500 = 450.",
    faqs: [
      { q: "Is percentage change the same as percentage of?", a: "No. A change compares a new value with an old value. Use the percentage increase and decrease calculator when you already have both values." },
      { q: "Why can a percent be over 100?", a: "Because a part can be larger than the reference. 150 is 150% of 100. That is arithmetic, not an error." },
    ],
    related: ["percentage-change-calculator", "discount-calculator", "percentage-off-calculator"],
    affiliateTags: ["general", "math"],
  },
  {
    slug: "percentage-change-calculator",
    title: "Percentage increase and decrease calculator",
    description: "Measure the percent change from an old value to a new value, or apply an increase or decrease.",
    category: "general",
    keywords: ["percentage increase", "percentage decrease", "percent change"],
    synonyms: ["growth rate", "percentage difference"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "from-to", options: [
        { value: "from-to", label: "I know the old and new values" },
        { value: "apply", label: "Apply a percent change to a value" },
      ] },
      { id: "old", label: "Old value", type: "number", defaultValue: "80", required: true, step: "any", showIf: { field: "mode", equals: "from-to" } },
      { id: "next", label: "New value", type: "number", defaultValue: "100", required: true, step: "any", showIf: { field: "mode", equals: "from-to" } },
      { id: "base", label: "Starting value", type: "number", defaultValue: "80", required: true, step: "any", showIf: { field: "mode", equals: "apply" } },
      { id: "pct", label: "Percent change", type: "number", unit: "%", defaultValue: "25", required: true, step: "any", showIf: { field: "mode", equals: "apply" }, help: "Use a negative number for a decrease." },
    ],
    compute: (v) => {
      if (v.mode === "apply") {
        const base = readNumber(v, "base", "Starting value");
        const pct = readNumber(v, "pct", "Percent change");
        const next = base * (1 + pct / 100);
        return pack([item("New value", formatNumber(next, 4), true), item("Absolute change", formatNumber(next - base, 4))]);
      }
      const oldValue = readNumber(v, "old", "Old value");
      const next = readNumber(v, "next", "New value");
      if (oldValue === 0) throw new InputError("Percent change is undefined when the starting value is zero.");
      const change = ((next - oldValue) / oldValue) * 100;
      return pack([
        item("Percent change", `${formatNumber(change, 4)}%`, true, change >= 0 ? "Increase" : "Decrease"),
        item("Absolute change", formatNumber(next - oldValue, 4)),
        item("New value is", `${formatNumber((next / oldValue) * 100, 2)}% of the old value`),
      ]);
    },
    formula: "Percent change = (new − old) / old × 100.",
    howItWorks: "The denominator is the old value, not the new one and not the average. A rise from 80 to 100 is 25%, while a fall from 100 to 80 is 20%. Those are different questions, so the direction matters.",
    steps: ["Identify which number came first.", "Subtract the old value from the new value.", "Divide by the old value and multiply by 100.", "A negative result is a decrease."],
    example: "From 80 to 100: (100 − 80) / 80 × 100 = 25% increase.",
    faqs: [
      { q: "What if the old value is negative?", a: "The formula still runs, but the words increase and decrease become easy to misread. State the absolute change as well." },
      { q: "Is this the same as percentage points?", a: "No. If a rate moves from 10% to 12%, that is a 2 percentage-point change and a 20% relative increase." },
    ],
    related: ["percentage-calculator", "revenue-growth-calculator", "discount-calculator"],
  },
  {
    slug: "ratio-calculator",
    title: "Ratio calculator",
    description: "Simplify a ratio and split a quantity into the same proportions.",
    category: "general",
    keywords: ["ratio", "simplify ratio", "split in ratio"],
    synonyms: ["proportion split", "a to b"],
    inputs: [
      { id: "a", label: "First part", type: "number", defaultValue: "2", required: true, min: 0 },
      { id: "b", label: "Second part", type: "number", defaultValue: "3", required: true, min: 0 },
      { id: "c", label: "Third part (optional)", type: "number", min: 0, help: "Leave blank for a two-part ratio." },
      { id: "total", label: "Quantity to split (optional)", type: "number", min: 0, unit: "units" },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First part", { min: 0 });
      const b = readNumber(v, "b", "Second part", { min: 0 });
      const c = readOptionalNumber(v, "c", "Third part");
      const parts = c === null ? [a, b] : [a, b, c];
      if (parts.every((p) => p === 0)) throw new InputError("At least one part must be greater than zero.");
      const factor = parts.reduce((g, p) => {
        const x = Math.round(g * 1000);
        const y = Math.round(p * 1000);
        const gcd = (m: number, n: number): number => (n ? gcd(n, m % n) : m);
        return gcd(x, y) / 1000;
      }, parts[0]);
      const simplified = parts.map((p) => formatNumber(factor === 0 ? p : p / factor, 4));
      const totalParts = parts.reduce((s, p) => s + p, 0);
      const results = [item("Simplified ratio", simplified.join(" : "), true), item("Share of the whole", parts.map((p) => `${formatNumber((p / totalParts) * 100, 2)}%`).join(" · "))];
      const total = readOptionalNumber(v, "total", "Quantity");
      if (total !== null) {
        parts.forEach((p, i) => results.push(item(`Part ${i + 1}`, formatNumber((total * p) / totalParts, 4))));
      }
      return pack(results);
    },
    formula: "Simplified ratio = each part ÷ greatest common divisor. A share = total × part / sum of parts.",
    howItWorks: "Ratios compare relative size, not absolute size. 2:3 is the same relationship as 4:6. If you also enter a quantity, each share is that quantity multiplied by the part’s fraction of the total parts.",
    steps: ["Enter the parts in the same units.", "Read the simplified ratio.", "If you entered a quantity, check that the shares add back to it."],
    example: "Split 100 in the ratio 2:3. Shares are 40 and 60.",
    faqs: [
      { q: "Can I use decimals?", a: "Yes. The simplifier scales by 1,000 before finding a common divisor, which is enough for three-decimal ratios." },
      { q: "What if I need a missing term in a proportion?", a: "Use the proportion calculator, which solves a/b = c/d for one unknown." },
    ],
    related: ["proportion-calculator", "percentage-calculator", "average-calculator"],
  },
  {
    slug: "proportion-calculator",
    title: "Proportion calculator",
    description: "Solve a/b = c/d for the missing term.",
    category: "general",
    keywords: ["proportion", "cross multiply", "solve for x"],
    synonyms: ["ratios equal", "rule of three"],
    inputs: [
      { id: "unknown", label: "Which term is unknown?", type: "select", defaultValue: "d", options: [
        { value: "a", label: "a" },
        { value: "b", label: "b" },
        { value: "c", label: "c" },
        { value: "d", label: "d" },
      ] },
      { id: "a", label: "a", type: "number", defaultValue: "3", step: "any", showIf: { field: "unknown", equals: "b" } },
      { id: "a2", label: "a", type: "number", defaultValue: "3", step: "any", showIf: { field: "unknown", equals: "c" } },
      { id: "a3", label: "a", type: "number", defaultValue: "3", step: "any", showIf: { field: "unknown", equals: "d" } },
      { id: "b", label: "b", type: "number", defaultValue: "4", step: "any", showIf: { field: "unknown", equals: "a" } },
      { id: "b2", label: "b", type: "number", defaultValue: "4", step: "any", showIf: { field: "unknown", equals: "c" } },
      { id: "b3", label: "b", type: "number", defaultValue: "4", step: "any", showIf: { field: "unknown", equals: "d" } },
      { id: "c", label: "c", type: "number", defaultValue: "6", step: "any", showIf: { field: "unknown", equals: "a" } },
      { id: "c2", label: "c", type: "number", defaultValue: "6", step: "any", showIf: { field: "unknown", equals: "b" } },
      { id: "c3", label: "c", type: "number", defaultValue: "6", step: "any", showIf: { field: "unknown", equals: "d" } },
      { id: "d", label: "d", type: "number", defaultValue: "8", step: "any", showIf: { field: "unknown", equals: "a" } },
      { id: "d2", label: "d", type: "number", defaultValue: "8", step: "any", showIf: { field: "unknown", equals: "b" } },
      { id: "d3", label: "d", type: "number", defaultValue: "8", step: "any", showIf: { field: "unknown", equals: "c" } },
    ],
    compute: (v) => {
      const unknown = v.unknown || "d";
      const pick = (id: string) => readNumber(v, id, id);
      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;
      if (unknown === "a") {
        b = pick("b"); c = pick("c"); d = pick("d");
        if (c === 0) throw new InputError("c cannot be zero when solving for a.");
        a = (b * c) / d;
      } else if (unknown === "b") {
        a = pick("a"); c = pick("c2"); d = pick("d2");
        if (c === 0) throw new InputError("c cannot be zero when solving for b.");
        b = (a * d) / c;
      } else if (unknown === "c") {
        a = pick("a2"); b = pick("b2"); d = pick("d3");
        if (b === 0) throw new InputError("b cannot be zero when solving for c.");
        c = (a * d) / b;
      } else {
        a = pick("a3"); b = pick("b3"); c = pick("c3");
        if (a === 0) throw new InputError("a cannot be zero when solving for d.");
        d = (b * c) / a;
      }
      if ([b, d].includes(0) && unknown !== "b" && unknown !== "d") throw new InputError("A denominator in the proportion is zero.");
      const solved = unknown === "a" ? a : unknown === "b" ? b : unknown === "c" ? c : d;
      return pack([
        item(unknown, formatNumber(solved, 6), true),
        item("Proportion", `${formatNumber(a, 4)} / ${formatNumber(b, 4)} = ${formatNumber(c, 4)} / ${formatNumber(d, 4)}`),
      ]);
    },
    formula: "If a/b = c/d, then a×d = b×c. The missing term is isolated from that cross-product.",
    howItWorks: "A proportion says two ratios are equal. Cross-multiplication turns that statement into a linear equation with one unknown. The page hides the field you are solving for so it is not mistaken for an input.",
    steps: ["Choose the missing letter.", "Enter the three known terms.", "Check that neither ratio has a zero denominator."],
    example: "3/4 = 6/d gives d = (4×6)/3 = 8.",
    faqs: [
      { q: "What does a zero denominator mean?", a: "Division by zero is undefined, so the proportion is not a usable statement. Change the terms." },
      { q: "Can the terms have different units?", a: "Only if both ratios use a consistent pair. 3 km / 4 hours = 6 km / d hours is valid. Mixing km and miles is not." },
    ],
    related: ["ratio-calculator", "linear-equation-calculator", "percentage-calculator"],
  },
  {
    slug: "average-calculator",
    title: "Average calculator",
    description: "Find the mean of a list, with the median, mode, and range beside it.",
    category: "general",
    keywords: ["average", "mean", "median"],
    synonyms: ["arithmetic mean"],
    inputs: [{ id: "values", label: "Numbers", type: "textarea", defaultValue: "12, 15, 18, 15, 21", required: true, rows: 4, help: "Separate numbers with commas, spaces, or new lines." }],
    compute: (v) => {
      const values = parseNumberList(v.values || "", "the list");
      const mode = modes(values);
      return pack([
        item("Mean", formatNumber(mean(values), 4), true),
        item("Median", formatNumber(median(values), 4)),
        item("Mode", mode.length ? mode.map((n) => formatNumber(n, 4)).join(", ") : "No repeated value"),
        item("Range", formatNumber(range(values), 4)),
        item("Count", formatInt(values.length)),
        item("Sum", formatNumber(values.reduce((s, n) => s + n, 0), 4)),
      ]);
    },
    formula: "Mean = sum of values / count.",
    howItWorks: "The arithmetic mean is the balance point of the list. It is pulled by outliers. The median is the middle value after sorting and is often steadier for skewed data such as incomes or house prices. This page shows both so you can see the difference.",
    steps: ["Paste the numbers.", "Check the count, in case a comma created an extra value.", "Use the mean for additive totals and the median when extremes distort the centre."],
    example: "12, 15, 18, 15, 21 sum to 81. The mean is 81 / 5 = 16.2. The median is 15.",
    faqs: [
      { q: "Does a blank line count?", a: "No. Empty separators are ignored. A letter or symbol stops the calculation with an error." },
      { q: "Is this a weighted average?", a: "No. Every value has equal weight. Use the weighted average calculator when items have different weights." },
    ],
    related: ["weighted-average-calculator", "mean-median-mode-calculator", "statistics-calculator"],
  },
  {
    slug: "weighted-average-calculator",
    title: "Weighted average calculator",
    description: "Average numbers when each value has its own weight, such as credits, quantities, or grades.",
    category: "general",
    keywords: ["weighted average", "weighted mean", "grades"],
    synonyms: ["credit weighted gpa", "weighted score"],
    inputs: [{ id: "rows", label: "Values and weights", type: "textarea", defaultValue: "80, 3\n90, 4\n70, 2", required: true, rows: 6, help: "One pair per line: value, weight." }],
    compute: (v) => {
      const lines = (v.rows || "").split(/\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) throw new InputError("Enter at least one value and weight.");
      let weighted = 0;
      let weightSum = 0;
      const parsed = lines.map((line, index) => {
        const bits = line.split(/[,:\s]+/).filter(Boolean);
        if (bits.length < 2) throw new InputError(`Line ${index + 1} needs a value and a weight.`);
        const value = Number(bits[0]);
        const weight = Number(bits[1]);
        if (!Number.isFinite(value) || !Number.isFinite(weight)) throw new InputError(`Line ${index + 1} is not numeric.`);
        if (weight < 0) throw new InputError("Weights cannot be negative.");
        weighted += value * weight;
        weightSum += weight;
        return [formatNumber(value, 4), formatNumber(weight, 4)];
      });
      if (weightSum === 0) throw new InputError("The weights sum to zero, so the average is undefined.");
      return pack([
        item("Weighted average", formatNumber(weighted / weightSum, 4), true),
        item("Total weight", formatNumber(weightSum, 4)),
        item("Weighted sum", formatNumber(weighted, 4)),
      ], { table: { caption: "Pairs read", headers: ["Value", "Weight"], rows: parsed } });
    },
    formula: "Weighted average = Σ(value × weight) / Σ(weight).",
    howItWorks: "A weighted average lets some observations count more. A 4-credit course should move a grade point average more than a 2-credit course. The weights do not need to sum to 100; only their relative size matters.",
    steps: ["Put each value and its weight on one line.", "Confirm the total weight is what you expected.", "Read the weighted average."],
    example: "(80×3 + 90×4 + 70×2) / (3+4+2) = 740 / 9 = 82.222.",
    faqs: [
      { q: "Can I enter percentages as weights?", a: "Yes. Weights of 20, 30, and 50 behave the same as 0.2, 0.3, and 0.5." },
      { q: "What if one weight is zero?", a: "That row does not affect the result. A zero total weight is rejected." },
    ],
    related: ["average-calculator", "statistics-calculator", "percentage-calculator"],
  },
  {
    slug: "fraction-calculator",
    title: "Fraction calculator",
    description: "Add, subtract, multiply, and divide fractions, including mixed numbers, and simplify the result.",
    category: "general",
    keywords: ["fraction", "add fractions", "mixed numbers"],
    synonyms: ["fraction simplifier"],
    inputs: [
      { id: "a", label: "First fraction", type: "text", defaultValue: "1 1/2", required: true, placeholder: "3/4 or 1 1/2" },
      { id: "op", label: "Operation", type: "select", defaultValue: "+", options: [
        { value: "+", label: "Add" },
        { value: "-", label: "Subtract" },
        { value: "*", label: "Multiply" },
        { value: "/", label: "Divide" },
      ] },
      { id: "b", label: "Second fraction", type: "text", defaultValue: "2/3", required: true },
    ],
    compute: (v) => {
      const a = parseFraction(v.a || "");
      const b = parseFraction(v.b || "");
      let n = 0;
      let d = 1;
      if (v.op === "+") {
        n = a.n * b.d + b.n * a.d;
        d = a.d * b.d;
      } else if (v.op === "-") {
        n = a.n * b.d - b.n * a.d;
        d = a.d * b.d;
      } else if (v.op === "*") {
        n = a.n * b.n;
        d = a.d * b.d;
      } else {
        if (b.n === 0) throw new InputError("Cannot divide by zero.");
        n = a.n * b.d;
        d = a.d * b.n;
      }
      const simple = simplifyFraction(n, d);
      return pack([
        item("Result", formatFraction(simple.n, simple.d, true), true),
        item("Improper fraction", formatFraction(simple.n, simple.d, false)),
        item("Decimal", formatNumber(simple.n / simple.d, 6)),
      ]);
    },
    formula: "a/b + c/d = (ad + bc) / bd. a/b ÷ c/d = a/b × d/c.",
    howItWorks: "Fractions are exact rational numbers. The calculator parses whole numbers, proper fractions, and mixed numbers, performs the operation with integer arithmetic, then divides by the greatest common divisor.",
    steps: ["Enter fractions as 3/4 or mixed numbers as 1 1/2.", "Choose the operation.", "Use the simplified fraction if you need an exact answer, and the decimal if you need a measurement."],
    example: "1 1/2 + 2/3 = 3/2 + 2/3 = 13/6 = 2 1/6.",
    faqs: [
      { q: "Can I enter decimals?", a: "Not in this box. Convert the decimal first, or use the decimal-to-fraction converter and paste the fraction." },
      { q: "Why is the sign on the numerator?", a: "A negative result is stored as a negative numerator over a positive denominator, which is the usual school convention." },
    ],
    related: ["decimal-to-fraction-calculator", "ratio-calculator", "percentage-calculator"],
  },
  {
    slug: "decimal-to-fraction-calculator",
    title: "Decimal to fraction converter",
    description: "Turn a decimal into a simplified fraction, with a limit on the denominator so repeating decimals stay readable.",
    category: "general",
    keywords: ["decimal to fraction", "fraction converter"],
    synonyms: ["0.75 in fraction", "repeating decimal"],
    inputs: [
      { id: "value", label: "Decimal", type: "number", defaultValue: "0.375", required: true, step: "any" },
      { id: "max", label: "Maximum denominator", type: "number", defaultValue: "10000", min: 1, max: 1000000, required: true },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Decimal");
      const max = readNumber(v, "max", "Maximum denominator", { min: 1, integer: true });
      const frac = toFraction(value, max);
      return pack([
        item("Fraction", formatFraction(frac.n, frac.d, true), true),
        item("Check", formatNumber(frac.n / frac.d, 10)),
        item("Absolute error", formatNumber(Math.abs(value - frac.n / frac.d), 12)),
      ]);
    },
    formula: "A continued-fraction expansion finds the simplest fraction within the denominator limit.",
    howItWorks: "Some decimals are exact fractions, such as 0.375 = 3/8. Others, such as π or a rounded measurement, are approximated. The denominator cap stops the converter from printing an unusably large exact expansion of a rounded number.",
    steps: ["Enter the decimal.", "Lower the maximum denominator if you want a rough shop-floor fraction such as eighths.", "Compare the check value with the original."],
    example: "0.375 = 3/8 exactly.",
    faqs: [
      { q: "Why is 0.333 not exactly 1/3?", a: "0.333 is 333/1000. One third is the repeating decimal 0.333…. Raise the denominator limit or enter more 3s if you were approximating one third." },
      { q: "Does it simplify?", a: "Yes. The fraction is reduced by the greatest common divisor." },
    ],
    related: ["fraction-calculator", "rounding-calculator", "percentage-calculator"],
  },
  {
    slug: "rounding-calculator",
    title: "Rounding calculator",
    description: "Round a number to decimal places or to a step such as 0.05, with half-up, half-even, floor, ceiling, or truncation.",
    category: "general",
    keywords: ["rounding", "round to nearest", "bankers rounding"],
    synonyms: ["round half up", "significant figures"],
    inputs: [
      { id: "value", label: "Number", type: "number", defaultValue: "2.675", required: true, step: "any" },
      { id: "mode", label: "Rule", type: "select", defaultValue: "half-up", options: [
        { value: "half-up", label: "Half away from zero" },
        { value: "half-even", label: "Half to even (banker’s)" },
        { value: "floor", label: "Floor (toward −∞)" },
        { value: "ceil", label: "Ceiling (toward +∞)" },
        { value: "trunc", label: "Truncate toward zero" },
      ] },
      { id: "step", label: "Round to nearest", type: "number", defaultValue: "0.01", required: true, step: "any", help: "Use 1 for whole numbers, 10 for tens, or 0.05 for nickels." },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Number");
      const step = readNumber(v, "step", "Step", { allowZero: false });
      const mode = (v.mode || "half-up") as "half-up" | "half-even" | "floor" | "ceil" | "trunc";
      const rounded = roundToStep(value, step, mode);
      return pack([
        item("Rounded value", formatNumber(rounded, 8), true),
        item("Difference", formatNumber(rounded - value, 8)),
        item("Rule", mode),
      ]);
    },
    formula: "Scale the number by the step, apply the chosen rounding rule, then multiply by the step again.",
    howItWorks: "Half-up is the rule most school textbooks describe. Half-even is common in financial standards because it does not systematically drift up when many .5 values are summed. Floor and ceiling are useful for stock counts and for conservative estimates.",
    steps: ["Enter the unrounded number.", "Choose the rule your context requires.", "Set the step. Money in paise or cents usually uses 0.01."],
    example: "2.675 to the nearest 0.01, half away from zero, is 2.68.",
    faqs: [
      { q: "Why do spreadsheets sometimes show 2.67?", a: "Binary floating point cannot store 2.675 exactly. A displayed 2.675 may already be slightly under or over the decimal. For money, calculate in the smallest unit when you can." },
      { q: "Can I round to significant figures?", a: "Use a step of 1, 10, 100, and so on for whole-number significance. For a general significant-figure display, scientific notation is the clearer tool." },
    ],
    related: ["decimal-to-fraction-calculator", "scientific-notation-calculator", "average-calculator"],
  },
  {
    slug: "random-number-generator",
    title: "Random number generator",
    description: "Draw integers from a range with the browser’s cryptographic random source. Nothing is stored or uploaded.",
    category: "general",
    keywords: ["random number", "rng", "dice", "pick a number"],
    synonyms: ["random integer", "lottery picker"],
    live: false,
    submitLabel: "Generate",
    inputs: [
      { id: "min", label: "Minimum", type: "number", defaultValue: "1", required: true },
      { id: "max", label: "Maximum", type: "number", defaultValue: "100", required: true },
      { id: "count", label: "How many", type: "number", defaultValue: "1", min: 1, max: 100, required: true },
      { id: "unique", label: "Unique values only", type: "select", defaultValue: "yes", options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No, allow repeats" },
      ] },
      { id: "sort", label: "Sort the list", type: "select", defaultValue: "no", options: [
        { value: "no", label: "Keep draw order" },
        { value: "yes", label: "Sort ascending" },
      ] },
    ],
    compute: (v) => {
      const min = readNumber(v, "min", "Minimum", { integer: true });
      const max = readNumber(v, "max", "Maximum", { integer: true });
      const count = readNumber(v, "count", "Count", { min: 1, max: 100, integer: true });
      if (max < min) throw new InputError("Maximum must be greater than or equal to minimum.");
      if (max - min > 1_000_000_000) throw new InputError("Choose a range of at most one billion.");
      const unique = v.unique !== "no";
      if (unique && count > max - min + 1) throw new InputError("There are not enough unique integers in that range.");
      const draws: number[] = [];
      const used = new Set<number>();
      while (draws.length < count) {
        const n = randomInt(min, max);
        if (unique && used.has(n)) continue;
        used.add(n);
        draws.push(n);
      }
      const shown = v.sort === "yes" ? [...draws].sort((a, b) => a - b) : draws;
      return pack([
        item(count === 1 ? "Number" : "Numbers", shown.join(", "), true),
        item("Range", `${formatInt(min)} to ${formatInt(max)} inclusive`),
      ], { notes: ["Draws use crypto.getRandomValues and rejection sampling to avoid modulo bias. This is appropriate for games and sampling, not for generating passwords."] });
    },
    formula: "Each integer in the inclusive range is equally likely. Unique mode samples without replacement.",
    howItWorks: "The generator asks the browser for cryptographically strong random bytes and maps them onto your range without the slight bias of a plain remainder. It does not keep a history of draws.",
    steps: ["Set the inclusive minimum and maximum.", "Choose how many numbers you need.", "Press Generate. Press it again for a new draw."],
    example: "A standard die is minimum 1, maximum 6, count 1.",
    faqs: [
      { q: "Can I generate decimals?", a: "This tool is for integers. For a decimal, generate an integer and divide by the scale you need, or use the scientific calculator." },
      { q: "Is the result stored?", a: "No. Only the calculator name can be saved in your recent list, never the numbers drawn." },
    ],
    related: ["decision-picker", "random-name-picker", "rounding-calculator"],
  },
  ...unitPages,
  {
    slug: "unit-converter",
    title: "Unit converter",
    description: "Convert length, weight, area, volume, temperature, and speed without leaving one page.",
    category: "general",
    keywords: ["unit converter", "measurement", "metric", "imperial"],
    synonyms: ["unit conversion"],
    featured: 10,
    inputs: [
      { id: "dimension", label: "Measure", type: "select", defaultValue: "length", options: ["length", "weight", "area", "volume", "temperature", "speed"].map((id) => ({ value: id, label: dimensions[id].label })) },
      { id: "value", label: "Value", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "from", label: "From unit code", type: "text", defaultValue: "m", required: true, help: "Examples: m, ft, kg, lb, C, F, kmh, mph, l, gal." },
      { id: "to", label: "To unit code", type: "text", defaultValue: "ft", required: true },
    ],
    compute: (v) => {
      const dimension = v.dimension || "length";
      const value = readNumber(v, "value", "Value");
      const from = (v.from || "").trim();
      const to = (v.to || "").trim();
      const known = dimensions[dimension]?.units ?? [];
      if (!known.some((u) => u.id === from) || !known.some((u) => u.id === to)) {
        throw new InputError(`Use one of these unit codes for ${dimensions[dimension].label}: ${known.map((u) => u.id).join(", ")}.`);
      }
      const converted = convertUnit(dimension, value, from, to);
      return pack([
        item("Result", formatNumber(converted, 8), true),
        item("Statement", `${formatNumber(value, 6)} ${from} = ${formatNumber(converted, 8)} ${to}`),
      ], { notes: ["Dedicated converters list every unit in a menu if you would rather not type a code."] });
    },
    formula: "Convert to the dimension’s base unit, then to the target unit. Temperature uses an offset formula.",
    howItWorks: "This hub is the fast path when you already know the unit code. The dedicated length, weight, area, volume, temperature, and speed pages offer the same factors with labelled menus.",
    steps: ["Choose the kind of measure.", "Enter the value and the two unit codes shown in the help text.", "Open a dedicated converter if you want a dropdown instead."],
    example: "1 metre = 3.2808399 feet.",
    faqs: [
      { q: "Where are pressure and data units?", a: "Pressure and energy are on their own pages under mathematics. Data storage has a technology page that explains decimal and binary prefixes." },
      { q: "Are the factors exact?", a: "International definitions such as the inch (25.4 mm) are exact. Displayed results are rounded." },
    ],
    related: ["length-converter", "weight-converter", "temperature-converter", "data-storage-converter"],
  },
  {
    slug: "roman-numeral-converter",
    title: "Roman numeral converter",
    description: "Convert integers from 1 to 3,999 into standard Roman numerals, and read a standard numeral back.",
    category: "general",
    keywords: ["roman numerals", "roman to number", "XIV"],
    synonyms: ["roman converter"],
    inputs: [
      { id: "mode", label: "Direction", type: "select", defaultValue: "to", options: [
        { value: "to", label: "Number to Roman" },
        { value: "from", label: "Roman to number" },
      ] },
      { id: "number", label: "Number", type: "number", defaultValue: "2026", showIf: { field: "mode", equals: "to" }, required: true },
      { id: "roman", label: "Roman numeral", type: "text", defaultValue: "MMXXVI", showIf: { field: "mode", equals: "from" }, required: true },
    ],
    compute: (v) => {
      if (v.mode === "from") {
        const n = fromRoman(v.roman || "");
        return pack([item("Number", formatInt(n), true), item("Standard form", toRoman(n))]);
      }
      const n = readNumber(v, "number", "Number", { integer: true, min: 1, max: 3999 });
      return pack([item("Roman numeral", toRoman(n), true), item("Number", formatInt(n))]);
    },
    formula: "Values: I=1, V=5, X=10, L=50, C=100, D=500, M=1000. A smaller numeral before a larger one subtracts.",
    howItWorks: "The converter uses the standard subtractive pairs IV, IX, XL, XC, CD, and CM. It rejects non-canonical strings such as IIII so a typo is not silently accepted as 4.",
    steps: ["Choose a direction.", "Enter a number from 1 to 3,999 or a standard numeral.", "The other form is shown beside it."],
    example: "2026 = MMXXVI. MCMXCIV = 1994.",
    faqs: [
      { q: "Why is 4 written IV and not IIII?", a: "Both appear on clocks, but the standard form taught and used in this converter is IV." },
      { q: "Can it write numbers above 3,999?", a: "Not without an overline convention for thousands. Those forms are not unique enough to convert safely, so they are out of range." },
    ],
    related: ["number-to-words-converter", "base-converter", "roman-numeral-converter"],
  },
  {
    slug: "number-to-words-converter",
    title: "Number to words converter",
    description: "Spell a number in Western English or the Indian numbering system, up to just under one trillion.",
    category: "general",
    keywords: ["number to words", "cheque amount", "lakh", "crore"],
    synonyms: ["amount in words", "figures to words"],
    inputs: [
      { id: "value", label: "Number", type: "number", defaultValue: "125000", required: true, step: "any" },
      { id: "system", label: "Numbering system", type: "select", defaultValue: "indian", options: [
        { value: "indian", label: "Indian (lakh, crore)" },
        { value: "western", label: "Western (million, billion)" },
      ] },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Number");
      const system = v.system === "western" ? "western" : "indian";
      return pack([
        item("In words", numberToWords(value, system), true),
        item("System", system === "indian" ? "Indian" : "Western"),
      ], { notes: ["Decimals are read digit by digit after “point”, which is safer for cheques than inventing a currency subunit."] });
    },
    formula: "Group digits by thousands in the Western system, or by thousands and then lakhs and crores in the Indian system.",
    howItWorks: "English number names change at different boundaries in India and in the US or UK. 100,000 is “one lakh” in the Indian system and “one hundred thousand” in the Western system. The converter does not add “rupees” or “dollars”; add the currency yourself so the words match the document.",
    steps: ["Enter the number.", "Choose the numbering system used by the reader.", "Copy the words and add the currency name if you are writing a cheque or invoice."],
    example: "125000 in the Indian system is one lakh twenty-five thousand.",
    faqs: [
      { q: "Does it capitalise the words?", a: "No. Cheque stationery often wants title case. Capitalise the copy if the form requires it." },
      { q: "What about paise?", a: "A two-decimal number is read as “point” plus the digits. That avoids claiming a currency the tool does not know." },
    ],
    related: ["roman-numeral-converter", "invoice-tax-calculator", "base-converter"],
  },
  {
    slug: "base-converter",
    title: "Binary, decimal, hexadecimal, and octal converter",
    description: "Convert an integer between binary, octal, decimal, and hexadecimal.",
    category: "general",
    keywords: ["binary", "hexadecimal", "octal", "decimal", "base converter"],
    synonyms: ["hex to decimal", "binary converter"],
    inputs: [
      { id: "value", label: "Value", type: "text", defaultValue: "255", required: true },
      { id: "from", label: "From base", type: "select", defaultValue: "10", options: [
        { value: "2", label: "Binary (2)" },
        { value: "8", label: "Octal (8)" },
        { value: "10", label: "Decimal (10)" },
        { value: "16", label: "Hexadecimal (16)" },
      ] },
    ],
    compute: (v) => {
      const from = Number(v.from || "10");
      const value = v.value || "";
      return pack([
        item("Decimal", convertBase(value, from, 10), true),
        item("Binary", convertBase(value, from, 2)),
        item("Octal", convertBase(value, from, 8)),
        item("Hexadecimal", convertBase(value, from, 16)),
      ], { notes: ["Only non-negative integers within JavaScript’s safe integer range are converted. Fractions and two’s-complement negatives are not inferred."] });
    },
    formula: "Interpret each digit in the source base, then rewrite the integer in the target base.",
    howItWorks: "Positional notation multiplies each digit by a power of the base. Hexadecimal digits A–F stand for 10–15. Prefixes such as 0x or 0b are stripped so you can paste them.",
    steps: ["Paste the value.", "Select the base you pasted it from.", "Read all four representations."],
    example: "255 decimal = 11111111 binary = 377 octal = FF hexadecimal.",
    faqs: [
      { q: "Why is a very long binary rejected?", a: "Above the safe integer limit, a JavaScript number cannot represent every integer exactly. Use a big-integer tool for those values." },
      { q: "Are letters case-sensitive?", a: "No. ff and FF are the same hexadecimal value." },
    ],
    related: ["subnet-calculator", "scientific-notation-calculator", "base64-encoder"],
  },
  {
    slug: "age-calculator",
    title: "Age calculator",
    description: "Find an exact age in years, months, and days, plus the next birthday.",
    category: "general",
    keywords: ["age", "how old", "birthday"],
    synonyms: ["age in years and months"],
    featured: 6,
    inputs: [
      { id: "birth", label: "Date of birth", type: "date", required: true, defaultValue: "1998-04-12" },
      { id: "asof", label: "Age on this date", type: "date", required: true, defaultValue: "2026-03-21" },
    ],
    compute: (v) => {
      const birth = parseISODate(v.birth || "", "date of birth");
      const asOf = parseISODate(v.asof || "", "as-of date");
      const age = ageParts(birth, asOf);
      let next = new Date(asOf.getFullYear(), birth.getMonth(), birth.getDate());
      if (next < asOf) next = new Date(asOf.getFullYear() + 1, birth.getMonth(), birth.getDate());
      if (next.getMonth() !== birth.getMonth()) next = new Date(next.getFullYear(), next.getMonth() + 1, 0);
      return pack([
        item("Age", `${age.years} years, ${age.months} months, ${age.days} days`, true),
        item("Total days", formatInt(age.totalDays)),
        item("Next birthday", formatLongDate(next)),
        item("Days until next birthday", formatInt(daysBetween(asOf, next))),
        item("Born on", formatLongDate(birth)),
      ]);
    },
    formula: "Count full years, then full months, then the remaining days. Month-ends follow the calendar.",
    howItWorks: "Age is not just today’s year minus the birth year. If the birthday has not yet occurred this year, one year is subtracted. The same rule applies to the month. February 29 birthdays are observed on February 28 in non-leap years for the next-birthday date.",
    steps: ["Enter the date of birth.", "Enter the date you want the age on. It can be today or a past or future date.", "Read years, months, and days together. A year count alone hides the months."],
    example: "Born 12 April 1998, age on 21 March 2026 is 27 years, 11 months, and 9 days.",
    faqs: [
      { q: "Is this a legal age?", a: "It is a calendar age. Legal age for a contract, licence, or benefit can depend on local rules and the exact time of birth, which this page does not collect." },
      { q: "Do you store the date of birth?", a: "No. It stays in the page. Favourites store only the calculator name." },
    ],
    related: ["date-of-birth-calculator", "days-between-dates-calculator", "birthday-countdown"],
  },
  {
    slug: "date-of-birth-calculator",
    title: "Date of birth calculator",
    description: "Estimate a date of birth from an age in years and months. The result is a range when the exact day is unknown.",
    category: "general",
    keywords: ["date of birth from age", "dob calculator"],
    synonyms: ["birth date estimator"],
    inputs: [
      { id: "asof", label: "Age was measured on", type: "date", required: true, defaultValue: "2026-03-21" },
      { id: "years", label: "Age in years", type: "number", defaultValue: "30", min: 0, max: 130, required: true },
      { id: "months", label: "Additional months", type: "number", defaultValue: "0", min: 0, max: 11, required: true },
    ],
    compute: (v) => {
      const asOf = parseISODate(v.asof || "", "measurement date");
      const years = readNumber(v, "years", "Years", { min: 0, max: 130, integer: true });
      const months = readNumber(v, "months", "Months", { min: 0, max: 11, integer: true });
      const latest = addMonths(addYears(asOf, -years), -months);
      const earliest = addDays(addMonths(latest, -1), 1);
      return pack([
        item("Latest possible date of birth", formatLongDate(latest), true),
        item("Earliest possible date of birth", formatLongDate(earliest)),
        item("If born on the latest date, age is", `${years} years, ${months} months, 0 days`),
      ], { notes: ["Someone who is 30 years and 0 months old was born on a day in the month-long window ending on the latest date. You cannot recover the exact day from a rounded age."] });
    },
    formula: "Latest DOB = measurement date minus the stated years and months. The earliest DOB is one day after a month before that.",
    howItWorks: "An age stated in completed years and months identifies a window, not a single day. This page makes that window explicit instead of pretending a single date is known.",
    steps: ["Enter the date the age was stated.", "Enter completed years and months, not a rounded-up age.", "Treat the result as a range unless you have the day from another record."],
    example: "A person who is 30 years and 0 months on 21 March 2026 was born between 22 February 1996 and 21 March 1996.",
    faqs: [
      { q: "Why is this not a single date?", a: "Because “30 years old” is true for 365 or 366 different birthdays. Guessing one of them would be misleading." },
      { q: "Can I use this for an official form?", a: "No. Use a birth record. This is only a way to understand what a stated age implies." },
    ],
    related: ["age-calculator", "days-between-dates-calculator", "date-calculator"],
  },
  {
    slug: "days-between-dates-calculator",
    title: "Days between dates calculator",
    description: "Count the days between two dates, with an option to include both endpoints.",
    category: "general",
    keywords: ["days between dates", "date difference", "how many days"],
    synonyms: ["day counter"],
    inputs: [
      { id: "start", label: "Start date", type: "date", required: true, defaultValue: "2026-01-01" },
      { id: "end", label: "End date", type: "date", required: true, defaultValue: "2026-03-21" },
      { id: "inclusive", label: "Count", type: "select", defaultValue: "exclusive", options: [
        { value: "exclusive", label: "The gap between the dates" },
        { value: "inclusive", label: "Include both start and end" },
      ] },
    ],
    compute: (v) => {
      const start = parseISODate(v.start || "", "start date");
      const end = parseISODate(v.end || "", "end date");
      const gap = daysBetween(start, end);
      const inclusive = v.inclusive === "inclusive" ? Math.abs(gap) + 1 : Math.abs(gap);
      return pack([
        item(v.inclusive === "inclusive" ? "Days including both dates" : "Days between", formatInt(inclusive), true),
        item("Signed gap", formatInt(gap), false, gap < 0 ? "End is before start" : "End is on or after start"),
        item("Weeks", formatNumber(Math.abs(gap) / 7, 2)),
      ]);
    },
    formula: "Gap = UTC day number of the end date − UTC day number of the start date.",
    howItWorks: "Counting by UTC day numbers avoids daylight-saving surprises. Inclusive counting adds one, which is what people want for a stay that includes the arrival and departure dates, or for a challenge that includes both the start and end day.",
    steps: ["Enter both dates.", "Choose whether the end date itself should be counted.", "Use working days if weekends should be excluded."],
    example: "1 January 2026 to 21 March 2026 is 79 days between the dates, or 80 days if both dates count.",
    faqs: [
      { q: "Does a leap day count?", a: "Yes, if 29 February falls strictly inside the gap, or on an included endpoint." },
      { q: "What about time of day?", a: "This page uses calendar dates only. Use the time duration calculator when hours matter." },
    ],
    related: ["working-days-calculator", "date-calculator", "age-calculator"],
  },
  {
    slug: "date-calculator",
    title: "Date calculator",
    description: "Add or subtract days, months, and years from a date without slipping past the end of a short month.",
    category: "general",
    keywords: ["add days to date", "date plus months", "calendar calculator"],
    synonyms: ["date adder"],
    inputs: [
      { id: "start", label: "Start date", type: "date", required: true, defaultValue: "2026-01-31" },
      { id: "direction", label: "Direction", type: "select", defaultValue: "add", options: [
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
      ] },
      { id: "years", label: "Years", type: "number", defaultValue: "0", min: 0, required: true },
      { id: "months", label: "Months", type: "number", defaultValue: "1", min: 0, required: true },
      { id: "days", label: "Days", type: "number", defaultValue: "0", min: 0, required: true },
    ],
    compute: (v) => {
      const start = parseISODate(v.start || "", "start date");
      const sign = v.direction === "subtract" ? -1 : 1;
      const years = readNumber(v, "years", "Years", { min: 0, integer: true });
      const months = readNumber(v, "months", "Months", { min: 0, integer: true });
      const days = readNumber(v, "days", "Days", { min: 0, integer: true });
      let next = addYears(start, sign * years);
      next = addMonths(next, sign * months);
      next = addDays(next, sign * days);
      return pack([
        item("Resulting date", formatLongDate(next), true),
        item("ISO date", formatISODate(next)),
        item("Days moved", formatInt(daysBetween(start, next))),
      ], { notes: ["Adding one month to 31 January lands on the last day of February, not on 2 or 3 March."] });
    },
    formula: "Add years, then months, clamping the day to the last valid day of the target month, then add days.",
    howItWorks: "Calendar arithmetic is not the same as adding 30 days and calling it a month. This calculator uses calendar months and keeps the same day-of-month when that day exists.",
    steps: ["Enter the start date.", "Choose add or subtract.", "Enter years, months, and days. Use zero for a unit you do not need."],
    example: "31 January 2026 plus 1 month is 28 February 2026.",
    faqs: [
      { q: "What happens in a leap year?", a: "31 January 2028 plus 1 month is 29 February 2028, because that day exists." },
      { q: "Can I find the gap instead?", a: "Yes. Use days between dates when both endpoints are already known." },
    ],
    related: ["days-between-dates-calculator", "countdown-calculator", "working-days-calculator"],
  },
  {
    slug: "time-duration-calculator",
    title: "Time duration calculator",
    description: "Find the hours and minutes between two times, including shifts that pass midnight.",
    category: "general",
    keywords: ["time duration", "hours between", "timesheet"],
    synonyms: ["elapsed time", "duration calculator"],
    inputs: [
      { id: "start", label: "Start time", type: "time", required: true, defaultValue: "09:30" },
      { id: "end", label: "End time", type: "time", required: true, defaultValue: "18:15" },
      { id: "breakMin", label: "Unpaid break", type: "number", unit: "minutes", defaultValue: "45", min: 0, required: true },
    ],
    compute: (v) => {
      const [sh, sm] = (v.start || "00:00").split(":").map(Number);
      const [eh, em] = (v.end || "00:00").split(":").map(Number);
      if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) throw new InputError("Enter both times.");
      let minutes = eh * 60 + em - (sh * 60 + sm);
      let crossed = false;
      if (minutes < 0) {
        minutes += 24 * 60;
        crossed = true;
      }
      const breakMin = readNumber(v, "breakMin", "Break", { min: 0 });
      const net = minutes - breakMin;
      if (net < 0) throw new InputError("The break is longer than the shift.");
      const grossH = Math.floor(minutes / 60);
      const grossM = minutes % 60;
      const netH = Math.floor(net / 60);
      const netM = net % 60;
      return pack([
        item("Net duration", `${netH} h ${netM} min`, true),
        item("Decimal hours", formatNumber(net / 60, 2)),
        item("Gross duration", `${grossH} h ${grossM} min`),
      ], { notes: crossed ? ["The end time is on the next day, so 24 hours were added before subtracting the break."] : ["Both times are treated as the same calendar day."] });
    },
    formula: "Duration in minutes = end − start, plus 1,440 if the shift crosses midnight, minus the break.",
    howItWorks: "Timesheets often fail when a shift ends after midnight. This page assumes a single overnight crossing, which covers a normal shift. It is not a multi-day project timer; use the date calculator plus this page for those.",
    steps: ["Enter start and end in 24-hour time.", "Enter unpaid break minutes, or zero.", "Use decimal hours if you multiply by an hourly rate."],
    example: "09:30 to 18:15 is 8 hours 45 minutes gross. A 45-minute break leaves 8.00 hours.",
    faqs: [
      { q: "Does it handle time zones?", a: "No. Both times are clock times in the same zone. Use the time zone converter first if the clocks differ." },
      { q: "Can the break be in hours?", a: "Enter it in minutes. One hour is 60." },
    ],
    related: ["time-zone-converter", "hourly-wage-calculator", "date-calculator"],
  },
  {
    slug: "time-zone-converter",
    title: "Time zone converter",
    description: "Convert a civil date and time between major IANA time zones, including daylight-saving rules.",
    category: "general",
    keywords: ["time zone", "IST", "EST", "UTC converter"],
    synonyms: ["world clock converter", "timezone"],
    inputs: [
      { id: "date", label: "Date", type: "date", required: true, defaultValue: "2026-03-21" },
      { id: "time", label: "Time", type: "time", required: true, defaultValue: "18:30" },
      { id: "from", label: "From", type: "select", defaultValue: "Asia/Kolkata", options: zoneOptions },
      { id: "to", label: "To", type: "select", defaultValue: "America/New_York", options: zoneOptions },
    ],
    compute: (v) => {
      const utc = zonedWallTimeToUtc(v.date || "", v.time || "", v.from || "UTC");
      return pack([
        item("Converted time", formatInZone(utc, v.to || "UTC"), true),
        item("UTC", formatInZone(utc, "UTC")),
        item("Source", formatInZone(utc, v.from || "UTC")),
      ], { notes: ["Offsets come from the browser’s IANA time-zone database, so daylight-saving changes are included for the date you enter."] });
    },
    formula: "Interpret the wall time in the source zone, convert to UTC, then format that instant in the target zone.",
    howItWorks: "A time zone is a region with rules, not a fixed offset. 18:30 in India is a specific instant. That same instant has another clock reading in New York, and the difference is not the same in January and July.",
    steps: ["Enter the date and time as shown on a clock in the source zone.", "Choose both zones.", "Read the target clock time. The date may change."],
    example: "21 March 2026, 18:30 in India, is morning in New York on the same calendar date.",
    faqs: [
      { q: "Why is my city missing?", a: "The list is a practical set of major zones, not every city. Pick a city that shares the zone, such as Paris for Berlin in winter and summer under current EU rules." },
      { q: "Does India observe daylight saving?", a: "No. Asia/Kolkata is UTC+5:30 all year." },
    ],
    related: ["time-duration-calculator", "unix-timestamp-converter", "date-calculator"],
  },
  {
    slug: "countdown-calculator",
    title: "Countdown calculator",
    description: "Count the days, hours, and minutes from now, or from a chosen moment, until a target.",
    category: "general",
    keywords: ["countdown", "days until", "timer date"],
    synonyms: ["how many days until"],
    inputs: [
      { id: "target", label: "Target date", type: "date", required: true, defaultValue: "2026-12-31" },
      { id: "time", label: "Target time", type: "time", defaultValue: "23:59" },
      { id: "from", label: "Count from", type: "date", required: true, defaultValue: "2026-03-21" },
    ],
    compute: (v) => {
      const from = parseISODate(v.from || "", "start date");
      const [hh, mm] = (v.time || "00:00").split(":").map(Number);
      const target = parseISODate(v.target || "", "target date");
      target.setHours(hh || 0, mm || 0, 0, 0);
      const ms = target.getTime() - from.getTime();
      const parts = durationFromMs(ms);
      const label = ms >= 0 ? "Remaining" : "Elapsed since the target";
      return pack([
        item(label, `${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`, true),
        item("Total days", formatNumber(Math.abs(ms) / 86_400_000, 2)),
        item("Target", formatLongDate(target)),
      ]);
    },
    formula: "Remaining = target instant − start of the from-date, in milliseconds.",
    howItWorks: "The from-date is treated as local midnight so the result is stable on the page. For a live second-by-second countdown to an event, use the event countdown, which is aimed at a named date.",
    steps: ["Enter the target date and time.", "Enter the date you are counting from.", "A negative gap means the target has passed."],
    example: "From 21 March 2026 to 31 December 2026 at 23:59 is 285 days and 23 hours.",
    faqs: [
      { q: "Does it update every second?", a: "No. It calculates the interval between the two values you enter, which is what you want for a plan. Refresh the from-date if you want today’s count." },
      { q: "Are time zones applied?", a: "Both values use your browser’s local calendar. Convert zones first if the event is announced in another zone." },
    ],
    related: ["event-countdown", "birthday-countdown", "days-between-dates-calculator"],
  },
  {
    slug: "working-days-calculator",
    title: "Working days calculator",
    description: "Count weekdays between two dates and optionally exclude holiday dates you list.",
    category: "general",
    keywords: ["working days", "business days", "weekdays between"],
    synonyms: ["workday calculator", "business day counter"],
    inputs: [
      { id: "start", label: "Start date", type: "date", required: true, defaultValue: "2026-03-02" },
      { id: "end", label: "End date", type: "date", required: true, defaultValue: "2026-03-31" },
      { id: "inclusive", label: "Include the end date", type: "select", defaultValue: "yes", options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ] },
      { id: "holidays", label: "Holidays", type: "textarea", rows: 4, placeholder: "2026-03-25", help: "One YYYY-MM-DD per line. Weekends in this list are already excluded." },
    ],
    compute: (v) => {
      const start = parseISODate(v.start || "", "start date");
      const end = parseISODate(v.end || "", "end date");
      const holidays = (v.holidays || "").split(/\n/).map((line) => line.trim()).filter(Boolean).map((line) => parseISODate(line, "holiday"));
      const days = countWorkingDays(start, end, holidays, v.inclusive !== "no");
      const calendar = Math.abs(daysBetween(start, end)) + (v.inclusive !== "no" ? 1 : 0);
      return pack([
        item("Working days", formatInt(days), true),
        item("Calendar days in the same span", formatInt(calendar)),
        item("Holidays excluded", formatInt(holidays.filter((h) => h >= start && h <= end && h.getDay() !== 0 && h.getDay() !== 6).length)),
      ], { notes: ["Saturday and Sunday are treated as non-working. A region with a different weekend should add those dates to the holiday list."] });
    },
    formula: "Working days = dates in the span that are not Saturday, Sunday, or a listed holiday.",
    howItWorks: "There is no universal holiday calendar, so this tool does not pretend to know public holidays. You supply the dates that matter for your office or contract. The count is reproducible from those inputs.",
    steps: ["Enter the start and end dates.", "Decide whether the end date is a working day that should count.", "Paste holiday dates, one per line."],
    example: "2 March 2026 to 31 March 2026, including the end date and with no extra holidays, is 22 working days.",
    faqs: [
      { q: "Does it know national holidays?", a: "No. Holiday lists differ by country, state, and employer. Paste the ones that apply." },
      { q: "What if the start date is after the end date?", a: "The calculation stops and asks you to swap them, rather than returning a negative working-day count that is easy to misuse." },
    ],
    related: ["days-between-dates-calculator", "date-calculator", "time-duration-calculator"],
  },
];
