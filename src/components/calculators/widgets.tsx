import { useMemo, useState } from "react";
import { InputError } from "@/lib/format";
import { evaluateExpression } from "@/lib/parser";

const passage = "A good calculator shows its working. It names the units, refuses a zero denominator, and tells you when a result is only an estimate. Type this passage at a steady pace. Accuracy matters more than speed, and the score stays on this page.";

export function BasicCalculator() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  function apply(a: number, operator: string, b: number) {
    if (operator === "+") return a + b;
    if (operator === "-") return a - b;
    if (operator === "*") return a * b;
    if (operator === "/") {
      if (b === 0) throw new InputError("Division by zero.");
      return a / b;
    }
    return b;
  }

  function inputDigit(d: string) {
    setDisplay((current) => {
      if (fresh || current === "0") return d === "." ? "0." : d;
      if (d === "." && current.includes(".")) return current;
      return current + d;
    });
    setFresh(false);
  }

  function chooseOp(next: string) {
    const current = Number(display);
    if (acc !== null && op && !fresh) {
      try {
        const value = apply(acc, op, current);
        setAcc(value);
        setDisplay(String(Math.round(value * 1e10) / 1e10));
      } catch (error) {
        setDisplay(error instanceof Error ? error.message : "Error");
        setAcc(null);
        setOp(null);
        setFresh(true);
        return;
      }
    } else setAcc(current);
    setOp(next);
    setFresh(true);
  }

  function equals() {
    if (acc === null || !op) return;
    try {
      const value = apply(acc, op, Number(display));
      setDisplay(String(Math.round(value * 1e10) / 1e10));
      setAcc(null);
      setOp(null);
      setFresh(true);
    } catch (error) {
      setDisplay(error instanceof Error ? error.message : "Error");
      setAcc(null);
      setOp(null);
      setFresh(true);
    }
  }

  const keys = ["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "%", "+"];
  return (
    <div className="rounded-3xl bg-[#102033] p-4 text-white" onKeyDown={(event) => {
      if (/^[0-9.]$/.test(event.key)) inputDigit(event.key);
      if (["+", "-", "*", "/"].includes(event.key)) chooseOp(event.key);
      if (event.key === "Enter") equals();
      if (event.key === "Escape") { setDisplay("0"); setAcc(null); setOp(null); setFresh(true); }
      if (event.key === "Backspace") setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
    }} tabIndex={0}>
      <p className="num min-h-16 break-all text-right text-4xl" aria-live="polite">{display}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <button type="button" className="key warn col-span-2" onClick={() => { setDisplay("0"); setAcc(null); setOp(null); setFresh(true); }}>Clear</button>
        <button type="button" className="key" onClick={() => setDisplay((d) => String(Number(d) * -1))}>±</button>
        <button type="button" className="key" onClick={() => setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : "0"))}>⌫</button>
        {keys.map((key) => (
          <button key={key} type="button" className={`key ${"+-*/%".includes(key) ? "op" : ""}`} onClick={() => {
            if (key === "%") {
              if (acc !== null && op) setDisplay(String((acc * Number(display)) / 100));
              else setDisplay(String(Number(display) / 100));
              setFresh(true);
            } else if ("+-*/".includes(key)) chooseOp(key);
            else inputDigit(key);
          }}>{key}</button>
        ))}
        <button type="button" className="key eq col-span-4" onClick={equals}>=</button>
      </div>
    </div>
  );
}

export function ScientificCalculator() {
  const [expr, setExpr] = useState("sin(30)");
  const [angle, setAngle] = useState<"deg" | "rad">("deg");
  const [ans, setAns] = useState(0);
  const [out, setOut] = useState("0.5");
  const [error, setError] = useState("");

  function run(source = expr) {
    try {
      const value = evaluateExpression(source, angle, ans);
      setOut(String(Math.round(value * 1e10) / 1e10));
      setAns(value);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not evaluate.");
    }
  }

  const keys = ["sin(", "cos(", "tan(", "sqrt(", "ln(", "log(", "^", "(", ")", "pi", "7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", ".", "ans", "+"];
  return (
    <div className="rounded-3xl bg-[#102033] p-4 text-white">
      <div className="mb-2 flex gap-2">
        <button type="button" className={`key ${angle === "deg" ? "eq" : ""}`} onClick={() => setAngle("deg")}>Deg</button>
        <button type="button" className={`key ${angle === "rad" ? "eq" : ""}`} onClick={() => setAngle("rad")}>Rad</button>
      </div>
      <label className="sr-only" htmlFor="sci-expr">Expression</label>
      <input id="sci-expr" value={expr} onChange={(e) => setExpr(e.target.value)} className="num w-full rounded-xl bg-[#0b1726] px-3 py-3 text-right text-xl" />
      <p className="num mt-2 text-right text-3xl text-teal-200" aria-live="polite">{error || out}</p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {keys.map((key) => (
          <button key={key} type="button" className="key" onClick={() => setExpr((e) => e + key)}>{key}</button>
        ))}
        <button type="button" className="key warn" onClick={() => { setExpr(""); setError(""); }}>C</button>
        <button type="button" className="key eq col-span-2" onClick={() => run()}>=</button>
      </div>
    </div>
  );
}

export function JsonTool() {
  const [text, setText] = useState('{\n  "calculator": "Calcora",\n  "local": true\n}');
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");
  function run(minify: boolean) {
    try {
      const parsed = JSON.parse(text);
      setOutput(JSON.stringify(parsed, null, minify ? undefined : 2));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
    }
  }
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="json-input">JSON</label>
      <textarea id="json-input" value={text} onChange={(e) => setText(e.target.value)} rows={8} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3 font-mono text-sm" />
      <div className="flex gap-2">
        <button type="button" className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm text-white" onClick={() => run(false)}>Format</button>
        <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => run(true)}>Minify</button>
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {output ? <pre className="overflow-auto rounded-2xl bg-[#102033] p-4 text-sm text-teal-100">{output}</pre> : null}
    </div>
  );
}

export function HashTool() {
  const [text, setText] = useState("Calcora");
  const [algo, setAlgo] = useState("SHA-256");
  const [hex, setHex] = useState("");
  const [error, setError] = useState("");
  async function run() {
    try {
      const data = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest(algo, data);
      const bytes = Array.from(new Uint8Array(digest));
      setHex(bytes.map((b) => b.toString(16).padStart(2, "0")).join(""));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hashing failed in this browser.");
    }
  }
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium" htmlFor="hash-text">Text to hash locally</label>
      <textarea id="hash-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3" />
      <label className="block text-sm font-medium" htmlFor="hash-algo">Algorithm</label>
      <select id="hash-algo" value={algo} onChange={(e) => setAlgo(e.target.value)} className="rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
        {["SHA-256", "SHA-384", "SHA-512", "SHA-1"].map((name) => <option key={name}>{name}</option>)}
      </select>
      <button type="button" className="ml-2 rounded-full bg-[var(--navy)] px-4 py-2 text-sm text-white" onClick={() => void run()}>Hash</button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {hex ? <p className="break-all rounded-2xl bg-[#102033] p-4 font-mono text-sm text-teal-100" aria-live="polite">{hex}</p> : null}
      <p className="text-sm text-[var(--muted)]">SHA-1 is included only to match old checksums. Prefer SHA-256 for new work. This is not password storage.</p>
    </div>
  );
}

export function TypingTest() {
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const stats = useMemo(() => {
    const minutes = started ? Math.max((Date.now() - started) / 60000, 1 / 60) : 0;
    let correct = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === passage[i]) correct += 1;
    const wpm = minutes ? (correct / 5) / minutes : 0;
    const accuracy = typed.length ? (correct / typed.length) * 100 : 100;
    return { wpm, accuracy, correct };
  }, [typed, started, done]);
  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-[var(--card)] p-4 leading-7" aria-hidden="true">
        {passage.split("").map((char, i) => (
          <span key={i} className={typed[i] == null ? "" : typed[i] === char ? "text-teal-700" : "bg-red-100 text-red-800"}>{char}</span>
        ))}
      </p>
      <label className="block text-sm font-medium" htmlFor="typing">Type the passage</label>
      <textarea id="typing" value={typed} rows={4} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3" onChange={(e) => {
        if (!started) setStarted(Date.now());
        setTyped(e.target.value);
        if (e.target.value.length >= passage.length) setDone(true);
      }} />
      <p aria-live="polite" className="text-sm">WPM {stats.wpm.toFixed(0)} · Accuracy {stats.accuracy.toFixed(0)}%</p>
      <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => { setTyped(""); setStarted(null); setDone(false); }}>Reset</button>
    </div>
  );
}

function hsl(r: number, g: number, b: number) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
  else if (max === G) h = (B - R) / d + 2;
  else h = (R - G) / d + 4;
  return { h: h * 60, s, l };
}

function luminance(r: number, g: number, b: number) {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function ColorTool() {
  const [hex, setHex] = useState("#0F766E");
  const clean = hex.replace("#", "");
  const valid = /^[0-9a-fA-F]{6}$/.test(clean);
  const r = valid ? parseInt(clean.slice(0, 2), 16) : 0;
  const g = valid ? parseInt(clean.slice(2, 4), 16) : 0;
  const b = valid ? parseInt(clean.slice(4, 6), 16) : 0;
  const { h, s, l } = hsl(r, g, b);
  const contrast = (other: number) => {
    const L1 = luminance(r, g, b);
    const lighter = Math.max(L1, other);
    const darker = Math.min(L1, other);
    return (lighter + 0.05) / (darker + 0.05);
  };
  return (
    <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
      <div className="h-40 rounded-2xl border border-[var(--line)]" style={{ background: valid ? `#${clean}` : "#ccc" }} />
      <div className="space-y-3">
        <label className="block text-sm font-medium" htmlFor="hex">Hex</label>
        <input id="hex" value={hex} onChange={(e) => setHex(e.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2" />
        <input aria-label="Colour picker" type="color" value={valid ? `#${clean}` : "#000000"} onChange={(e) => setHex(e.target.value.toUpperCase())} />
        {valid ? (
          <div className="result-panel p-4 text-sm" aria-live="polite">
            <p>RGB {r}, {g}, {b}</p>
            <p>HSL {h.toFixed(0)}°, {(s * 100).toFixed(0)}%, {(l * 100).toFixed(0)}%</p>
            <p>Contrast with white {contrast(1).toFixed(2)}:1</p>
            <p>Contrast with black {contrast(0).toFixed(2)}:1</p>
          </div>
        ) : <p role="alert" className="text-sm text-red-700">Enter a 6-digit hex colour.</p>}
      </div>
    </div>
  );
}
