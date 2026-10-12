import { InputError } from "./format";

export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function gcdMany(values: number[]): number {
  if (values.length === 0) throw new InputError("Enter at least one integer.");
  return values.reduce((acc, value) => gcd(acc, value));
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(Math.trunc(a) * Math.trunc(b)) / gcd(a, b);
}

export function lcmMany(values: number[]): number {
  if (values.length === 0) throw new InputError("Enter at least one integer.");
  return values.reduce((acc, value) => lcm(acc, value));
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new InputError("Factorial is defined here for whole numbers from 0 upward.");
  if (n > 170) throw new InputError("Factorial above 170 is too large for standard number precision. Use a smaller value.");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function nPr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0) {
    throw new InputError("n and r must be whole numbers of zero or more.");
  }
  if (r > n) throw new InputError("r cannot be greater than n for permutations.");
  let result = 1;
  for (let i = 0; i < r; i++) result *= n - i;
  return result;
}

export function nCr(n: number, r: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0) {
    throw new InputError("n and r must be whole numbers of zero or more.");
  }
  if (r > n) throw new InputError("r cannot be greater than n for combinations.");
  const k = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return result;
}

export function isPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function primeFactors(n: number): number[] {
  if (!Number.isInteger(n) || n < 2) throw new InputError("Enter an integer of 2 or more.");
  if (n > 1_000_000_000_000) throw new InputError("Enter a number up to 1 trillion so the factorisation stays responsive.");
  const factors: number[] = [];
  let x = n;
  while (x % 2 === 0) {
    factors.push(2);
    x /= 2;
  }
  while (x % 3 === 0) {
    factors.push(3);
    x /= 3;
  }
  let d = 5;
  while (d * d <= x) {
    while (x % d === 0) {
      factors.push(d);
      x /= d;
    }
    const d2 = d + 2;
    while (x % d2 === 0) {
      factors.push(d2);
      x /= d2;
    }
    d += 6;
  }
  if (x > 1) factors.push(x);
  return factors;
}

export function mean(values: number[]): number {
  if (values.length === 0) throw new InputError("Enter at least one number.");
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) throw new InputError("Enter at least one number.");
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
}

export function modes(values: number[]): number[] {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best = 0;
  for (const count of counts.values()) best = Math.max(best, count);
  if (best <= 1) return [];
  return [...counts.entries()]
    .filter(([, count]) => count === best)
    .map(([value]) => value)
    .sort((a, b) => a - b);
}

export function range(values: number[]): number {
  if (values.length === 0) throw new InputError("Enter at least one number.");
  return Math.max(...values) - Math.min(...values);
}

export function variance(values: number[], sample = true): number {
  if (values.length === 0) throw new InputError("Enter at least one number.");
  if (sample && values.length < 2) throw new InputError("Sample variance needs at least two numbers.");
  const avg = mean(values);
  const sum = values.reduce((s, v) => s + (v - avg) ** 2, 0);
  return sum / (sample ? values.length - 1 : values.length);
}

export function stdev(values: number[], sample = true): number {
  return Math.sqrt(variance(values, sample));
}

export function quadraticRoots(a: number, b: number, c: number): { discriminant: number; roots: string[] } {
  if (a === 0) throw new InputError("The coefficient a cannot be zero in a quadratic equation. Use the linear solver.");
  const discriminant = b * b - 4 * a * c;
  if (discriminant > 0) {
    const s = Math.sqrt(discriminant);
    return {
      discriminant,
      roots: [formatRoot((-b + s) / (2 * a)), formatRoot((-b - s) / (2 * a))],
    };
  }
  if (Math.abs(discriminant) < 1e-12) {
    return { discriminant: 0, roots: [formatRoot(-b / (2 * a))] };
  }
  const real = -b / (2 * a);
  const imag = Math.sqrt(-discriminant) / (2 * Math.abs(a));
  const sign = a > 0 ? 1 : -1;
  return {
    discriminant,
    roots: [
      `${formatRoot(real)} + ${formatRoot(sign * imag)}i`,
      `${formatRoot(real)} − ${formatRoot(sign * imag)}i`,
    ],
  };
}

function formatRoot(value: number): string {
  const rounded = Math.round(value * 1e8) / 1e8;
  return String(rounded);
}

export function solve2x2(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): { x: number; y: number } {
  const det = a1 * b2 - a2 * b1;
  if (Math.abs(det) < 1e-12) throw new InputError("These equations do not have a unique solution. The lines are parallel or the same.");
  return {
    x: (c1 * b2 - c2 * b1) / det,
    y: (a1 * c2 - a2 * c1) / det,
  };
}

export function polygonArea(sides: number, sideLength: number): number {
  return (sides * sideLength * sideLength) / (4 * Math.tan(Math.PI / sides));
}

export function det2(a: number, b: number, c: number, d: number): number {
  return a * d - b * c;
}

export function det3(m: number[]): number {
  const [a, b, c, d, e, f, g, h, i] = m;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

export function toScientific(value: number): { mantissa: number; exponent: number; text: string } {
  if (value === 0) return { mantissa: 0, exponent: 0, text: "0 × 10^0" };
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / 10 ** exponent;
  return {
    mantissa,
    exponent,
    text: `${Math.round(mantissa * 1e8) / 1e8} × 10^${exponent}`,
  };
}

export function fromScientific(mantissa: number, exponent: number): number {
  return mantissa * 10 ** exponent;
}

export function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return (Math.sign(value) * Math.round(Math.abs(value) * factor + Number.EPSILON)) / factor;
}

export function roundHalfEven(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  const scaled = value * factor;
  const floor = Math.floor(Math.abs(scaled));
  const diff = Math.abs(scaled) - floor;
  let mag: number;
  if (Math.abs(diff - 0.5) < 1e-8) mag = floor % 2 === 0 ? floor : floor + 1;
  else mag = Math.round(Math.abs(scaled));
  return (Math.sign(value) * mag) / factor;
}

export function roundToStep(value: number, step: number, mode: "half-up" | "half-even" | "floor" | "ceil" | "trunc"): number {
  if (step === 0) throw new InputError("The rounding step cannot be zero.");
  const scaled = value / step;
  let rounded: number;
  if (mode === "floor") rounded = Math.floor(scaled);
  else if (mode === "ceil") rounded = Math.ceil(scaled);
  else if (mode === "trunc") rounded = Math.trunc(scaled);
  else if (mode === "half-even") rounded = roundHalfEven(scaled, 0);
  else rounded = roundHalfUp(scaled, 0);
  return rounded * step;
}
