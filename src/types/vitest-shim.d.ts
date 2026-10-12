declare module "vitest" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  type Matcher = {
    toBe(value: unknown): void;
    toEqual(value: unknown): void;
    toBeCloseTo(value: number, digits?: number): void;
    toBeGreaterThan(value: number): void;
    toBeLessThan(value: number): void;
  };
  export function expect(value: unknown): Matcher;
}
