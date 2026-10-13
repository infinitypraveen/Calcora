# Calcora Calculators

Free, browser-based calculators with the formula, assumptions, and a worked example on every page. There is no backend. Sensitive inputs are not uploaded.

This repository is a Vite + React + TypeScript app styled with Tailwind CSS. The production build used by this project inlines assets into `dist/index.html` because `vite-plugin-singlefile` is already configured. Host the `dist` folder and rewrite unknown paths to `index.html` (see Netlify and Vercel files).

The production domain is `https://calcoraplus.netlify.app` (set in `src/config/site.ts`, `index.html`, `public/robots.txt`, and `public/sitemap.xml`). If you move to a custom domain, update those four places. Replace the owner placeholders in `src/config/site.ts` before launch. Nothing here is a claim of AdSense approval, search ranking, a security certification, or a measured Core Web Vitals score.

## Local setup

```bash
npm install
npm run dev
```

Open the URL Vite prints. Production check:

```bash
npm run build
npm run preview
```

Unit tests for calculation logic use Vitest, which is not required to build the site:

```bash
npx vitest run --config vitest.config.ts
```

## Add a calculator

1. Add a definition to the right file in `src/data/calcs/`.
2. Give it a unique `slug`, category, inputs, a real `compute` function, formula, steps, example, FAQs, and related slugs.
3. Export it from that file’s array. `src/data/calculators.ts` collects the arrays.
4. Do not add a calculator whose maths is not implemented. The directory only lists registered definitions.
5. Add a regression in `src/tests/calculations.test.ts` if the formula is easy to get wrong.

Routes are `/calculators/{slug}` and `/category/{category-id}`.

## Add an affiliate product

Edit `src/data/affiliateProducts.ts` only.

- Set `active`, `order`, `placements`, and `tags` (category id, calculator slug, or guide slug).
- Use an `https` URL. Cards add `rel="sponsored noopener noreferrer"`.
- Leave `priceLabel` empty unless you maintain the price.
- Set `placeholder: false` when the listing is real. **Affiliate sections stay hidden until at least one product is configured** — active, not a placeholder, and pointing at a real domain (example.com URLs are ignored). The sample records therefore render nothing.
- Optional: set `amazonAssociatesTag` in the same file. It is appended only to `amazon.*` URLs.

Do not add fake reviews, ratings, or discounts. The card component does not need to change.

## Donations ("Buy me a coffee")

Edit `src/config/support.ts`. Set `url` to your own Buy Me a Coffee, Ko-fi, GitHub Sponsors, or payment link (it must be `https`). Change `label` and `platform` if you use a different service. Until `url` is set, the site still says Calcora is free, but no donate button appears. The message shows on the homepage, under each calculator, in the footer, and on `/support`.

## Configure Google AdSense

The official loader is already in `index.html` `<head>` (loaded once for every page):

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9505925327648300" crossorigin="anonymous"></script>
```

`src/config/ads.ts` stores the same publisher ID and is the single source of truth for the units. To start serving ads:

1. In the AdSense console, create ad units for the placements you want.
2. Paste each unit’s numeric slot ID into the matching placement’s `slotId` in `src/config/ads.ts`. Until a slot ID is set, that placement renders a labelled placeholder box.
3. Set a placement’s `active: false` to hide it. Sidebar placements are desktop-only.
4. Set `previewPlaceholders: false` to stop rendering the labelled boxes once your units are live.
5. Ad unit requests still wait for the consent bar to be accepted (`requireConsent`). The head loader itself loads as part of Google’s standard integration.
6. The Content-Security-Policy in `public/_headers`, `netlify.toml`, and `vercel.json` already allows Google’s adscript, frame, connect, and image domains. If you edit the CSP, keep those domains or ad units will be blocked.

Placements are documented in `src/config/ads.ts` (each has a `createAs` field). Create them in AdSense as follows — 7× Display ads (Responsive) plus 1× In-article ad:

| Placement | Click in AdSense | Shape | Serves |
|---|---|---|---|
| `homeTop` | Display ads → Responsive | Horizontal | 728×90 leaderboard desktop / 320×100 mobile |
| `homeSidebar` | Display ads → Responsive | Square | 300×250 medium rectangle in the 300px sidebar |
| `homeMid` | Display ads → Responsive | Horizontal | In-content banner |
| `articleMid` | **In-article ads** → Fluid | Automatic | Native unit inside guides (style it to match body text) |
| `calcTop` | Display ads → Responsive | Horizontal | Above the calculator |
| `calcBelowResults` | Display ads → Responsive | Horizontal | Below the results panel |
| `calcBeforeFaq` | Display ads → Responsive | Horizontal | Mid-content banner |
| `calcSidebar` | Display ads → Responsive | Square | 300×250 medium rectangle in the 300px sidebar |
| `footerBanner` | Display ads → Responsive | Horizontal | Full-width banner (already live: `8464147019`) |

Do not use In-feed ads (our pages have no post/feed lists) or Multiplex ads (no recommendation grid). For Display units, leave size on Responsive — the site constrains the shape via `data-ad-format`, and sidebars are desktop-only so they never squeeze on mobile.

## Consent and where ads are shown

Ads and analytics ask for consent only from visitors in the EEA, UK, and Switzerland. `src/lib/geo.ts` detects this from the browser's IANA time zone — no IP address, no network request, no third-party service. Everyone else is served ads immediately and is never shown a banner.

Why: GDPR and Google's EU User Consent Policy require a choice for those regions. They do not require it for India, the US, or most other countries, and blocking ads there costs revenue with no compliance benefit. Given the India-centric calculator set (GST, EMI, income tax, HRA, PPF, NPS), most traffic is outside the consent regions.

Toggle in `src/config/ads.ts`:
- `consentRegionsOnly: true` — ask only the EEA/UK/CH. Recommended.
- `consentRegionsOnly: false` — ask every visitor, which blocks ads for anyone who rejects.

**This is not a certified CMP.** Google's policy for EEA/UK traffic expects a Google-certified consent platform. The fully compliant route is Google Privacy & Messaging (formerly Funding Choices) in your AdSense account: it is free, Google-certified, and can be set to show only in Europe. If you take that route, remove the CookieConsent banner from `Layout.tsx` so visitors are not asked twice. Time-zone detection is also a heuristic — a visitor on a VPN may appear elsewhere.

## Analytics (Google Analytics 4)

Open `src/config/analytics.ts` and paste your Measurement ID into `gaMeasurementId`. That is the only change needed — everything else is wired.

Get the ID from Google Analytics → **Admin → Data streams → Web → your stream**. It looks like `G-ABC123XYZ`. Do not use the `GT-` tag ID or the numeric stream ID.

What is already handled:
- Loads once, asynchronously, after consent rules pass.
- Single-page route changes are reported as `page_view`, so all ~200 calculator pages show up in reports (a plain gtag snippet would only ever record the first page).
- `anonymize_ip` on; Google Signals and ad personalisation off.
- Calculator inputs and raw search text are never sent. Only coarse events: calculator slug, category, affiliate click, search result count.
- Google's CSP domains are already allowed in the hosting headers.

While `gaMeasurementId` is empty, nothing loads and no requests are made.

## Ranking and backlinks

Technical SEO is done (titles, descriptions, canonicals, sitemap, structured data, server-rendered static content). Rankings also depend on factors no code can set:

- **Backlinks.** The audit reported 0 domain strength, which is normal for a new site. Links from real sites are the single biggest remaining factor. No code change affects this.
- **Domain.** `calcoraplus.netlify.app` is a subdomain of netlify.app. A custom domain is generally better for building authority.
- **Time.** Google needs to crawl and index ~200 pages. Submit the sitemap in Search Console and expect weeks, not days.

Nobody can guarantee a #1 position for "calculator" — that term is dominated by very high authority sites. Realistic wins are specific long-tail pages such as "guntha to square feet", "step up SIP calculator" or "HRA exemption calculator", where the detailed explanations on each page compete well.

## Tax, GST, and currency

- Indian income-tax slabs live in `src/config/taxRules.ts`. Update that file when the Finance Act changes. The interface reads the file; it does not hardcode slabs in the form.
- GST rates are chosen by the user. 12% and 28% remain available for older invoices. Confirm the rate for the HSN or SAC.
- The currency converter does not fetch live rates. Enter a dated rate. Do not present a sample rate as a market quote.

## SEO and hosting

- Titles, descriptions, canonical URLs, Open Graph tags, and JSON-LD are set in the browser by `src/components/seo/Seo.tsx`.
- `public/robots.txt` points at the sitemap. Replace the domain.
- `public/sitemap.xml` lists public routes. If you add calculators, regenerate it or extend it. The HTML sitemap at `/sitemap` is generated from the registry and is the easier checklist.
- Because the app is a client-rendered single file, crawlers that execute JavaScript can see calculator pages. A host rewrite is required so `/calculators/emi-calculator` returns `index.html`. Full static prerender of every route is not wired into this Vite config.
- Search Console: paste the verification token into `searchConsoleVerification` in `src/config/site.ts`.

## Security notes

- No `eval`. The scientific calculator uses a small parser.
- External affiliate URLs must be `http` or `https`.
- Passwords and other sensitive fields are not copied into the result text and are not stored.
- Headers in `public/_headers`, `netlify.toml`, and `vercel.json` set `nosniff`, a referrer policy, a permissions policy, and framing limited to the same origin. The preview environment may ignore those files.
- The CSP allows inline scripts because the single-file build inlines the bundle. Tighten it only if you stop inlining.

## Unfinished before a public launch

- Replace the owner name, email, and address in `src/config/site.ts` (the domain is already set).
- Add real AdSense IDs only after approval, then update CSP.
- Replace sample affiliate products.
- Re-check tax and GST notes against current official notifications.
- Add a dated exchange-rate source if you want live currency conversion.
- Generate a complete XML sitemap after the domain is final, and submit it in Search Console.
- Have counsel review the privacy, terms, disclaimer, and consent bar for your visitors.
- Measure Core Web Vitals on the production host. They are targets, not results recorded here.
- The single-file build prevents per-route prerendered HTML. If you need that, remove the single-file plugin and add a prerender step.
