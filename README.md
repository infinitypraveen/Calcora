# Calcora Calculators

Free, browser-based calculators with the formula, assumptions, and a worked example on every page. There is no backend. Sensitive inputs are not uploaded.

This repository is a Vite + React + TypeScript app styled with Tailwind CSS. The production build used by this project inlines assets into `dist/index.html` because `vite-plugin-singlefile` is already configured. Host the `dist` folder and rewrite unknown paths to `index.html` (see Netlify and Vercel files).

Replace `https://example.com` and the owner placeholders in `src/config/site.ts` before launch. Nothing here is a claim of AdSense approval, search ranking, a security certification, or a measured Core Web Vitals score.

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

Ads are off until you edit `src/config/ads.ts`.

1. The AdSense loader script is in the `<head>` of `index.html` (publisher `ca-pub-9505925327648300`). It loads once for every route, because the app is a single page. Do not add a second copy.
2. `public/ads.txt` authorises that publisher. Keep it at the site root after you change domains.
3. The CSP in `public/_headers`, `netlify.toml`, and `vercel.json` already allows Google's ad domains. If you change the CSP, keep those domains.
4. After approval, set `enabled: true` in `src/config/ads.ts`. The `publisherId` is already set to the ID above.
3. Create ad units and paste each unit’s numeric slot ID into the matching placement’s `slotId`.
4. Leave a placement `active: false` to hide it. Sidebar placements are desktop-only.
5. `previewPlaceholders` shows labelled boxes when a live unit cannot render. Turn it off in production if you do not want empty boxes.
6. The consent bar must be accepted before the AdSense script loads, because `requireConsent` is true.
7. Update the Content-Security-Policy in `public/_headers` so Google’s ad domains are allowed. The default policy is strict enough for the calculator and will block AdSense until you widen it. The official script is loaded once from `AdScript.tsx`.

Placements are documented in `src/config/ads.ts`: homepage leaderboard, homepage sidebar, in-content break, guide midpoint, footer banner, calculator top, below results, before FAQs, and calculator sidebar.

## Analytics

Set `enabled` and a real `G-` measurement ID in `src/config/analytics.ts`. Events fire only after consent. Do not send calculator inputs or raw search text. The tracker records calculator slug, category, affiliate product id, and search result counts.

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

- Replace example.com, owner name, email, and address.
- Add real AdSense IDs only after approval, then update CSP.
- Replace sample affiliate products.
- Re-check tax and GST notes against current official notifications.
- Add a dated exchange-rate source if you want live currency conversion.
- Generate a complete XML sitemap after the domain is final, and submit it in Search Console.
- Have counsel review the privacy, terms, disclaimer, and consent bar for your visitors.
- Measure Core Web Vitals on the production host. They are targets, not results recorded here.
- The single-file build prevents per-route prerendered HTML. If you need that, remove the single-file plugin and add a prerender step.
