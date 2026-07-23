export const fmtNum = n => {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const fmtDuration = ms => {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export const fmtCost = usd => {
  if (usd == null || !Number.isFinite(usd)) return '-';
  if (usd === 0) return '$0.00';
  const abs = Math.abs(usd);
  const sign = usd < 0 ? '-' : '';
  if (abs < 0.0001) return `${sign}$${abs.toFixed(8)}`;
  if (abs < 0.01) return `${sign}$${abs.toFixed(6)}`;
  if (abs < 1) return `${sign}$${abs.toFixed(4)}`;
  if (abs < 1000) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${(abs / 1000).toFixed(1)}K`;
};
