import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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

function normalizePath(pathname: string): string {
  if (pathname.length > 1) return pathname.replace(/\/+$/, "") || "/";
  return pathname;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy method */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

/**
 * Primary donate/support call to action.
 * - External donation URL configured  -> external button (new tab).
 * - Not configured, elsewhere on site -> internal link to /support.
 * - Not configured, already on /support -> nothing (the banner shows share
 *   actions instead, so there is never a dead self-link or empty space).
 */
export function SupportButton({ compact = false }: { compact?: boolean }) {
  const { pathname } = useLocation();
  const href = supportUrl();
  const onSupportPage = normalizePath(pathname) === "/support";
  const cls = `inline-flex items-center gap-2 rounded-full bg-amber-300 font-semibold text-[#102033] hover:bg-amber-200 ${compact ? "px-3 py-1.5 text-sm" : "px-5 py-2.5"}`;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("support_click", { platform: supportConfig.platform })}
        className={cls}
      >
        <CoffeeIcon className="h-5 w-5" />
        {supportConfig.label}
        <span className="sr-only"> on {supportConfig.platform} (opens in a new tab)</span>
      </a>
    );
  }
  if (onSupportPage) return null;
  return (
    <Link to="/support" className={cls} aria-label="Support Calcora — open the support page">
      <CoffeeIcon className="h-5 w-5" />
      Support Calcora
    </Link>
  );
}

/**
 * Share actions that always work, with or without a donation URL.
 * Copy uses the clipboard (with legacy fallback and visible feedback);
 * Email/X/WhatsApp are plain links, so they work even with JS disabled.
 */
export function ShareButtons({ variant = "light", compact = false }: { variant?: "dark" | "light"; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" && window.location?.href ? window.location.href : "https://calcoraplus.netlify.app/";
  const shareText = "Free calculators with the working shown — Calcora";
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const canNativeShare = typeof navigator !== "undefined" && typeof (navigator as Navigator & { share?: unknown }).share === "function";

  const base = "inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors focus-visible:outline-2";
  const size = compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const theme = variant === "dark"
    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
    : "border-[var(--line)] bg-[var(--card)] text-[var(--ink)] hover:border-[var(--teal)]";

  const handleCopy = async () => {
    const ok = await copyText(shareUrl);
    if (ok) {
      setCopied(true);
      track("support_share", { channel: "copy" });
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    try {
      await (navigator as Navigator & { share: (data: { title: string; text: string; url: string }) => Promise<void> }).share({
        title: "Calcora",
        text: shareText,
        url: shareUrl,
      });
      track("support_share", { channel: "native" });
    } catch {
      /* user cancelled — nothing to do */
    }
  };

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Share this page">
      <button type="button" onClick={handleCopy} className={`${base} ${size} ${theme}`} aria-live="polite">
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      {canNativeShare ? (
        <button type="button" onClick={handleNativeShare} className={`${base} ${size} ${theme}`}>
          Share…
        </button>
      ) : null}
      <a
        href={`mailto:?subject=${encodeURIComponent("Free calculators — Calcora")}&body=${encodeURIComponent(`I found this useful: ${shareUrl}`)}`}
        className={`${base} ${size} ${theme}`}
        onClick={() => track("support_share", { channel: "email" })}
      >
        Email
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${size} ${theme}`}
        onClick={() => track("support_share", { channel: "x" })}
      >
        Post on X
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${size} ${theme}`}
        onClick={() => track("support_share", { channel: "whatsapp" })}
      >
        WhatsApp
      </a>
    </div>
  );
}

/** Full banner for the homepage and the support page. Always shows a working action. */
export function SupportBanner() {
  const { pathname } = useLocation();
  if (!supportConfig.enabled) return null;
  const onSupportPage = normalizePath(pathname) === "/support";
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
            {configured ? (
              <p className="mt-2 text-sm text-slate-300">
                Contributions are processed by {supportConfig.platform}. Calcora never sees your card details.
              </p>
            ) : onSupportPage ? (
              <p className="mt-2 text-sm text-slate-300">
                Online donations aren&apos;t set up yet — sharing Calcora with a friend is the best way to help right now.
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-300">
                Sharing a calculator with a friend helps too. <Link to="/support" className="text-teal-200 underline">Ways to support</Link>
              </p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <SupportButton />
          <ShareButtons variant="dark" compact />
        </div>
      </div>
    </section>
  );
}

/** Small, unobtrusive note used under calculator results. */
export function SupportNote() {
  if (!supportConfig.enabled) return null;
  return (
    <div className="no-print mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
      <CoffeeIcon className="h-5 w-5 shrink-0 text-[var(--teal)]" />
      <span className="min-w-52 flex-1">Calcora is free to use, with no sign-up. If this helped, you can support the project.</span>
      {supportUrl() ? <SupportButton compact /> : <Link to="/support" className="font-semibold text-[var(--teal)] underline-offset-2 hover:underline">Support Calcora</Link>}
    </div>
  );
}
