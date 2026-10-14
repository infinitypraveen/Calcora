import { useEffect, useReducer, useRef } from "react";
import { adPlacements, adsConfig, adsAllowed, publisherIdConfigured, slotReady, type AdPage, type AdPlacementKey } from "@/config/ads";

export function AdSlot({ placement, page }: { placement: AdPlacementKey; page: AdPage }) {
  const config = adPlacements[placement];
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  // Re-check eligibility the moment the visitor answers the consent banner,
  // so ads start (or stop) without waiting for a navigation.
  const [, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const onConsent = () => bump();
    window.addEventListener("calcora:consent", onConsent);
    return () => window.removeEventListener("calcora:consent", onConsent);
  }, []);

  const allowed = config.active && config.pages.includes(page);
  const live = allowed && slotReady(config) && adsAllowed();
  const placeholder = allowed && !live && adsConfig.previewPlaceholders;

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
  const isInArticle = config.format === "in-article";
  // Shape hint sent to AdSense. In-article units require fluid + in-article layout.
  const formatAttr =
    isInArticle || config.format === "fluid"
      ? "fluid"
      : config.format === "rectangle"
        ? "rectangle"
        : config.format === "vertical"
          ? "vertical"
          : config.format === "horizontal"
            ? "horizontal"
            : "auto";

  return (
    <aside className={`ad-frame no-print ${desktop} flex-col my-4`} aria-label="Advertisement">
      {live && publisherIdConfigured() ? (
        <>
          <p className="ad-label">Advertisement</p>
          <ins
            ref={ref}
            className="adsbygoogle block w-full"
            style={{ display: "block", minHeight: config.minHeight, textAlign: isInArticle ? "center" : undefined }}
            data-ad-client={adsConfig.publisherId}
            data-ad-slot={config.slotId}
            data-ad-format={formatAttr}
            data-ad-layout={isInArticle ? "in-article" : undefined}
            data-full-width-responsive={config.format === "horizontal" ? "true" : undefined}
          />
        </>
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
