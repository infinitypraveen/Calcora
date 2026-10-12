import { gcd } from "./mathx";
import { InputError } from "./format";

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new InputError("Standard Roman numerals on this page cover the integers 1 to 3,999.");
  }
  let n = value;
  let out = "";
  for (const [amount, glyph] of ROMAN) {
    while (n >= amount) {
      out += glyph;
      n -= amount;
    }
  }
  return out;
}

export function fromRoman(raw: string): number {
  const text = raw.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(text)) throw new InputError("Use only the Roman digits I, V, X, L, C, D, and M.");
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const current = values[text[i]];
    const next = values[text[i + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  if (toRoman(total) !== text) throw new InputError("That is not a standard Roman numeral. Try a canonical form such as XIV or MCM.");
  return total;
}

const SMALL = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function under100(n: number): string {
  if (n < 20) return SMALL[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]}-${SMALL[one]}` : TENS[ten];
}

function under1000(n: number): string {
  if (n < 100) return under100(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return rest ? `${SMALL[hundred]} hundred ${under100(rest)}` : `${SMALL[hundred]} hundred`;
}

export function numberToWords(value: number, system: "indian" | "western" = "western"): string {
  if (!Number.isFinite(value)) throw new InputError("Enter a finite number.");
  if (Math.abs(value) >= 1e12) throw new InputError("Enter a number below 1 trillion.");
  const sign = value < 0 ? "minus " : "";
  const abs = Math.abs(value);
  const whole = Math.trunc(abs);
  const fraction = Math.round((abs - whole) * 100) / 100;
  const words = system === "indian" ? indianWords(whole) : westernWords(whole);
  if (fraction === 0) return sign + words;
  const digits = (abs.toFixed(2).split(".")[1] ?? "").replace(/0+$/, "");
  const point = digits
    .split("")
    .map((d) => SMALL[Number(d)])
    .join(" ");
  return `${sign}${words} point ${point}`;
}

function westernWords(n: number): string {
  if (n === 0) return "zero";
  const scales = ["", "thousand", "million", "billion"];
  const parts: string[] = [];
  let rest = n;
  let scale = 0;
  while (rest > 0) {
    const chunk = rest % 1000;
    if (chunk) parts.unshift(`${under1000(chunk)}${scales[scale] ? ` ${scales[scale]}` : ""}`);
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  return parts.join(" ");
}

function indianWords(n: number): string {
  if (n === 0) return "zero";
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${under1000(crore)} crore`);
  if (lakh) parts.push(`${under100(lakh)} lakh`);
  if (thousand) parts.push(`${under100(thousand)} thousand`);
  if (rest) parts.push(under1000(rest));
  return parts.join(" ");
}

export function simplifyFraction(numerator: number, denominator: number): { n: number; d: number } {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new InputError("Enter whole-number numerators and denominators, or use the decimal converter.");
  }
  if (denominator === 0) throw new InputError("The denominator cannot be zero.");
  const sign = numerator * denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator) || 1;
  return { n: (sign * Math.abs(numerator)) / divisor, d: Math.abs(denominator) / divisor };
}

export function toFraction(value: number, maxDenominator = 10_000): { n: number; d: number } {
  if (!Number.isFinite(value)) throw new InputError("Enter a finite decimal.");
  const sign = value < 0 ? -1 : 1;
  let x = Math.abs(value);
  if (x === 0) return { n: 0, d: 1 };
  let h0 = 0;
  let h1 = 1;
  let k0 = 1;
  let k1 = 0;
  let b = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(b);
    const h = a * h1 + h0;
    const k = a * k1 + k0;
    if (k > maxDenominator) break;
    h0 = h1;
    h1 = h;
    k0 = k1;
    k1 = k;
    if (Math.abs(x - h1 / k1) < 1e-12) break;
    const frac = b - a;
    if (frac < 1e-12) break;
    b = 1 / frac;
  }
  return simplifyFraction(sign * h1, k1 || 1);
}

export function parseFraction(raw: string): { n: number; d: number } {
  const text = raw.trim();
  const mixed = /^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(text);
  if (mixed) {
    const whole = Number(mixed[1]);
    const n = Number(mixed[2]);
    const d = Number(mixed[3]);
    if (d === 0) throw new InputError("A denominator cannot be zero.");
    const sign = whole < 0 ? -1 : 1;
    return simplifyFraction(sign * (Math.abs(whole) * d + n), d);
  }
  const frac = /^(-?\d+)\s*\/\s*(-?\d+)$/.exec(text);
  if (frac) return simplifyFraction(Number(frac[1]), Number(frac[2]));
  if (/^-?\d+$/.test(text)) return { n: Number(text), d: 1 };
  throw new InputError("Use a fraction such as 3/4, a whole number, or a mixed number such as 1 1/2.");
}

export function formatFraction(n: number, d: number, mixed = false): string {
  if (d === 1) return String(n);
  if (!mixed || Math.abs(n) < d) return `${n}/${d}`;
  const sign = n < 0 ? "-" : "";
  const whole = Math.floor(Math.abs(n) / d);
  const rem = Math.abs(n) % d;
  if (rem === 0) return `${sign}${whole}`;
  return `${sign}${whole} ${rem}/${d}`;
}

export function convertBase(raw: string, fromBase: number, toBase: number): string {
  const text = raw.trim().toLowerCase().replace(/^0b/, "").replace(/^0o/, "").replace(/^0x/, "");
  if (!text) throw new InputError("Enter a number to convert.");
  if (fromBase < 2 || fromBase > 16 || toBase < 2 || toBase > 16) throw new InputError("Bases must be between 2 and 16.");
  const digits = "0123456789abcdef";
  let value = 0;
  for (const char of text) {
    const digit = digits.indexOf(char);
    if (digit < 0 || digit >= fromBase) throw new InputError(`“${char}” is not a valid digit in base ${fromBase}.`);
    value = value * fromBase + digit;
    if (!Number.isSafeInteger(value)) throw new InputError("That value is too large for exact integer conversion in the browser.");
  }
  if (value === 0) return "0";
  let out = "";
  let n = value;
  while (n > 0) {
    out = digits[n % toBase] + out;
    n = Math.floor(n / toBase);
  }
  return out.toUpperCase();
}

export function utf8ToBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function base64ToUtf8(value: string): string {
  try {
    const binary = atob(value.trim());
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new InputError("That text is not valid Base64, or it does not decode as UTF-8.");
  }
}
