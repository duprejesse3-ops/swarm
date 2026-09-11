import { SITE, SWARM_REPO, SWARM_SKU } from "./catalog";
import type { Product } from "./types";

export type SiteListing = {
  product: Product;
  handle: string;
  title: string;
  blurb: string;
  priceLabel: string;
  catalogLine: string;
  catalogHtml: string;
  pageMarkdown: string;
  jsonLd: string;
  shopCsv: string;
  metaTitle: string;
  metaDescription: string;
  includes: string[];
  faq: { q: string; a: string }[];
  bundle: string;
};

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function includesFor(product: Product) {
  if (product.sku === SWARM_SKU) {
    return [
      "Installed app for Android (Chrome) and Windows (Edge/Chrome)",
      "Full source on GitHub",
      "Autopilot genome — local, no API spend",
      "Copy-ready packets: search, conversation, proof-loop, shadow",
      "Site listing kit for every MultiNiche SKU",
    ];
  }
  switch (product.format) {
    case "Prompt Pack":
      return ["PDF", "Notion database", "Watch a run on your own task"];
    case "Automation":
      return ["Blueprint", "Run notes", "Watch a run on your own task"];
    case "Agent":
      return ["System prompt", "Config sheet", "Watch a run on your own task"];
    case "Template":
      return ["Markdown", "Working doc", "Watch a run on your own task"];
    case "Connector":
      return ["App download", "One-time license", "Runs on your machine"];
    case "Host":
      return [".zip", "./install.sh", "Perpetual license, no rent"];
    default:
      return ["Digital delivery", "One-time payment"];
  }
}

function faqFor(product: Product) {
  if (product.sku === SWARM_SKU) {
    return [
      {
        q: "Is this a Google Ads account?",
        a: "No. SWARM writes proof-first packets you paste into search, threads, and listings. Autopilot evolves what wins.",
      },
      {
        q: "Does Autopilot burn Grok quota?",
        a: "No. Autopilot uses the local genome. Grok writes copy only when you flip that switch.",
      },
      {
        q: "Is there a Play Store or Microsoft Store app?",
        a: "No store listing. Chrome or Edge → Install app. Home screen, Start menu, taskbar.",
      },
      {
        q: "Subscription?",
        a: "$79.00 one-time. Source included. Bundle 3+ different tools on MultiNiche for 15% off.",
      },
    ];
  }
  return [
    {
      q: "What do I actually get?",
      a: `${product.format} for ${product.role}. ${product.job}.`,
    },
    {
      q: "Can I watch it before I pay?",
      a: "Yes. Watch it run on your own task first. Spec sheet, not a pitch.",
    },
    {
      q: "Subscription?",
      a: `$${product.price.toFixed(2)} one-time. Credits never expire. Bundle 3+ different tools for 15% off.`,
    },
  ];
}

export function listingFor(product: Product): SiteListing {
  const handle = slug(product.name);
  const includes = includesFor(product);
  const faq = faqFor(product);
  const priceLabel = `$${product.price.toFixed(2)}`;
  const blurb = `${product.job}. ${product.proof}.`;
  const url = `${SITE}/?sku=${encodeURIComponent(product.sku)}`;
  const catalogLine = `${product.sku}  ${product.role}  ${product.format}\n${product.name}\n${blurb}\n${includes[0]} · ${priceLabel}  + Add`;
  const catalogHtml = `<article data-sku="${product.sku}">
  <p>${product.sku}</p>
  <p>${product.role} · ${product.format}</p>
  <h2>${product.name}</h2>
  <p>${blurb}</p>
  <p>${includes[0]} · one-time</p>
  <p>${priceLabel}</p>
  <button type="button">+ Add</button>
</article>`;
  const pageMarkdown = [
    `# ${product.name}`,
    `**${product.sku}** · ${product.format} · ${product.role} · ${priceLabel}`,
    "",
    "## What it does",
    product.job + ".",
    "",
    "## Proof",
    product.proof + ".",
    "",
    "## The pain it intercepts",
    product.pain,
    "",
    "## What it runs on",
    product.sku === SWARM_SKU
      ? "Chrome or Edge. Install as an app on Android and Windows. Source on GitHub."
      : "Built for Claude, ChatGPT, and Gemini unless the spec names a host. Watch it run on your own task.",
    "",
    "## What it costs",
    `${priceLabel} one-time. No subscription. Bundle 3+ different tools for 15% off.`,
    "",
    "## Includes",
    ...includes.map((item) => `- ${item}`),
    "",
    "## Queries it hijacks",
    ...product.queries.map((q) => `- ${q}`),
    "",
    "## FAQ",
    ...faq.flatMap((item) => [`### ${item.q}`, item.a, ""]),
    product.sku === SWARM_SKU ? `Source: ${SWARM_REPO}` : `Landing: ${url}`,
  ].join("\n");
  const jsonLd = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      sku: product.sku,
      description: blurb,
      brand: { "@type": "Brand", name: "MultiNiche AI" },
      category: product.format,
      offers: {
        "@type": "Offer",
        price: product.price.toFixed(2),
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url,
      },
    },
    null,
    2,
  );
  const bodyHtml = `<p>${blurb}</p><ul>${includes.map((item) => `<li>${item}</li>`).join("")}</ul>`;
  const shopCsv = [
    "Handle,Title,Vendor,Type,Tags,Published,Variant SKU,Variant Price,Variant Requires Shipping,Status",
    [
      handle,
      `"${product.name.replaceAll('"', '""')}"`,
      "MultiNiche AI",
      product.format,
      `"${[product.role, product.format, "one-time"].join(",")}"`,
      "true",
      product.sku,
      product.price.toFixed(2),
      "false",
      "active",
    ].join(","),
    "",
    "Body HTML:",
    bodyHtml,
  ].join("\n");
  const metaTitle = `${product.name} · ${product.sku} · MultiNiche AI`;
  const metaDescription = `${blurb} ${priceLabel} one-time.`;
  const bundle = [
    catalogLine,
    "",
    pageMarkdown,
    "",
    "## JSON-LD",
    jsonLd,
    "",
    "## Shop CSV",
    shopCsv,
    "",
    `Meta title: ${metaTitle}`,
    `Meta description: ${metaDescription}`,
  ].join("\n");
  return {
    product,
    handle,
    title: product.name,
    blurb,
    priceLabel,
    catalogLine,
    catalogHtml,
    pageMarkdown,
    jsonLd,
    shopCsv,
    metaTitle,
    metaDescription,
    includes,
    faq,
    bundle,
  };
}
