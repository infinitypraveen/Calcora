import { InputError } from "./format";

export interface UnitDef {
  id: string;
  label: string;
  /** Multiply a value in this unit by `toBase` to get the dimension base. Ignored for temperature. */
  toBase: number;
}

export interface Dimension {
  id: string;
  label: string;
  base: string;
  units: UnitDef[];
  temperature?: boolean;
}

const length: UnitDef[] = [
  { id: "mm", label: "Millimetres", toBase: 0.001 },
  { id: "cm", label: "Centimetres", toBase: 0.01 },
  { id: "m", label: "Metres", toBase: 1 },
  { id: "km", label: "Kilometres", toBase: 1000 },
  { id: "in", label: "Inches", toBase: 0.0254 },
  { id: "ft", label: "Feet", toBase: 0.3048 },
  { id: "yd", label: "Yards", toBase: 0.9144 },
  { id: "mi", label: "Miles", toBase: 1609.344 },
  { id: "nmi", label: "Nautical miles", toBase: 1852 },
];

const weight: UnitDef[] = [
  { id: "mg", label: "Milligrams", toBase: 1e-6 },
  { id: "g", label: "Grams", toBase: 0.001 },
  { id: "kg", label: "Kilograms", toBase: 1 },
  { id: "t", label: "Metric tonnes", toBase: 1000 },
  { id: "oz", label: "Ounces", toBase: 0.028349523125 },
  { id: "lb", label: "Pounds", toBase: 0.45359237 },
  { id: "st", label: "Stone", toBase: 6.35029318 },
];

const area: UnitDef[] = [
  { id: "mm2", label: "Square millimetres", toBase: 1e-6 },
  { id: "cm2", label: "Square centimetres", toBase: 1e-4 },
  { id: "m2", label: "Square metres", toBase: 1 },
  { id: "ha", label: "Hectares", toBase: 10000 },
  { id: "km2", label: "Square kilometres", toBase: 1e6 },
  { id: "in2", label: "Square inches", toBase: 0.00064516 },
  { id: "ft2", label: "Square feet", toBase: 0.09290304 },
  { id: "yd2", label: "Square yards", toBase: 0.83612736 },
  { id: "acre", label: "Acres", toBase: 4046.8564224 },
];

const volume: UnitDef[] = [
  { id: "ml", label: "Millilitres", toBase: 1e-6 },
  { id: "l", label: "Litres", toBase: 0.001 },
  { id: "m3", label: "Cubic metres", toBase: 1 },
  { id: "tsp", label: "US teaspoons", toBase: 4.92892159375e-6 },
  { id: "tbsp", label: "US tablespoons", toBase: 1.478676478125e-5 },
  { id: "cup", label: "US cups", toBase: 0.0002365882365 },
  { id: "floz", label: "US fluid ounces", toBase: 2.95735295625e-5 },
  { id: "pt", label: "US pints", toBase: 0.000473176473 },
  { id: "gal", label: "US gallons", toBase: 0.003785411784 },
  { id: "galuk", label: "UK gallons", toBase: 0.00454609 },
  { id: "ft3", label: "Cubic feet", toBase: 0.028316846592 },
  { id: "in3", label: "Cubic inches", toBase: 1.6387064e-5 },
];

const speed: UnitDef[] = [
  { id: "mps", label: "Metres per second", toBase: 1 },
  { id: "kmh", label: "Kilometres per hour", toBase: 1 / 3.6 },
  { id: "mph", label: "Miles per hour", toBase: 0.44704 },
  { id: "kn", label: "Knots", toBase: 0.514444 },
  { id: "fps", label: "Feet per second", toBase: 0.3048 },
];

const pressure: UnitDef[] = [
  { id: "pa", label: "Pascals", toBase: 1 },
  { id: "kpa", label: "Kilopascals", toBase: 1000 },
  { id: "bar", label: "Bar", toBase: 100000 },
  { id: "atm", label: "Atmospheres", toBase: 101325 },
  { id: "psi", label: "Pounds per square inch", toBase: 6894.757293168 },
  { id: "mmhg", label: "Millimetres of mercury", toBase: 133.322387415 },
];

const energy: UnitDef[] = [
  { id: "j", label: "Joules", toBase: 1 },
  { id: "kj", label: "Kilojoules", toBase: 1000 },
  { id: "cal", label: "Calories", toBase: 4.184 },
  { id: "kcal", label: "Kilocalories", toBase: 4184 },
  { id: "wh", label: "Watt-hours", toBase: 3600 },
  { id: "kwh", label: "Kilowatt-hours", toBase: 3_600_000 },
  { id: "btu", label: "British thermal units", toBase: 1055.05585262 },
];

const data: UnitDef[] = [
  { id: "bit", label: "Bits", toBase: 0.125 },
  { id: "B", label: "Bytes", toBase: 1 },
  { id: "KB", label: "Kilobytes (1000)", toBase: 1000 },
  { id: "MB", label: "Megabytes (1000²)", toBase: 1000 ** 2 },
  { id: "GB", label: "Gigabytes (1000³)", toBase: 1000 ** 3 },
  { id: "TB", label: "Terabytes (1000⁴)", toBase: 1000 ** 4 },
  { id: "KiB", label: "Kibibytes (1024)", toBase: 1024 },
  { id: "MiB", label: "Mebibytes (1024²)", toBase: 1024 ** 2 },
  { id: "GiB", label: "Gibibytes (1024³)", toBase: 1024 ** 3 },
  { id: "TiB", label: "Tebibytes (1024⁴)", toBase: 1024 ** 4 },
];

const temperature: UnitDef[] = [
  { id: "C", label: "Celsius", toBase: 1 },
  { id: "F", label: "Fahrenheit", toBase: 1 },
  { id: "K", label: "Kelvin", toBase: 1 },
];

const land: UnitDef[] = [
  { id: "m2", label: "Square metres", toBase: 1 },
  { id: "ft2", label: "Square feet", toBase: 0.09290304 },
  { id: "yd2", label: "Square yards", toBase: 0.83612736 },
  { id: "acre", label: "Acres", toBase: 4046.8564224 },
  { id: "ha", label: "Hectares", toBase: 10000 },
  { id: "cent", label: "Cent (435.6 sq ft)", toBase: 435.6 * 0.09290304 },
  { id: "guntha", label: "Guntha (Maharashtra, 121 sq yd)", toBase: 121 * 0.83612736 },
  { id: "ground", label: "Ground (Tamil Nadu, 2,400 sq ft)", toBase: 2400 * 0.09290304 },
  { id: "bigha-up", label: "Bigha (Uttar Pradesh, 27,225 sq ft)", toBase: 27225 * 0.09290304 },
  { id: "bigha-wb", label: "Bigha (West Bengal, 14,400 sq ft)", toBase: 14400 * 0.09290304 },
];

export const dimensions: Record<string, Dimension> = {
  length: { id: "length", label: "Length", base: "m", units: length },
  weight: { id: "weight", label: "Weight", base: "kg", units: weight },
  area: { id: "area", label: "Area", base: "m²", units: area },
  volume: { id: "volume", label: "Volume", base: "m³", units: volume },
  temperature: { id: "temperature", label: "Temperature", base: "C", units: temperature, temperature: true },
  speed: { id: "speed", label: "Speed", base: "m/s", units: speed },
  pressure: { id: "pressure", label: "Pressure", base: "Pa", units: pressure },
  energy: { id: "energy", label: "Energy", base: "J", units: energy },
  data: { id: "data", label: "Data storage", base: "B", units: data },
  land: { id: "land", label: "Land area", base: "m²", units: land },
};

export function convertTemperature(value: number, from: string, to: string): number {
  let celsius: number;
  if (from === "C") celsius = value;
  else if (from === "F") celsius = ((value - 32) * 5) / 9;
  else if (from === "K") celsius = value - 273.15;
  else throw new InputError("Unknown temperature unit.");
  if (to === "C") return celsius;
  if (to === "F") return (celsius * 9) / 5 + 32;
  if (to === "K") return celsius + 273.15;
  throw new InputError("Unknown temperature unit.");
}

export function convertUnit(dimensionId: string, value: number, from: string, to: string): number {
  const dimension = dimensions[dimensionId];
  if (!dimension) throw new InputError("Unknown conversion type.");
  if (dimension.temperature) return convertTemperature(value, from, to);
  const fromUnit = dimension.units.find((unit) => unit.id === from);
  const toUnit = dimension.units.find((unit) => unit.id === to);
  if (!fromUnit || !toUnit) throw new InputError("Choose valid units.");
  return (value * fromUnit.toBase) / toUnit.toBase;
}

export function unitOptions(dimensionId: string): { value: string; label: string }[] {
  return dimensions[dimensionId].units.map((unit) => ({ value: unit.id, label: unit.label }));
}
