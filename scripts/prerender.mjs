import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";

const root = process.cwd();
const dist = path.join(root, "dist");
const siteUrl = "https://calcoraplus.netlify.app";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const jsonScript = (value) =>
  `<script type="application/ld+json">${JSON.stringify(value).replaceAll("<", "\\u003c")}</script>`;

function metaDescription(value) {
  let text = String(value).replace(/\s+/g, " ").trim();
  if (text.length < 115) {
    text += " Use the free tool with its formula, assumptions and a worked example.";
  }
  if (text.length <= 160) return text;
  const shortened = text.slice(0, 157);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 120 ? boundary : 157)}...`;
}

function pageTitle(value) {
  const suffix = " | Calcora";
  const preferred = `${value} - Free Online Tool${suffix}`;
  if (preferred.length <= 62) return preferred;
  const simple = `${value}${suffix}`;
  if (simple.length <= 62) return simple;
  return `${value.slice(0, 62 - suffix.length).trim()}${suffix}`;
}

function absoluteUrl(route) {
  return route === "/" ? `${siteUrl}/` : `${siteUrl}${route}`;
}

function nav() {
  return `<header style="padding:1rem 1.25rem;border-bottom:1px solid #e3e8ef;font-family:Georgia,serif">
    <a href="/" style="color:inherit;text-decoration:none"><strong>Calcora</strong></a>
    <nav aria-label="Primary" style="display:inline;margin-left:1rem;font-family:sans-serif;font-size:.9rem">
      <a href="/directory">All calculators</a> · <a href="/guides">Guides</a> · <a href="/support">Support</a> · <a href="/about">About</a>
    </nav>
  </header>`;
}

function footer() {
  return `<footer style="padding:1rem 1.25rem;border-top:1px solid #e3e8ef;font-family:sans-serif;font-size:.85rem">
    <nav aria-label="Footer"><a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/disclaimer">Disclaimer</a> · <a href="/sitemap">Sitemap</a></nav>
    <p>Calcora is free to use. Results are estimates, not financial, medical or legal advice.</p>
  </footer>`;
}

function shell(content) {
  return `${nav()}<main style="max-width:52rem;margin:0 auto;padding:2rem 1.25rem;font-family:Arial,sans-serif;line-height:1.65">${content}</main>${footer()}`;
}

function breadcrumb(items) {
  return `<nav aria-label="Breadcrumb" style="font-size:.9rem;color:#5c6b80">${items
    .map((item, index) =>
      index === items.length - 1
        ? `<span aria-current="page">${escapeHtml(item.name)}</span>`
        : `<a href="${item.path}">${escapeHtml(item.name)}</a> / `,
    )
    .join("")}</nav>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function updateHead(html, page) {
  const url = absoluteUrl(page.route);
  const title = page.title;
  const description = metaDescription(page.description);
  const keywords = (page.keywords ?? []).join(", ");

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  html = html.replace(
    /<link rel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<link rel="sitemap"[^>]*>/,
    `<link rel="sitemap" type="application/xml" title="Sitemap" href="${siteUrl}/sitemap.xml" />`,
  );
  html = html.replace(
    /<meta property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  html = html.replace(
    /<meta property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
  );
  html = html.replace(
    /<meta name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
  );
  html = html.replace(/<meta name="keywords"[^>]*>\s*/g, "");
  if (keywords) {
    html = html.replace(
      /<meta name="robots"/,
      `<meta name="keywords" content="${escapeHtml(keywords)}" />\n    <meta name="robots"`,
    );
  }
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const schema = (page.schemas ?? []).map(jsonScript).join("\n    ");
  html = html.replace("</head>", `    ${schema}\n  </head>`);
  return html;
}

function renderPage(template, page) {
  let html = updateHead(template, page);
  html = html.replace(
    /<!-- STATIC_CONTENT_START -->[\s\S]*?<!-- STATIC_CONTENT_END -->/,
    `<!-- STATIC_CONTENT_START -->\n${page.content}\n      <!-- STATIC_CONTENT_END -->`,
  );
  return html;
}

function calculatorPage(calc, bySlug, categoryById) {
  const route = `/calculators/${calc.slug}`;
  const category = categoryById.get(calc.category);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: category?.name ?? calc.category, path: `/category/${calc.category}` },
    { name: calc.title, path: route },
  ];
  const inputLabels = [...new Set(calc.inputs.map((input) => input.label))];
  const related = calc.related.map((slug) => bySlug.get(slug)).filter(Boolean).slice(0, 8);
  const content = shell(`${breadcrumb(crumbs)}
    <article>
      <h1>${escapeHtml(calc.title)}</h1>
      <p>${escapeHtml(calc.description)}</p>
      ${calc.disclaimer ? `<aside><strong>Important:</strong> ${escapeHtml(calc.disclaimer)}</aside>` : ""}
      <section>
        <h2>Use the ${escapeHtml(calc.title)}</h2>
        <p>The interactive calculator loads in a browser with JavaScript enabled. Your entries are calculated locally and are not uploaded.</p>
        ${inputLabels.length ? `<h3>Inputs</h3><ul>${inputLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join("")}</ul>` : ""}
      </section>
      <section>
        <h2>How ${escapeHtml(calc.title)} works</h2>
        <p>${escapeHtml(calc.howItWorks)}</p>
        <h3>Formula</h3><p><code>${escapeHtml(calc.formula)}</code></p>
        <h3>Calculation steps</h3><ol>${calc.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        <h3>Worked example</h3><p>${escapeHtml(calc.example)}</p>
        ${calc.assumptions?.length ? `<h3>Assumptions</h3><ul>${calc.assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}
      </section>
      <section><h2>Frequently asked questions</h2>${calc.faqs
        .map((faq) => `<h3>${escapeHtml(faq.q)}</h3><p>${escapeHtml(faq.a)}</p>`)
        .join("")}</section>
      ${related.length ? `<section><h2>Related calculators</h2><ul>${related.map((item) => `<li><a href="/calculators/${item.slug}">${escapeHtml(item.title)}</a></li>`).join("")}</ul></section>` : ""}
    </article>`);

  return {
    route,
    title: pageTitle(calc.title),
    description: calc.description,
    keywords: [calc.title, ...calc.keywords, ...(calc.synonyms ?? []), category?.name ?? calc.category],
    content,
    schemas: [
      breadcrumbSchema(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: calc.title,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description: calc.description,
        url: absoluteUrl(route),
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: calc.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };
}

function categoryPage(category, calculators) {
  const route = `/category/${category.id}`;
  const items = calculators
    .filter((calc) => calc.category === category.id)
    .sort((a, b) => a.title.localeCompare(b.title));
  const crumbs = [
    { name: "Home", path: "/" },
    { name: category.name, path: route },
  ];
  return {
    route,
    title: `${category.name} Calculators | Calcora`,
    description: category.description,
    keywords: [category.name, `${category.short} calculators`, ...items.slice(0, 12).map((item) => item.title)],
    content: shell(`${breadcrumb(crumbs)}<h1>${escapeHtml(category.name)} calculators</h1><p>${escapeHtml(category.description)}</p><p>${escapeHtml(category.blurb)}</p><section><h2>All ${escapeHtml(category.short.toLowerCase())} tools</h2><ul>${items
      .map((item) => `<li><h3><a href="/calculators/${item.slug}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.description)}</p></li>`)
      .join("")}</ul></section>`),
    schemas: [
      breadcrumbSchema(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${category.name} calculators`,
        description: category.description,
        url: absoluteUrl(route),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.title,
            url: absoluteUrl(`/calculators/${item.slug}`),
          })),
        },
      },
    ],
  };
}

function articlePage(article, bySlug) {
  const route = `/guides/${article.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Guides", path: "/guides" },
    { name: article.title, path: route },
  ];
  return {
    route,
    title: `${article.title} | Calcora`,
    description: article.description,
    keywords: [article.title, article.category, ...article.calculators.map((slug) => bySlug.get(slug)?.title).filter(Boolean)],
    content: shell(`${breadcrumb(crumbs)}<article><h1>${escapeHtml(article.title)}</h1><p>${escapeHtml(article.description)}</p><p><small>Updated ${escapeHtml(article.updated)}</small></p>${article.sections
      .map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</section>`)
      .join("")}<section><h2>Related calculators</h2><ul>${article.calculators
      .map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((calc) => `<li><a href="/calculators/${calc.slug}">${escapeHtml(calc.title)}</a></li>`)
      .join("")}</ul></section></article>`),
    schemas: [
      breadcrumbSchema(crumbs),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        dateModified: article.updated,
        author: { "@type": "Organization", name: "Calcora Calculators" },
        publisher: { "@type": "Organization", name: "Calcora Calculators" },
        mainEntityOfPage: absoluteUrl(route),
      },
    ],
  };
}

function genericPage(route, title, description, body) {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: title, path: route },
  ];
  return {
    route,
    title: `${title} | Calcora`,
    description,
    keywords: [title, "Calcora"],
    content: shell(`${breadcrumb(crumbs)}<article><h1>${escapeHtml(title)}</h1>${body}</article>`),
    schemas: [
      breadcrumbSchema(crumbs),
      { "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: absoluteUrl(route) },
    ],
  };
}

async function writeRoute(page, template) {
  const html = renderPage(template, page);
  if (page.route === "/") {
    await writeFile(path.join(dist, "index.html"), html);
    return;
  }
  const target = path.join(dist, page.route.slice(1), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

async function main() {
  let template = await readFile(path.join(dist, "index.html"), "utf8");

  // Vite rewrites root-absolute asset refs ("/favicon.svg") to relative
  // ("./favicon.svg"). That breaks on nested routes like
  // /calculators/bmi-calculator/, where "./favicon.svg" would resolve inside
  // the calculator folder. Normalize back to root-absolute before cloning the
  // template for all 223 routes.
  template = template.replaceAll('href="./', 'href="/').replaceAll('src="./', 'src="/');

  // The existing build is intentionally single-file. Extract the large bundle
  // and stylesheet after Vite runs so 223 static pages can share and cache them
  // instead of duplicating a ~780 KB HTML file for every route.
  const moduleMatch = template.match(/<script type="module" crossorigin>([\s\S]*?)<\/script>/);
  if (!moduleMatch) throw new Error("Could not find the inlined module bundle in dist/index.html");
  const cssMatch = template.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!cssMatch) throw new Error("Could not find the inlined stylesheet in dist/index.html");

  const jsHash = createHash("sha256").update(moduleMatch[1]).digest("hex").slice(0, 10);
  const cssHash = createHash("sha256").update(cssMatch[1]).digest("hex").slice(0, 10);
  await mkdir(path.join(dist, "assets"), { recursive: true });
  await writeFile(path.join(dist, "assets", `app-${jsHash}.js`), moduleMatch[1]);
  await writeFile(path.join(dist, "assets", `app-${cssHash}.css`), cssMatch[1]);
  template = template.replace(
    moduleMatch[0],
    `<script type="module" crossorigin src="/assets/app-${jsHash}.js"></script>`,
  );
  template = template.replace(
    cssMatch[0],
    `<link rel="stylesheet" crossorigin href="/assets/app-${cssHash}.css" />`,
  );

  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const [{ calculators }, { categories }, { articles }] = await Promise.all([
    vite.ssrLoadModule("/src/data/calculators.ts"),
    vite.ssrLoadModule("/src/data/categories.ts"),
    vite.ssrLoadModule("/src/data/articles.ts"),
  ]);
  await vite.close();

  const bySlug = new Map(calculators.map((calc) => [calc.slug, calc]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const pages = [];

  const homeContent = template.match(/<!-- STATIC_CONTENT_START -->([\s\S]*?)<!-- STATIC_CONTENT_END -->/)?.[1] ?? "";
  pages.push({
    route: "/",
    title: "Calcora - Free Online Calculator for EMI, BMI & Percentage",
    description: "Free online calculators for EMI, BMI, percentage, compound interest, GST and SIP. Every calculator shows the formula, assumptions and a worked example.",
    keywords: ["calculator", "EMI calculator", "BMI calculator", "percentage calculator", "compound interest calculator", "SIP calculator", "GST calculator"],
    content: homeContent,
    schemas: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Calcora Calculators",
        alternateName: "Calcora",
        url: `${siteUrl}/`,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Calcora Calculators",
        url: `${siteUrl}/`,
        logo: `${siteUrl}/favicon.svg`,
      },
    ],
  });

  pages.push(...calculators.map((calc) => calculatorPage(calc, bySlug, categoryById)));
  pages.push(...categories.map((category) => categoryPage(category, calculators)));
  pages.push(...articles.map((article) => articlePage(article, bySlug)));

  pages.push(
    genericPage(
      "/directory",
      "Calculator Directory",
      "Browse every free calculator on Calcora in one alphabetical directory.",
      `<p>Browse all ${calculators.length} working calculators. Each tool has a formula, assumptions, a worked example and its own shareable page.</p><ul>${[...calculators]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((calc) => `<li><a href="/calculators/${calc.slug}">${escapeHtml(calc.title)}</a></li>`)
        .join("")}</ul>`,
    ),
    genericPage(
      "/guides",
      "Calculator Guides",
      "Read practical guides to EMI, BMI, SIP, percentages, GST and compound interest.",
      `<p>Learn the formula, limitations and practical meaning behind the result.</p><ul>${articles.map((article) => `<li><h2><a href="/guides/${article.slug}">${escapeHtml(article.title)}</a></h2><p>${escapeHtml(article.description)}</p></li>`).join("")}</ul>`,
    ),
    genericPage("/about", "About Calcora", "Learn how Calcora builds free calculators with formulas, assumptions and transparent limitations.", "<p>Calcora is a free calculator library. Each tool runs in your browser, shows its formula and states the assumptions that can change the result.</p><p>There is no sign-up or paywall. Calculator inputs are not uploaded.</p>"),
    genericPage("/contact", "Contact Calcora", "Contact Calcora to suggest a calculator, report an issue or submit a correction.", "<p>Use the contact page in the interactive application to open your email client. Do not send passwords, full financial records or private health information.</p>"),
    genericPage("/privacy", "Privacy Policy", "Read how Calcora handles calculator inputs, local storage, Google Analytics, AdSense and consent.", "<p>Calculator inputs are processed in your browser and are not sent to Calcora. Local storage keeps only preferences such as favourites, recent tools, theme and consent.</p><p>Google Analytics and AdSense are configured with Consent Mode for visitors in regions where consent is required.</p>"),
    genericPage("/terms", "Terms of Use", "Terms for using Calcora's free online calculators and educational content.", "<p>Results are estimates and are not a quote, diagnosis, tax filing or professional advice. Verify important decisions with a qualified professional.</p>"),
    genericPage("/disclaimer", "Disclaimer", "Limits of Calcora's finance, health, tax, pregnancy and other calculator estimates.", "<p>Calculator results depend on the inputs and assumptions shown. They are not financial, medical, legal or tax advice.</p>"),
    genericPage("/affiliate-disclosure", "Affiliate Disclosure", "How affiliate links are labelled and used on Calcora.", "<p>Affiliate sections are hidden unless a real relevant product is configured. Calculator results never depend on affiliate links.</p>"),
    genericPage("/corrections", "Corrections and Feedback", "How to report a wrong formula, outdated rule or content correction to Calcora.", "<p>Report the calculator name, inputs, result shown and expected result. Clear arithmetic errors and outdated rules are corrected transparently.</p>"),
    genericPage("/support", "Support Calcora", "Calcora is free with no sign-up or paywall. Learn how optional support helps maintain the calculators.", `<p>Every calculator is free, with no account and no paywall. Optional contributions help with hosting, domain costs, formula checks and new tools, but do not unlock features.</p><h2>Ways to support</h2><ul><li><a href="mailto:?subject=Free%20calculators%20%E2%80%94%20Calcora&amp;body=I%20found%20this%20useful%3A%20https%3A%2F%2Fcalcoraplus.netlify.app%2Fsupport">Share Calcora by email</a></li><li><a href="https://twitter.com/intent/tweet?text=Free%20calculators%20with%20the%20working%20shown%20%E2%80%94%20Calcora&amp;url=https%3A%2F%2Fcalcoraplus.netlify.app%2Fsupport" rel="noopener noreferrer">Post about Calcora on X</a></li><li><a href="https://wa.me/?text=Free%20calculators%20with%20the%20working%20shown%20%E2%80%94%20Calcora%20https%3A%2F%2Fcalcoraplus.netlify.app%2Fsupport" rel="noopener noreferrer">Share Calcora on WhatsApp</a></li><li><a href="/corrections">Report a wrong formula or outdated rule</a></li><li><a href="/contact">Suggest a calculator you would like to see</a></li></ul>`),
    genericPage("/sitemap", "HTML Sitemap", "Browse Calcora categories, guides, policies and all free calculator pages.", `<h2>Categories</h2><ul>${categories.map((category) => `<li><a href="/category/${category.id}">${escapeHtml(category.name)}</a></li>`).join("")}</ul><h2>Calculators</h2><ul>${calculators.map((calc) => `<li><a href="/calculators/${calc.slug}">${escapeHtml(calc.title)}</a></li>`).join("")}</ul>`),
  );

  for (const page of pages) await writeRoute(page, template);
  console.log(`Generated ${pages.length} static HTML routes and shared hashed assets.`);
}

await main();
