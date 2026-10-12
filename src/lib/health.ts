import { InputError } from "./format";

export function bmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) throw new InputError("Weight and height must be greater than zero.");
  const metres = heightCm / 100;
  return weightKg / (metres * metres);
}

export function bmiCategory(value: number): string {
  if (value < 18.5) return "Underweight";
  if (value < 25) return "Normal weight";
  if (value < 30) return "Overweight";
  return "Obesity range";
}

export type Sex = "female" | "male";

export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function bmrHarris(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  if (sex === "male") return 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age;
  return 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
}

export const activityFactors = [
  { id: "sedentary", label: "Sedentary — desk work, little exercise", factor: 1.2 },
  { id: "light", label: "Light — exercise 1–3 days a week", factor: 1.375 },
  { id: "moderate", label: "Moderate — exercise 3–5 days a week", factor: 1.55 },
  { id: "active", label: "Active — hard exercise 6–7 days a week", factor: 1.725 },
  { id: "very", label: "Very active — physical job or training twice a day", factor: 1.9 },
] as const;

export function activityFactor(id: string): number {
  return activityFactors.find((item) => item.id === id)?.factor ?? 1.2;
}

export function idealWeightRange(sex: Sex, heightCm: number): { devine: number; robinson: number; miller: number } {
  const inchesOver = heightCm / 2.54 - 60;
  if (sex === "male") {
    return {
      devine: 50 + 2.3 * inchesOver,
      robinson: 52 + 1.9 * inchesOver,
      miller: 56.2 + 1.41 * inchesOver,
    };
  }
  return {
    devine: 45.5 + 2.3 * inchesOver,
    robinson: 49 + 1.7 * inchesOver,
    miller: 53.1 + 1.36 * inchesOver,
  };
}

export function navyBodyFat(sex: Sex, heightCm: number, neckCm: number, waistCm: number, hipCm = 0): number {
  const height = heightCm / 2.54;
  const neck = neckCm / 2.54;
  const waist = waistCm / 2.54;
  const hip = hipCm / 2.54;
  if (sex === "male") {
    if (waist <= neck) throw new InputError("Waist measurement must be larger than neck measurement for this formula.");
    return 86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76;
  }
  if (waist + hip <= neck) throw new InputError("Waist plus hip must be larger than the neck measurement for this formula.");
  return 163.205 * Math.log10(waist + hip - neck) - 97.684 * Math.log10(height) - 78.387;
}

export function leanBodyMassBoer(sex: Sex, weightKg: number, heightCm: number): number {
  if (sex === "male") return 0.407 * weightKg + 0.267 * heightCm - 19.2;
  return 0.252 * weightKg + 0.473 * heightCm - 48.3;
}

export function epley1rm(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function brzycki1rm(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps >= 37) throw new InputError("The Brzycki formula is not meaningful at 37 or more repetitions.");
  return weight * (36 / (37 - reps));
}

export const metActivities = [
  { id: "walk-slow", label: "Walking, slow (about 3 km/h)", met: 2.8 },
  { id: "walk", label: "Walking, moderate (about 5 km/h)", met: 3.5 },
  { id: "walk-brisk", label: "Walking, brisk (about 6.5 km/h)", met: 5 },
  { id: "run-8", label: "Running, about 8 km/h", met: 8.3 },
  { id: "run-10", label: "Running, about 10 km/h", met: 9.8 },
  { id: "run-12", label: "Running, about 12 km/h", met: 11.5 },
  { id: "cycle", label: "Cycling, moderate", met: 8 },
  { id: "swim", label: "Swimming, moderate", met: 6 },
  { id: "weights", label: "Weight training, general", met: 6 },
  { id: "hiit", label: "HIIT circuit", met: 8 },
  { id: "yoga", label: "Yoga, hatha", met: 2.5 },
  { id: "dance", label: "Dancing, aerobic", met: 7.3 },
  { id: "garden", label: "Gardening", met: 3.8 },
  { id: "clean", label: "House cleaning", met: 3.3 },
] as const;

export function caloriesFromMet(met: number, weightKg: number, minutes: number): number {
  return met * weightKg * (minutes / 60);
}
