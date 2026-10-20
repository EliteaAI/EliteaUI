import { formatNumberWithSpaces } from '@/utils/stringUtils';

const decimalsFor = value => (value < 1 ? 4 : 2);

/**
 * Approximate chat cost: "≈ $0.0991", "≈ $1.23+" when some models are unpriced, "—" when nothing is priced.
 */
export const formatApproxCost = chatUsage => {
  if (!chatUsage) return { text: '—', partial: false, tracked: false };
  const unpriced = chatUsage.unpriced_models || [];
  if (chatUsage.cost === null || chatUsage.cost === undefined) {
    return { text: '—', partial: unpriced.length > 0, tracked: true };
  }
  const value = Number(chatUsage.cost);
  const suffix = unpriced.length ? '+' : '';
  return {
    text: `≈ $${value.toFixed(decimalsFor(value))}${suffix}`,
    partial: unpriced.length > 0,
    tracked: true,
  };
};

export const formatTokens = value =>
  value === null || value === undefined ? '—' : formatNumberWithSpaces(value);
