// Invariant data-visualization colors — same in dark and light.
// These are not semantic UI tokens; they identify categorical data series.
// Use these directly (without palette.*) in chart and analytics components.

export const CHART_COLORS = [
  '#10A37F',
  '#4285F4',
  '#D4A574',
  '#FF9900',
  '#58A6FF',
  '#3FB950',
  '#D29922',
  '#BC8CFF',
  '#39D2C0',
  '#F0883E',
];

export const EVENT_TYPE_COLORS = {
  api: '#58A6FF',
  socketio: '#39D2C0',
  llm: '#BC8CFF',
  tool: '#F0883E',
  agent: '#3FB950',
  rpc: '#D29922',
  chat: '#79C0FF',
};

export const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

// Context-budget progress bar — always an amber/green gradient regardless of theme.
export const CONTEXT_BUDGET_COLORS = {
  highUtilization: '#FFC107',
  normalUtilization: '#0FA52D',
};

// Project avatar background, picked by the first letter of the project name — same in dark and light.
export const PROJECT_AVATAR_COLORS = [
  { letters: 'ABCD', color: '#eb691e' },
  { letters: 'EFGH', color: '#3B7DD8' },
  { letters: 'IJKL', color: '#8E24AA' },
  { letters: 'MNOP', color: '#00897B' },
  { letters: 'QRST', color: '#43A047' },
  { letters: 'UVWXYZ', color: '#C5A62A' },
];

export const PROJECT_AVATAR_DEFAULT_COLOR = '#757575';
