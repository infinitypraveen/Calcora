const ZERO_DECIMAL = new Set(["JPY", "KRW"]);

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  let max = digits;
  if (abs !== 0 && abs < 0.001) max = Math.max(digits, 6);
  else if (abs !== 0 && abs < 0.01) max = Math.max(digits, 4);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: max,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatFixed(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatMoney(value: number, currency = "INR", digits?: number): string {
  if (!Number.isFinite(value)) return "—";
  const maximumFractionDigits = digits ?? (ZERO_DECIMAL.has(currency) ? 0 : 2);
  const minimumFractionDigits = ZERO_DECIMAL.has(currency) ? 0 : Math.min(2, maximumFractionDigits);
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(value);
  } catch {
    return `${currency} ${formatFixed(value, maximumFractionDigits)}`;
  }
}

export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${formatNumber(value, digits)}%`;
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

export function readNumber(
  values: Record<string, string>,
  id: string,
  label: string,
  opts?: { min?: number; max?: number; integer?: boolean; allowZero?: boolean },
): number {
  const raw = (values[id] ?? "").trim().replace(/,/g, "");
  if (!raw) throw new InputError(`Enter ${label}.`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new InputError(`${label} must be a valid number.`);
  if (opts?.integer && !Number.isInteger(value)) throw new InputError(`${label} must be a whole number.`);
  if (opts?.min !== undefined && value < opts.min) {
    throw new InputError(`${label} must be at least ${opts.min}.`);
  }
  if (opts?.max !== undefined && value > opts.max) {
    throw new InputError(`${label} must be at most ${opts.max}.`);
  }
  if (opts?.allowZero === false && value === 0) throw new InputError(`${label} cannot be zero.`);
  return value;
}

export function readOptionalNumber(values: Record<string, string>, id: string, label: string): number | null {
  const raw = (values[id] ?? "").trim();
  if (!raw) return null;
  return readNumber(values, id, label);
}

export function parseNumberList(raw: string, label = "the list"): number[] {
  const parts = raw
    .split(/[\s,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) throw new InputError(`Enter at least one number in ${label}.`);
  return parts.map((part, index) => {
    const value = Number(part.replace(/,/g, ""));
    if (!Number.isFinite(value)) throw new InputError(`“${part}” in ${label} is not a valid number (item ${index + 1}).`);
    return value;
  });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function almostZero(value: number): boolean {
  return Math.abs(value) < 1e-10;
}
