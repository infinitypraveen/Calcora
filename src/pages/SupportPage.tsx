import { Link } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { SupportBanner } from "@/components/support/SupportBanner";
import { supportConfig, supportUrl } from "@/config/support";

export function SupportPage() {
  const configured = Boolean(supportUrl());
  return (
    <>
      <Seo
        title="Support Calcora"
        description="Calcora is free with no sign-up or paywall. Find out how optional contributions, sharing, and feedback help keep the calculators free and up to date."
        path="/support"
      />
      <article className="max-w-3xl">
        <h1 className="text-4xl">Support Calcora</h1>
        <p className="mt-3 text-[var(--muted)]">
          Every calculator on Calcora is free, and stays free. There is no account, no paywall, and no premium tier. Your inputs are processed in your browser and are never uploaded.
        </p>
        <SupportBanner />
        <h2 className="mt-10 text-2xl">Other ways to help</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-[var(--muted)]">
          <li>Share a calculator that saved you time with a friend or colleague.</li>
          <li><Link to="/corrections" className="text-[var(--teal)]">Report a wrong formula</Link> or an outdated tax rule.</li>
          <li><Link to="/contact" className="text-[var(--teal)]">Suggest a calculator</Link> you would like to see.</li>
        </ul>
        <h2 className="mt-10 text-2xl">Where contributions go</h2>
        <p className="mt-2 text-[var(--muted)]">
          Contributions are voluntary and do not unlock features. They help cover hosting, domain costs, and the time spent checking formulas and updating rules.
          {configured ? ` Payments are processed by ${supportConfig.platform}. Calcora does not see your card details.` : ""}
        </p>
      </article>
    </>
  );
}
