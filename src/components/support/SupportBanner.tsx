import { Link } from "react-router-dom";
import { supportConfig, supportUrl } from "@/config/support";
import { track } from "@/lib/track";

function CoffeeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
      <path d="M8 3v2M11.5 3v2M15 3v2" />
    </svg>
  );
}

export function SupportButton({ compact = false }: { compact?: boolean }) {
  const href = supportUrl();
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("support_click", { platform: supportConfig.platform })}
      className={`inline-flex items-center gap-2 rounded-full bg-amber-300 font-semibold text-[#102033] hover:bg-amber-200 ${compact ? "px-3 py-1.5 text-sm" : "px-5 py-2.5"}`}
    >
      <CoffeeIcon className="h-5 w-5" />
      {supportConfig.label}
      <span className="sr-only"> on {supportConfig.platform} (opens in a new tab)</span>
    </a>
  );
}

/** Full banner for the homepage and the support page. */
export function SupportBanner() {
  if (!supportConfig.enabled) return null;
  const configured = Boolean(supportUrl());
  return (
    <section aria-labelledby="support-heading" className="no-print mt-12 overflow-hidden rounded-3xl bg-[#102033] p-6 text-white sm:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-300 text-[#102033]">
            <CoffeeIcon className="h-7 w-7" />
          </span>
          <div>
            <h2 id="support-heading" className="text-2xl text-white">{supportConfig.heading}</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">{supportConfig.message}</p>
            {configured ? null : (
              <p className="mt-2 text-sm text-slate-300">
                Sharing a calculator with a friend helps too. <Link to="/support" className="text-teal-200 underline">Ways to support</Link>
              </p>
            )}
          </div>
        </div>
        <SupportButton />
      </div>
    </section>
  );
}

/** Small, unobtrusive note used under calculator results. */
export function SupportNote() {
  if (!supportConfig.enabled) return null;
  return (
    <p className="no-print mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
      <CoffeeIcon className="h-5 w-5 text-[var(--teal)]" />
      <span className="flex-1">Calcora is free to use, with no sign-up. If this helped, you can support the project.</span>
      {supportUrl() ? <SupportButton compact /> : <Link to="/support" className="font-semibold text-[var(--teal)]">Support Calcora</Link>}
    </p>
  );
}
