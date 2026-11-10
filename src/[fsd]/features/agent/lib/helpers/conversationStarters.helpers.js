export const toString = value => (value === null || value === undefined ? '' : String(value));

// Counted the way the backend counts: blank starters are dropped on save
export const countFilled = starters => (starters || []).filter(s => toString(s).trim()).length;

export const AT_LIMIT_TOOLTIP = 'You have reached the limit of chat starters';

export const overLimitTooltip = max =>
  `This version has more starters than the current limit (${max}). Remove some to add new ones.`;

// Adding stops at the limit everywhere. A version saved above it stays savable (the backend accepts up to
// max(limit, starters already saved)) but can't grow
export const getStartersLimitState = ({ count, max }) => {
  const isOverLimit = count > max;
  const canAdd = count < max;
  let addTooltip = '';
  if (isOverLimit) addTooltip = overLimitTooltip(max);
  else if (!canAdd) addTooltip = AT_LIMIT_TOOLTIP;

  return { isOverLimit, canAdd, addTooltip };
};

const LIMIT_ERROR_MARKER = 'cannot exceed';

// Only the count error: a per-item error on the same field must not trigger a limit refetch
export const isConversationStartersLimitError = error => {
  const detail = error?.data;
  return (
    Array.isArray(detail) &&
    detail.some(item => item?.loc?.[0] === 'conversation_starters' && item?.msg?.includes(LIMIT_ERROR_MARKER))
  );
};
