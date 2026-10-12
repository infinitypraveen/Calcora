import { describe, expect, it } from "vitest";
import { emi, cagr, sipFutureValue, xirr, simpleInterest } from "@/lib/finance";
import { bmi, bmrMifflin } from "@/lib/health";
import { gcd, lcm, quadraticRoots, isPrime } from "@/lib/mathx";
import { estimateIncomeTax } from "@/config/taxRules";
import { evaluateExpression } from "@/lib/parser";
import { subnetInfo } from "@/lib/subnet";
import { toRoman, fromRoman } from "@/lib/text";

describe("finance", () => {
  it("computes a known EMI", () => {
    const payment = emi(1_000_000, 9, 240);
    expect(payment).toBeGreaterThan(8990);
    expect(payment).toBeLessThan(9010);
  });

  it("computes SIP future value", () => {
    const value = sipFutureValue(10000, 12, 120);
    expect(value).toBeGreaterThan(2_300_000);
    expect(value).toBeLessThan(2_350_000);
  });

  it("computes CAGR", () => {
    expect(cagr(100000, 180000, 5)).toBeCloseTo(0.1247, 3);
  });

  it("computes simple interest", () => {
    expect(simpleInterest(50000, 7, 3).interest).toBe(10500);
  });

  it("finds about 10% XIRR over a year", () => {
    const rate = xirr([
      { amount: -1000, date: new Date(2024, 0, 1) },
      { amount: 1100, date: new Date(2025, 0, 1) },
    ]);
    expect(rate).toBeGreaterThan(0.09);
    expect(rate).toBeLessThan(0.11);
  });
});

describe("health and tax", () => {
  it("computes BMI", () => {
    expect(bmi(68, 168)).toBeCloseTo(24.09, 1);
  });

  it("computes Mifflin BMR for a woman", () => {
    const value = bmrMifflin("female", 68, 168, 34);
    expect(value).toBeGreaterThan(1350);
    expect(value).toBeLessThan(1450);
  });

  it("applies the new-regime rebate near 12 lakh taxable", () => {
    const estimate = estimateIncomeTax({
      yearId: "2026-27",
      regime: "new",
      age: "below60",
      grossIncome: 1_200_000,
      isSalaried: true,
      oldRegimeDeductions: 0,
      employerNps: 0,
      basicSalary: 0,
    });
    expect(estimate.taxableIncome).toBe(1_125_000);
    expect(estimate.totalTax).toBe(0);
  });
});

describe("math and text", () => {
  it("solves a quadratic", () => {
    const solved = quadraticRoots(1, -5, 6);
    expect(solved.roots).toEqual(["3", "2"]);
  });

  it("computes gcd and lcm", () => {
    expect(gcd(48, 180)).toBe(12);
    expect(lcm(12, 18)).toBe(36);
  });

  it("checks primes", () => {
    expect(isPrime(97)).toBe(true);
    expect(isPrime(91)).toBe(false);
  });

  it("evaluates without eval", () => {
    expect(evaluateExpression("2*(3+4)^2")).toBe(98);
    expect(evaluateExpression("sin(30)")).toBeCloseTo(0.5, 6);
  });

  it("converts Roman numerals", () => {
    expect(toRoman(2026)).toBe("MMXXVI");
    expect(fromRoman("MCMXCIV")).toBe(1994);
  });
});

describe("subnet", () => {
  it("calculates a /24", () => {
    const info = subnetInfo("192.168.1.25", 24);
    expect(info.network).toBe("192.168.1.0");
    expect(info.broadcast).toBe("192.168.1.255");
    expect(info.usableHosts).toBe(254);
  });
});
