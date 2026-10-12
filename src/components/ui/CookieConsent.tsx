import { useState } from "react";
import { Link } from "react-router-dom";
import { needsConsentChoice } from "@/lib/geo";
import { getConsent, setConsent, type ConsentState } from "@/lib/storage";

/**
 * Consent banner. Shown only to visitors in the EEA, UK, and Switzerland,
 * where GDPR and Google's EU User Consent Policy require a choice.
 *
 * Visitors in other regions are never asked, and ads serve immediately.
 * See src/lib/geo.ts for how the region is detected.
 */
export function CookieConsent() {
  const [state, setState] = useState<ConsentState>(() => getConsent());
  const required = needsConsentChoice();

  if (state !== "unknown" || !required) return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--card)] p-4 shadow-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--muted)]">
          Every calculator works with or without optional cookies. If you allow them, we can show personalised ads and
          measure which calculators are used. Rejecting leaves the site fully usable and shows non-personalised ads.
          See the <Link to="/privacy" className="underline">privacy policy</Link>.
        </p>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => { setConsent("denied"); setState("denied"); }}>
            Reject
          </button>
          <button type="button" className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm text-white" onClick={() => { setConsent("granted"); setState("granted"); }}>
            Allow analytics and ads
          </button>
        </div>
      </div>
    </div>
  );
}
