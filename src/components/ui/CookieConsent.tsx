import { useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, setConsent, type ConsentState } from "@/lib/storage";

export function CookieConsent() {
  const [state, setState] = useState<ConsentState>(() => getConsent());

  if (state !== "unknown") return null;

  return (
    <div className="no-print fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--card)] p-4 shadow-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--muted)]">
          Calculators work without optional cookies. Analytics and ads stay off until you allow them. See the <Link to="/privacy" className="underline">privacy policy</Link>.
        </p>
        <div className="flex gap-2">
          <button type="button" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm" onClick={() => { setConsent("denied"); setState("denied"); }}>
            Reject
          </button>
          <button type="button" className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm text-white" onClick={() => { setConsent("granted"); setState("granted"); window.location.reload(); }}>
            Allow analytics and ads
          </button>
        </div>
      </div>
    </div>
  );
}
