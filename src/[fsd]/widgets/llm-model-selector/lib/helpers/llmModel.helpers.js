// Ordered most-specific → least-specific within each family.
// Each description is a short tagline under 40 characters focused on when to use the model.
// Tested against lowercased model.name (technical id) first, then model.display_name.
const MODEL_DESCRIPTION_PATTERNS = [
  // === GPT-6 ===
  [/gpt.*6.*astra|gpt-6-astra/, 'Most capable for hard, long tasks'],
  [/gpt[-/ ]6\b|gpt.*\bsix\b/, 'Most capable for hard, long tasks'],
  // === GPT-5.6 sub-variants ===
  [/gpt.*5[.-]6.*sol/, 'Deep reasoning for complex problems'],
  [/gpt.*5[.-]6.*terra/, 'Balanced for everyday tasks'],
  [/gpt.*5[.-]6.*luna/, 'Fast and low-cost for simple tasks'],
  [/gpt.*5[.-]6/, 'Balanced for everyday tasks'],
  // === GPT-5.4 ===
  [/gpt.*5[.-]4.*mini/, 'Previous-gen, quick and low-cost'],
  [/gpt.*5[.-]4/, 'Previous-gen all-rounder'],
  // === GPT-5 (other variants) ===
  [/gpt.?5.*mini/, 'Compact and fast for simple tasks'],
  [/gpt.?5/, 'Capable and versatile for most tasks'],
  // === GPT-4o ===
  [/gpt-4o-mini/, 'Affordable and fast for light tasks'],
  [/gpt-4o/, 'Fast, flexible for diverse tasks'],
  // === GPT-4 ===
  [/gpt-4-turbo/, 'Improved instruction following'],
  [/gpt-4/, 'High-intelligence for complex tasks'],
  // === GPT-3.5 ===
  [/gpt-3\.5/, 'Fast, inexpensive model for simple tasks'],
  // === o-series ===
  [/o4-mini|o3-mini/, 'Fast, flexible reasoning model'],
  [/\bo4\b|\bo3\b/, 'Most powerful reasoning model'],
  [/o1-mini/, 'Fast, affordable reasoning model'],
  [/(o1-preview|o1-pro)/, 'Enhanced reasoning for hard problems'],
  [/\bo1\b/, 'Reasoning model for multi-step tasks'],
  // === Claude Opus — 3.x first (exact prefix), then 4.x/5.x anchored to family with (?!\d) ===
  [/claude-3-opus/, 'Most powerful for complex tasks'],
  [/claude[-. ]?opus[-. ]?5[._-]5(?!\d)/, 'Most capable for ambitious work'],
  [/claude[-. ]?opus[-. ]?5(?!\d)/, 'Most capable for ambitious work'],
  [/claude[-. ]?opus[-. ]?4(?!\d)/, 'Most capable for complex work'],
  // === Claude Sonnet — 3.x first (exact prefix), then 4.x/5.x anchored to family with (?!\d) ===
  [/claude-3-7-sonnet/, 'Extended thinking for complex tasks'],
  [/claude-3-5-sonnet/, 'Balanced for speed and intelligence'],
  [/claude-3-sonnet/, 'Balanced for diverse tasks'],
  [/claude[-. ]?sonnet[-. ]?5[._-]5(?!\d)/, 'Smart and fast for most tasks'],
  [/claude[-. ]?sonnet[-. ]?5(?!\d)/, 'Smart and fast for most tasks'],
  [/claude[-. ]?sonnet[-. ]?4[._-]6(?!\d)/, 'Reliable for everyday work and coding'],
  [/claude[-. ]?sonnet[-. ]?4[._-]5(?!\d)/, 'Balanced for speed and intelligence'],
  [/claude[-. ]?sonnet[-. ]?4(?!\d)/, 'Smart and fast for everyday tasks'],
  // === Claude Haiku — 3.x first (exact prefix), then 4.x anchored to family with (?!\d) ===
  [/claude-3-5-haiku/, 'Fastest model for near-instant tasks'],
  [/claude-3-haiku/, 'Fastest for instant responses'],
  [/claude[-. ]?haiku[-. ]?4[._-]5(?!\d)/, 'Fastest Claude for quick, simple tasks'],
  [/claude[-. ]?haiku[-. ]?4(?!\d)/, 'Fastest for quick, simple tasks'],
  // === Claude catch-alls (display-name patterns like "Anthropic Claude Sonnet 5") ===
  [/claude.*opus/, 'Most capable for ambitious work'],
  [/claude.*sonnet/, 'Smart and fast for most tasks'],
  [/claude.*haiku/, 'Fastest Claude for quick, simple tasks'],
  [/claude/, 'Capable and safety-focused language model'],
  // === Gemini ===
  [/gemini-2\.5-pro/, 'Most capable for multimodal tasks'],
  [/gemini-2\.5-flash/, 'Fast with multimodal capabilities'],
  [/gemini-2\.0-flash/, 'Fast and versatile next-gen model'],
  [/gemini-1\.5-pro/, 'Multimodal model with long context'],
  [/gemini-1\.5-flash/, 'Fast, versatile multimodal model'],
  [/gemini/, 'Multimodal model for diverse tasks'],
  // === Llama ===
  [/llama-3\.[23]/, 'Latest open-source multimodal model'],
  [/llama-3/, 'Advanced open-source language model'],
  [/llama-2/, 'Robust open-source language model'],
  [/llama/, 'Open-source language model'],
  // === Mistral ===
  [/mixtral/, 'Mixture of experts for strong performance'],
  [/codestral/, 'Purpose-built for code generation'],
  [/mistral-large/, 'Top-tier model for complex reasoning'],
  [/mistral-small/, 'Compact and efficient for everyday tasks'],
  [/mistral-7b/, 'Lightweight model for simple tasks'],
  [/mistral/, 'Efficient model with strong reasoning'],
  // === DeepSeek ===
  [/deepseek-r1/, 'Reasoning with chain-of-thought'],
  [/deepseek-coder/, 'Specialized for code generation'],
  [/deepseek/, 'Advanced model with broad reasoning'],
  // === Cohere ===
  [/command-r-plus/, 'Most powerful for enterprise tasks'],
  [/command-r/, 'Optimized for retrieval-augmented tasks'],
  // === Phi ===
  [/phi-4/, 'Compact, capable small language model'],
  [/phi-3/, 'Efficient small language model'],
  // === Amazon Titan ===
  [/titan/, 'Foundational model for text generation'],
];

/**
 * Returns a default description for a model when the backend provides none.
 * Tests the lowercased technical name first, then the display name, matching
 * from most-specific to least-specific within each model family.
 *
 * @param {{ name?: string, display_name?: string }} model
 * @returns {string | null}
 */
export const getDefaultModelDescription = model => {
  const candidates = [(model?.name || '').toLowerCase(), (model?.display_name || '').toLowerCase()].filter(
    Boolean,
  );

  for (const candidate of candidates) {
    for (const [pattern, description] of MODEL_DESCRIPTION_PATTERNS) {
      if (pattern.test(candidate)) return description;
    }
  }
  return null;
};

// Provider rank determines the display order in the model picker:
//   0 OpenAI  →  1 Anthropic  →  2 Azure AI Foundry  →  3 Others
// Substring matching handles namespaced names like global.openai.gpt-*, eu.anthropic.claude-*, etc.
const PROVIDER_PATTERNS = [
  [/openai|gpt|\bo\d|whisper|dall-e|codex|text-davinci|text-embedding-ada/, 0],
  [/anthropic|claude/, 1],
  [/azure/, 2],
];

export const getModelProviderRank = model => {
  const key = (model?.name || '').toLowerCase();
  for (const [pattern, rank] of PROVIDER_PATTERNS) {
    if (pattern.test(key)) return rank;
  }
  return 3;
};

export const compareModels = (a, b) => {
  const rankDiff = getModelProviderRank(a) - getModelProviderRank(b);
  if (rankDiff !== 0) return rankDiff;
  return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
};
