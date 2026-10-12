import { factorial } from "./mathx";
import { InputError } from "./format";

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

function tokenize(source: string): Tok[] {
  const s = source.replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  const tokens: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "lp" });
      i += 1;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: "rp" });
      i += 1;
      continue;
    }
    if (c === ",") {
      tokens.push({ t: "comma" });
      i += 1;
      continue;
    }
    if (c === "!") {
      tokens.push({ t: "op", v: "!" });
      i += 1;
      continue;
    }
    if (c === "*" && s[i + 1] === "*") {
      tokens.push({ t: "op", v: "^" });
      i += 2;
      continue;
    }
    if ("+-*/%^".includes(c)) {
      tokens.push({ t: "op", v: c });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      if ((s[j] === "e" || s[j] === "E") && /[0-9+-]/.test(s[j + 1] ?? "")) {
        j += 1;
        if (s[j] === "+" || s[j] === "-") j += 1;
        while (j < s.length && /[0-9]/.test(s[j])) j += 1;
      }
      const num = Number(s.slice(i, j));
      if (!Number.isFinite(num)) throw new InputError("That number could not be read.");
      tokens.push({ t: "num", v: num });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j += 1;
      tokens.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    throw new InputError(`Unexpected character “${c}”.`);
  }
  return tokens;
}

function toRad(value: number, angle: "deg" | "rad"): number {
  return angle === "deg" ? (value * Math.PI) / 180 : value;
}

function fromRad(value: number, angle: "deg" | "rad"): number {
  return angle === "deg" ? (value * 180) / Math.PI : value;
}

function callFunc(name: string, args: number[], angle: "deg" | "rad"): number {
  const [a = 0, b = 0] = args;
  switch (name) {
    case "sin":
      return Math.sin(toRad(a, angle));
    case "cos":
      return Math.cos(toRad(a, angle));
    case "tan":
      return Math.tan(toRad(a, angle));
    case "asin":
      return fromRad(Math.asin(a), angle);
    case "acos":
      return fromRad(Math.acos(a), angle);
    case "atan":
      return fromRad(Math.atan(a), angle);
    case "sqrt":
      if (a < 0) throw new InputError("Square root is not defined for negative numbers in real arithmetic.");
      return Math.sqrt(a);
    case "cbrt":
      return Math.cbrt(a);
    case "ln":
      if (a <= 0) throw new InputError("Natural log is defined for positive numbers only.");
      return Math.log(a);
    case "log":
    case "log10":
      if (args.length === 2) {
        if (a <= 0 || b <= 0 || b === 1) throw new InputError("Logarithm needs a positive value and a positive base other than 1.");
        return Math.log(a) / Math.log(b);
      }
      if (a <= 0) throw new InputError("Logarithm is defined for positive numbers only.");
      return Math.log10(a);
    case "abs":
      return Math.abs(a);
    case "floor":
      return Math.floor(a);
    case "ceil":
      return Math.ceil(a);
    case "round":
      return Math.round(a);
    case "exp":
      return Math.exp(a);
    case "min":
      return Math.min(...args);
    case "max":
      return Math.max(...args);
    case "pow":
      return a ** b;
    default:
      throw new InputError(`Unknown function “${name}”.`);
  }
}

export function evaluateExpression(source: string, angle: "deg" | "rad" = "deg", ans = 0): number {
  if (!source.trim()) throw new InputError("Enter an expression.");
  const tokens = tokenize(source);
  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  function parseExpr(): number {
    return parseAdd();
  }
  function isOp(token: Tok | undefined, op: string): boolean {
    return !!token && token.t === "op" && token.v === op;
  }
  function parseAdd(): number {
    let left = parseMul();
    while (isOp(peek(), "+") || isOp(peek(), "-")) {
      const op = (eat() as { t: "op"; v: string }).v;
      const right = parseMul();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }
  function parseMul(): number {
    let left = parsePow();
    while (peek()) {
      const p = peek();
      if (p.t === "op" && (p.v === "*" || p.v === "/" || p.v === "%")) {
        eat();
        const right = parsePow();
        if ((p.v === "/" || p.v === "%") && right === 0) throw new InputError("Division by zero.");
        left = p.v === "*" ? left * right : p.v === "/" ? left / right : left % right;
      } else if (p.t === "num" || p.t === "id" || p.t === "lp") {
        left *= parsePow();
      } else break;
    }
    return left;
  }
  function parsePow(): number {
    const left = parseUnary();
    if (isOp(peek(), "^")) {
      eat();
      return left ** parsePow();
    }
    return left;
  }
  function parseUnary(): number {
    const token = peek();
    if (token && token.t === "op" && (token.v === "+" || token.v === "-")) {
      eat();
      const value = parseUnary();
      return token.v === "-" ? -value : value;
    }
    return parsePostfix();
  }
  function parsePostfix(): number {
    let value = parsePrimary();
    while (isOp(peek(), "!")) {
      eat();
      value = factorial(value);
    }
    return value;
  }
  function parsePrimary(): number {
    const p = peek();
    if (!p) throw new InputError("The expression ended unexpectedly.");
    if (p.t === "num") {
      eat();
      return p.v;
    }
    if (p.t === "id") {
      eat();
      const name = p.v.toLowerCase();
      if (name === "pi") return Math.PI;
      if (name === "e") return Math.E;
      if (name === "ans") return ans;
      if (peek() && peek().t === "lp") {
        eat();
        const args: number[] = [];
        if (!(peek() && peek().t === "rp")) {
          args.push(parseExpr());
          while (peek() && peek().t === "comma") {
            eat();
            args.push(parseExpr());
          }
        }
        if (!peek() || peek().t !== "rp") throw new InputError("Missing a closing parenthesis.");
        eat();
        return callFunc(name, args, angle);
      }
      throw new InputError(`Unknown name “${p.v}”. Try a function such as sin, sqrt, or log.`);
    }
    if (p.t === "lp") {
      eat();
      const value = parseExpr();
      if (!peek() || peek().t !== "rp") throw new InputError("Missing a closing parenthesis.");
      eat();
      return value;
    }
    throw new InputError("The expression could not be read. Check operators and parentheses.");
  }

  const result = parseExpr();
  if (i < tokens.length) throw new InputError("There is unexpected input after the expression.");
  if (!Number.isFinite(result)) throw new InputError("The result is not a finite number.");
  return result;
}
