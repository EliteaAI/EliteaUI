// DEV-ONLY: rich mock data for exercising the Usage UI without a live backend.
// To toggle mock mode on/off, use the "Mock" button in the Usage header.

// Set to true to start in mock mode by default (dev convenience flag).
export const DEV_MOCK_DEFAULT = true;

const SHARED_MONTHLY_HISTORY = [
  { period: '202610', spend: 142.87 },
  { period: '202609', spend: 388.42 },
  { period: '202608', spend: 291.15 },
];

const makeDaily = (startDate, count, baseSpend, baseTok) => {
  const days = [];
  const d = new Date(startDate + 'T00:00:00Z');

  for (let i = 0; i < count; i++) {
    const jitter = 0.6 + Math.random() * 0.8;
    const date = new Date(d);

    date.setUTCDate(d.getUTCDate() + i);
    days.push({
      date: date.toISOString().slice(0, 10),
      spend: parseFloat((baseSpend * jitter).toFixed(4)),
      total_tokens: Math.round(baseTok * jitter),
    });
  }

  return days;
};

export const MOCK_USAGE_DATA = {
  // Amounts visible (admin/editor view)
  can_see_amounts: true,

  // Budget
  spend: 142.87,
  effective_limit: 500,
  percent_used: 28.6,
  currency: 'USD',
  resets_at: '2026-11-01',
  warning_pct: 80,
  spend_available: true,

  // Period
  period_start: '2026-10-01',
  period_end: '2026-10-31',
  period_yyyymm: '202610',
  available_periods: ['202610', '202609', '202608'],

  // Metadata
  generated_at: new Date().toISOString(),

  // 20 days of daily data
  daily: makeDaily('2026-10-01', 20, 7.15, 28000),

  // 11 models — enough to trigger the "Show all" button (DEFAULT_VISIBLE = 8)
  models: [
    { model: 'claude-sonnet-4-5', display_name: 'Claude Sonnet 4.5', spend: 51.2, total_tokens: 204800 },
    { model: 'claude-opus-4-5', display_name: 'Claude Opus 4.5', spend: 38.7, total_tokens: 96750 },
    { model: 'gpt-4o', display_name: 'GPT-4o', spend: 18.4, total_tokens: 92000 },
    { model: 'gpt-4o-mini', display_name: 'GPT-4o Mini', spend: 9.6, total_tokens: 320000 },
    { model: 'claude-haiku-4-5', display_name: 'Claude Haiku 4.5', spend: 7.3, total_tokens: 486667 },
    { model: 'gemini-1.5-pro', display_name: 'Gemini 1.5 Pro', spend: 6.8, total_tokens: 56667 },
    {
      model: 'text-embedding-3-large',
      display_name: 'text-embedding-3-large',
      spend: 4.1,
      total_tokens: 1640000,
    },
    { model: 'dall-e-3', display_name: 'DALL-E 3', spend: 3.5, total_tokens: 3500 },
    { model: 'mistral-large', display_name: 'Mistral Large', spend: 2.17, total_tokens: 21700 },
    { model: 'llama-3.1-70b', display_name: 'LLaMA 3.1 70B', spend: 0.9, total_tokens: 45000 },
    { model: 'flux-schnell', display_name: 'Flux Schnell', spend: 0.2, total_tokens: 200 },
  ],

  // Sources for the donut chart
  by_source: [
    { source: 'agents', spend: 72.3, total_tokens: 289200 },
    { source: 'chat', spend: 34.6, total_tokens: 173000 },
    { source: 'pipelines', spend: 19.4, total_tokens: 97000 },
    { source: 'indexing', spend: 9.8, total_tokens: 490000 },
    { source: 'skills', spend: 4.57, total_tokens: 22850 },
    { source: 'external', spend: 2.2, total_tokens: 11000 },
  ],

  // Token breakdown
  token_mix: {
    input_tokens: 720000,
    output_tokens: 180000,
    cached_tokens: 250000,
    image_tokens: 15000,
    input_tokens_cost: 72.0,
    output_tokens_cost: 54.0,
    cached_tokens_cost: 12.5,
    image_tokens_cost: 4.37,
  },
  cache_hit_rate: 0.258,

  // Paid tool spend (web search, etc.)
  tool_spend: [
    {
      feature: 'web_search',
      label: 'Web search',
      spend: 2.5,
      effective_limit: 10.0,
      percent_used: 25,
      calls: 142,
      spend_available: true,
      currency: 'USD',
    },
    {
      feature: 'code_execution',
      label: 'Code execution',
      spend: 0.8,
      effective_limit: 5.0,
      percent_used: 16,
      calls: 37,
      spend_available: true,
      currency: 'USD',
    },
  ],

  // Top agents
  top_agents: [
    { id: 101, name: 'Code Review Bot', type: 'agent', runs: 312, spend: 28.4 },
    { id: 102, name: 'Doc Generator Pipeline', type: 'pipeline', runs: 87, spend: 21.7 },
    { id: 103, name: 'SQL Assistant', type: 'agent', runs: 204, spend: 15.9 },
    { id: 104, name: 'Test Writer', type: 'agent', runs: 156, spend: 11.2 },
    { id: 105, name: 'Onboarding Flow', type: 'pipeline', runs: 43, spend: 9.6 },
  ],

  // Top skills
  top_skills: [
    { name: 'GitHub Search', uses: 1840, spend: 8.3 },
    { name: 'Jira Lookup', uses: 720, spend: 4.1 },
    { name: 'Confluence Fetch', uses: 540, spend: 3.2 },
    { name: 'Web Scraper', uses: 310, spend: 2.7 },
    { name: 'DB Query', uses: 192, spend: 1.9 },
  ],

  // 4 months of history
  monthly_history: SHARED_MONTHLY_HISTORY,
};

// September 2026 data
export const MOCK_PREVIOUS_DATA = {
  can_see_amounts: true,
  spend: 388.42,
  effective_limit: 500,
  percent_used: 77.7,
  currency: 'USD',
  resets_at: '2026-10-01',
  warning_pct: 80,
  spend_available: true,
  period_start: '2026-09-01',
  period_end: '2026-09-30',
  period_yyyymm: '202609',
  available_periods: ['202610', '202609', '202608'],
  monthly_history: SHARED_MONTHLY_HISTORY,
  generated_at: new Date().toISOString(),

  daily: makeDaily('2026-09-01', 30, 12.95, 51000),

  models: [
    { model: 'claude-sonnet-4-5', display_name: 'Claude Sonnet 4.5', spend: 140.3, total_tokens: 561200 },
    { model: 'claude-opus-4-5', display_name: 'Claude Opus 4.5', spend: 92.1, total_tokens: 230250 },
    { model: 'gpt-4o', display_name: 'GPT-4o', spend: 55.7, total_tokens: 278500 },
    { model: 'gpt-4o-mini', display_name: 'GPT-4o Mini', spend: 28.4, total_tokens: 946667 },
    { model: 'claude-haiku-4-5', display_name: 'Claude Haiku 4.5', spend: 22.6, total_tokens: 1506667 },
    { model: 'gemini-1.5-pro', display_name: 'Gemini 1.5 Pro', spend: 18.9, total_tokens: 157500 },
    {
      model: 'text-embedding-3-large',
      display_name: 'text-embedding-3-large',
      spend: 12.3,
      total_tokens: 4920000,
    },
    { model: 'dall-e-3', display_name: 'DALL-E 3', spend: 8.52, total_tokens: 8520 },
    { model: 'mistral-large', display_name: 'Mistral Large', spend: 5.8, total_tokens: 58000 },
    { model: 'llama-3.1-70b', display_name: 'LLaMA 3.1 70B', spend: 3.2, total_tokens: 160000 },
    { model: 'flux-schnell', display_name: 'Flux Schnell', spend: 0.55, total_tokens: 550 },
  ],

  by_source: [
    { source: 'agents', spend: 185.2, total_tokens: 740800 },
    { source: 'chat', spend: 88.4, total_tokens: 442000 },
    { source: 'pipelines', spend: 62.7, total_tokens: 313500 },
    { source: 'indexing', spend: 31.5, total_tokens: 1575000 },
    { source: 'skills', spend: 14.1, total_tokens: 70500 },
    { source: 'external', spend: 6.52, total_tokens: 32600 },
  ],

  token_mix: {
    input_tokens: 1840000,
    output_tokens: 460000,
    cached_tokens: 640000,
    image_tokens: 38000,
    input_tokens_cost: 184.0,
    output_tokens_cost: 138.0,
    cached_tokens_cost: 32.0,
    image_tokens_cost: 11.2,
  },
  cache_hit_rate: 0.258,

  tool_spend: [
    {
      feature: 'web_search',
      label: 'Web search',
      spend: 7.3,
      effective_limit: 10.0,
      percent_used: 73,
      calls: 412,
      spend_available: true,
      currency: 'USD',
    },
    {
      feature: 'code_execution',
      label: 'Code execution',
      spend: 2.15,
      effective_limit: 5.0,
      percent_used: 43,
      calls: 98,
      spend_available: true,
      currency: 'USD',
    },
  ],

  top_agents: [
    { id: 101, name: 'Code Review Bot', type: 'agent', runs: 890, spend: 78.2 },
    { id: 102, name: 'Doc Generator Pipeline', type: 'pipeline', runs: 244, spend: 62.1 },
    { id: 103, name: 'SQL Assistant', type: 'agent', runs: 580, spend: 44.7 },
    { id: 104, name: 'Test Writer', type: 'agent', runs: 420, spend: 31.5 },
    { id: 105, name: 'Onboarding Flow', type: 'pipeline', runs: 115, spend: 27.3 },
  ],

  top_skills: [
    { name: 'GitHub Search', uses: 4710, spend: 21.2 },
    { name: 'Jira Lookup', uses: 1840, spend: 10.5 },
    { name: 'Confluence Fetch', uses: 1380, spend: 8.2 },
    { name: 'Web Scraper', uses: 793, spend: 6.9 },
    { name: 'DB Query', uses: 491, spend: 4.9 },
  ],

  members: [
    {
      user_id: 1,
      name: 'Alice Chen',
      email: 'alice@example.com',
      spend: 95.3,
      effective_limit: 150,
      percent_used: 63.5,
      currency: 'USD',
    },
    {
      user_id: 2,
      name: 'Bob Tanaka',
      email: 'bob@example.com',
      spend: 128.7,
      effective_limit: 150,
      percent_used: 85.8,
      currency: 'USD',
    },
    {
      user_id: 3,
      name: 'Carol Smith',
      email: 'carol@example.com',
      spend: 62.4,
      effective_limit: 100,
      percent_used: 62.4,
      currency: 'USD',
    },
  ],
};

// Members data — shape returned by the /members endpoint
export const MOCK_MEMBERS_DATA = {
  total: 6,
  warning_pct: 80,
  degraded: false,
  system_row: {
    name: 'System / unattributed',
    spend: 12.5,
    currency: 'USD',
  },
  rows: [
    {
      user_id: 1,
      name: 'Alice Chen',
      email: 'alice@example.com',
      spend: 38.7,
      effective_limit: 150,
      percent_used: 25.8,
      currency: 'USD',
    },
    {
      user_id: 2,
      name: 'Bob Tanaka',
      email: 'bob@example.com',
      spend: 51.2,
      effective_limit: 150,
      percent_used: 34.1,
      currency: 'USD',
    },
    {
      user_id: 3,
      name: 'Carol Smith',
      email: 'carol@example.com',
      spend: 19.6,
      effective_limit: 100,
      percent_used: 19.6,
      currency: 'USD',
    },
    {
      user_id: 4,
      name: 'David Park',
      email: 'david@example.com',
      spend: 14.3,
      effective_limit: 100,
      percent_used: 14.3,
      currency: 'USD',
    },
    {
      user_id: 5,
      name: 'Eva Müller',
      email: 'eva@example.com',
      spend: 11.87,
      effective_limit: null,
      percent_used: null,
      currency: 'USD',
    },
    {
      user_id: 6,
      name: 'Frank Lee',
      email: 'frank@example.com',
      spend: 6.7,
      effective_limit: null,
      percent_used: null,
      currency: 'USD',
    },
  ],
};

// Non-admin variant: same data but with can_see_amounts = false
export const MOCK_USAGE_DATA_NO_AMOUNTS = {
  ...MOCK_USAGE_DATA,
  can_see_amounts: false,
};

// Lightweight stub for Aug — real shape, scaled-down values
const MOCK_AUG_DATA = {
  ...MOCK_PREVIOUS_DATA,
  spend: 291.15,
  percent_used: 58.2,
  period_start: '2026-08-01',
  period_end: '2026-08-31',
  period_yyyymm: '202608',
  daily: makeDaily('2026-08-01', 31, 9.4, 37000),
  monthly_history: SHARED_MONTHLY_HISTORY,
};

// Map YYYYMM → mock data for that period (latest 3 months only)
const MOCK_PERIOD_MAP = {
  202610: MOCK_USAGE_DATA,
  202609: MOCK_PREVIOUS_DATA,
  202608: MOCK_AUG_DATA,
};

/** Return mock data for the given period, or null when period is absent/unknown. */
export const getMockDataForPeriod = (period, noAmounts = false) => {
  if (!period) return null;
  const base = MOCK_PERIOD_MAP[period] ?? null;
  if (!base) return null;
  return noAmounts ? { ...base, can_see_amounts: false } : base;
};
