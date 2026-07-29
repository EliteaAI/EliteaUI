export const fmtNum = n => {
  // Missing data renders as an em-dash, mirroring fmtCost/fmtDuration. A real
  // zero is distinct from "unknown" and still formats as '0'.
  if (n == null) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const fmtDuration = ms => {
  if (ms == null) return '-';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

// Recharts axis `tick` styling shared across the analytics charts. Not an MUI
// `sx` value, so it lives here rather than inside a component `styles` object.
export const axisTick = (stroke, fontSize = 11) => ({ fill: stroke, fontSize });

export const fmtCost = usd => {
  if (usd == null || !Number.isFinite(usd)) return '-';
  if (usd === 0) return '$0.00';
  const abs = Math.abs(usd);
  const sign = usd < 0 ? '-' : '';
  if (abs < 0.0001) return `${sign}$${abs.toFixed(8)}`;
  if (abs < 0.01) return `${sign}$${abs.toFixed(6)}`;
  if (abs < 1) return `${sign}$${abs.toFixed(4)}`;
  if (abs < 1000) return `${sign}$${abs.toFixed(2)}`;
  if (abs < 1_000_000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
};
