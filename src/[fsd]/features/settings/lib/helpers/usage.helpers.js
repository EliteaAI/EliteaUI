export const formatMoney = (value, currency = 'USD') => {
  if (value === null || value === undefined) return '—';

  const symbol = currency === 'USD' ? '$' : `${currency} `;
  const amount = Number(value);

  // Sub-cent spend still matters when a limit is small, so keep 4 decimals there
  if (amount > 0 && amount < 0.01) return `${symbol}${amount.toFixed(4)}`;

  return `${symbol}${amount.toFixed(2)}`;
};

export const formatLimit = (value, currency = 'USD') =>
  value === null || value === undefined ? 'Unlimited' : formatMoney(value, currency);

export const formatTokens = tokens => {
  const value = Number(tokens || 0);

  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;

  return String(value);
};

/** Strip provider paths and the shared-project id prefix for display only. */
export const formatModelName = model => {
  if (!model) return 'Unknown';

  const withoutProvider = model.includes('/') ? model.slice(model.lastIndexOf('/') + 1) : model;

  return withoutProvider.replace(/^\d+_/, '');
};

/** Fill days with no activity so the chart cannot interpolate across a gap. */
export const fillDailyGaps = (daily = [], periodStart, periodEnd) => {
  if (!daily.length || !periodStart) return daily;

  const byDate = new Map(daily.map(day => [day.date, day]));

  // Stop at today: future days of the month have no data yet and would flatten the line
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = [periodEnd, today].filter(Boolean).sort()[0];

  const result = [];
  const cursor = new Date(`${periodStart}T00:00:00Z`);
  const end = new Date(`${lastDate}T00:00:00Z`);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);

    result.push(byDate.get(key) || { date: key, spend: 0, total_tokens: 0, api_requests: 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
};

export const usageSeverity = percentUsed => {
  if (percentUsed === null || percentUsed === undefined) return 'none';
  if (percentUsed >= 100) return 'exceeded';
  if (percentUsed >= 80) return 'warning';

  return 'ok';
};

/** Days until the monthly budget resets, for a plain-language label. */
export const daysUntilReset = resetsAt => {
  if (!resetsAt) return null;

  const diff = new Date(resetsAt).getTime() - Date.now();

  return diff <= 0 ? 0 : Math.ceil(diff / (24 * 60 * 60 * 1000));
};

export const formatResetLabel = resetsAt => {
  const days = daysUntilReset(resetsAt);

  if (days === null) return '';
  if (days === 0) return 'Resets today';
  if (days === 1) return 'Resets tomorrow';

  return `Resets in ${days} days`;
};
