import { useEffect, useMemo, useState } from "react";
import { InputError } from "@/lib/format";
import type { CalcDef, FieldDef } from "@/data/types";
import { BasicCalculator, ColorTool, HashTool, JsonTool, ScientificCalculator, TypingTest } from "./widgets";

function visible(field: FieldDef, values: Record<string, string>) {
  return !field.showIf || values[field.showIf.field] === field.showIf.equals;
}

function defaults(calc: CalcDef): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of calc.inputs) values[field.id] = field.defaultValue ?? "";
  return values;
}

export function CalculatorView({ calc }: { calc: CalcDef }) {
  const [values, setValues] = useState<Record<string, string>>(() => defaults(calc));
  const [submitted, setSubmitted] = useState(calc.live !== false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    setValues(defaults(calc));
    setSubmitted(calc.live !== false);
    setCopied("");
  }, [calc.slug]);

  const output = useMemo(() => {
    if (calc.widget) return null;
    if (calc.live === false && !submitted) return null;
    const ready = calc.inputs.filter((field) => visible(field, values) && field.required).every((field) => (values[field.id] ?? "").trim() !== "");
    if (!ready) return null;
    try {
      return calc.compute(values);
    } catch (error) {
      return { results: [], error: error instanceof InputError ? error.message : "Check the inputs and try again." };
    }
  }, [calc, values, submitted]);

  const fields = calc.inputs.filter((field) => visible(field, values));

  function copyResults() {
    if (!output?.results.length) return;
    const text = [calc.title, ...output.results.map((row) => `${row.label}: ${row.value}`)].join("\n");
    void navigator.clipboard?.writeText(text).then(() => setCopied("Copied")).catch(() => setCopied("Copy failed"));
  }

  return (
    <div className="space-y-4">
      {calc.widget === "basic" ? <BasicCalculator /> : null}
      {calc.widget === "scientific" ? <ScientificCalculator /> : null}
      {calc.widget === "json" ? <JsonTool /> : null}
      {calc.widget === "hash" ? <HashTool /> : null}
      {calc.widget === "typing" ? <TypingTest /> : null}
      {calc.widget === "color" ? <ColorTool /> : null}
      {calc.inputs.length > 0 ? (
        <form
          className="grid gap-4 rounded-3xl border border-[var(--line)] bg-[var(--card)] p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          {fields.map((field) => (
            <div key={field.id}>
              <label htmlFor={field.id} className="mb-1 block text-sm font-medium">
                {field.label}
                {field.unit ? <span className="font-normal text-[var(--muted)]"> ({field.unit})</span> : null}
              </label>
              {field.type === "select" ? (
                <select id={field.id} value={values[field.id] ?? ""} onChange={(e) => { setValues({ ...values, [field.id]: e.target.value }); setSubmitted(calc.live !== false); }} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2">
                  {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              ) : field.type === "textarea" ? (
                <textarea id={field.id} rows={field.rows ?? 4} value={values[field.id] ?? ""} onChange={(e) => setValues({ ...values, [field.id]: e.target.value })} className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2" />
              ) : (
                <input
                  id={field.id}
                  type={field.type === "password" ? "password" : field.type === "number" ? "number" : field.type}
                  inputMode={field.type === "number" ? "decimal" : undefined}
                  min={field.min}
                  max={field.max}
                  step={field.step ?? (field.type === "number" ? "any" : undefined)}
                  value={values[field.id] ?? ""}
                  required={field.required}
                  placeholder={field.placeholder}
                  autoComplete={field.sensitive ? "off" : undefined}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => { setValues({ ...values, [field.id]: e.target.value }); if (calc.live !== false) setSubmitted(true); }}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2"
                />
              )}
              {field.help ? <p className="mt-1 text-xs text-[var(--muted)]">{field.help}</p> : null}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            {calc.live === false ? <button type="submit" className="rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-semibold text-white">{calc.submitLabel ?? "Calculate"}</button> : null}
            <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => { setValues(defaults(calc)); setSubmitted(calc.live !== false); }}>Reset</button>
            <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => { const empty: Record<string, string> = {}; calc.inputs.forEach((f) => { empty[f.id] = ""; }); setValues(empty); setSubmitted(false); }}>Clear</button>
          </div>
        </form>
      ) : null}
      <section id="calculator-results" aria-live="polite" className="result-panel p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg text-white">Results</h2>
          <div className="no-print flex gap-2">
            <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-xs" onClick={copyResults}>Copy</button>
            <button type="button" className="rounded-full bg-white/10 px-3 py-1 text-xs" onClick={() => window.print()}>Print</button>
          </div>
        </div>
        {copied ? <p className="mb-2 text-xs text-teal-200">{copied}</p> : null}
        {!output && !calc.widget ? <p className="text-sm text-slate-300">Enter the required values to calculate. Nothing is sent to a server.</p> : null}
        {output?.error ? <p role="alert" className="text-sm text-amber-200">{output.error}</p> : null}
        {output?.results.length ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            {output.results.map((row) => (
              <div key={row.label} className={row.emphasize ? "sm:col-span-2" : ""}>
                <dt className="text-xs uppercase tracking-wide text-slate-300">{row.label}</dt>
                <dd className={`num ${row.emphasize ? "text-3xl text-teal-200" : "text-lg"}`}>{row.value}</dd>
                {row.detail ? <p className="text-xs text-slate-300">{row.detail}</p> : null}
              </div>
            ))}
          </dl>
        ) : null}
        {output?.notes?.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-200">{output.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
        {output?.table ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              {output.table.caption ? <caption className="mb-2 text-left text-slate-300">{output.table.caption}</caption> : null}
              <thead><tr>{output.table.headers.map((header) => <th key={header} className="border-b border-white/10 py-2 pr-3">{header}</th>)}</tr></thead>
              <tbody>
                {output.table.rows.slice(0, 40).map((row, index) => (
                  <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b border-white/10 py-1 pr-3">{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {output.table.rows.length > 40 ? <p className="mt-2 text-xs text-slate-300">Showing the first 40 rows of {output.table.rows.length}.</p> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
