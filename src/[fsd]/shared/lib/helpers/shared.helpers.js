export const secondsInHumanFormat = value => {
  if (!value || value <= 0) return '0 s';

  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);

  if (hours === 0 && minutes === 0) return `${value} s`;

  const parts = [
    hours > 0 && `${hours} h`,
    minutes > 0 && `${minutes} m`,
    seconds > 0 && `${seconds} s`,
  ].filter(Boolean);

  return parts.join(' ') || '0 s';
};

/**
 * Sorts an array with priority items first, then remaining items alphabetically
 */
export const sortWithPriority = (items, priorityOrderItems) => {
  // Case-insensitive, numeric-aware ordering
  const collatorOptions = { sensitivity: 'base', numeric: true };

  const priorityKeys = priorityOrderItems.filter(key => items.includes(key));

  const otherKeys = items
    .filter(key => !priorityOrderItems.includes(key))
    .sort((a, b) => String(a).localeCompare(String(b), undefined, collatorOptions));

  return [...priorityKeys, ...otherKeys];
};
