const form = document.querySelector("#auditForm");
const reportOutput = document.querySelector("#reportOutput");
const scoreValue = document.querySelector("#scoreValue");
const resultTitle = document.querySelector("#resultTitle");
const copyMarkdown = document.querySelector("#copyMarkdown");
const copyLlms = document.querySelector("#copyLlms");
const copySchema = document.querySelector("#copySchema");

let currentReport = "";
let currentLlms = "";
let currentSchema = "";

const trackEvent = (name, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getValue = (id) => document.querySelector(`#${id}`).value.trim();

const splitList = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const scoreAudit = ({ brandName, productDescription, competitors, keywords, aiAnswer }) => {
  let score = 35;
  const lowerAnswer = aiAnswer.toLowerCase();

  if (brandName && lowerAnswer.includes(brandName.toLowerCase())) score += 22;
  if (productDescription.length > 80) score += 12;
  if (competitors.length >= 2) score += 10;
  if (keywords.length >= 2) score += 10;
  if (/faq|schema|comparison|alternative|pricing/i.test(productDescription + aiAnswer)) {
    score += 8;
  }
  if (!aiAnswer) score -= 8;

  return Math.max(0, Math.min(100, score));
};

const buildFaqIdeas = (brandName, targetUsers, keywords) => {
  const audience = targetUsers || "your target customers";
  const primaryKeyword = keywords[0] || "this product category";

  return [
    `What is ${brandName} best used for?`,
    `Who is ${brandName} designed for?`,
    `How does ${brandName} compare with common alternatives?`,
    `What problems does ${brandName} solve for ${audience}?`,
    `Is ${brandName} a good option for ${primaryKeyword}?`,
  ];
};

const buildRecommendations = ({ brandName, competitors, keywords, aiAnswer }) => {
  const recommendations = [];

  if (!aiAnswer.toLowerCase().includes(brandName.toLowerCase())) {
    recommendations.push(
      `Make the brand-product connection clearer. AI answers did not mention ${brandName}.`
    );
  }

  if (competitors.length > 0) {
    recommendations.push(
      `Create comparison pages for ${competitors.slice(0, 3).join(", ")} so AI systems understand positioning.`
    );
  } else {
    recommendations.push("List 3 direct competitors and write a short comparison paragraph for each.");
  }

  if (keywords.length > 0) {
    recommendations.push(
      `Add pages or FAQ answers targeting: ${keywords.slice(0, 3).join(", ")}.`
    );
  } else {
    recommendations.push("Define 3 search phrases customers would ask AI assistants.");
  }

  recommendations.push("Add a concise FAQ section with question-style headings.");
  recommendations.push("Publish SoftwareApplication structured data on the homepage.");
  recommendations.push("Create an llms.txt file that summarizes the product, audience, use cases, and key URLs.");

  return recommendations;
};

const buildLlms = ({ brandName, websiteUrl, productDescription, targetUsers, competitors, keywords }) => `# ${brandName}

> ${productDescription}

Website: ${websiteUrl}

Target users:
${targetUsers || "Add the main audience here."}

Core use cases:
${keywords.length ? keywords.map((item) => `- ${item}`).join("\n") : "- Add core search phrases and use cases here."}

Competitive context:
${competitors.length ? competitors.map((item) => `- Alternative to ${item}`).join("\n") : "- Add competitor and alternative context here."}

Recommended pages for AI systems:
- Homepage: ${websiteUrl}
- Pricing: ${websiteUrl.replace(/\/$/, "")}/pricing
- FAQ: ${websiteUrl.replace(/\/$/, "")}/faq
- Comparisons: ${websiteUrl.replace(/\/$/, "")}/compare
`;

const buildSchema = ({ brandName, websiteUrl, productDescription }) =>
  JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: brandName,
      url: websiteUrl,
      description: productDescription,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    null,
    2
  );

const buildReport = (data) => {
  const score = scoreAudit(data);
  const recommendations = buildRecommendations(data);
  const faqIdeas = buildFaqIdeas(data.brandName, data.targetUsers, data.keywords);

  currentLlms = buildLlms(data);
  currentSchema = buildSchema(data);

  return `# AI Visibility Audit: ${data.brandName}

Score: ${score}/100

## What this means
${score >= 75
  ? "Your product has a solid base, but you can still improve AI answer coverage."
  : score >= 55
    ? "Your product is understandable, but AI systems may not confidently recommend it yet."
    : "Your product needs clearer public signals before AI systems can reliably understand it."}

## Missing signals
- FAQ answers written as customer questions
- Clear competitor and alternative positioning
- Structured data for software/product context
- llms.txt summary for AI crawlers and agents

## Recommended fixes
${recommendations.map((item) => `- ${item}`).join("\n")}

## FAQ ideas to add
${faqIdeas.map((item) => `- ${item}`).join("\n")}

## llms.txt draft
\`\`\`txt
${currentLlms}
\`\`\`

## Schema JSON-LD draft
\`\`\`json
${currentSchema}
\`\`\`
`;
};

const getMissingSignals = (data) => {
  const text = `${data.productDescription} ${data.aiAnswer}`.toLowerCase();
  const checks = [
    ["Buyer-intent FAQ answers", /faq|question|answer|objection|pricing/],
    ["Comparison or alternatives page", /compare|comparison|alternative|versus|vs/],
    ["AI-readable llms.txt summary", /llms\.txt|ai-readable|summary/],
    ["Structured Schema markup", /schema|json-ld|structured data/],
    ["Specific use-case pages", /use case|workflow|for teams|for founders/],
    ["Proof or review page", /testimonial|review|case study|customer/],
  ];
  return checks.filter(([, pattern]) => !pattern.test(text)).map(([label]) => label);
};

const getOffer = (score) => {
  if (score < 55) {
    return {
      label: "Request a Mini Audit",
      price: "$149",
      note: "Best when the page needs a manual pass before templates will help.",
      url: "mailto:zzd050131@gmail.com?subject=Request%20a%20Mini%20Audit",
      event: "audit_request",
    };
  }
  if (score < 80) {
    return {
      label: "Download the Fix Kit",
      price: "$29",
      note: "Use templates to add missing pages, FAQ targets, llms.txt, and Schema.",
      url: "https://zzdynamo3.gumroad.com/l/ai-visibility-fix-kit",
      event: "kit_cta_click",
    };
  }
  return {
    label: "Request the Pro Kit",
    price: "$49",
    note: "Useful when the basics are in place and you want a broader rollout plan.",
    url: "mailto:zzd050131@gmail.com?subject=AI%20Visibility%20Pro%20Kit",
    event: "kit_cta_click",
  };
};

const buildReportHtml = (data, score, recommendations) => {
  const missingSignals = getMissingSignals(data).slice(0, 4);
  const fixes = recommendations.slice(0, 4);
  const offer = getOffer(score);

  return `
    <div class="result-section">
      <div class="signal-grid">
        <div class="signal-card">
          <strong>AI Visibility Score</strong>
          <p>${score}/100 based on product clarity, answer coverage, structured content, and citeable pages.</p>
        </div>
        <div class="signal-card">
          <strong>Missing buyer-intent signals</strong>
          <ul class="result-list">
            ${missingSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No major gaps detected.</li>"}
          </ul>
        </div>
      </div>

      <div class="signal-card">
        <strong>Top recommended fixes</strong>
        <ul class="result-list">
          ${fixes.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>

      <div class="cta-card">
        <span class="badge">${offer.price}</span>
        <h4>${escapeHtml(offer.label)}</h4>
        <p>${escapeHtml(offer.note)}</p>
        <a class="button primary full" href="${offer.url}" data-event="${offer.event}" target="_blank" rel="noreferrer">
          ${escapeHtml(offer.label)}
        </a>
      </div>

      <p class="disclaimer">
        This checker does not guarantee AI rankings, citations, or recommendations.
        It helps make your website clearer, more structured, and easier for people and AI systems to understand.
      </p>
    </div>
  `;
};

const copyText = async (text, button) => {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  trackEvent("copy_output", { tool: "ai_visibility_checker", target: button.id });
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  trackEvent("tool_start", { tool: "ai_visibility_checker" });

  const data = {
    brandName: getValue("brandName"),
    websiteUrl: getValue("websiteUrl"),
    productDescription: getValue("productDescription"),
    targetUsers: getValue("targetUsers"),
    competitors: splitList(getValue("competitors")),
    keywords: splitList(getValue("keywords")),
    aiAnswer: getValue("aiAnswer"),
  };

  const score = scoreAudit(data);
  const recommendations = buildRecommendations(data);
  currentReport = buildReport(data);

  resultTitle.textContent = `${data.brandName} visibility report`;
  scoreValue.textContent = score;
  reportOutput.innerHTML = buildReportHtml(data, score, recommendations);
  trackEvent("tool_complete", { tool: "ai_visibility_checker", score });
});

copyMarkdown.addEventListener("click", () => copyText(currentReport, copyMarkdown));
copyLlms.addEventListener("click", () => copyText(currentLlms, copyLlms));
copySchema.addEventListener("click", () => copyText(currentSchema, copySchema));

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;

  const text = link.textContent.trim();
  if (link.dataset.event) {
    trackEvent(link.dataset.event, { url: link.href, text });
  }
  if (link.href.includes("gumroad.com")) {
    trackEvent("gumroad_click", { url: link.href, text });
  }
  if (link.href.startsWith("mailto:")) {
    trackEvent("audit_request", { url: link.href, text });
  }
});
