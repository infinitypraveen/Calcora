import { addDays, formatLongDate, parseISODate } from "@/lib/dates";
import { formatNumber, InputError, readNumber } from "@/lib/format";
import {
  activityFactor,
  activityFactors,
  bmi,
  bmiCategory,
  bmrHarris,
  bmrMifflin,
  brzycki1rm,
  caloriesFromMet,
  epley1rm,
  idealWeightRange,
  leanBodyMassBoer,
  metActivities,
  navyBodyFat,
  type Sex,
} from "@/lib/health";
import { HEALTH_DISCLAIMER, PREGNANCY_DISCLAIMER, item, pack, type CalcDef } from "../types";

function sexOf(value: string): Sex {
  return value === "male" ? "male" : "female";
}

function metricWeight(v: Record<string, string>, id = "weight"): number {
  return readNumber(v, id, "Weight", { min: 20, max: 400 });
}

function metricHeight(v: Record<string, string>, id = "height"): number {
  return readNumber(v, id, "Height", { min: 80, max: 250 });
}

const sexField = {
  id: "sex",
  label: "Sex for the formula",
  type: "select" as const,
  defaultValue: "female",
  options: [
    { value: "female", label: "Female" },
    { value: "male", label: "Male" },
  ],
  help: "These formulas were fitted on binary sex categories. They are a poor fit for many people. Treat the result as a rough screen.",
};

export const healthCalcs: CalcDef[] = [
  {
    slug: "bmi-calculator",
    title: "BMI calculator",
    description: "Calculate body mass index from height and weight, and read the WHO ranges with their limits.",
    category: "health",
    keywords: ["bmi", "body mass index", "healthy weight"],
    synonyms: ["bmi women", "bmi men", "obesity screening"],
    featured: 2,
    disclaimer: HEALTH_DISCLAIMER,
    affiliateTags: ["health"],
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true, min: 20, max: 400 },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true, min: 80, max: 250 },
    ],
    compute: (v) => {
      const value = bmi(metricWeight(v), metricHeight(v));
      return pack([
        item("BMI", formatNumber(value, 1), true),
        item("WHO adult range", bmiCategory(value)),
        item("Height in metres", formatNumber(metricHeight(v) / 100, 2)),
      ], { notes: ["WHO adult ranges are under 18.5, 18.5–24.9, 25–29.9, and 30 or above. They were not designed for children, athletes with high muscle mass, or pregnancy."] });
    },
    formula: "BMI = weight (kg) / height (m)².",
    howItWorks: "BMI compares weight with height. It is a population screening ratio, not a measure of body fat, fitness, or health. Two people with the same BMI can have very different muscle, bone, and fat. The category labels come from adult WHO cut-offs and should not be read as a diagnosis.",
    steps: ["Enter weight in kilograms and height in centimetres.", "The page converts height to metres and squares it.", "Compare the number with the range, then read the limitation before acting on it."],
    example: "68 kg and 168 cm: 68 / 1.68² = 24.1, inside the normal-weight band.",
    faqs: [
      { q: "Does BMI differ for men and women?", a: "The formula is the same. Average body composition differs, which is one reason a single cut-off is a blunt tool." },
      { q: "What should I do with a high or low result?", a: "Use it as a prompt to talk with a clinician if you are worried, not as a verdict. Waist measurement and how you feel matter as well." },
    ],
    related: ["waist-to-height-calculator", "ideal-weight-calculator", "bmr-calculator"],
  },
  {
    slug: "bmr-calculator",
    title: "BMR calculator",
    description: "Estimate basal metabolic rate with the Mifflin–St Jeor equation, and compare it with revised Harris–Benedict.",
    category: "health",
    keywords: ["bmr", "basal metabolic rate", "mifflin"],
    synonyms: ["resting calories", "bmr women"],
    featured: 12,
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "age", label: "Age", type: "number", unit: "years", defaultValue: "34", required: true, min: 15, max: 100 },
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
    ],
    compute: (v) => {
      const sex = sexOf(v.sex);
      const age = readNumber(v, "age", "Age", { min: 15, max: 100 });
      const weight = metricWeight(v);
      const height = metricHeight(v);
      const mifflin = bmrMifflin(sex, weight, height, age);
      const harris = bmrHarris(sex, weight, height, age);
      return pack([
        item("Mifflin–St Jeor BMR", `${formatNumber(mifflin, 0)} kcal/day`, true),
        item("Revised Harris–Benedict", `${formatNumber(harris, 0)} kcal/day`),
        item("Difference", `${formatNumber(mifflin - harris, 0)} kcal/day`),
      ], { notes: ["BMR is the energy of a resting body, not the energy of a normal day. Use TDEE to include activity."] });
    },
    formula: "Mifflin–St Jeor, women: 10W + 6.25H − 5A − 161. Men: 10W + 6.25H − 5A + 5. Weight is kg, height cm, age years.",
    howItWorks: "Mifflin–St Jeor is widely used because it was fitted more recently than the original Harris–Benedict equation. Both are population equations. Illness, pregnancy, thyroid disease, and some medicines move true expenditure away from the estimate.",
    steps: ["Enter age, weight, and height.", "Choose the sex category the equation was built with.", "Use the Mifflin figure as the primary estimate and treat the gap between equations as uncertainty, not as a target."],
    example: "A 34-year-old woman, 68 kg and 168 cm, has a Mifflin–St Jeor BMR of about 1,409 kcal/day.",
    faqs: [
      { q: "Is BMR the number of calories I should eat?", a: "No. Eating at BMR would ignore walking, work, and digestion. Start from TDEE if you are estimating intake, and involve a clinician for a diet." },
      { q: "Which equation should I trust?", a: "Neither is a measurement. Mifflin–St Jeor is the default here. A lab measurement is the only personal figure." },
    ],
    related: ["tdee-calculator", "daily-calorie-calculator", "bmi-calculator"],
  },
  {
    slug: "tdee-calculator",
    title: "TDEE calculator",
    description: "Estimate total daily energy expenditure from BMR and a described activity level.",
    category: "health",
    keywords: ["tdee", "maintenance calories", "activity factor"],
    synonyms: ["total daily energy expenditure"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "age", label: "Age", type: "number", unit: "years", defaultValue: "34", required: true, min: 15, max: 100 },
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
      { id: "activity", label: "Activity", type: "select", defaultValue: "light", options: activityFactors.map((a) => ({ value: a.id, label: a.label })) },
    ],
    compute: (v) => {
      const bmr = bmrMifflin(sexOf(v.sex), metricWeight(v), metricHeight(v), readNumber(v, "age", "Age", { min: 15, max: 100 }));
      const factor = activityFactor(v.activity);
      return pack([
        item("Estimated TDEE", `${formatNumber(bmr * factor, 0)} kcal/day`, true),
        item("BMR used", `${formatNumber(bmr, 0)} kcal/day`),
        item("Activity factor", formatNumber(factor, 3)),
      ], { notes: ["Activity factors are broad buckets. A step counter or a few weeks of weight trend will beat a single factor."] });
    },
    formula: "TDEE ≈ BMR × activity factor.",
    howItWorks: "Total daily energy expenditure adds movement and the thermic effect of food, roughly, by multiplying BMR by a factor from 1.2 to 1.9. The factor is the weak part of the estimate. People overstate planned exercise and undercount daily walking, or the reverse.",
    steps: ["Calculate BMR from age, size, and the formula’s sex category.", "Pick the activity description that matches a typical week, not your best week.", "Use the result as a starting band, not a prescription."],
    example: "A BMR of 1,409 kcal and a light-activity factor of 1.375 gives about 1,937 kcal/day.",
    faqs: [
      { q: "Should I eat my TDEE?", a: "TDEE estimates maintenance. Eating more or less changes weight over time, with wide individual variation. It is not a meal plan." },
      { q: "Why is my watch different?", a: "Watches use heart rate and motion models with their own error. A gap of a few hundred calories is ordinary." },
    ],
    related: ["daily-calorie-calculator", "calorie-deficit-calculator", "bmr-calculator"],
  },
  {
    slug: "daily-calorie-calculator",
    title: "Daily calorie needs calculator",
    description: "A plain-language maintenance estimate, with a range rather than a false-precise target.",
    category: "health",
    keywords: ["calorie needs", "daily calories", "maintenance"],
    synonyms: ["how many calories should I eat"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "age", label: "Age", type: "number", unit: "years", defaultValue: "34", required: true, min: 15, max: 100 },
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
      { id: "activity", label: "Typical week", type: "select", defaultValue: "moderate", options: activityFactors.map((a) => ({ value: a.id, label: a.label })) },
    ],
    compute: (v) => {
      const bmr = bmrMifflin(sexOf(v.sex), metricWeight(v), metricHeight(v), readNumber(v, "age", "Age", { min: 15, max: 100 }));
      const tdee = bmr * activityFactor(v.activity);
      return pack([
        item("Central estimate", `${formatNumber(tdee, 0)} kcal/day`, true),
        item("Planning range", `${formatNumber(tdee * 0.9, 0)} – ${formatNumber(tdee * 1.1, 0)} kcal/day`, false, "About ±10%, a more honest band than a single number."),
      ]);
    },
    formula: "Same Mifflin–St Jeor BMR and activity factor as the TDEE page, reported as a range.",
    howItWorks: "Daily needs are not a single calorie. Appetite, sleep, and a change in routine move intake and burn. This page uses the same maths as the TDEE calculator but presents a band, which is the more useful way to read an estimate.",
    steps: ["Enter the same body details you would for BMR.", "Choose a typical week.", "Plan inside the range, and adjust from a trend in weight or energy rather than from one day."],
    example: "About 2,180 kcal/day at a moderate factor, with a planning band near 1,960–2,400 kcal.",
    faqs: [
      { q: "Is the low end a diet?", a: "No. The band is uncertainty around maintenance, not a deficit target. The deficit page is separate and carries a stronger caution." },
      { q: "Do children use this page?", a: "No. The equations and minimums here are for adults. A paediatric clinician should guide a child’s intake." },
    ],
    related: ["tdee-calculator", "macro-calculator", "calorie-deficit-calculator"],
  },
  {
    slug: "calorie-deficit-calculator",
    title: "Calorie deficit calculator",
    description: "Subtract a chosen deficit from an estimated maintenance intake, and flag very low targets.",
    category: "health",
    keywords: ["calorie deficit", "weight loss calories"],
    synonyms: ["cutting calories"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "tdee", label: "Estimated maintenance", type: "number", unit: "kcal/day", defaultValue: "2100", required: true, min: 800, max: 8000 },
      { id: "deficit", label: "Daily deficit", type: "number", unit: "kcal", defaultValue: "500", required: true, min: 0, max: 2000 },
      sexField,
    ],
    compute: (v) => {
      const tdee = readNumber(v, "tdee", "Maintenance", { min: 800, max: 8000 });
      const deficit = readNumber(v, "deficit", "Deficit", { min: 0, max: 2000 });
      const target = tdee - deficit;
      const floor = sexOf(v.sex) === "male" ? 1500 : 1200;
      const notes = [
        "A deficit of about 500 kcal/day is a common planning figure, not a rule. It is roughly associated with 0.5 kg a week only if 7,700 kcal per kilogram holds, which is a simplification.",
      ];
      if (target < floor) notes.push(`The target is below ${floor} kcal/day, a level often cited as a floor for unsupervised adult diets. Do not use it without clinical advice.`);
      return pack([
        item("Intake target", `${formatNumber(target, 0)} kcal/day`, true),
        item("Weekly deficit", `${formatNumber(deficit * 7, 0)} kcal`),
        item("Rough weight change", `${formatNumber((deficit * 7) / 7700, 2)} kg/week`, false, "Using 7,700 kcal per kilogram, an approximation."),
      ], { notes });
    },
    formula: "Target = maintenance − deficit. Illustrative weekly change ≈ deficit × 7 / 7,700.",
    howItWorks: "A deficit is the gap between energy in and energy out. This page does not know your true expenditure. It only subtracts the deficit you choose from the maintenance figure you supply, then warns if the result is very low.",
    steps: ["Get a maintenance estimate from the TDEE page or from your own trend.", "Choose a modest deficit.", "Stop and get advice if the warning about a low target appears, or if you are pregnant, ill, or have a history of disordered eating."],
    example: "2,100 − 500 = 1,600 kcal/day, about 0.45 kg a week on the 7,700 kcal rule of thumb.",
    faqs: [
      { q: "Is 1,200 calories safe?", a: "Not as a general target. It is a number that appears in old diet plans. It can be too low, especially for larger or more active adults." },
      { q: "Will I lose exactly the predicted weight?", a: "No. Water, glycogen, and metabolic adaptation make weekly change uneven." },
    ],
    related: ["weight-loss-timeline-calculator", "tdee-calculator", "macro-calculator"],
  },
  {
    slug: "ideal-weight-calculator",
    title: "Ideal weight calculator",
    description: "Compare Devine, Robinson, and Miller adult formulas. They disagree, which is the point.",
    category: "health",
    keywords: ["ideal weight", "devine formula", "healthy weight range"],
    synonyms: ["ibw"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
    ],
    compute: (v) => {
      const height = metricHeight(v);
      const range = idealWeightRange(sexOf(v.sex), height);
      const values = [range.devine, range.robinson, range.miller];
      return pack([
        item("Formula span", `${formatNumber(Math.min(...values), 1)} – ${formatNumber(Math.max(...values), 1)} kg`, true),
        item("Devine", `${formatNumber(range.devine, 1)} kg`),
        item("Robinson", `${formatNumber(range.robinson, 1)} kg`),
        item("Miller", `${formatNumber(range.miller, 1)} kg`),
      ], { notes: ["These formulas were built for drug dosing and population description, not as a personal goal weight. They are less meaningful far below 152 cm."] });
    },
    formula: "Devine, men: 50 kg + 2.3 kg per inch over 5 feet. Women: 45.5 kg + 2.3 kg per inch over 5 feet.",
    howItWorks: "There is no single ideal weight. The three formulas use height and a sex category and still disagree by several kilograms. Showing the span is more honest than crowning one number.",
    steps: ["Enter height.", "Read the span, not a target.", "Prefer a clinician’s advice over any of these formulas if weight is a medical question."],
    example: "At 168 cm the three women’s formulas cluster in the high 50s to low 60s kilograms, depending on the equation.",
    faqs: [
      { q: "Should I aim for the lowest figure?", a: "No. The lowest formula is not healthier. Frame, muscle, and health markers are outside these equations." },
      { q: "Do the formulas work for children?", a: "No." },
    ],
    related: ["bmi-calculator", "waist-to-height-calculator", "lean-body-mass-calculator"],
  },
  {
    slug: "body-fat-calculator",
    title: "Body fat percentage estimator",
    description: "Estimate body fat with the US Navy circumference method. It is a screening equation, not a scan.",
    category: "health",
    keywords: ["body fat", "navy method", "body fat percentage"],
    synonyms: ["body fat calculator"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
      { id: "neck", label: "Neck", type: "number", unit: "cm", defaultValue: "34", required: true, min: 20, max: 60 },
      { id: "waist", label: "Waist", type: "number", unit: "cm", defaultValue: "80", required: true, min: 40, max: 200, help: "At the navel for the men’s equation; at the narrowest point for the women’s equation, as the method specifies." },
      { id: "hip", label: "Hip", type: "number", unit: "cm", defaultValue: "98", required: true, min: 40, max: 200, showIf: { field: "sex", equals: "female" } },
    ],
    compute: (v) => {
      const sex = sexOf(v.sex);
      const fat = navyBodyFat(sex, metricHeight(v), readNumber(v, "neck", "Neck", { min: 20, max: 60 }), readNumber(v, "waist", "Waist", { min: 40, max: 200 }), sex === "female" ? readNumber(v, "hip", "Hip", { min: 40, max: 200 }) : 0);
      if (fat < 2 || fat > 70) throw new InputError("The measurements produce an implausible percentage. Check the tape positions and units.");
      return pack([
        item("Estimated body fat", `${formatNumber(fat, 1)}%`, true),
        item("Method", "US Navy circumference equation"),
      ], { notes: ["Tape placement changes the result by several points. A DEXA or a skilled caliper reading is a different measurement, not a correction of this one."] });
    },
    formula: "Men: 86.010×log10(waist−neck) − 70.041×log10(height) + 36.76, with measurements in inches.",
    howItWorks: "The US Navy method estimates fat from circumferences because those measurements are cheap. The constants were fitted to a specific population. A result outside a broad human range usually means a tape error, not a metabolic discovery.",
    steps: ["Measure in centimetres. The page converts to inches for the published constants.", "Use the tape positions the method expects.", "Repeat the measurement rather than treating one reading as exact."],
    example: "Small changes in waist or neck move the estimate by a point or more, which is why the page does not present it as a precise body-fat lab value.",
    faqs: [
      { q: "Is this a medical body-composition test?", a: "No. It is a circumference equation. It cannot see visceral fat or muscle the way imaging can." },
      { q: "What if hip is hidden?", a: "The women’s equation needs a hip measurement. Switch the formula category or enter the hip circumference." },
    ],
    related: ["lean-body-mass-calculator", "waist-to-height-calculator", "bmi-calculator"],
  },
  {
    slug: "lean-body-mass-calculator",
    title: "Lean body mass calculator",
    description: "Estimate lean body mass with the Boer formula from weight and height.",
    category: "health",
    keywords: ["lean body mass", "lbm", "boer formula"],
    synonyms: ["fat free mass"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      sexField,
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
    ],
    compute: (v) => {
      const weight = metricWeight(v);
      const lbm = leanBodyMassBoer(sexOf(v.sex), weight, metricHeight(v));
      if (lbm <= 0 || lbm > weight) throw new InputError("The formula returned a value outside a usable range for these inputs. It is not reliable at extreme heights or weights.");
      return pack([
        item("Estimated lean mass", `${formatNumber(lbm, 1)} kg`, true),
        item("Remainder", `${formatNumber(weight - lbm, 1)} kg`, false, "Not a measured fat mass."),
        item("Lean share of weight", `${formatNumber((lbm / weight) * 100, 1)}%`),
      ]);
    },
    formula: "Boer, men: 0.407×weight + 0.267×height − 19.2. Women: 0.252×weight + 0.473×height − 48.3.",
    howItWorks: "Lean body mass here means the Boer estimate of everything that is not the formula’s implied fat compartment. It is used in some dosing contexts. It is not a scan, and it should not be used to set a supplement dose without a professional.",
    steps: ["Enter weight and height.", "Read lean mass as an estimate.", "Do not subtract it from weight and call the remainder a clinical fat measurement."],
    example: "The Boer women’s equation at 68 kg and 168 cm is in the mid-40 kg range. Your tape or scan can differ.",
    faqs: [
      { q: "Can I use this for protein dosing?", a: "The protein page uses total body weight and a range. Do not invent a dose from lean mass without advice." },
      { q: "Why might the result be rejected?", a: "At unusual sizes the linear formula can exceed body weight. That is a model failure, so the page stops." },
    ],
    related: ["body-fat-calculator", "protein-intake-calculator", "ideal-weight-calculator"],
  },
  {
    slug: "protein-intake-calculator",
    title: "Protein intake calculator",
    description: "Show a protein range in grams per kilogram, not a single prescribed dose.",
    category: "health",
    keywords: ["protein", "grams per kg", "protein intake"],
    synonyms: ["how much protein"],
    disclaimer: HEALTH_DISCLAIMER,
    affiliateTags: ["health"],
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "goal", label: "Context", type: "select", defaultValue: "active", options: [
        { value: "general", label: "General adult reference, about 0.8 g/kg" },
        { value: "active", label: "Regular training, about 1.2–1.6 g/kg" },
        { value: "strength", label: "Strength or fat-loss training, about 1.6–2.2 g/kg" },
      ] },
    ],
    compute: (v) => {
      const weight = metricWeight(v);
      const bands = { general: [0.8, 0.8], active: [1.2, 1.6], strength: [1.6, 2.2] } as const;
      const [low, high] = bands[(v.goal as keyof typeof bands) || "active"];
      return pack([
        item("Protein range", low === high ? `${formatNumber(weight * low, 0)} g/day` : `${formatNumber(weight * low, 0)} – ${formatNumber(weight * high, 0)} g/day`, true),
        item("Per kilogram", low === high ? `${low} g` : `${low}–${high} g`),
      ], { notes: ["Kidney disease, pregnancy, and some metabolic conditions change protein advice. This range is not a prescription."] });
    },
    formula: "Grams per day = body weight (kg) × grams per kilogram for the chosen context.",
    howItWorks: "Protein recommendations are ranges because training, energy intake, and age all move the useful amount. A single gram target looks precise and usually is not. The bands here follow commonly cited sports-nutrition ranges, not a personalised diet.",
    steps: ["Enter body weight.", "Choose the context closest to your week.", "Use the range as a discussion point with a dietitian if you need a plan."],
    example: "68 kg at 1.2–1.6 g/kg is about 82–109 g of protein a day.",
    faqs: [
      { q: "Is more always better?", a: "No. Above the upper end of a training range, extra protein is not a shortcut, and some people need less for medical reasons." },
      { q: "Do I use ideal weight or current weight?", a: "This page uses the weight you enter. A dietitian may choose a different reference weight." },
    ],
    related: ["macro-calculator", "lean-body-mass-calculator", "tdee-calculator"],
  },
  {
    slug: "water-intake-calculator",
    title: "Water intake estimator",
    description: "Estimate a daily fluid starting point from body weight and exercise time. Thirst and climate still matter.",
    category: "health",
    keywords: ["water intake", "hydration", "how much water"],
    synonyms: ["drink water calculator"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "ml", label: "Millilitres per kilogram", type: "number", defaultValue: "35", min: 20, max: 50, required: true },
      { id: "exercise", label: "Exercise", type: "number", unit: "minutes", defaultValue: "30", min: 0, max: 300, required: true },
    ],
    compute: (v) => {
      const weight = metricWeight(v);
      const mlPerKg = readNumber(v, "ml", "Millilitres per kilogram", { min: 20, max: 50 });
      const exercise = readNumber(v, "exercise", "Exercise", { min: 0, max: 300 });
      const ml = weight * mlPerKg + exercise * 12;
      return pack([
        item("Starting estimate", `${formatNumber(ml / 1000, 2)} litres`, true),
        item("From body size", `${formatNumber((weight * mlPerKg) / 1000, 2)} litres`),
        item("Exercise add-on", `${formatNumber((exercise * 12) / 1000, 2)} litres`, false, "About 12 ml per minute, a rough planning add-on."),
      ], { notes: ["Fluid also comes from food. Heat, altitude, illness, and some medicines change needs. Do not force a large volume if a clinician has limited your fluids."] });
    },
    formula: "Millilitres ≈ weight × ml/kg + exercise minutes × 12.",
    howItWorks: "The familiar “eight glasses” rule ignores body size. A millilitres-per-kilogram figure is still only a start. Urine colour, thirst, and medical advice are better guides than hitting a litre target exactly.",
    steps: ["Enter weight.", "Leave 35 ml/kg unless you have a reason to use another planning factor.", "Add exercise minutes. Drink to thirst in addition to any plan, unless you are on a fluid restriction."],
    example: "68 kg × 35 ml, plus 30 minutes × 12 ml, is about 2.74 litres.",
    faqs: [
      { q: "Does coffee count?", a: "Ordinary caffeinated drinks contribute to fluid for most people. They are not a reason to ignore thirst." },
      { q: "Can I drink too much?", a: "Yes. Very large volumes in a short time can be dangerous. This estimator is not a challenge." },
    ],
    related: ["tdee-calculator", "exercise-calorie-calculator", "protein-intake-calculator"],
  },
  {
    slug: "macro-calculator",
    title: "Macro calculator",
    description: "Split a calorie target into protein, fat, and carbohydrate grams.",
    category: "health",
    keywords: ["macros", "protein carbs fat", "iifym"],
    synonyms: ["macro split"],
    disclaimer: HEALTH_DISCLAIMER,
    affiliateTags: ["health", "macro-calculator"],
    inputs: [
      { id: "calories", label: "Calorie target", type: "number", unit: "kcal", defaultValue: "2000", required: true, min: 800, max: 8000 },
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "protein", label: "Protein", type: "number", unit: "g/kg", defaultValue: "1.6", required: true, min: 0.5, max: 3 },
      { id: "fatPct", label: "Fat share of calories", type: "number", unit: "%", defaultValue: "30", required: true, min: 15, max: 60 },
    ],
    compute: (v) => {
      const calories = readNumber(v, "calories", "Calories", { min: 800, max: 8000 });
      const weight = metricWeight(v);
      const proteinPerKg = readNumber(v, "protein", "Protein", { min: 0.5, max: 3 });
      const fatPct = readNumber(v, "fatPct", "Fat share", { min: 15, max: 60 });
      const proteinG = weight * proteinPerKg;
      const proteinKcal = proteinG * 4;
      const fatKcal = calories * (fatPct / 100);
      const fatG = fatKcal / 9;
      const carbKcal = calories - proteinKcal - fatKcal;
      if (carbKcal < 0) throw new InputError("Protein and fat already exceed the calorie target. Lower one of them.");
      return pack([
        item("Protein", `${formatNumber(proteinG, 0)} g`, true, `${formatNumber(proteinKcal, 0)} kcal`),
        item("Fat", `${formatNumber(fatG, 0)} g`, false, `${formatNumber(fatKcal, 0)} kcal`),
        item("Carbohydrate", `${formatNumber(carbKcal / 4, 0)} g`, false, `${formatNumber(carbKcal, 0)} kcal`),
      ], { notes: ["4 kcal per gram of protein or carbohydrate and 9 kcal per gram of fat are Atwater averages. Food labels can differ slightly."] });
    },
    formula: "Protein grams = weight × g/kg. Fat grams = calories × fat% / 9. Carbohydrate fills the remaining calories at 4 kcal/g.",
    howItWorks: "A macro split is an accounting identity once you fix calories, protein, and fat. It does not know which foods you tolerate or whether the calorie target is appropriate. Carbohydrate is the remainder so the three macros sum to the calorie target.",
    steps: ["Set a calorie target from the TDEE or deficit page.", "Choose protein in g/kg.", "Choose a fat percentage. Carbohydrate is whatever energy remains."],
    example: "2,000 kcal, 68 kg, 1.6 g/kg protein, and 30% fat leaves about 109 g protein, 67 g fat, and 218 g carbohydrate.",
    faqs: [
      { q: "Do I have to hit the grams exactly?", a: "No. A daily band is more realistic than a gram-perfect target." },
      { q: "Is a low carbohydrate result a keto plan?", a: "Only if you chose inputs that leave little carbohydrate. This page does not recommend a diet style." },
    ],
    related: ["protein-intake-calculator", "daily-calorie-calculator", "calorie-deficit-calculator"],
  },
  {
    slug: "weight-loss-timeline-calculator",
    title: "Weight loss timeline estimator",
    description: "Translate a daily deficit into a rough timeline. The 7,700 kcal rule is an approximation.",
    category: "health",
    keywords: ["weight loss timeline", "how long to lose weight"],
    synonyms: ["weeks to goal weight"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "kg", label: "Weight to lose", type: "number", unit: "kg", defaultValue: "5", required: true, min: 0.1, max: 100 },
      { id: "deficit", label: "Daily deficit", type: "number", unit: "kcal", defaultValue: "500", required: true, min: 100, max: 1500 },
    ],
    compute: (v) => {
      const kg = readNumber(v, "kg", "Weight", { min: 0.1, max: 100 });
      const deficit = readNumber(v, "deficit", "Deficit", { min: 100, max: 1500 });
      const days = (kg * 7700) / deficit;
      return pack([
        item("Rough timeline", `${formatNumber(days / 7, 1)} weeks`, true),
        item("Days", formatNumber(days, 0)),
        item("Energy gap used", `${formatNumber(kg * 7700, 0)} kcal`),
      ], { notes: ["Real loss is rarely linear. The first week often includes water. Later weeks can slow as expenditure falls. This is not a promise."] });
    },
    formula: "Days ≈ kilograms × 7,700 / daily deficit.",
    howItWorks: "A kilogram of body tissue is often approximated as 7,700 kcal. The true energy density depends on how much of the loss is water, glycogen, fat, or lean tissue. The timeline is a planning sketch.",
    steps: ["Enter a modest amount of weight, not an aggressive target.", "Use a deficit you can actually sustain.", "Revisit the estimate after a few weeks of real data."],
    example: "5 kg at 500 kcal/day is about 77 days, or 11 weeks, on the 7,700 kcal rule.",
    faqs: [
      { q: "Why did I lose more in week one?", a: "Glycogen and water shift quickly. That is not a faster fat-loss rate you should expect to keep." },
      { q: "Can I use a 1,500 kcal deficit?", a: "The field allows it so you can see how aggressive it looks. It is often a poor idea without supervision." },
    ],
    related: ["calorie-deficit-calculator", "tdee-calculator", "bmi-calculator"],
  },
  {
    slug: "pace-calculator",
    title: "Pace calculator",
    description: "Convert a distance and a time into pace per kilometre or mile, and into speed.",
    category: "health",
    keywords: ["pace", "min per km", "running pace"],
    synonyms: ["race pace"],
    inputs: [
      { id: "distance", label: "Distance", type: "number", defaultValue: "10", required: true, min: 0.01 },
      { id: "unit", label: "Distance unit", type: "select", defaultValue: "km", options: [
        { value: "km", label: "Kilometres" },
        { value: "mi", label: "Miles" },
      ] },
      { id: "hours", label: "Hours", type: "number", defaultValue: "0", min: 0, required: true },
      { id: "minutes", label: "Minutes", type: "number", defaultValue: "55", min: 0, required: true },
      { id: "seconds", label: "Seconds", type: "number", defaultValue: "0", min: 0, max: 59, required: true },
    ],
    compute: (v) => {
      const distance = readNumber(v, "distance", "Distance", { min: 0.01 });
      const hours = readNumber(v, "hours", "Hours", { min: 0 });
      const minutes = readNumber(v, "minutes", "Minutes", { min: 0 });
      const seconds = readNumber(v, "seconds", "Seconds", { min: 0, max: 59 });
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;
      if (totalSeconds <= 0) throw new InputError("Enter a time greater than zero.");
      const km = v.unit === "mi" ? distance * 1.609344 : distance;
      const pace = totalSeconds / km;
      const paceMin = Math.floor(pace / 60);
      const paceSec = Math.round(pace % 60);
      return pack([
        item("Pace", `${paceMin}:${String(paceSec).padStart(2, "0")} per km`, true),
        item("Speed", `${formatNumber(km / (totalSeconds / 3600), 2)} km/h`),
        item("Mile pace", `${formatNumber((totalSeconds / (km / 1.609344)) / 60, 2)} min/mile`),
      ]);
    },
    formula: "Pace (seconds per km) = total seconds / kilometres.",
    howItWorks: "Pace is the inverse of speed, written in minutes and seconds so runners can read a watch. A 10 km run in 55 minutes is not 5.5 min/km if you forget that 0.5 minutes is 30 seconds. This page keeps the seconds visible.",
    steps: ["Enter distance and choose kilometres or miles.", "Enter the finish time.", "Use per-kilometre pace for most road signs outside the US, and the mile pace if your watch is set that way."],
    example: "10 km in 55:00 is 5:30 per km and 10.91 km/h.",
    faqs: [
      { q: "Does it include stops?", a: "The time you enter is the elapsed time. Stops make the pace slower, which is the correct race pace." },
      { q: "Can I predict a finish time?", a: "Divide the race distance by your intended speed, or multiply pace by distance. Conditions will still change the day." },
    ],
    related: ["running-speed-calculator", "walking-calorie-calculator", "exercise-calorie-calculator"],
  },
  {
    slug: "running-speed-calculator",
    title: "Running speed calculator",
    description: "Convert pace to speed and speed to pace, in kilometres and miles.",
    category: "health",
    keywords: ["running speed", "pace to speed", "km/h to min/km"],
    synonyms: ["mph running"],
    inputs: [
      { id: "mode", label: "I know", type: "select", defaultValue: "pace", options: [
        { value: "pace", label: "Pace in min/km" },
        { value: "speed", label: "Speed in km/h" },
      ] },
      { id: "paceMin", label: "Pace minutes", type: "number", defaultValue: "5", min: 0, showIf: { field: "mode", equals: "pace" }, required: true },
      { id: "paceSec", label: "Pace seconds", type: "number", defaultValue: "30", min: 0, max: 59, showIf: { field: "mode", equals: "pace" }, required: true },
      { id: "speed", label: "Speed", type: "number", unit: "km/h", defaultValue: "10", min: 0.1, showIf: { field: "mode", equals: "speed" }, required: true },
    ],
    compute: (v) => {
      let kmh: number;
      if (v.mode === "speed") kmh = readNumber(v, "speed", "Speed", { min: 0.1 });
      else {
        const seconds = readNumber(v, "paceMin", "Minutes", { min: 0 }) * 60 + readNumber(v, "paceSec", "Seconds", { min: 0, max: 59 });
        if (seconds <= 0) throw new InputError("Pace must be greater than zero.");
        kmh = 3600 / seconds;
      }
      const paceSeconds = 3600 / kmh;
      const min = Math.floor(paceSeconds / 60);
      const sec = Math.round(paceSeconds % 60);
      return pack([
        item("Speed", `${formatNumber(kmh, 2)} km/h`, true),
        item("Pace", `${min}:${String(sec).padStart(2, "0")} /km`),
        item("Miles per hour", formatNumber(kmh / 1.609344, 2)),
        item("Seconds per km", formatNumber(paceSeconds, 0)),
      ]);
    },
    formula: "Speed (km/h) = 3600 / pace in seconds per km.",
    howItWorks: "Treadmills often speak km/h while coaches speak in minutes per kilometre. This page only converts those languages. It does not predict fitness.",
    steps: ["Choose whether you are starting from pace or speed.", "Enter the figure from your watch or treadmill.", "Read the other form."],
    example: "5:30 per km is 10.91 km/h, or about 6.78 mph.",
    faqs: [
      { q: "Is treadmill pace the same as outdoor pace?", a: "The conversion is the same. The effort often is not, because the belt removes wind and the surface differs." },
      { q: "Why is 6 min/km not 10 km/h?", a: "10 km/h is exactly 6:00 per km. 5:30 is faster than 10 km/h." },
    ],
    related: ["pace-calculator", "speed-converter", "walking-calorie-calculator"],
  },
  {
    slug: "walking-calorie-calculator",
    title: "Walking calorie estimator",
    description: "Estimate energy used while walking from speed, time, and body weight using MET values.",
    category: "health",
    keywords: ["walking calories", "steps calories", "walk MET"],
    synonyms: ["calories burned walking"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "minutes", label: "Duration", type: "number", unit: "minutes", defaultValue: "40", required: true, min: 1, max: 600 },
      { id: "pace", label: "Walk", type: "select", defaultValue: "walk", options: metActivities.filter((a) => a.id.startsWith("walk")).map((a) => ({ value: a.id, label: a.label })) },
    ],
    compute: (v) => {
      const activity = metActivities.find((a) => a.id === v.pace) ?? metActivities[1];
      const kcal = caloriesFromMet(activity.met, metricWeight(v), readNumber(v, "minutes", "Duration", { min: 1, max: 600 }));
      return pack([
        item("Estimated energy", `${formatNumber(kcal, 0)} kcal`, true),
        item("MET used", formatNumber(activity.met, 1)),
        item("Per minute", `${formatNumber(kcal / readNumber(v, "minutes", "Duration"), 1)} kcal`),
      ], { notes: ["MET values are averages from physical-activity compilations. Hills, load, and fitness change the cost."] });
    },
    formula: "kcal ≈ MET × weight (kg) × hours.",
    howItWorks: "A MET is a multiple of resting oxygen use. Walking at a moderate pace is often listed near 3.5 METs. Multiplying by weight and time gives a planning estimate, not a measurement from your body.",
    steps: ["Enter weight and minutes.", "Pick the walk that matches the speed, not the effort you hope you felt.", "Treat the calories as a band of uncertainty of at least 10–20%."],
    example: "68 kg walking at 3.5 METs for 40 minutes uses about 159 kcal in this model.",
    faqs: [
      { q: "Do steps convert cleanly to calories?", a: "No. Step length and speed change the energy per step. Time and speed are the inputs here." },
      { q: "Should I eat back these calories?", a: "Not automatically. Estimates are rough, and double-counting exercise is a common reason plans stall." },
    ],
    related: ["exercise-calorie-calculator", "pace-calculator", "tdee-calculator"],
  },
  {
    slug: "exercise-calorie-calculator",
    title: "Exercise calorie estimator",
    description: "Estimate calories for common activities with published MET values and your body weight.",
    category: "health",
    keywords: ["calories burned", "exercise calories", "MET"],
    synonyms: ["workout calories"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "weight", label: "Weight", type: "number", unit: "kg", defaultValue: "68", required: true },
      { id: "minutes", label: "Duration", type: "number", unit: "minutes", defaultValue: "30", required: true, min: 1, max: 600 },
      { id: "activity", label: "Activity", type: "select", defaultValue: "cycle", options: metActivities.map((a) => ({ value: a.id, label: `${a.label} (${a.met} MET)` })) },
    ],
    compute: (v) => {
      const activity = metActivities.find((a) => a.id === v.activity) ?? metActivities[0];
      const minutes = readNumber(v, "minutes", "Duration", { min: 1, max: 600 });
      const kcal = caloriesFromMet(activity.met, metricWeight(v), minutes);
      return pack([
        item("Estimated energy", `${formatNumber(kcal, 0)} kcal`, true),
        item("Activity", activity.label),
        item("MET", formatNumber(activity.met, 1)),
      ]);
    },
    formula: "kcal ≈ MET × body weight (kg) × hours.",
    howItWorks: "The Compendium of Physical Activities and similar references assign MET values to tasks. Those values are averages across people. A watch may disagree. Neither number is a laboratory measurement of your session.",
    steps: ["Choose the closest activity, not a flattering one.", "Enter the time you actually moved.", "Use the result to compare sessions, not to justify a precise food offset."],
    example: "30 minutes of moderate cycling at 8 METs for a 68 kg person is about 272 kcal in this model.",
    faqs: [
      { q: "Where do the MET numbers come from?", a: "They are rounded values in the range published for these activities in physical-activity references. They are not measured on you." },
      { q: "Can I add activities?", a: "Run the calculator once per activity and add the results. Resting metabolism for the whole day is already inside TDEE, so do not add these on top of a full TDEE and also eat them back without thinking." },
    ],
    related: ["walking-calorie-calculator", "activity-calorie-calculator", "heart-rate-zone-calculator"],
  },
  {
    slug: "heart-rate-zone-calculator",
    title: "Heart rate zone calculator",
    description: "Estimate training zones with the Karvonen formula. Maximum heart rate from age is itself an estimate.",
    category: "health",
    keywords: ["heart rate zones", "karvonen", "target heart rate"],
    synonyms: ["hr zones", "cardio zones"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "age", label: "Age", type: "number", unit: "years", defaultValue: "34", required: true, min: 15, max: 90 },
      { id: "rest", label: "Resting heart rate", type: "number", unit: "bpm", defaultValue: "62", required: true, min: 30, max: 120 },
      { id: "max", label: "Maximum heart rate (optional)", type: "number", unit: "bpm", help: "Leave blank to use 220 − age, which can be off by more than 10 bpm." },
    ],
    compute: (v) => {
      const age = readNumber(v, "age", "Age", { min: 15, max: 90 });
      const rest = readNumber(v, "rest", "Resting heart rate", { min: 30, max: 120 });
      const maxInput = v.max?.trim() ? readNumber(v, "max", "Maximum heart rate", { min: 100, max: 230 }) : 220 - age;
      if (maxInput <= rest) throw new InputError("Maximum heart rate must be above the resting rate.");
      const reserve = maxInput - rest;
      const zones = [
        ["Zone 1 · recovery", 0.5, 0.6],
        ["Zone 2 · easy", 0.6, 0.7],
        ["Zone 3 · steady", 0.7, 0.8],
        ["Zone 4 · threshold", 0.8, 0.9],
        ["Zone 5 · hard", 0.9, 1],
      ] as const;
      return pack([
        item("Estimated max", `${formatNumber(maxInput, 0)} bpm`, true),
        item("Heart-rate reserve", `${formatNumber(reserve, 0)} bpm`),
        ...zones.map(([label, low, high]) => item(label, `${formatNumber(rest + reserve * low, 0)} – ${formatNumber(rest + reserve * high, 0)} bpm`)),
      ], { notes: ["Stop and get medical advice for chest pain, dizziness, or an unusually high rate. Zones are training labels, not a cardiac assessment."] });
    },
    formula: "Target = resting + (maximum − resting) × intensity. Estimated maximum = 220 − age if you do not enter one.",
    howItWorks: "Karvonen zones use heart-rate reserve, so a lower resting rate shifts the zones down compared with a plain percent of maximum. The 220−age rule is a rough population line. A measured maximum, if you have one from a supervised test, is better.",
    steps: ["Measure resting heart rate when calm, not after coffee or stairs.", "Enter a tested maximum if you have one.", "Use zones as effort guides. Perceived effort still matters."],
    example: "Age 34 and resting 62, with max estimated at 186, puts zone 2 near 136–149 bpm.",
    faqs: [
      { q: "Is 220 minus age accurate?", a: "It is a rule of thumb with a wide error. That is why the maximum field is optional and the limitation is stated." },
      { q: "Can I use this if I take heart medication?", a: "Do not set training from this page if a medicine changes your heart rate. Ask the clinician who prescribed it." },
    ],
    related: ["exercise-calorie-calculator", "pace-calculator", "one-rep-max-calculator"],
  },
  {
    slug: "one-rep-max-calculator",
    title: "One-rep max calculator",
    description: "Estimate a one-repetition maximum with the Epley and Brzycki formulas.",
    category: "health",
    keywords: ["one rep max", "1rm", "epley", "brzycki"],
    synonyms: ["bench max calculator"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "weight", label: "Weight lifted", type: "number", unit: "kg", defaultValue: "60", required: true, min: 1, max: 500 },
      { id: "reps", label: "Repetitions", type: "number", defaultValue: "5", required: true, min: 1, max: 15 },
    ],
    compute: (v) => {
      const weight = readNumber(v, "weight", "Weight", { min: 1, max: 500 });
      const reps = readNumber(v, "reps", "Repetitions", { min: 1, max: 15, integer: true });
      const epley = epley1rm(weight, reps);
      const brzycki = brzycki1rm(weight, reps);
      const notes = ["Do not attempt a true one-rep max from this estimate without a spotter and a progression you already tolerate."];
      if (reps > 10) notes.push("Above about 10 repetitions the formulas diverge and get less reliable.");
      return pack([
        item("Epley estimate", `${formatNumber(epley, 1)} kg`, true),
        item("Brzycki estimate", `${formatNumber(brzycki, 1)} kg`),
        item("Spread", `${formatNumber(Math.abs(epley - brzycki), 1)} kg`),
      ], { notes });
    },
    formula: "Epley: weight × (1 + reps / 30). Brzycki: weight × 36 / (37 − reps).",
    howItWorks: "Both formulas extrapolate a heavy single from a lighter set. They agree closely around 1–5 reps and drift apart as reps rise. The spread is a useful uncertainty band. Neither formula knows your technique or injury history.",
    steps: ["Enter a weight you completed with good form.", "Enter the repetitions. Use 10 or fewer when you can.", "Read both estimates. Do not load the higher one as a first attempt."],
    example: "60 kg for 5 reps is about 70 kg by Epley and 67.5 kg by Brzycki.",
    faqs: [
      { q: "Which formula is better?", a: "Neither is personal. If they disagree, the honest answer is the range between them." },
      { q: "Can I use pounds?", a: "Enter pounds and read the result as pounds. The formulas are unitless ratios." },
    ],
    related: ["heart-rate-zone-calculator", "protein-intake-calculator", "exercise-calorie-calculator"],
  },
  {
    slug: "waist-to-height-calculator",
    title: "Waist-to-height ratio calculator",
    description: "Divide waist by height. A ratio under 0.5 is a commonly cited adult screening cut-off, not a diagnosis.",
    category: "health",
    keywords: ["waist to height", "whtr", "waist circumference"],
    synonyms: ["waist height ratio"],
    disclaimer: HEALTH_DISCLAIMER,
    inputs: [
      { id: "waist", label: "Waist", type: "number", unit: "cm", defaultValue: "80", required: true, min: 40, max: 200 },
      { id: "height", label: "Height", type: "number", unit: "cm", defaultValue: "168", required: true },
    ],
    compute: (v) => {
      const waist = readNumber(v, "waist", "Waist", { min: 40, max: 200 });
      const height = metricHeight(v);
      const ratio = waist / height;
      return pack([
        item("Waist-to-height ratio", formatNumber(ratio, 2), true),
        item("Compared with 0.5", ratio < 0.5 ? "Below 0.5" : "0.5 or above"),
      ], { notes: ["Keep the tape level, midway between the lowest rib and the top of the hip bone, unless your clinician asked for a different site. A ratio is a screen, not a finding of disease."] });
    },
    formula: "WHtR = waist / height, in the same units.",
    howItWorks: "Waist-to-height ratio puts waist size in the context of stature. Public-health sources often mention 0.5 as a simple adult cut-off. It does not replace blood pressure, lipids, glucose, or a clinical exam.",
    steps: ["Measure waist and height in centimetres.", "Divide.", "If the result surprises you, repeat the tape measurement before worrying about the third decimal."],
    example: "80 / 168 = 0.48.",
    faqs: [
      { q: "Is 0.5 a diagnosis?", a: "No. It is a screening threshold used in some guidelines and papers. Interpretation belongs with a clinician who knows your history." },
      { q: "Does the site of the tape matter?", a: "Yes. A tape at the navel and a tape at the narrowest point can differ by centimetres." },
    ],
    related: ["bmi-calculator", "body-fat-calculator", "ideal-weight-calculator"],
  },
  {
    slug: "pregnancy-due-date-calculator",
    title: "Pregnancy due date calculator",
    description: "Estimate a due date from the first day of the last menstrual period using Naegele’s rule.",
    category: "health",
    keywords: ["due date", "naegele", "pregnancy calculator"],
    synonyms: ["edd calculator", "40 weeks"],
    disclaimer: PREGNANCY_DISCLAIMER,
    inputs: [
      { id: "lmp", label: "First day of last menstrual period", type: "date", required: true, defaultValue: "2026-01-01" },
      { id: "cycle", label: "Usual cycle length", type: "number", unit: "days", defaultValue: "28", required: true, min: 21, max: 40 },
    ],
    compute: (v) => {
      const lmp = parseISODate(v.lmp || "", "last menstrual period");
      const cycle = readNumber(v, "cycle", "Cycle length", { min: 21, max: 40, integer: true });
      const due = addDays(lmp, 280 + (cycle - 28));
      return pack([
        item("Estimated due date", formatLongDate(due), true),
        item("40 weeks from a 28-day cycle would be", formatLongDate(addDays(lmp, 280))),
        item("Cycle adjustment", `${cycle - 28} days`),
      ], { notes: ["Ultrasound dating in early pregnancy is more reliable than a calendar rule, especially if cycles vary. This page does not confirm that a pregnancy exists."] });
    },
    formula: "Naegele: due date ≈ LMP + 280 days. For a cycle that is not 28 days, add (cycle length − 28).",
    howItWorks: "Naegele’s rule assumes ovulation about 14 days before the next period and a 280-day pregnancy counted from the last menstrual period. Irregular cycles, recent contraception, and uncertain dates all weaken it. A clinician may replace the calendar date with an ultrasound date.",
    steps: ["Enter the first day of the last period you are sure about.", "Enter the usual cycle length. Use 28 if you do not know it, and treat the result as rougher.", "Confirm dates with a clinician. Do not use this page as a test."],
    example: "An LMP of 1 January 2026 and a 28-day cycle gives a due date of 8 October 2026.",
    faqs: [
      { q: "Does this mean I am pregnant?", a: "No. A calendar cannot confirm a pregnancy. Use a test and clinical care for that question." },
      { q: "What if I know the conception date?", a: "Add 266 days to a known conception date as a rough alternative. The pregnancy week calculator can also count from an ultrasound due date." },
    ],
    related: ["pregnancy-week-calculator", "ovulation-calculator", "date-calculator"],
  },
  {
    slug: "pregnancy-week-calculator",
    title: "Pregnancy week calculator",
    description: "Count completed weeks and days from a last menstrual period or from a dated due date.",
    category: "health",
    keywords: ["pregnancy week", "how many weeks pregnant", "gestational age"],
    synonyms: ["gestational age calculator"],
    disclaimer: PREGNANCY_DISCLAIMER,
    inputs: [
      { id: "mode", label: "I know", type: "select", defaultValue: "lmp", options: [
        { value: "lmp", label: "The first day of the last period" },
        { value: "due", label: "A due date from a clinician" },
      ] },
      { id: "lmp", label: "Last menstrual period", type: "date", defaultValue: "2026-01-01", showIf: { field: "mode", equals: "lmp" }, required: true },
      { id: "due", label: "Due date", type: "date", defaultValue: "2026-10-08", showIf: { field: "mode", equals: "due" }, required: true },
      { id: "asof", label: "Count on", type: "date", required: true, defaultValue: "2026-03-21" },
    ],
    compute: (v) => {
      const asOf = parseISODate(v.asof || "", "count date");
      const lmp = v.mode === "due" ? addDays(parseISODate(v.due || "", "due date"), -280) : parseISODate(v.lmp || "", "last period");
      const days = Math.round((asOf.getTime() - lmp.getTime()) / 86_400_000);
      if (days < 0) throw new InputError("The count date is before the calculated start.");
      const weeks = Math.floor(days / 7);
      const rem = days % 7;
      return pack([
        item("Gestational age", `${weeks} weeks and ${rem} days`, true),
        item("Days from LMP dating", formatNumber(days, 0)),
        item("Implied LMP", formatLongDate(lmp)),
      ], { notes: ["Clinical gestational age may follow an ultrasound, not the calendar LMP. Use the date your clinician gave you when they differ."] });
    },
    formula: "Weeks = days since the dating LMP / 7. A due date implies an LMP 280 days earlier.",
    howItWorks: "Pregnancy weeks in clinical notes are usually counted from the last menstrual period or from an ultrasound-adjusted equivalent, not from conception. This page follows that convention and labels it so a conception count is not confused with a gestational count.",
    steps: ["Choose the date you actually know.", "Enter the day you want the week count for.", "If a scan date disagrees, keep the scan date for appointments."],
    example: "From 1 January 2026 to 21 March 2026 is 11 weeks and 2 days on LMP dating.",
    faqs: [
      { q: "Why is gestational age older than time since conception?", a: "Because the clinical clock usually starts about two weeks before a typical ovulation." },
      { q: "Can this detect a problem?", a: "No. Bleeding, pain, reduced movement, or a date that does not match a scan need a clinician, not a calculator." },
    ],
    related: ["pregnancy-due-date-calculator", "ovulation-calculator", "days-between-dates-calculator"],
  },
  {
    slug: "ovulation-calculator",
    title: "Ovulation and fertile window estimator",
    description: "Estimate ovulation and a fertile window from the last period and a regular cycle length. Not a contraceptive.",
    category: "health",
    keywords: ["ovulation", "fertile window", "cycle calculator"],
    synonyms: ["fertility calendar"],
    disclaimer: `${PREGNANCY_DISCLAIMER} This calendar is not contraception and not a fertility treatment. Cycles vary.`,
    inputs: [
      { id: "lmp", label: "First day of last period", type: "date", required: true, defaultValue: "2026-03-01" },
      { id: "cycle", label: "Usual cycle length", type: "number", unit: "days", defaultValue: "28", required: true, min: 21, max: 40 },
    ],
    compute: (v) => {
      const lmp = parseISODate(v.lmp || "", "last period");
      const cycle = readNumber(v, "cycle", "Cycle length", { min: 21, max: 40, integer: true });
      const ovulation = addDays(lmp, cycle - 14);
      const fertileStart = addDays(ovulation, -5);
      const fertileEnd = addDays(ovulation, 1);
      const next = addDays(lmp, cycle);
      return pack([
        item("Estimated ovulation", formatLongDate(ovulation), true),
        item("Estimated fertile window", `${formatLongDate(fertileStart)} – ${formatLongDate(fertileEnd)}`),
        item("Next period if the cycle repeats", formatLongDate(next)),
      ], { notes: ["The fertile window shown is ovulation minus 5 days through ovulation plus 1 day, a teaching approximation. Sperm survival and the day of ovulation both vary. Do not use this to prevent pregnancy."] });
    },
    formula: "Estimated ovulation = LMP + cycle length − 14 days.",
    howItWorks: "In a textbook cycle, the luteal phase is about 14 days, so ovulation is about 14 days before the next period. Real cycles are less tidy. Apps and calendars miss a substantial share of fertile days. This page is a way to understand the arithmetic, not a method of contraception or a promise of conception.",
    steps: ["Enter the first day of bleeding.", "Enter a cycle length you have observed, not an ideal 28, if you know it.", "Read the window as an estimate with several days of uncertainty either side."],
    example: "A 1 March 2026 period and a 28-day cycle points to ovulation around 15 March 2026.",
    faqs: [
      { q: "Can I use this as birth control?", a: "No. Calendar estimates are not a reliable contraceptive." },
      { q: "Does a result mean I am fertile or pregnant?", a: "No. It does not observe ovulation, and it cannot test for pregnancy." },
    ],
    related: ["pregnancy-due-date-calculator", "pregnancy-week-calculator", "date-calculator"],
  },
];
