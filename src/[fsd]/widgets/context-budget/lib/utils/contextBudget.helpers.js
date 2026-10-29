import { formatNumberWithSpaces } from '@/utils/stringUtils';

const decimalsFor = value => (value < 1 ? 4 : 2);

/**
 * Approximate chat cost: "≈ $0.0991", "≈ $1.23+" when some models are unpriced, "—" when nothing is priced.
 */
export const formatApproxCost = chatUsage => {
  if (!chatUsage) return { text: '—', partial: false, tracked: false };
  const unpriced = chatUsage.unpriced_models || [];
  const value = chatUsage.cost == null ? NaN : Number(chatUsage.cost);
  if (Number.isNaN(value)) return { text: '—', partial: unpriced.length > 0, tracked: true };
  const suffix = unpriced.length ? '+' : '';
  return {
    text: `≈ $${value.toFixed(decimalsFor(value))}${suffix}`,
    partial: unpriced.length > 0,
    tracked: true,
  };
};

export const formatTokens = value => (value == null ? '—' : formatNumberWithSpaces(value));

/**
 * Short window size: 272000 -> "272K", 1048576 -> "1M". Empty when the size is unknown.
 */
export const formatWindowSize = tokens => {
  if (!tokens || tokens <= 0) return '';
  if (tokens >= 1000000) return `${Number((tokens / 1000000).toFixed(1))}M`;
  return `${Math.round(tokens / 1000)}K`;
};

/**
 * Tokens each window mode gives the selected model. Balanced is capped, Full is the whole window
 * (mirrors the backend resolve_context_budget).
 */
export const getWindowModeTokens = (modelWindow, balancedCap) => ({
  balanced: modelWindow > 0 ? Math.min(balancedCap, modelWindow) : 0,
  full: modelWindow > 0 ? modelWindow : 0,
});
