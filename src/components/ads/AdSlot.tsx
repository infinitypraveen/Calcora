import { useEffect, useRef } from "react";
import { adPlacements, adsConfig, publisherIdConfigured, slotReady, type AdPage, type AdPlacementKey } from "@/config/ads";
import { getConsent } from "@/lib/storage";

export function AdSlot({ placement, page }: { placement: AdPlacementKey; page: AdPage }) {
  const config = adPlacements[placement];
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const allowed = config.active && config.pages.includes(page);
  const consentOk = !adsConfig.requireConsent || getConsent() === "granted";
  const live = allowed && slotReady(config) && consentOk;
  const placeholder = allowed && !live && (adsConfig.previewPlaceholders || adsConfig.enabled);

  useEffect(() => {
    if (!live || pushed.current || !ref.current) return;
    const w = window;
    w.adsbygoogle = w.adsbygoogle || [];
    try {
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      /* AdSense can throw if the script is blocked. The calculator must still work. */
    }
  }, [live]);

  if (!allowed || (!live && !placeholder)) return null;

  const desktop = config.desktopOnly ? "hidden lg:flex" : "flex";

  return (
    <aside className={`no-print ${desktop} my-4`} aria-label="Advertisement">
      {live && publisherIdConfigured() ? (
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block", minHeight: config.minHeight }}
          data-ad-client={adsConfig.publisherId}
          data-ad-slot={config.slotId}
          data-ad-format={config.format === "horizontal" ? "horizontal" : "auto"}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="ad-slot w-full px-3 py-2" style={{ minHeight: config.minHeight }}>
          <span>
            Advertisement
            <span className="mt-1 block font-normal normal-case tracking-normal text-[0.7rem] opacity-80">{config.label}</span>
          </span>
        </div>
      )}
    </aside>
  );
}
