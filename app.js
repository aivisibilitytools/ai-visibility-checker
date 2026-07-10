const form = document.querySelector("#auditForm");
const reportPanel = document.querySelector("#reportPanel");
const reportOutput = document.querySelector("#reportOutput");
const scoreValue = document.querySelector("#scoreValue");
const scoreMeaning = document.querySelector("#scoreMeaning");
const resultTitle = document.querySelector("#resultTitle");
const submitButton = document.querySelector("#submitButton");
const copyStatus = document.querySelector("#copyStatus");
const copyFallback = document.querySelector("#copyFallback");
const manualCopyText = document.querySelector("#manualCopyText");
const menuButton = document.querySelector("#menuButton");
const primaryNav = document.querySelector("#primaryNav");
const exampleButton = document.querySelector("#exampleButton");
const copyButtons = [
  document.querySelector("#copyMarkdown"),
  document.querySelector("#copyLlms"),
  document.querySelector("#copySchema"),
];

let currentReport = "";
let currentLlms = "";
let currentSchema = "";

const icons = () => window.lucide?.createIcons();
window.addEventListener("DOMContentLoaded", icons);

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
  if (/faq|schema|comparison|alternative|pricing/i.test(productDescription + aiAnswer)) score += 8;
  if (!aiAnswer) score -= 8;

  return Math.max(0, Math.min(100, score));
};

const scoreLabel = (score) => {
  if (score >= 75) return "Strong structure";
  if (score >= 50) return "Good foundation";
  return "Needs clearer signals";
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
    recommendations.push(`Make the brand-product connection clearer. The pasted answer did not mention ${brandName}.`);
  }
  if (competitors.length) {
    recommendations.push(`Create comparison pages for ${competitors.slice(0, 3).join(", ")}.`);
  } else {
    recommendations.push("List three direct competitors and explain the difference in plain language.");
  }
  if (keywords.length) {
    recommendations.push(`Add pages or FAQ answers targeting: ${keywords.slice(0, 3).join(", ")}.`);
  } else {
    recommendations.push("Define three phrases customers would ask an AI assistant.");
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

Recommended pages:
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
    },
    null,
    2
  );

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
  if (score < 50) {
    return {
      label: "Book Mini Audit — $149",
      note: "A human review can help identify the first priorities.",
      url: "https://zzdynamo3.gumroad.com/l/mini-ai-visibility-audit",
    };
  }
  if (score < 75) {
    return {
      label: "Get Fix Kit — $29",
      note: "Use reusable templates to close the most common gaps.",
      url: "https://zzdynamo3.gumroad.com/l/ai-visibility-fix-kit",
    };
  }
  return {
    label: "Get Pro Kit — $49",
    note: "Build a broader site-wide testing and improvement workflow.",
    url: "https://zzdynamo3.gumroad.com/l/ai-visibility-fix-kit",
  };
};

const buildReport = (data, score, recommendations, faqIdeas) => {
  currentLlms = buildLlms(data);
  currentSchema = buildSchema(data);
  return `# AI Visibility Audit: ${data.brandName}

Score: ${score}/100 — ${scoreLabel(score)}

## Findings
${getMissingSignals(data).map((item) => `- ${item}`).join("\n") || "- No major gaps detected."}

## Priority fixes
${recommendations.slice(0, 5).map((item) => `- ${item}`).join("\n")}

## FAQ ideas
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

const sectionHeader = (icon, title) => `
  <div class="report-section-header">
    <i data-lucide="${icon}"></i>
    <h3>${title}</h3>
  </div>
`;

const buildReportHtml = (data, score, recommendations, faqIdeas) => {
  const missing = getMissingSignals(data).slice(0, 5);
  const offer = getOffer(score);
  return `
    <section class="report-section">
      ${sectionHeader("list-checks", "Findings")}
      <ul class="report-list">
        ${missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No major gaps detected.</li>"}
      </ul>
    </section>

    <section class="report-section">
      ${sectionHeader("wrench", "Priority fixes")}
      <ol class="report-list">
        ${recommendations.slice(0, 4).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>

    <section class="report-section">
      ${sectionHeader("sparkles", "FAQ ideas")}
      <ul class="report-list">
        ${faqIdeas.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>

    <section class="report-section">
      ${sectionHeader("file-code-2", "Generated assets")}
      <div class="asset-list">
        <div class="asset-row"><span><i data-lucide="file-text"></i> Full report</span><small>Ready to copy</small></div>
        <div class="asset-row"><span><i data-lucide="file-text"></i> llms.txt</span><small>Ready to copy</small></div>
        <div class="asset-row"><span><i data-lucide="braces"></i> Schema JSON-LD</span><small>Ready to copy</small></div>
      </div>
    </section>

    <section class="report-section">
      <div class="next-step">
        <h3>Recommended next step</h3>
        <p>${escapeHtml(offer.note)}</p>
        <a class="button button-primary" href="${offer.url}" target="_blank" rel="noreferrer">
          ${escapeHtml(offer.label)} <i data-lucide="external-link"></i>
        </a>
      </div>
    </section>
  `;
};

const fieldMessages = {
  brandName: "Enter the public name of your brand or product.",
  websiteUrl: "Enter a complete URL beginning with https:// or http://.",
  productDescription: "Describe what the product does and who it helps.",
};

const validateField = (field) => {
  const error = document.querySelector(`#${field.id}Error`);
  let message = "";
  if (!field.value.trim()) {
    message = fieldMessages[field.id];
  } else if (field.id === "websiteUrl") {
    try {
      const url = new URL(field.value.trim());
      if (!["http:", "https:"].includes(url.protocol)) message = fieldMessages.websiteUrl;
    } catch {
      message = fieldMessages.websiteUrl;
    }
  }
  field.setAttribute("aria-invalid", String(Boolean(message)));
  error.textContent = message;
  return !message;
};

["brandName", "websiteUrl", "productDescription"].forEach((id) => {
  const field = document.querySelector(`#${id}`);
  field.addEventListener("blur", () => validateField(field));
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(field);
  });
});

const setLoading = (loading) => {
  submitButton.disabled = loading;
  submitButton.classList.toggle("is-loading", loading);
  submitButton.innerHTML = loading
    ? '<i data-lucide="loader-circle"></i><span>Generating report…</span>'
    : '<i data-lucide="scan-search"></i><span>Run the Free Checker</span>';
  icons();
};

const enableCopyButtons = () => copyButtons.forEach((button) => (button.disabled = false));

const hideCopyFallback = () => {
  copyFallback.hidden = true;
  manualCopyText.value = "";
};

const showCopyFallback = (text, label) => {
  manualCopyText.value = text;
  copyFallback.hidden = false;
  copyStatus.textContent = `Automatic copy was blocked. ${label} is selected for manual copy.`;
  manualCopyText.focus();
  manualCopyText.select();
};

const renderReport = (data) => {
  hideCopyFallback();
  const score = scoreAudit(data);
  const recommendations = buildRecommendations(data);
  const faqIdeas = buildFaqIdeas(data.brandName, data.targetUsers, data.keywords);
  currentReport = buildReport(data, score, recommendations, faqIdeas);
  resultTitle.textContent = `${data.brandName} visibility report`;
  scoreValue.textContent = score;
  scoreMeaning.textContent = `${scoreLabel(score)} · Readiness guidance, not a ranking forecast.`;
  reportOutput.innerHTML = buildReportHtml(data, score, recommendations, faqIdeas);
  enableCopyButtons();
  icons();
  trackEvent("tool_complete", { tool: "ai_visibility_checker", score });
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const requiredFields = ["brandName", "websiteUrl", "productDescription"].map((id) =>
    document.querySelector(`#${id}`)
  );
  const validity = requiredFields.map(validateField);
  if (validity.includes(false)) {
    requiredFields[validity.indexOf(false)].focus();
    return;
  }

  setLoading(true);
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

  window.setTimeout(() => {
    renderReport(data);
    setLoading(false);
    if (window.innerWidth < 981) reportPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 350);
});

const copyText = async (text, button, label) => {
  if (!text || button.disabled) return;
  try {
    await writeClipboard(text);
    const original = button.innerHTML;
    hideCopyFallback();
    button.classList.add("is-success");
    button.innerHTML = '<i data-lucide="check"></i><span>Copied</span>';
    copyStatus.textContent = `${label} copied to clipboard.`;
    icons();
    trackEvent("copy_output", { tool: "ai_visibility_checker", target: button.id });
    window.setTimeout(() => {
      button.classList.remove("is-success");
      button.innerHTML = original;
      icons();
    }, 1600);
  } catch {
    showCopyFallback(text, label);
  }
};

const writeClipboard = async (text) => {
  if (copyWithSelection(text)) {
    return;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Use the selection-based path below when async clipboard access is
      // blocked by an embedded browser or local preview context.
    }
  }

  throw new Error("Copy command was not accepted by the browser.");
};

const copyWithSelection = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  textarea.remove();

  return copied;
};

copyButtons[0].addEventListener("click", () => copyText(currentReport, copyButtons[0], "Report"));
copyButtons[1].addEventListener("click", () => copyText(currentLlms, copyButtons[1], "llms.txt"));
copyButtons[2].addEventListener("click", () => copyText(currentSchema, copyButtons[2], "Schema"));

menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
  menuButton.innerHTML = `<i data-lucide="${open ? "menu" : "x"}"></i>`;
  primaryNav.classList.toggle("is-open", !open);
  icons();
});

primaryNav.addEventListener("click", (event) => {
  if (!event.target.closest("a") || window.innerWidth > 760) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  menuButton.innerHTML = '<i data-lucide="menu"></i>';
  primaryNav.classList.remove("is-open");
  icons();
});

exampleButton.addEventListener("click", () => {
  document.querySelector("#brandName").value = "Northstar CRM";
  document.querySelector("#websiteUrl").value = "https://example.com";
  document.querySelector("#productDescription").value =
    "A privacy-first lightweight CRM for independent consultants that organizes clients, projects, follow-ups, and proposals.";
  document.querySelector("#targetUsers").value = "Independent consultants, small agencies";
  document.querySelector("#competitors").value = "HubSpot, Pipedrive, Notion";
  document.querySelector("#keywords").value = "best CRM for consultants, simple client tracker";
  document.querySelector("#aiAnswer").value =
    "Common options include HubSpot and Pipedrive. Compare pricing, alternatives, FAQs, and use cases before choosing.";
  form.requestSubmit();
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  if (link.href.includes("gumroad.com")) {
    trackEvent("gumroad_click", { url: link.href, text: link.textContent.trim() });
  }
});
