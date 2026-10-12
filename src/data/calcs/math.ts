import { InputError, formatNumber, parseNumberList, readNumber } from "@/lib/format";
import {
  det2,
  det3,
  factorial,
  gcdMany,
  isPrime,
  lcmMany,
  mean,
  median,
  modes,
  nCr,
  nPr,
  polygonArea,
  primeFactors,
  quadraticRoots,
  range,
  solve2x2,
  stdev,
  toScientific,
  variance,
} from "@/lib/mathx";
import { evaluateExpression } from "@/lib/parser";
import { item, pack, type CalcDef } from "../types";

function statsPack(values: number[], sample = true) {
  const mode = modes(values);
  return [
    item("Count", formatNumber(values.length, 0)),
    item("Mean", formatNumber(mean(values), 4), true),
    item("Median", formatNumber(median(values), 4)),
    item("Mode", mode.length ? mode.map((n) => formatNumber(n, 4)).join(", ") : "No mode"),
    item("Range", formatNumber(range(values), 4)),
    item(sample ? "Sample standard deviation" : "Population standard deviation", formatNumber(stdev(values, sample), 4)),
    item(sample ? "Sample variance" : "Population variance", formatNumber(variance(values, sample), 4)),
  ];
}

export const mathCalcs: CalcDef[] = [
  {
    slug: "algebra-calculator",
    title: "Algebra calculator",
    description: "Evaluate a numeric expression locally. This is not a computer-algebra system and does not use eval.",
    category: "math",
    keywords: ["algebra", "expression", "evaluate"],
    synonyms: ["math expression", "solve expression"],
    inputs: [
      { id: "expr", label: "Expression", type: "text", defaultValue: "2*(3+4)^2", required: true },
      { id: "angle", label: "Angle mode", type: "select", defaultValue: "deg", options: [
        { value: "deg", label: "Degrees" },
        { value: "rad", label: "Radians" },
      ] },
    ],
    compute: (v) => {
      const value = evaluateExpression(v.expr || "", v.angle === "rad" ? "rad" : "deg");
      return pack([item("Value", formatNumber(value, 8), true), item("Expression", v.expr || "")], {
        notes: ["Functions: sin, cos, tan, asin, acos, atan, sqrt, cbrt, log, ln, abs, factorial with !. Constants: pi and e. For equations, use the linear, quadratic, or simultaneous solvers."],
      });
    },
    formula: "The expression is parsed and evaluated with ordinary precedence: powers, then multiplication and division, then addition and subtraction.",
    howItWorks: "A numeric evaluator answers “what is this expression worth?”. It does not rearrange symbols or prove an identity. The parser is local and rejects unknown names instead of executing arbitrary code.",
    steps: ["Type an expression using + − * / ^ and parentheses.", "Use sqrt(x), log(x), or sin(x).", "Choose degrees if the expression contains trigonometry in degrees."],
    example: "2*(3+4)^2 = 2*49 = 98.",
    faqs: [
      { q: "Can it solve for x?", a: "Not symbolically. Linear and quadratic pages solve the standard forms." },
      { q: "Is log base 10?", a: "log(x) is base 10. ln(x) is natural. log(x, base) uses the base you give." },
    ],
    related: ["scientific-calculator", "quadratic-equation-calculator", "linear-equation-calculator"],
  },
  {
    slug: "quadratic-equation-calculator",
    title: "Quadratic equation solver",
    description: "Solve ax² + bx + c = 0, including a negative discriminant written with a real and imaginary part.",
    category: "math",
    keywords: ["quadratic", "roots", "discriminant"],
    synonyms: ["quadratic formula"],
    inputs: [
      { id: "a", label: "a", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "b", label: "b", type: "number", defaultValue: "-5", required: true, step: "any" },
      { id: "c", label: "c", type: "number", defaultValue: "6", required: true, step: "any" },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "a", { allowZero: false });
      const b = readNumber(v, "b", "b");
      const c = readNumber(v, "c", "c");
      const solved = quadraticRoots(a, b, c);
      return pack([
        item("Roots", solved.roots.join(" and "), true),
        item("Discriminant", formatNumber(solved.discriminant, 6)),
        item("Nature", solved.discriminant > 0 ? "Two distinct real roots" : solved.discriminant === 0 ? "One repeated real root" : "Two complex roots"),
        item("Sum of roots", formatNumber(-b / a, 6)),
        item("Product of roots", formatNumber(c / a, 6)),
      ]);
    },
    formula: "x = (−b ± √(b² − 4ac)) / (2a). Discriminant D = b² − 4ac.",
    howItWorks: "The quadratic formula comes from completing the square. The discriminant tells you whether the parabola crosses the axis twice, once, or not at all in the real numbers. Vieta’s formulas give the sum and product without finding the roots again.",
    steps: ["Write the equation in standard form and identify a, b, and c.", "If a is zero, use the linear solver instead.", "Read the discriminant before interpreting complex results as measurement errors."],
    example: "x² − 5x + 6 = 0 has roots 2 and 3. D = 1.",
    faqs: [
      { q: "What if a is zero?", a: "The equation is linear. The page rejects a = 0 rather than hiding a division by zero." },
      { q: "Are the complex roots exact?", a: "They are shown from the same formula. Floating-point rounding can nudge a tiny discriminant across zero." },
    ],
    related: ["linear-equation-calculator", "polynomial-calculator", "algebra-calculator"],
  },
  {
    slug: "linear-equation-calculator",
    title: "Linear equation solver",
    description: "Solve ax + b = 0 for x.",
    category: "math",
    keywords: ["linear equation", "solve for x"],
    synonyms: ["one step equation"],
    inputs: [
      { id: "a", label: "a", type: "number", defaultValue: "4", required: true, step: "any" },
      { id: "b", label: "b", type: "number", defaultValue: "-12", required: true, step: "any" },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "a", { allowZero: false });
      const b = readNumber(v, "b", "b");
      return pack([item("x", formatNumber(-b / a, 8), true), item("Check", formatNumber(a * (-b / a) + b, 8))]);
    },
    formula: "x = −b / a, provided a ≠ 0.",
    howItWorks: "A linear equation has one unknown to the first power. Subtracting b and dividing by a isolates x. If a is zero, either every number is a solution or none is, and this page asks you to rewrite the equation.",
    steps: ["Move the equation into ax + b = 0.", "Enter a and b.", "Substitute the result back into the original statement."],
    example: "4x − 12 = 0 gives x = 3.",
    faqs: [
      { q: "What about ax + b = c?", a: "Rewrite it as ax + (b − c) = 0 and enter b − c as b." },
      { q: "Can a be a fraction?", a: "Yes. Enter it as a decimal or solve an equivalent integer equation." },
    ],
    related: ["simultaneous-equations-calculator", "quadratic-equation-calculator", "algebra-calculator"],
  },
  {
    slug: "simultaneous-equations-calculator",
    title: "Simultaneous equations solver",
    description: "Solve two linear equations in x and y.",
    category: "math",
    keywords: ["simultaneous equations", "system of equations", "two variables"],
    synonyms: ["linear system"],
    inputs: [
      { id: "a1", label: "a1 (x in equation 1)", type: "number", defaultValue: "2", required: true, step: "any" },
      { id: "b1", label: "b1 (y in equation 1)", type: "number", defaultValue: "3", required: true, step: "any" },
      { id: "c1", label: "c1 (right side 1)", type: "number", defaultValue: "8", required: true, step: "any" },
      { id: "a2", label: "a2", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "b2", label: "b2", type: "number", defaultValue: "-1", required: true, step: "any" },
      { id: "c2", label: "c2", type: "number", defaultValue: "1", required: true, step: "any" },
    ],
    compute: (v) => {
      const a1 = readNumber(v, "a1", "a1");
      const b1 = readNumber(v, "b1", "b1");
      const c1 = readNumber(v, "c1", "c1");
      const a2 = readNumber(v, "a2", "a2");
      const b2 = readNumber(v, "b2", "b2");
      const c2 = readNumber(v, "c2", "c2");
      const solved = solve2x2(a1, b1, c1, a2, b2, c2);
      return pack([
        item("x", formatNumber(solved.x, 6), true),
        item("y", formatNumber(solved.y, 6), true),
        item("Determinant", formatNumber(a1 * b2 - a2 * b1, 6)),
      ]);
    },
    formula: "For a1 x + b1 y = c1 and a2 x + b2 y = c2, x = (c1 b2 − c2 b1) / (a1 b2 − a2 b1).",
    howItWorks: "Two lines meet at one point when their slopes differ. The denominator is that test. If it is zero, the lines are parallel or identical and there is no unique solution. The page stops rather than inventing one.",
    steps: ["Write both equations as ax + by = c.", "Enter the six coefficients.", "Check by substituting x and y back into both equations."],
    example: "2x + 3y = 8 and x − y = 1 gives x = 2.2 and y = 1.2.",
    faqs: [
      { q: "What if the determinant is zero?", a: "There is not one unique pair (x, y). The equations need to be restated or they describe the same line." },
      { q: "Can I solve three equations?", a: "Not here. Use a matrix method or reduce the system by hand first." },
    ],
    related: ["linear-equation-calculator", "matrix-calculator", "slope-calculator"],
  },
  {
    slug: "polynomial-calculator",
    title: "Polynomial calculator",
    description: "Evaluate a polynomial and its derivative at a point. Degree 2 also shows the roots.",
    category: "math",
    keywords: ["polynomial", "evaluate polynomial", "derivative"],
    synonyms: ["cubic calculator"],
    inputs: [
      { id: "coeffs", label: "Coefficients", type: "text", defaultValue: "1, -5, 6", required: true, help: "Highest degree first. 1, -5, 6 means x² − 5x + 6." },
      { id: "x", label: "x", type: "number", defaultValue: "2", required: true, step: "any" },
    ],
    compute: (v) => {
      const coeffs = parseNumberList(v.coeffs || "", "the coefficients");
      const x = readNumber(v, "x", "x");
      let value = 0;
      let derivative = 0;
      coeffs.forEach((coeff, index) => {
        const power = coeffs.length - 1 - index;
        value = value * x + coeff;
        if (power > 0) derivative += coeff * power * x ** (power - 1);
      });
      const results = [item("p(x)", formatNumber(value, 6), true), item("p'(x)", formatNumber(derivative, 6)), item("Degree", formatNumber(coeffs.length - 1, 0))];
      if (coeffs.length === 3) {
        const roots = quadraticRoots(coeffs[0], coeffs[1], coeffs[2]);
        results.push(item("Roots", roots.roots.join(" and ")));
      }
      return pack(results);
    },
    formula: "Horner’s method evaluates p(x). The derivative uses the power rule term by term.",
    howItWorks: "A polynomial is a sum of coefficients times powers of x. Horner’s method nests the multiplication so a long polynomial does not need huge intermediate powers. Roots are shown automatically only for quadratics, where a closed form is reliable.",
    steps: ["List coefficients from the highest power, including zeros for missing terms.", "Enter the x value.", "For a quadratic, compare the roots with the evaluation."],
    example: "1, -5, 6 at x = 2 is 0, because 2 is a root of x² − 5x + 6.",
    faqs: [
      { q: "How do I enter x³ + 1?", a: "Use 1, 0, 0, 1 so the missing x² and x terms are present." },
      { q: "Can it factor a cubic?", a: "It evaluates and differentiates. It does not search for rational roots." },
    ],
    related: ["quadratic-equation-calculator", "algebra-calculator", "exponent-calculator"],
  },
  {
    slug: "exponent-calculator",
    title: "Exponent and power calculator",
    description: "Raise a base to a power and show the reciprocal power as a check.",
    category: "math",
    keywords: ["exponent", "power", "indices"],
    synonyms: ["a to the power b"],
    inputs: [
      { id: "base", label: "Base", type: "number", defaultValue: "2", required: true, step: "any" },
      { id: "exp", label: "Exponent", type: "number", defaultValue: "10", required: true, step: "any" },
    ],
    compute: (v) => {
      const base = readNumber(v, "base", "Base");
      const exp = readNumber(v, "exp", "Exponent");
      const value = base ** exp;
      if (!Number.isFinite(value)) throw new InputError("The power is too large or is not a real number for these inputs.");
      return pack([
        item("Result", formatNumber(value, 8), true),
        item("Scientific form", toScientific(value).text),
      ]);
    },
    formula: "Result = base^exponent.",
    howItWorks: "A positive integer exponent means repeated multiplication. A fractional exponent is a root, and a negative exponent is a reciprocal. A negative base with a fractional exponent may not have a real value; the page reports that instead of returning a misleading number.",
    steps: ["Enter the base and exponent.", "Use a fraction as a decimal if you need a root, or use the root calculator.", "Check the scientific form when the result is huge."],
    example: "2^10 = 1,024.",
    faqs: [
      { q: "What is 0^0?", a: "It is left undefined here if the platform returns a non-finite or conventional 1 you did not intend. Prefer a limit in class rather than a calculator value." },
      { q: "How do I enter a square?", a: "Use exponent 2, or the root calculator for the inverse question." },
    ],
    related: ["root-calculator", "logarithm-calculator", "scientific-notation-calculator"],
  },
  {
    slug: "root-calculator",
    title: "Square root and cube root calculator",
    description: "Find a principal square root, a cube root, or an nth root.",
    category: "math",
    keywords: ["square root", "cube root", "nth root"],
    synonyms: ["sqrt", "cbrt"],
    inputs: [
      { id: "value", label: "Number", type: "number", defaultValue: "81", required: true, step: "any" },
      { id: "n", label: "Root", type: "number", defaultValue: "2", required: true, min: 2, max: 20 },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Number");
      const n = readNumber(v, "n", "Root", { min: 2, max: 20, integer: true });
      if (value < 0 && n % 2 === 0) throw new InputError("Even roots of negative numbers are not real.");
      const root = value < 0 ? -((-value) ** (1 / n)) : value ** (1 / n);
      return pack([
        item(`${formatNumber(n, 0)}th root`, formatNumber(root, 8), true),
        item("Check", formatNumber(root ** n, 6)),
      ]);
    },
    formula: "nth root of x = x^(1/n), with the real negative root kept for odd n.",
    howItWorks: "The square root symbol denotes the non-negative root. Cube roots of negative numbers are negative. This page follows that convention and checks the result by raising it back to the nth power.",
    steps: ["Enter the number.", "Use 2 for a square root and 3 for a cube root.", "Compare the check with the original number."],
    example: "The square root of 81 is 9. The cube root of 27 is 3.",
    faqs: [
      { q: "Why is the check not exact?", a: "Binary floating point cannot represent every decimal. A tiny gap in the check is rounding, not a second root." },
      { q: "Can I get both square roots?", a: "The principal root is shown. The other real square root is its negative." },
    ],
    related: ["exponent-calculator", "quadratic-equation-calculator", "scientific-calculator"],
  },
  {
    slug: "logarithm-calculator",
    title: "Logarithm calculator",
    description: "Calculate a logarithm in any positive base other than 1, plus common and natural logs.",
    category: "math",
    keywords: ["logarithm", "log", "ln"],
    synonyms: ["log base"],
    inputs: [
      { id: "value", label: "Value", type: "number", defaultValue: "1000", required: true, step: "any" },
      { id: "base", label: "Base", type: "number", defaultValue: "10", required: true, step: "any" },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Value", { min: 0, allowZero: false });
      const base = readNumber(v, "base", "Base", { allowZero: false });
      if (base <= 0 || base === 1) throw new InputError("The base must be positive and not 1.");
      const result = Math.log(value) / Math.log(base);
      return pack([
        item("Logarithm", formatNumber(result, 8), true),
        item("Common log", formatNumber(Math.log10(value), 8)),
        item("Natural log", formatNumber(Math.log(value), 8)),
      ]);
    },
    formula: "log_b(x) = ln(x) / ln(b).",
    howItWorks: "A logarithm asks which exponent turns the base into the value. Change of base lets any log be computed from natural logs. The value must be positive. The base must be positive and not 1.",
    steps: ["Enter a positive value.", "Enter the base. Use 10 for common logs and e (about 2.71828) for natural logs.", "Use the exponent calculator to check base^result."],
    example: "log10(1000) = 3, because 10³ = 1,000.",
    faqs: [
      { q: "Why is log of a negative number rejected?", a: "Real logarithms are defined for positive values only." },
      { q: "Is log the same as ln?", a: "Only if the base is e. This page makes the base explicit." },
    ],
    related: ["exponent-calculator", "scientific-notation-calculator", "scientific-calculator"],
  },
  {
    slug: "scientific-notation-calculator",
    title: "Scientific notation converter",
    description: "Split a number into a mantissa and a power of ten, or rebuild it.",
    category: "math",
    keywords: ["scientific notation", "standard form", "powers of ten"],
    synonyms: ["x 10^"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "split", options: [
        { value: "split", label: "Number to scientific notation" },
        { value: "join", label: "Mantissa and exponent to number" },
      ] },
      { id: "value", label: "Number", type: "number", defaultValue: "1234500", showIf: { field: "mode", equals: "split" }, required: true, step: "any" },
      { id: "mantissa", label: "Mantissa", type: "number", defaultValue: "1.2345", showIf: { field: "mode", equals: "join" }, required: true, step: "any" },
      { id: "exp", label: "Exponent", type: "number", defaultValue: "6", showIf: { field: "mode", equals: "join" }, required: true },
    ],
    compute: (v) => {
      if (v.mode === "join") {
        const mantissa = readNumber(v, "mantissa", "Mantissa");
        const exp = readNumber(v, "exp", "Exponent");
        const value = mantissa * 10 ** exp;
        if (!Number.isFinite(value)) throw new InputError("That power of ten is outside the range of ordinary numbers.");
        return pack([item("Number", formatNumber(value, 8), true), item("Check", toScientific(value).text)]);
      }
      const value = readNumber(v, "value", "Number");
      const parts = toScientific(value);
      return pack([
        item("Scientific notation", parts.text, true),
        item("Mantissa", formatNumber(parts.mantissa, 8)),
        item("Exponent", formatNumber(parts.exponent, 0)),
      ]);
    },
    formula: "A number is written as m × 10^e with 1 ≤ |m| < 10, except for zero.",
    howItWorks: "Scientific notation separates scale from significant digits. The exponent is the order of magnitude. Normalising the mantissa between 1 and 10 makes comparisons easier and matches the way many science texts write measurements.",
    steps: ["Choose a direction.", "Enter the number, or the mantissa and exponent.", "Round the mantissa to the significant figures you actually measured."],
    example: "1,234,500 = 1.2345 × 10^6.",
    faqs: [
      { q: "What about engineering notation?", a: "Engineering notation uses exponents that are multiples of three. Adjust the mantissa by powers of 1,000 if a lab report requires that form." },
      { q: "Is E notation accepted?", a: "In the join mode, enter the mantissa and exponent separately. The algebra calculator accepts 1.2e3." },
    ],
    related: ["exponent-calculator", "rounding-calculator", "logarithm-calculator"],
  },
  {
    slug: "gcd-calculator",
    title: "Greatest common divisor calculator",
    description: "Find the greatest common divisor of two or more integers with the Euclidean algorithm.",
    category: "math",
    keywords: ["gcd", "hcf", "greatest common divisor"],
    synonyms: ["highest common factor"],
    inputs: [{ id: "values", label: "Integers", type: "text", defaultValue: "48, 180, 72", required: true }],
    compute: (v) => {
      const values = parseNumberList(v.values || "", "the integers");
      if (values.some((n) => !Number.isInteger(n))) throw new InputError("GCD is calculated for integers.");
      return pack([item("GCD", formatNumber(gcdMany(values), 0), true), item("Count", formatNumber(values.length, 0))]);
    },
    formula: "gcd(a, b) = gcd(b, a mod b), repeated until the remainder is zero.",
    howItWorks: "The Euclidean algorithm replaces the larger number with the remainder. The last non-zero remainder is the greatest common divisor. For more than two numbers, the operation is applied from left to right.",
    steps: ["Enter integers separated by commas.", "Read the GCD.", "Divide each input by the GCD to see the reduced integers."],
    example: "gcd(48, 180, 72) = 12.",
    faqs: [
      { q: "Is GCD the same as HCF?", a: "Yes. Highest common factor is another name for the same number." },
      { q: "What about zero?", a: "gcd(a, 0) is |a|. A list of all zeros returns 0." },
    ],
    related: ["lcm-calculator", "factorization-calculator", "fraction-calculator"],
  },
  {
    slug: "lcm-calculator",
    title: "Least common multiple calculator",
    description: "Find the least common multiple of two or more integers.",
    category: "math",
    keywords: ["lcm", "least common multiple"],
    synonyms: ["lowest common multiple"],
    inputs: [{ id: "values", label: "Integers", type: "text", defaultValue: "12, 18, 24", required: true }],
    compute: (v) => {
      const values = parseNumberList(v.values || "", "the integers");
      if (values.some((n) => !Number.isInteger(n))) throw new InputError("LCM is calculated for integers.");
      return pack([item("LCM", formatNumber(lcmMany(values), 0), true)]);
    },
    formula: "lcm(a, b) = |a × b| / gcd(a, b), extended across the list.",
    howItWorks: "The least common multiple is the smallest positive integer that each input divides. It is the number you need for a common denominator or for events that repeat on different cycles.",
    steps: ["Enter non-zero integers.", "Read the LCM.", "Check that each input divides it."],
    example: "lcm(12, 18, 24) = 72.",
    faqs: [
      { q: "What if a number is zero?", a: "The LCM of a set containing zero is zero in this implementation, because no positive multiple of zero exists in the usual sense and the product identity collapses." },
      { q: "Can the result be inexact?", a: "Very large products can exceed safe integer precision. Keep the inputs moderate." },
    ],
    related: ["gcd-calculator", "fraction-calculator", "factorization-calculator"],
  },
  {
    slug: "prime-number-calculator",
    title: "Prime number checker",
    description: "Test whether an integer is prime and show the search limit used.",
    category: "math",
    keywords: ["prime", "prime checker", "is prime"],
    synonyms: ["primality"],
    inputs: [{ id: "n", label: "Integer", type: "number", defaultValue: "97", required: true }],
    compute: (v) => {
      const n = readNumber(v, "n", "Integer", { integer: true, min: 0, max: 1_000_000_000_000 });
      const prime = isPrime(n);
      return pack([
        item("Result", prime ? "Prime" : "Not prime", true),
        item("Checked up to", formatNumber(Math.ceil(Math.sqrt(n)), 0), false, "Trial division stops at the square root."),
      ]);
    },
    formula: "An integer greater than 1 is prime when no integer from 2 to its square root divides it.",
    howItWorks: "Trial division is enough for a single number of this size. The page skips multiples of 2 and 3 after the first checks. It does not claim a cryptographic primality proof for huge integers, and it caps the input so the page stays responsive.",
    steps: ["Enter a whole number.", "Read prime or not prime.", "If it is composite, the factorisation page lists the factors."],
    example: "97 is prime. 91 is not, because 7 × 13 = 91.",
    faqs: [
      { q: "Is 1 prime?", a: "No. Primes are defined to have exactly two distinct positive divisors, 1 and themselves." },
      { q: "Why is there a size cap?", a: "So a very large composite cannot stall the browser. One trillion is the limit." },
    ],
    related: ["factorization-calculator", "gcd-calculator", "prime-number-calculator"],
  },
  {
    slug: "factorization-calculator",
    title: "Factorization calculator",
    description: "List the prime factors of an integer up to one trillion.",
    category: "math",
    keywords: ["prime factors", "factorize", "factorisation"],
    synonyms: ["prime factorization"],
    inputs: [{ id: "n", label: "Integer", type: "number", defaultValue: "360", required: true, min: 2 }],
    compute: (v) => {
      const n = readNumber(v, "n", "Integer", { integer: true, min: 2 });
      const factors = primeFactors(n);
      const grouped = new Map<number, number>();
      factors.forEach((f) => grouped.set(f, (grouped.get(f) ?? 0) + 1));
      const written = [...grouped.entries()].map(([f, c]) => (c === 1 ? String(f) : `${f}^${c}`)).join(" × ");
      return pack([
        item("Prime factorisation", written, true),
        item("Factors with multiplicity", factors.join(" × ")),
        item("Number of prime factors", formatNumber(factors.length, 0)),
      ]);
    },
    formula: "Divide out 2, then 3, then integers of the form 6k±1, until the remaining cofactor is 1 or prime.",
    howItWorks: "Every integer greater than 1 has a unique prime factorisation, ignoring order. The algorithm peels off small primes first, which is fast for typical classroom numbers and bounded for the page’s size limit.",
    steps: ["Enter an integer of at least 2.", "Read the grouped form for a tidy answer.", "Multiply the factors to check."],
    example: "360 = 2³ × 3² × 5.",
    faqs: [
      { q: "Does order matter?", a: "No. 2 × 3 × 5 is the same factorisation as 5 × 2 × 3." },
      { q: "Can it factor a decimal?", a: "No. Factorisation in this sense is for integers." },
    ],
    related: ["prime-number-calculator", "gcd-calculator", "lcm-calculator"],
  },
  {
    slug: "permutation-combination-calculator",
    title: "Permutation and combination calculator",
    description: "Calculate nPr, nCr, and n factorial for moderate whole numbers.",
    category: "math",
    keywords: ["permutation", "combination", "npr", "ncr"],
    synonyms: ["n choose r"],
    inputs: [
      { id: "n", label: "n", type: "number", defaultValue: "10", required: true, min: 0, max: 1000 },
      { id: "r", label: "r", type: "number", defaultValue: "3", required: true, min: 0, max: 1000 },
    ],
    compute: (v) => {
      const n = readNumber(v, "n", "n", { min: 0, max: 1000, integer: true });
      const r = readNumber(v, "r", "r", { min: 0, max: 1000, integer: true });
      const results = [item("nPr", formatNumber(nPr(n, r), 4), true), item("nCr", formatNumber(nCr(n, r), 4), true)];
      if (n <= 170) results.push(item("n!", formatNumber(factorial(n), 4)));
      else results.push(item("n!", "Too large to show exactly"));
      return pack(results);
    },
    formula: "nPr = n! / (n − r)!. nCr = n! / (r! (n − r)!).",
    howItWorks: "A permutation counts ordered selections. A combination ignores order, so it divides by the ways to arrange the chosen items. The page multiplies sequentially to avoid computing enormous factorials when only a ratio is needed.",
    steps: ["Enter n, the size of the set.", "Enter r, how many you pick. r cannot exceed n.", "Use nPr when order matters and nCr when it does not."],
    example: "10P3 = 720. 10C3 = 120.",
    faqs: [
      { q: "Why is nCr smaller than nPr?", a: "Because combinations treat ABC and CBA as the same selection." },
      { q: "What is  nC0?", a: "1. There is one way to choose nothing." },
    ],
    related: ["probability-calculator", "statistics-calculator", "algebra-calculator"],
  },
  {
    slug: "probability-calculator",
    title: "Probability calculator",
    description: "Compute complements, independent combinations, and a simple at-least-one probability.",
    category: "math",
    keywords: ["probability", "chance", "at least one"],
    synonyms: ["odds calculator"],
    inputs: [
      { id: "mode", label: "Question", type: "select", defaultValue: "complement", options: [
        { value: "complement", label: "Complement of one event" },
        { value: "and", label: "Both of two independent events" },
        { value: "or", label: "At least one of two independent events" },
        { value: "trials", label: "At least one success in n independent trials" },
      ] },
      { id: "p", label: "Probability of A", type: "number", defaultValue: "0.25", required: true, min: 0, max: 1, step: "any" },
      { id: "q", label: "Probability of B", type: "number", defaultValue: "0.4", min: 0, max: 1, step: "any", showIf: { field: "mode", equals: "and" } },
      { id: "q2", label: "Probability of B", type: "number", defaultValue: "0.4", min: 0, max: 1, step: "any", showIf: { field: "mode", equals: "or" } },
      { id: "n", label: "Trials", type: "number", defaultValue: "5", min: 1, max: 10000, showIf: { field: "mode", equals: "trials" } },
    ],
    compute: (v) => {
      const p = readNumber(v, "p", "Probability of A", { min: 0, max: 1 });
      if (v.mode === "and" || v.mode === "or") {
        const q = readNumber(v, v.mode === "and" ? "q" : "q2", "Probability of B", { min: 0, max: 1 });
        const value = v.mode === "and" ? p * q : p + q - p * q;
        return pack([item("Probability", formatNumber(value, 6), true)], { notes: ["Independence is assumed. If the events influence each other, do not multiply."] });
      }
      if (v.mode === "trials") {
        const n = readNumber(v, "n", "Trials", { min: 1, max: 10000, integer: true });
        return pack([item("At least one success", formatNumber(1 - (1 - p) ** n, 6), true), item("None", formatNumber((1 - p) ** n, 6))]);
      }
      return pack([item("Probability A does not occur", formatNumber(1 - p, 6), true)]);
    },
    formula: "P(not A) = 1 − P(A). For independent events, P(A and B) = P(A)P(B) and P(A or B) = P(A) + P(B) − P(A)P(B).",
    howItWorks: "These identities are the first tools in a probability course. They fail when you apply independence to events that share a cause. The page states that assumption next to the result so a 0.9 does not look more certain than the model.",
    steps: ["Write each probability as a number from 0 to 1, not a percent.", "Choose the question.", "Convert back to a percent by multiplying by 100 if you prefer that language."],
    example: "If P(A) = 0.25, the complement is 0.75. Five independent trials with success 0.25 have about a 0.763 chance of at least one success.",
    faqs: [
      { q: "Can I enter 25% as 25?", a: "No. Enter 0.25. A value above 1 is rejected." },
      { q: "Is this a betting tool?", a: "No. It is classroom probability, not a prediction of a game or a market." },
    ],
    related: ["permutation-combination-calculator", "statistics-calculator", "percentage-calculator"],
  },
  {
    slug: "statistics-calculator",
    title: "Statistics calculator",
    description: "Summarise a list with mean, median, mode, range, and sample or population spread.",
    category: "math",
    keywords: ["statistics", "mean", "standard deviation"],
    synonyms: ["descriptive statistics"],
    inputs: [
      { id: "values", label: "Numbers", type: "textarea", defaultValue: "4, 8, 6, 5, 3, 8, 9", required: true, rows: 4 },
      { id: "sample", label: "Spread", type: "select", defaultValue: "sample", options: [
        { value: "sample", label: "Sample (divide by n − 1)" },
        { value: "population", label: "Population (divide by n)" },
      ] },
    ],
    compute: (v) => pack(statsPack(parseNumberList(v.values || "", "the list"), v.sample !== "population")),
    formula: "Sample variance = Σ(x − mean)² / (n − 1). Population variance divides by n.",
    howItWorks: "A summary replaces a list with a few numbers. The mean is the balance point. The median resists outliers. Sample standard deviation uses n − 1 because a sample mean has already been fitted to the data, which would otherwise understate spread.",
    steps: ["Paste the observations.", "Choose sample if the list is a subset, and population if it is the whole group you care about.", "Pair the mean with the standard deviation rather than quoting either alone."],
    example: "The list 4, 8, 6, 5, 3, 8, 9 has mean about 6.14 and two modes at 8 if 8 is repeated.",
    faqs: [
      { q: "Which standard deviation should I use?", a: "Use the sample form for a sample and the population form only when the list is the entire population." },
      { q: "What if there are two modes?", a: "Both are listed. A list with no repeat has no mode." },
    ],
    related: ["mean-median-mode-calculator", "standard-deviation-calculator", "average-calculator"],
  },
  {
    slug: "mean-median-mode-calculator",
    title: "Mean, median, mode, and range calculator",
    description: "Find the four usual centre-and-spread summaries for a short list.",
    category: "math",
    keywords: ["mean median mode", "range", "average"],
    synonyms: ["measures of central tendency"],
    inputs: [{ id: "values", label: "Numbers", type: "textarea", defaultValue: "2, 5, 5, 7, 11", required: true, rows: 4 }],
    compute: (v) => {
      const values = parseNumberList(v.values || "", "the list");
      const sorted = [...values].sort((a, b) => a - b);
      const mode = modes(values);
      return pack([
        item("Mean", formatNumber(mean(values), 4), true),
        item("Median", formatNumber(median(values), 4)),
        item("Mode", mode.length ? mode.join(", ") : "No mode"),
        item("Range", formatNumber(range(values), 4)),
        item("Minimum", formatNumber(sorted[0], 4)),
        item("Maximum", formatNumber(sorted[sorted.length - 1], 4)),
      ]);
    },
    formula: "Mean = sum / n. Median is the middle of the sorted list. Range = maximum − minimum.",
    howItWorks: "These four numbers answer different questions. The mean uses every value. The median uses position. The mode uses frequency. The range uses only the ends and can be dominated by one unusual observation.",
    steps: ["Enter the list.", "Sort it mentally or trust the minimum and maximum lines.", "Say which summary you are using when you quote a single number."],
    example: "2, 5, 5, 7, 11 has mean 6, median 5, mode 5, and range 9.",
    faqs: [
      { q: "Is the mean always the best average?", a: "No. A single large value pulls it. The median is often clearer for skewed lists." },
      { q: "How is an even number of items handled?", a: "The median is the average of the two middle values." },
    ],
    related: ["statistics-calculator", "average-calculator", "standard-deviation-calculator"],
  },
  {
    slug: "standard-deviation-calculator",
    title: "Standard deviation and variance calculator",
    description: "Calculate sample and population variance and standard deviation for one list.",
    category: "math",
    keywords: ["standard deviation", "variance", "spread"],
    synonyms: ["sd calculator"],
    inputs: [{ id: "values", label: "Numbers", type: "textarea", defaultValue: "10, 12, 23, 23, 16, 23, 21, 16", required: true, rows: 4 }],
    compute: (v) => {
      const values = parseNumberList(v.values || "", "the list");
      return pack([
        item("Sample standard deviation", formatNumber(stdev(values, true), 4), true),
        item("Population standard deviation", formatNumber(stdev(values, false), 4)),
        item("Sample variance", formatNumber(variance(values, true), 4)),
        item("Population variance", formatNumber(variance(values, false), 4)),
        item("Mean", formatNumber(mean(values), 4)),
      ]);
    },
    formula: "Standard deviation is the square root of variance. Sample variance divides by n − 1.",
    howItWorks: "Variance averages squared distances from the mean, so units are squared. Standard deviation puts the result back in the original units. Showing both sample and population forms prevents a silent choice of divisor.",
    steps: ["Paste the numbers.", "Use the sample line for a sample.", "Square the standard deviation if you need to return to variance."],
    example: "For 10, 12, 23, 23, 16, 23, 21, 16 the sample standard deviation is larger than the population figure because the divisor is 7 rather than 8.",
    faqs: [
      { q: "Why square the distances?", a: "So negatives do not cancel positives. Absolute deviation is a different measure and is not shown here." },
      { q: "What if I have one number?", a: "Population spread is zero. Sample spread is undefined and the page will say so." },
    ],
    related: ["statistics-calculator", "mean-median-mode-calculator", "average-calculator"],
  },
  {
    slug: "geometry-calculator",
    title: "Geometry calculator",
    description: "Find area and perimeter for a rectangle, circle, or triangle from base and height.",
    category: "math",
    keywords: ["geometry", "area", "perimeter"],
    synonyms: ["shape calculator"],
    inputs: [
      { id: "shape", label: "Shape", type: "select", defaultValue: "rectangle", options: [
        { value: "rectangle", label: "Rectangle" },
        { value: "circle", label: "Circle" },
        { value: "triangle", label: "Triangle from base and height" },
      ] },
      { id: "a", label: "Length or radius or base", type: "number", defaultValue: "8", required: true, min: 0 },
      { id: "b", label: "Width or height", type: "number", defaultValue: "3", min: 0, showIf: { field: "shape", equals: "rectangle" } },
      { id: "h", label: "Height", type: "number", defaultValue: "4", min: 0, showIf: { field: "shape", equals: "triangle" } },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First measurement", { min: 0 });
      if (v.shape === "circle") {
        return pack([item("Area", formatNumber(Math.PI * a * a, 4), true), item("Circumference", formatNumber(2 * Math.PI * a, 4))]);
      }
      if (v.shape === "triangle") {
        const h = readNumber(v, "h", "Height", { min: 0 });
        return pack([item("Area", formatNumber(0.5 * a * h, 4), true)]);
      }
      const b = readNumber(v, "b", "Width", { min: 0 });
      return pack([item("Area", formatNumber(a * b, 4), true), item("Perimeter", formatNumber(2 * (a + b), 4)), item("Diagonal", formatNumber(Math.sqrt(a * a + b * b), 4))]);
    },
    formula: "Rectangle area = length × width. Circle area = πr². Triangle area = ½ × base × height.",
    howItWorks: "This hub covers the three area formulas students meet first. Dedicated pages add sectors, polygons, and surface area. Units are whatever you entered; the page does not convert them.",
    steps: ["Choose a shape.", "Enter the measurements in the same unit.", "Square the unit when you report area."],
    example: "A 8 by 3 rectangle has area 24 and perimeter 22.",
    faqs: [
      { q: "Does the triangle need every side?", a: "Not for area from base and height. Use the triangle page for three sides." },
      { q: "Which value of π is used?", a: "The JavaScript value of Math.PI, enough for ordinary lengths." },
    ],
    related: ["circle-calculator", "rectangle-calculator", "triangle-calculator"],
  },
  {
    slug: "triangle-calculator",
    title: "Triangle calculator",
    description: "Solve a triangle from three sides using the law of cosines and Heron’s formula.",
    category: "math",
    keywords: ["triangle", "heron", "law of cosines"],
    synonyms: ["sss triangle"],
    inputs: [
      { id: "a", label: "Side a", type: "number", defaultValue: "7", required: true, min: 0 },
      { id: "b", label: "Side b", type: "number", defaultValue: "8", required: true, min: 0 },
      { id: "c", label: "Side c", type: "number", defaultValue: "9", required: true, min: 0 },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "Side a", { min: 0, allowZero: false });
      const b = readNumber(v, "b", "Side b", { min: 0, allowZero: false });
      const c = readNumber(v, "c", "Side c", { min: 0, allowZero: false });
      if (a + b <= c || a + c <= b || b + c <= a) throw new InputError("Those lengths do not satisfy the triangle inequality.");
      const angle = (opp: number, x: number, y: number) => (Math.acos((x * x + y * y - opp * opp) / (2 * x * y)) * 180) / Math.PI;
      const A = angle(a, b, c);
      const B = angle(b, a, c);
      const C = 180 - A - B;
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      return pack([
        item("Area", formatNumber(area, 4), true),
        item("Angle A", `${formatNumber(A, 2)}°`),
        item("Angle B", `${formatNumber(B, 2)}°`),
        item("Angle C", `${formatNumber(C, 2)}°`),
        item("Perimeter", formatNumber(a + b + c, 4)),
      ]);
    },
    formula: "Cos A = (b² + c² − a²) / (2bc). Area = √[s(s−a)(s−b)(s−c)], s = (a+b+c)/2.",
    howItWorks: "Three sides determine a triangle if they satisfy the triangle inequality. The law of cosines recovers the angles, and Heron’s formula recovers the area without drawing a height. Angle C is completed to 180° so rounding does not leave a visible gap.",
    steps: ["Enter the three sides in the same unit.", "If the page rejects the lengths, one side is at least as long as the other two combined.", "Angles are opposite the sides of the same letter."],
    example: "Sides 7, 8, and 9 form a valid scalene triangle with a perimeter of 24.",
    faqs: [
      { q: "Can I enter an angle instead?", a: "This page is SSS. A right triangle with a missing side belongs on the Pythagorean page." },
      { q: "Are angles exact?", a: "They are inverse-cosine results rounded for display." },
    ],
    related: ["pythagorean-theorem-calculator", "geometry-calculator", "trigonometry-calculator"],
  },
  {
    slug: "pythagorean-theorem-calculator",
    title: "Pythagorean theorem calculator",
    description: "Find the missing side of a right triangle, or test three lengths.",
    category: "math",
    keywords: ["pythagoras", "right triangle", "hypotenuse"],
    synonyms: ["a squared plus b squared"],
    inputs: [
      { id: "a", label: "Leg a", type: "number", defaultValue: "3", step: "any", help: "Leave a leg blank to solve for it." },
      { id: "b", label: "Leg b", type: "number", defaultValue: "4", step: "any" },
      { id: "c", label: "Hypotenuse c", type: "number", step: "any", help: "Leave blank to solve for the hypotenuse." },
    ],
    compute: (v) => {
      const a = v.a?.trim() ? readNumber(v, "a", "Leg a", { min: 0 }) : null;
      const b = v.b?.trim() ? readNumber(v, "b", "Leg b", { min: 0 }) : null;
      const c = v.c?.trim() ? readNumber(v, "c", "Hypotenuse", { min: 0 }) : null;
      const known = [a, b, c].filter((n) => n !== null).length;
      if (known < 2) throw new InputError("Enter two sides.");
      if (a !== null && b !== null && c === null) {
        return pack([item("Hypotenuse", formatNumber(Math.sqrt(a * a + b * b), 6), true)]);
      }
      if (a !== null && c !== null && b === null) {
        if (c <= a) throw new InputError("The hypotenuse must be longer than the leg.");
        return pack([item("Leg b", formatNumber(Math.sqrt(c * c - a * a), 6), true)]);
      }
      if (b !== null && c !== null && a === null) {
        if (c <= b) throw new InputError("The hypotenuse must be longer than the leg.");
        return pack([item("Leg a", formatNumber(Math.sqrt(c * c - b * b), 6), true)]);
      }
      if (a === null || b === null || c === null) throw new InputError("Enter two sides.");
      const gap = Math.abs(a * a + b * b - c * c);
      return pack([item("Right triangle?", gap < 1e-6 ? "Yes, within rounding" : "No", true), item("a² + b² − c²", formatNumber(a * a + b * b - c * c, 6))]);
    },
    formula: "a² + b² = c², with c the hypotenuse.",
    howItWorks: "Pythagoras relates the two legs of a right triangle to the side opposite the right angle. You can solve for any one missing side. If you enter all three, the page tests the identity instead of overwriting a number.",
    steps: ["Leave the unknown side blank.", "Keep the hypotenuse in the c field.", "A failed test means the triangle is not right-angled, or a length was mistyped."],
    example: "Legs 3 and 4 give a hypotenuse of 5.",
    faqs: [
      { q: "Does this work for non-right triangles?", a: "No. Use the triangle page and the law of cosines." },
      { q: "Can a leg be longer than the hypotenuse?", a: "No. The page rejects that input." },
    ],
    related: ["triangle-calculator", "distance-calculator", "geometry-calculator"],
  },
  {
    slug: "circle-calculator",
    title: "Circle calculator",
    description: "Calculate area, circumference, and an optional sector from the radius or diameter.",
    category: "math",
    keywords: ["circle", "area", "circumference", "sector"],
    synonyms: ["pi r squared"],
    inputs: [
      { id: "mode", label: "I know", type: "select", defaultValue: "radius", options: [
        { value: "radius", label: "Radius" },
        { value: "diameter", label: "Diameter" },
      ] },
      { id: "size", label: "Size", type: "number", defaultValue: "7", required: true, min: 0 },
      { id: "angle", label: "Sector angle", type: "number", unit: "degrees", defaultValue: "0", min: 0, max: 360, help: "Leave 0 if you do not need a sector." },
    ],
    compute: (v) => {
      const size = readNumber(v, "size", "Size", { min: 0 });
      const radius = v.mode === "diameter" ? size / 2 : size;
      const angle = v.angle?.trim() ? readNumber(v, "angle", "Angle", { min: 0, max: 360 }) : 0;
      const area = Math.PI * radius * radius;
      const results = [
        item("Area", formatNumber(area, 4), true),
        item("Circumference", formatNumber(2 * Math.PI * radius, 4)),
        item("Radius", formatNumber(radius, 4)),
        item("Diameter", formatNumber(radius * 2, 4)),
      ];
      if (angle > 0) {
        results.push(item("Sector area", formatNumber(area * (angle / 360), 4)));
        results.push(item("Arc length", formatNumber(2 * Math.PI * radius * (angle / 360), 4)));
      }
      return pack(results);
    },
    formula: "Area = πr². Circumference = 2πr. Sector area = area × angle / 360.",
    howItWorks: "Every circle measurement here follows from the radius. A diameter is halved first. A sector is the same fraction of the circle as its angle is of 360 degrees.",
    steps: ["Choose radius or diameter.", "Enter the length.", "Add a sector angle only when you need the slice."],
    example: "Radius 7 has area about 153.938 and circumference about 43.982.",
    faqs: [
      { q: "Is π rounded?", a: "Only on display. The calculation uses Math.PI." },
      { q: "What about an annulus?", a: "Subtract the inner circle’s area from the outer circle’s area. Run the page twice." },
    ],
    related: ["geometry-calculator", "polygon-calculator", "surface-area-volume-calculator"],
  },
  {
    slug: "rectangle-calculator",
    title: "Rectangle and square calculator",
    description: "Find area, perimeter, and diagonal of a rectangle or square.",
    category: "math",
    keywords: ["rectangle", "square", "diagonal"],
    synonyms: ["length times width"],
    inputs: [
      { id: "length", label: "Length", type: "number", defaultValue: "12", required: true, min: 0 },
      { id: "width", label: "Width", type: "number", defaultValue: "5", required: true, min: 0, help: "Use the same value as length for a square." },
    ],
    compute: (v) => {
      const length = readNumber(v, "length", "Length", { min: 0 });
      const width = readNumber(v, "width", "Width", { min: 0 });
      return pack([
        item("Area", formatNumber(length * width, 4), true),
        item("Perimeter", formatNumber(2 * (length + width), 4)),
        item("Diagonal", formatNumber(Math.sqrt(length * length + width * width), 4)),
        item("Shape", length === width ? "Square" : "Rectangle"),
      ]);
    },
    formula: "Area = length × width. Perimeter = 2(length + width). Diagonal = √(length² + width²).",
    howItWorks: "A square is a rectangle with equal sides, so one page covers both. The diagonal is the Pythagorean hypotenuse of the two sides. Area and perimeter answer different practical questions: flooring uses area, skirting uses perimeter.",
    steps: ["Enter both sides.", "If they match, the label says square.", "Keep units consistent."],
    example: "12 by 5 has area 60, perimeter 34, and diagonal 13.",
    faqs: [
      { q: "Why is a 5-12-13 diagonal familiar?", a: "5-12-13 is a scaled Pythagorean triple, so the diagonal is an integer." },
      { q: "Can I enter feet and inches?", a: "Convert to one unit first with the feet and inches converter." },
    ],
    related: ["room-area-calculator", "geometry-calculator", "pythagorean-theorem-calculator"],
  },
  {
    slug: "polygon-calculator",
    title: "Polygon calculator",
    description: "Calculate the area, perimeter, and interior angle of a regular polygon.",
    category: "math",
    keywords: ["regular polygon", "pentagon", "hexagon area"],
    synonyms: ["n-gon"],
    inputs: [
      { id: "sides", label: "Number of sides", type: "number", defaultValue: "6", required: true, min: 3, max: 100 },
      { id: "length", label: "Side length", type: "number", defaultValue: "4", required: true, min: 0 },
    ],
    compute: (v) => {
      const sides = readNumber(v, "sides", "Sides", { min: 3, max: 100, integer: true });
      const length = readNumber(v, "length", "Side length", { min: 0 });
      return pack([
        item("Area", formatNumber(polygonArea(sides, length), 4), true),
        item("Perimeter", formatNumber(sides * length, 4)),
        item("Interior angle", `${formatNumber(((sides - 2) * 180) / sides, 2)}°`),
        item("Sum of interior angles", `${formatNumber((sides - 2) * 180, 0)}°`),
      ]);
    },
    formula: "Area = n s² / (4 tan(π/n)). Interior angle = (n − 2) × 180° / n.",
    howItWorks: "A regular polygon has equal sides and equal angles. The area formula comes from splitting it into n isosceles triangles. It does not apply to an irregular polygon; those need a different measurement.",
    steps: ["Enter the number of sides. Three is an equilateral triangle.", "Enter one side length.", "Do not use this area for a polygon with unequal sides."],
    example: "A regular hexagon with side 4 has perimeter 24 and area about 41.569.",
    faqs: [
      { q: "Does a hexagon made of six equilateral triangles match?", a: "Yes. That is a useful check on the formula." },
      { q: "What is the exterior angle?", a: "360° / n. It is not shown as a separate target because it follows immediately." },
    ],
    related: ["geometry-calculator", "triangle-calculator", "circle-calculator"],
  },
  {
    slug: "surface-area-volume-calculator",
    title: "Surface area and volume calculator",
    description: "Calculate volume and surface area for a cube, box, sphere, cylinder, or cone.",
    category: "math",
    keywords: ["volume", "surface area", "cylinder", "sphere"],
    synonyms: ["3d shapes"],
    inputs: [
      { id: "shape", label: "Solid", type: "select", defaultValue: "cylinder", options: [
        { value: "cube", label: "Cube" },
        { value: "box", label: "Rectangular box" },
        { value: "sphere", label: "Sphere" },
        { value: "cylinder", label: "Cylinder" },
        { value: "cone", label: "Cone" },
      ] },
      { id: "a", label: "Edge, radius, or length", type: "number", defaultValue: "4", required: true, min: 0 },
      { id: "b", label: "Width or height", type: "number", defaultValue: "10", min: 0 },
      { id: "c", label: "Height of box", type: "number", defaultValue: "2", min: 0, showIf: { field: "shape", equals: "box" } },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First measurement", { min: 0 });
      const b = v.b?.trim() ? readNumber(v, "b", "Second measurement", { min: 0 }) : 0;
      if (v.shape === "cube") return pack([item("Volume", formatNumber(a ** 3, 4), true), item("Surface area", formatNumber(6 * a * a, 4))]);
      if (v.shape === "sphere") return pack([item("Volume", formatNumber((4 / 3) * Math.PI * a ** 3, 4), true), item("Surface area", formatNumber(4 * Math.PI * a * a, 4))]);
      if (v.shape === "cylinder") {
        return pack([
          item("Volume", formatNumber(Math.PI * a * a * b, 4), true),
          item("Surface area", formatNumber(2 * Math.PI * a * (a + b), 4)),
        ]);
      }
      if (v.shape === "cone") {
        const slant = Math.sqrt(a * a + b * b);
        return pack([
          item("Volume", formatNumber((1 / 3) * Math.PI * a * a * b, 4), true),
          item("Surface area", formatNumber(Math.PI * a * (a + slant), 4)),
          item("Slant height", formatNumber(slant, 4)),
        ]);
      }
      const c = readNumber(v, "c", "Height", { min: 0 });
      return pack([
        item("Volume", formatNumber(a * b * c, 4), true),
        item("Surface area", formatNumber(2 * (a * b + a * c + b * c), 4)),
      ]);
    },
    formula: "Cylinder volume = πr²h. Sphere volume = 4/3 πr³. Cone volume = 1/3 πr²h.",
    howItWorks: "Volume counts the space inside. Surface area counts the outside, including both ends of a closed cylinder and the base of a cone. Open tanks are different; subtract the missing face yourself.",
    steps: ["Choose the solid.", "For a cylinder or cone, the first field is radius and the second is height.", "For a box, enter length, width, and height."],
    example: "A cylinder of radius 4 and height 10 has volume about 502.65.",
    faqs: [
      { q: "Are the solids closed?", a: "Yes. A cylinder includes the top and bottom. Remove  πr² if the top is open." },
      { q: "Which field is the radius?", a: "The first measurement, except for a box or cube." },
    ],
    related: ["circle-calculator", "tank-volume-calculator", "geometry-calculator"],
  },
  {
    slug: "trigonometry-calculator",
    title: "Trigonometry calculator",
    description: "Find sine, cosine, and tangent, or solve a right triangle from one side and one acute angle.",
    category: "math",
    keywords: ["trigonometry", "sine", "cosine", "tangent"],
    synonyms: ["sohcahtoa"],
    inputs: [
      { id: "mode", label: "Mode", type: "select", defaultValue: "functions", options: [
        { value: "functions", label: "sin, cos, and tan of an angle" },
        { value: "triangle", label: "Right triangle from a side and an angle" },
      ] },
      { id: "angle", label: "Angle", type: "number", unit: "degrees", defaultValue: "30", required: true },
      { id: "side", label: "Known side", type: "number", defaultValue: "10", showIf: { field: "mode", equals: "triangle" }, required: true, min: 0 },
      { id: "which", label: "That side is", type: "select", defaultValue: "opposite", showIf: { field: "mode", equals: "triangle" }, options: [
        { value: "opposite", label: "Opposite the angle" },
        { value: "adjacent", label: "Adjacent to the angle" },
        { value: "hypotenuse", label: "The hypotenuse" },
      ] },
    ],
    compute: (v) => {
      const angle = readNumber(v, "angle", "Angle");
      const rad = (angle * Math.PI) / 180;
      if (v.mode !== "triangle") {
        return pack([
          item("sin", formatNumber(Math.sin(rad), 6), true),
          item("cos", formatNumber(Math.cos(rad), 6)),
          item("tan", Number.isFinite(Math.tan(rad)) ? formatNumber(Math.tan(rad), 6) : "Undefined"),
        ]);
      }
      if (angle <= 0 || angle >= 90) throw new InputError("Use an acute angle between 0 and 90 degrees for the triangle.");
      const known = readNumber(v, "side", "Side", { min: 0, allowZero: false });
      let opposite = 0;
      let adjacent = 0;
      let hypotenuse = 0;
      if (v.which === "hypotenuse") {
        hypotenuse = known;
        opposite = known * Math.sin(rad);
        adjacent = known * Math.cos(rad);
      } else if (v.which === "adjacent") {
        adjacent = known;
        hypotenuse = known / Math.cos(rad);
        opposite = known * Math.tan(rad);
      } else {
        opposite = known;
        hypotenuse = known / Math.sin(rad);
        adjacent = known / Math.tan(rad);
      }
      return pack([
        item("Opposite", formatNumber(opposite, 4), true),
        item("Adjacent", formatNumber(adjacent, 4)),
        item("Hypotenuse", formatNumber(hypotenuse, 4)),
        item("Other acute angle", `${formatNumber(90 - angle, 2)}°`),
      ]);
    },
    formula: "sin = opposite / hypotenuse, cos = adjacent / hypotenuse, tan = opposite / adjacent.",
    howItWorks: "Trigonometric ratios connect an acute angle to the sides of a right triangle. The function mode only evaluates the ratio. The triangle mode scales that ratio by the side you know. Angles are degrees on this page; the scientific calculator can use radians.",
    steps: ["Choose a mode.", "Enter the angle in degrees.", "In triangle mode, say which side you measured."],
    example: "sin 30° = 0.5. A hypotenuse of 10 opposite a 30° angle gives an opposite side of 5.",
    faqs: [
      { q: "Why is tan 90 undefined?", a: "Cosine of 90° is zero, and tangent divides by cosine." },
      { q: "Can I enter radians?", a: "Use the scientific calculator for radian evaluation. This page is in degrees so school problems are harder to misread." },
    ],
    related: ["pythagorean-theorem-calculator", "scientific-calculator", "triangle-calculator"],
  },
  {
    slug: "matrix-calculator",
    title: "Matrix calculator",
    description: "Add, multiply, and invert 2×2 matrices, and find a 3×3 determinant.",
    category: "math",
    keywords: ["matrix", "determinant", "inverse"],
    synonyms: ["2x2 matrix"],
    inputs: [
      { id: "mode", label: "Operation", type: "select", defaultValue: "det2", options: [
        { value: "det2", label: "2×2 determinant and inverse" },
        { value: "mul", label: "Multiply two 2×2 matrices" },
        { value: "add", label: "Add two 2×2 matrices" },
        { value: "det3", label: "3×3 determinant" },
      ] },
      { id: "a", label: "Matrix A", type: "text", defaultValue: "1, 2; 3, 4", required: true, help: "Rows separated by semicolons." },
      { id: "b", label: "Matrix B", type: "text", defaultValue: "5, 6; 7, 8", showIf: { field: "mode", equals: "mul" } },
      { id: "b2", label: "Matrix B", type: "text", defaultValue: "5, 6; 7, 8", showIf: { field: "mode", equals: "add" } },
    ],
    compute: (v) => {
      const parse = (raw: string, size: number) => {
        const rows = raw.split(";").map((row) => row.split(/[,\s]+/).filter(Boolean).map(Number));
        if (rows.length !== size || rows.some((row) => row.length !== size || row.some((n) => !Number.isFinite(n)))) {
          throw new InputError(`Enter a ${size}×${size} matrix, with rows separated by semicolons.`);
        }
        return rows;
      };
      if (v.mode === "det3") {
        const m = parse(v.a || "", 3).flat();
        return pack([item("Determinant", formatNumber(det3(m), 6), true)]);
      }
      const A = parse(v.a || "", 2);
      if (v.mode === "det2") {
        const d = det2(A[0][0], A[0][1], A[1][0], A[1][1]);
        const results = [item("Determinant", formatNumber(d, 6), true)];
        if (Math.abs(d) < 1e-12) results.push(item("Inverse", "None — determinant is zero"));
        else {
          results.push(item("Inverse", `${formatNumber(A[1][1] / d, 4)}, ${formatNumber(-A[0][1] / d, 4)}; ${formatNumber(-A[1][0] / d, 4)}, ${formatNumber(A[0][0] / d, 4)}`));
        }
        return pack(results);
      }
      const B = parse(v.mode === "add" ? v.b2 || "" : v.b || "", 2);
      if (v.mode === "add") {
        return pack([item("Sum", `${A[0][0] + B[0][0]}, ${A[0][1] + B[0][1]}; ${A[1][0] + B[1][0]}, ${A[1][1] + B[1][1]}`, true)]);
      }
      const c00 = A[0][0] * B[0][0] + A[0][1] * B[1][0];
      const c01 = A[0][0] * B[0][1] + A[0][1] * B[1][1];
      const c10 = A[1][0] * B[0][0] + A[1][1] * B[1][0];
      const c11 = A[1][0] * B[0][1] + A[1][1] * B[1][1];
      return pack([item("Product AB", `${formatNumber(c00, 4)}, ${formatNumber(c01, 4)}; ${formatNumber(c10, 4)}, ${formatNumber(c11, 4)}`, true)]);
    },
    formula: "det([[a, b], [c, d]]) = ad − bc. The inverse is (1/det) × [[d, −b], [−c, a]].",
    howItWorks: "Matrix multiplication is row-by-column, so AB is not generally BA. The determinant is the signed area scale of the linear map. A zero determinant means the matrix collapses the plane and has no inverse.",
    steps: ["Choose the operation.", "Enter rows separated by semicolons and entries separated by commas.", "For a product, A is on the left."],
    example: "[[1, 2], [3, 4]] has determinant −2.",
    faqs: [
      { q: "Does order matter when multiplying?", a: "Yes. This page computes AB, not BA." },
      { q: "Can I invert a 3×3 matrix?", a: "This page gives the 3×3 determinant only. The inverse is limited to 2×2 so the input stays readable." },
    ],
    related: ["simultaneous-equations-calculator", "linear-equation-calculator", "algebra-calculator"],
  },
  {
    slug: "coordinate-geometry-calculator",
    title: "Coordinate geometry calculator",
    description: "Find the distance, midpoint, slope, and line equation through two points.",
    category: "math",
    keywords: ["coordinate geometry", "midpoint", "line equation"],
    synonyms: ["analytic geometry"],
    inputs: [
      { id: "x1", label: "x1", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "y1", label: "y1", type: "number", defaultValue: "2", required: true, step: "any" },
      { id: "x2", label: "x2", type: "number", defaultValue: "5", required: true, step: "any" },
      { id: "y2", label: "y2", type: "number", defaultValue: "8", required: true, step: "any" },
    ],
    compute: (v) => {
      const x1 = readNumber(v, "x1", "x1");
      const y1 = readNumber(v, "y1", "y1");
      const x2 = readNumber(v, "x2", "x2");
      const y2 = readNumber(v, "y2", "y2");
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const mid = `${formatNumber((x1 + x2) / 2, 4)}, ${formatNumber((y1 + y2) / 2, 4)}`;
      if (dx === 0) return pack([item("Distance", formatNumber(distance, 4), true), item("Midpoint", mid), item("Line", `x = ${formatNumber(x1, 4)}`, false, "Vertical line, slope undefined")]);
      const slope = dy / dx;
      const intercept = y1 - slope * x1;
      return pack([
        item("Distance", formatNumber(distance, 4), true),
        item("Midpoint", mid),
        item("Slope", formatNumber(slope, 4)),
        item("Equation", `y = ${formatNumber(slope, 4)}x + ${formatNumber(intercept, 4)}`),
      ]);
    },
    formula: "Distance = √[(x2−x1)² + (y2−y1)²]. Midpoint = ((x1+x2)/2, (y1+y2)/2). Slope = (y2−y1)/(x2−x1).",
    howItWorks: "Two points determine a segment and, unless the segment is vertical, a unique non-vertical line. The same differences that make the slope also make the distance, which is why the dedicated slope and distance pages are special cases of this one.",
    steps: ["Enter both points.", "Read the distance and midpoint first.", "Use the equation only if the line is not vertical."],
    example: "Points (1, 2) and (5, 8) are 7.211 units apart, with midpoint (3, 5) and slope 1.5.",
    faqs: [
      { q: "What if the points are the same?", a: "Distance is zero and the slope is undefined in the sense that there is no unique line. Enter two distinct points for a line." },
      { q: "Are axes assumed perpendicular?", a: "Yes. This is ordinary Cartesian geometry." },
    ],
    related: ["slope-calculator", "distance-calculator", "linear-equation-calculator"],
  },
  {
    slug: "slope-calculator",
    title: "Slope calculator",
    description: "Calculate the slope and intercept of the line through two points.",
    category: "math",
    keywords: ["slope", "gradient", "rise over run"],
    synonyms: ["m = rise/run"],
    inputs: [
      { id: "x1", label: "x1", type: "number", defaultValue: "0", required: true, step: "any" },
      { id: "y1", label: "y1", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "x2", label: "x2", type: "number", defaultValue: "4", required: true, step: "any" },
      { id: "y2", label: "y2", type: "number", defaultValue: "9", required: true, step: "any" },
    ],
    compute: (v) => {
      const x1 = readNumber(v, "x1", "x1");
      const y1 = readNumber(v, "y1", "y1");
      const x2 = readNumber(v, "x2", "x2");
      const y2 = readNumber(v, "y2", "y2");
      if (x2 === x1) throw new InputError("The x-coordinates are equal, so the slope is undefined. The line is vertical.");
      const slope = (y2 - y1) / (x2 - x1);
      return pack([
        item("Slope", formatNumber(slope, 6), true),
        item("Intercept", formatNumber(y1 - slope * x1, 6)),
        item("Direction", slope > 0 ? "Rises left to right" : slope < 0 ? "Falls left to right" : "Horizontal"),
      ]);
    },
    formula: "Slope m = (y2 − y1) / (x2 − x1).",
    howItWorks: "Slope is rise over run. A positive slope rises as x increases. A zero slope is horizontal. Equal x-coordinates make the run zero, so the slope is undefined rather than infinite in the arithmetic sense.",
    steps: ["Enter two distinct points.", "Read the slope.", "The intercept is the y value where the line crosses x = 0."],
    example: "From (0, 1) to (4, 9), the slope is 2 and the intercept is 1.",
    faqs: [
      { q: "Is slope the same as gradient?", a: "In this school context, yes." },
      { q: "What is a perpendicular slope?", a: "The negative reciprocal, −1/m, if m is not zero. A horizontal line is perpendicular to a vertical line." },
    ],
    related: ["coordinate-geometry-calculator", "distance-calculator", "linear-equation-calculator"],
  },
  {
    slug: "distance-calculator",
    title: "Distance formula calculator",
    description: "Find the straight-line distance between two points in the plane.",
    category: "math",
    keywords: ["distance formula", "distance between points"],
    synonyms: ["euclidean distance"],
    inputs: [
      { id: "x1", label: "x1", type: "number", defaultValue: "0", required: true, step: "any" },
      { id: "y1", label: "y1", type: "number", defaultValue: "0", required: true, step: "any" },
      { id: "x2", label: "x2", type: "number", defaultValue: "3", required: true, step: "any" },
      { id: "y2", label: "y2", type: "number", defaultValue: "4", required: true, step: "any" },
    ],
    compute: (v) => {
      const dx = readNumber(v, "x2", "x2") - readNumber(v, "x1", "x1");
      const dy = readNumber(v, "y2", "y2") - readNumber(v, "y1", "y1");
      return pack([
        item("Distance", formatNumber(Math.sqrt(dx * dx + dy * dy), 6), true),
        item("Horizontal change", formatNumber(dx, 4)),
        item("Vertical change", formatNumber(dy, 4)),
      ]);
    },
    formula: "Distance = √[(x2 − x1)² + (y2 − y1)²].",
    howItWorks: "The distance formula is Pythagoras applied to the horizontal and vertical gaps. It is the straight-line distance, not a path along streets or a curve.",
    steps: ["Enter both points in the same coordinate system.", "Read the distance.", "The signed changes show direction; the distance does not."],
    example: "From (0, 0) to (3, 4) the distance is 5.",
    faqs: [
      { q: "Does order of the points matter?", a: "Not for the distance. It changes the sign of the horizontal and vertical changes." },
      { q: "Can I use latitude and longitude?", a: "Not accurately. Those need a spherical formula, which this plane formula is not." },
    ],
    related: ["coordinate-geometry-calculator", "slope-calculator", "pythagorean-theorem-calculator"],
  },
  {
    slug: "arithmetic-sequence-calculator",
    title: "Arithmetic sequence calculator",
    description: "Find the nth term and the sum of an arithmetic sequence.",
    category: "math",
    keywords: ["arithmetic sequence", "arithmetic series", "common difference"],
    synonyms: ["AP calculator"],
    inputs: [
      { id: "a", label: "First term", type: "number", defaultValue: "3", required: true, step: "any" },
      { id: "d", label: "Common difference", type: "number", defaultValue: "5", required: true, step: "any" },
      { id: "n", label: "Number of terms", type: "number", defaultValue: "10", required: true, min: 1, max: 10000 },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First term");
      const d = readNumber(v, "d", "Common difference");
      const n = readNumber(v, "n", "Number of terms", { min: 1, max: 10000, integer: true });
      const nth = a + (n - 1) * d;
      const sum = (n / 2) * (2 * a + (n - 1) * d);
      const preview = Array.from({ length: Math.min(n, 8) }, (_, i) => formatNumber(a + i * d, 4)).join(", ");
      return pack([
        item("nth term", formatNumber(nth, 6), true),
        item("Sum of n terms", formatNumber(sum, 6)),
        item("First terms", preview + (n > 8 ? ", …" : "")),
      ]);
    },
    formula: "a_n = a + (n − 1)d. Sum = n/2 × [2a + (n − 1)d].",
    howItWorks: "An arithmetic sequence adds the same difference each time. The nth-term formula jumps straight to the end. The sum formula pairs terms from the outside, which is why it is much faster than adding a long list.",
    steps: ["Enter the first term and the difference.", "Enter how many terms you want.", "The preview shows only the first few terms so a long sequence does not flood the page."],
    example: "3, 8, 13, … has tenth term 48 and a ten-term sum of 255.",
    faqs: [
      { q: "Can the difference be negative?", a: "Yes. The sequence then decreases." },
      { q: "Is n the term or the count?", a: "It is the count of terms, starting at the first term you entered." },
    ],
    related: ["geometric-sequence-calculator", "algebra-calculator", "average-calculator"],
  },
  {
    slug: "geometric-sequence-calculator",
    title: "Geometric sequence calculator",
    description: "Find the nth term and the sum of a geometric sequence.",
    category: "math",
    keywords: ["geometric sequence", "common ratio", "geometric series"],
    synonyms: ["GP calculator"],
    inputs: [
      { id: "a", label: "First term", type: "number", defaultValue: "2", required: true, step: "any" },
      { id: "r", label: "Common ratio", type: "number", defaultValue: "3", required: true, step: "any" },
      { id: "n", label: "Number of terms", type: "number", defaultValue: "6", required: true, min: 1, max: 200 },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First term");
      const r = readNumber(v, "r", "Common ratio");
      const n = readNumber(v, "n", "Number of terms", { min: 1, max: 200, integer: true });
      const nth = a * r ** (n - 1);
      if (!Number.isFinite(nth)) throw new InputError("The term is too large to display. Use a smaller ratio or fewer terms.");
      const sum = Math.abs(r - 1) < 1e-12 ? a * n : (a * (r ** n - 1)) / (r - 1);
      return pack([
        item("nth term", formatNumber(nth, 6), true),
        item("Sum of n terms", formatNumber(sum, 6)),
        item("Infinite sum", Math.abs(r) < 1 ? formatNumber(a / (1 - r), 6) : "Not convergent"),
      ]);
    },
    formula: "a_n = a × r^(n−1). Sum = a(r^n − 1)/(r − 1) when r ≠ 1.",
    howItWorks: "A geometric sequence multiplies by the same ratio. If the absolute value of the ratio is less than 1, an infinite series converges to a/(1−r). Otherwise the infinite sum is not a finite number, and the page says so.",
    steps: ["Enter the first term and ratio.", "Keep n modest if the ratio is large.", "Read the infinite-sum line only when |r| < 1."],
    example: "2, 6, 18, 54, 162, 486 is six terms with ratio 3. The sum is 728.",
    faqs: [
      { q: "What if the ratio is 1?", a: "Every term equals the first term and the sum is n times that term." },
      { q: "What if the ratio is negative?", a: "The signs alternate. The infinite sum still converges when the absolute value is below 1." },
    ],
    related: ["arithmetic-sequence-calculator", "exponent-calculator", "compound-interest-calculator"],
  },
  {
    slug: "scientific-unit-converter",
    title: "Scientific unit converter",
    description: "Convert pressure, energy, and speed with the factors used in science classes.",
    category: "math",
    keywords: ["scientific units", "si units", "pressure energy speed"],
    synonyms: ["physics unit converter"],
    inputs: [
      { id: "dimension", label: "Quantity", type: "select", defaultValue: "pressure", options: [
        { value: "pressure", label: "Pressure" },
        { value: "energy", label: "Energy" },
        { value: "speed", label: "Speed" },
      ] },
      { id: "value", label: "Value", type: "number", defaultValue: "1", required: true, step: "any" },
      { id: "from", label: "From code", type: "text", defaultValue: "bar", required: true, help: "Pressure: pa, kpa, bar, atm, psi, mmhg. Energy: j, kj, cal, kcal, wh, kwh, btu. Speed: mps, kmh, mph, kn, fps." },
      { id: "to", label: "To code", type: "text", defaultValue: "psi", required: true },
    ],
    compute: (v) => {
      const dimension = v.dimension || "pressure";
      const known = dimension === "energy" ? ["j", "kj", "cal", "kcal", "wh", "kwh", "btu"] : dimension === "speed" ? ["mps", "kmh", "mph", "kn", "fps"] : ["pa", "kpa", "bar", "atm", "psi", "mmhg"];
      const from = (v.from || "").trim();
      const to = (v.to || "").trim();
      if (!known.includes(from) || !known.includes(to)) throw new InputError(`Use one of: ${known.join(", ")}.`);
      const { convertUnit } = requireUnit();
      const value = readNumber(v, "value", "Value");
      return pack([item("Result", formatNumber(convertUnit(dimension, value, from, to), 8), true), item("Codes", `${from} → ${to}`)]);
    },
    formula: "Convert to the SI base unit, then to the target unit.",
    howItWorks: "Scientific conversions are exact only when the unit definition is exact. A calorie here is the thermochemical calorie, 4.184 J. An atmosphere is 101,325 Pa. The everyday unit converter covers length, mass, and temperature; this page keeps the laboratory quantities together.",
    steps: ["Choose pressure, energy, or speed.", "Type the unit codes from the help text.", "Open the dedicated pressure or energy page if you want a menu instead of codes."],
    example: "1 bar = 14.5038 psi, using the pascal as the base.",
    faqs: [
      { q: "Why codes instead of a menu?", a: "So one page can cover three quantities without hiding the unit identity. The dedicated converters have menus." },
      { q: "Is a food calorie a kcal?", a: "On labels, usually yes. Use kcal, not cal, for that quantity." },
    ],
    related: ["pressure-converter", "energy-converter", "unit-converter"],
  },
];

function requireUnit() {
  return { convertUnit: (dimension: string, value: number, from: string, to: string) => {
    const table: Record<string, Record<string, number>> = {
      pressure: { pa: 1, kpa: 1000, bar: 100000, atm: 101325, psi: 6894.757293168, mmhg: 133.322387415 },
      energy: { j: 1, kj: 1000, cal: 4.184, kcal: 4184, wh: 3600, kwh: 3600000, btu: 1055.05585262 },
      speed: { mps: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 0.514444, fps: 0.3048 },
    };
    return (value * table[dimension][from]) / table[dimension][to];
  } };
}
