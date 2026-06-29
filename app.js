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

const copyText = async (text, button) => {
  if (!text) return;
  await navigator.clipboard.writeText(text);
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
};

form.addEventListener("submit", (event) => {
  event.preventDefault();

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
  currentReport = buildReport(data);

  resultTitle.textContent = `${data.brandName} visibility report`;
  scoreValue.textContent = score;
  reportOutput.textContent = currentReport;
});

copyMarkdown.addEventListener("click", () => copyText(currentReport, copyMarkdown));
copyLlms.addEventListener("click", () => copyText(currentLlms, copyLlms));
copySchema.addEventListener("click", () => copyText(currentSchema, copySchema));
