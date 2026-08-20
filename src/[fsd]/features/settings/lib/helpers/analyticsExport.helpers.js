import { ExcelFormats, sanitizeFileNamePart } from '@/[fsd]/shared/lib/utils/exportToExcel.utils';

import { tokenStats } from './analyticsToken.helpers.js';

const EXPORT_LIMIT = 10_000;

const fmtISODate = iso => (iso ? new Date(iso).toISOString().slice(0, 10) : '');

const fmtISODateTime = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
};

const buildMetadata = (sheetLabel, { projectName, dateFrom, dateTo, timeZone }) => [
  ['Project', projectName],
  ['Exported Tab', sheetLabel],
  ['From', fmtISODateTime(dateFrom)],
  ['To', fmtISODateTime(dateTo)],
  ['Time Zone', timeZone],
  ['Exported At', fmtISODateTime(new Date().toISOString())],
];

const emptyRow = (columns, message) => {
  const row = {};
  if (columns.length > 0) row[columns[0].key] = message;
  return [row];
};

const NO_DATA_MSG = 'No data available for the selected date range.';

const buildOverviewSheet = (data, meta, isPersonalProject = false) => {
  const { kpis = {}, daily_activity = [], models = [], top_ai_users = [] } = data || {};

  const totalModelCalls = models.reduce((s, m) => s + (m.calls || 0), 0);

  const sections = [];

  sections.push({
    title: 'Summary Metrics',
    columns: [
      { header: 'Metric', key: 'metric' },
      { header: 'Value', key: 'value', numFmt: ExcelFormats.integer },
    ],
    rows: [
      { metric: 'Unique Active Users', value: kpis.unique_users ?? 0 },
      { metric: 'Total Project Users', value: kpis.total_project_users ?? 0 },
      { metric: 'AI Active Users', value: kpis.ai_active_users ?? 0 },
      { metric: 'Adoption Rate (%)', value: kpis.adoption_rate ?? 0 },
      { metric: 'LLM Calls', value: kpis.llm_calls ?? 0 },
      { metric: 'Tool Runs', value: kpis.tool_runs ?? 0 },
      { metric: 'Chat Messages', value: kpis.chat_msgs ?? 0 },
      { metric: 'Agent & Pipeline Runs', value: kpis.agent_runs ?? 0 },
      { metric: 'Total Tokens', value: kpis.total_tokens ?? 0 },
      { metric: 'Cost (USD)', value: kpis.total_llm_cost ?? 0 },
    ],
  });

  const dailyCols = [
    { header: 'Date', key: 'date' },
    { header: 'Events', key: 'events', numFmt: ExcelFormats.integer },
    { header: 'Users', key: 'users', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Daily Activity',
    columns: dailyCols,
    rows: daily_activity.length > 0 ? daily_activity : emptyRow(dailyCols, NO_DATA_MSG),
  });

  const modelCols = [
    { header: 'Model', key: 'name' },
    { header: 'Calls/Runs', key: 'calls', numFmt: ExcelFormats.integer },
    ...(isPersonalProject ? [] : [{ header: 'Users', key: 'users', numFmt: ExcelFormats.integer }]),
    { header: 'Share (%)', key: 'share', numFmt: ExcelFormats.percent },
  ];
  sections.push({
    title: 'Model Usage Breakdown',
    columns: modelCols,
    rows:
      models.length > 0
        ? models.map(m => ({
            name: m.display_name || m.model_name || 'Unknown',
            calls: m.calls ?? 0,
            ...(isPersonalProject ? {} : { users: m.users ?? 0 }),
            share: totalModelCalls > 0 ? Number((((m.calls || 0) / totalModelCalls) * 100).toFixed(2)) : 0,
          }))
        : emptyRow(modelCols, NO_DATA_MSG),
  });

  const userCols = [
    { header: 'User', key: 'user_email' },
    { header: 'AI Events', key: 'ai_events', numFmt: ExcelFormats.integer },
    { header: 'LLM Calls', key: 'llm_calls', numFmt: ExcelFormats.integer },
    { header: 'Tool Runs', key: 'tool_runs', numFmt: ExcelFormats.integer },
    { header: 'Agent & Pipeline Runs', key: 'agent_runs', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Top AI Adopters',
    columns: userCols,
    rows: top_ai_users.length > 0 ? top_ai_users : emptyRow(userCols, NO_DATA_MSG),
  });

  return {
    sheetName: 'Overview',
    metadata: buildMetadata('Overview', meta),
    sections,
  };
};

const buildCostsSheet = (data, meta) => {
  const { kpis = {}, by_model = [], by_agent = [], by_user = [], daily = [] } = data || {};

  const sections = [];

  sections.push({
    title: 'Summary Metrics',
    columns: [
      { header: 'Metric', key: 'metric' },
      { header: 'Value', key: 'value' },
    ],
    rows: [
      { metric: 'Total Cost (USD)', value: kpis.total_cost ?? 0 },
      { metric: 'Input Token Cost (USD)', value: kpis.total_input_cost ?? 0 },
      { metric: 'Output Token Cost (USD)', value: kpis.total_output_cost ?? 0 },
      { metric: 'Cache Read Cost (USD)', value: kpis.total_cache_read_cost ?? 0 },
      { metric: 'Cache Write Cost (USD)', value: kpis.total_cache_creation_cost ?? 0 },
    ],
  });

  const dailyCols = [
    { header: 'Date', key: 'date' },
    { header: 'Total Cost (USD)', key: 'total_cost', numFmt: ExcelFormats.currency },
    { header: 'Input Token Cost (USD)', key: 'input_cost', numFmt: ExcelFormats.currency },
    { header: 'Output Token Cost (USD)', key: 'output_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Read Cost (USD)', key: 'cache_read_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Write Cost (USD)', key: 'cache_creation_cost', numFmt: ExcelFormats.currency },
  ];
  sections.push({
    title: 'Daily Cost Trend',
    columns: dailyCols,
    rows: daily.length > 0 ? daily : emptyRow(dailyCols, NO_DATA_MSG),
  });

  const costShareCols = (nameHeader, nameKey) => [
    { header: nameHeader, key: nameKey },
    { header: 'Total Cost (USD)', key: 'total_cost', numFmt: ExcelFormats.currency },
    { header: 'Input Token Cost (USD)', key: 'input_cost', numFmt: ExcelFormats.currency },
    { header: 'Output Token Cost (USD)', key: 'output_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Read Cost (USD)', key: 'cache_read_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Write Cost (USD)', key: 'cache_creation_cost', numFmt: ExcelFormats.currency },
    { header: 'Share (%)', key: 'share', numFmt: ExcelFormats.percent },
  ];

  const costShareRows = (items, nameMapper, totalCost) =>
    [...items]
      .sort((a, b) => (b.total_cost ?? 0) - (a.total_cost ?? 0))
      .map(item => ({
        name: nameMapper(item),
        total_cost: item.total_cost ?? 0,
        input_cost: item.input_cost ?? 0,
        output_cost: item.output_cost ?? 0,
        cache_read_cost: item.cache_read_cost ?? 0,
        cache_creation_cost: item.cache_creation_cost ?? 0,
        share: totalCost > 0 ? Number((((item.total_cost ?? 0) / totalCost) * 100).toFixed(2)) : 0,
      }));

  const userCols = costShareCols('User', 'name');
  const totalUserCost = by_user.reduce((sum, u) => sum + (u.total_cost ?? 0), 0);
  sections.push({
    title: 'Cost by User',
    columns: userCols,
    rows:
      by_user.length > 0
        ? costShareRows(by_user, u => u.user_email, totalUserCost)
        : emptyRow(userCols, NO_DATA_MSG),
  });

  const modelCols = costShareCols('Model', 'name');
  const totalModelCost = by_model.reduce((sum, m) => sum + (m.total_cost ?? 0), 0);
  sections.push({
    title: 'Cost by Model',
    columns: modelCols,
    rows:
      by_model.length > 0
        ? costShareRows(by_model, m => m.display_name || m.model_name, totalModelCost)
        : emptyRow(modelCols, NO_DATA_MSG),
  });

  const agentCols = costShareCols('Agent / Pipeline', 'name');
  const totalAgentCost = by_agent.reduce((sum, a) => sum + (a.total_cost ?? 0), 0);
  sections.push({
    title: 'Cost by Agent & Pipeline',
    columns: agentCols,
    rows:
      by_agent.length > 0
        ? costShareRows(by_agent, a => a.entity_name, totalAgentCost)
        : emptyRow(agentCols, NO_DATA_MSG),
  });

  return {
    sheetName: 'Costs',
    metadata: buildMetadata('Costs', meta),
    sections,
  };
};

const buildTokenRows = (items, nameMapper, totalProjectTokens) =>
  [...items]
    .map(item => {
      const stats = tokenStats(item);
      return {
        name: nameMapper(item),
        total_tokens: stats.total,
        input_tokens: stats.input,
        output_tokens: stats.output,
        cache_read_tokens: stats.cacheRead,
        cache_write_tokens: stats.cacheWrite,
        share: totalProjectTokens > 0 ? Number(((stats.total / totalProjectTokens) * 100).toFixed(2)) : 0,
      };
    })
    .sort((a, b) => b.total_tokens - a.total_tokens);

const buildTokensSheet = (data, meta) => {
  const { kpis = {}, by_model = [], by_agent = [], by_user = [], daily = [] } = data || {};
  const totalProjectTokens = Number(kpis.total_tokens ?? 0) || 0;

  const sections = [];

  sections.push({
    title: 'Token Summary',
    columns: [
      { header: 'Metric', key: 'metric' },
      { header: 'Value', key: 'value', numFmt: ExcelFormats.integer },
    ],
    rows: [
      { metric: 'Total Tokens', value: Number(kpis.total_tokens ?? 0) || 0 },
      { metric: 'Input Tokens', value: Number(kpis.total_input_tokens ?? 0) || 0 },
      { metric: 'Output Tokens', value: Number(kpis.total_output_tokens ?? 0) || 0 },
      { metric: 'Cache Read Tokens', value: Number(kpis.total_cache_read_tokens ?? 0) || 0 },
      { metric: 'Cache Write Tokens', value: Number(kpis.total_cache_creation_tokens ?? 0) || 0 },
    ],
  });

  const dailyCols = [
    { header: 'Date', key: 'date' },
    { header: 'Total Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Input Tokens', key: 'input_tokens', numFmt: ExcelFormats.integer },
    { header: 'Output Tokens', key: 'output_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Read Tokens', key: 'cache_read_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Write Tokens', key: 'cache_write_tokens', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Daily Token Usage',
    columns: dailyCols,
    rows: daily.map(d => {
      const stats = tokenStats(d);
      return {
        date: d.date,
        total_tokens: stats.total,
        input_tokens: stats.input,
        output_tokens: stats.output,
        cache_read_tokens: stats.cacheRead,
        cache_write_tokens: stats.cacheWrite,
      };
    }),
  });

  const tokenCols = (nameHeader, nameKey = 'name') => [
    { header: nameHeader, key: nameKey },
    { header: 'Total Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Input Tokens', key: 'input_tokens', numFmt: ExcelFormats.integer },
    { header: 'Output Tokens', key: 'output_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Read Tokens', key: 'cache_read_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Write Tokens', key: 'cache_write_tokens', numFmt: ExcelFormats.integer },
    { header: 'Share', key: 'share', numFmt: ExcelFormats.percent },
  ];

  sections.push({
    title: 'Token Usage by User',
    columns: tokenCols('User'),
    rows: buildTokenRows(
      by_user,
      user =>
        user.user_display_name || user.user_email || `User ${user.user_id ?? ''}`.trim() || 'Unknown user',
      totalProjectTokens,
    ),
  });

  sections.push({
    title: 'Token Usage by Model',
    columns: tokenCols('Model'),
    rows: buildTokenRows(
      by_model,
      model => model.display_name || model.model_name || 'Unknown model',
      totalProjectTokens,
    ),
  });

  sections.push({
    title: 'Token Usage by Agent & Pipeline',
    columns: tokenCols('Agent / Pipeline'),
    rows: buildTokenRows(
      by_agent,
      agent => agent.entity_name || agent.display_name || 'Unattributed',
      totalProjectTokens,
    ),
  });

  return {
    sheetName: 'Tokens',
    metadata: buildMetadata('Tokens', meta),
    sections,
  };
};

const buildAgentsSheet = (data, meta) => {
  const { rows = [], chat_daily = [] } = data || {};

  const sections = [];

  const topAgentCols = [
    { header: 'Agent / Pipeline', key: 'name' },
    { header: 'Runs', key: 'runs', numFmt: ExcelFormats.integer },
  ];
  const topAgents = rows.slice(0, 20).map(a => ({
    name: a.entity_name || `Agent #${a.entity_id}`,
    runs: a.events ?? 0,
  }));
  sections.push({
    title: 'Most Active Agents & Pipelines',
    columns: topAgentCols,
    rows: topAgents.length > 0 ? topAgents : emptyRow(topAgentCols, NO_DATA_MSG),
  });

  const dailyCols = [
    { header: 'Date', key: 'date' },
    { header: 'Chat Messages', key: 'messages', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Chat Messages',
    columns: dailyCols,
    rows: chat_daily.length > 0 ? chat_daily : emptyRow(dailyCols, NO_DATA_MSG),
  });

  const agentCols = [
    { header: 'Agent / Pipeline', key: 'entity_name' },
    { header: 'Runs', key: 'events', numFmt: ExcelFormats.integer },
    { header: 'Users', key: 'users', numFmt: ExcelFormats.integer },
    { header: 'Total Cost (USD)', key: 'llm_cost', numFmt: ExcelFormats.currency },
    { header: 'Input Token Cost (USD)', key: 'input_cost', numFmt: ExcelFormats.currency },
    { header: 'Output Token Cost (USD)', key: 'output_cost', numFmt: ExcelFormats.currency },
    { header: 'Total Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Input Tokens', key: 'input_tokens', numFmt: ExcelFormats.integer },
    { header: 'Output Tokens', key: 'output_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Read Tokens', key: 'cache_read_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Write Tokens', key: 'cache_creation_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Read Cost (USD)', key: 'cache_read_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Write Cost (USD)', key: 'cache_creation_cost', numFmt: ExcelFormats.currency },
    { header: 'Avg Latency (ms)', key: 'avg_duration_ms', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Agent & Pipeline Activity',
    columns: agentCols,
    rows: rows.length > 0 ? rows : emptyRow(agentCols, NO_DATA_MSG),
  });

  return {
    sheetName: 'Agents & Pipelines',
    metadata: buildMetadata('Agents & Pipelines', meta),
    sections,
  };
};

const buildToolsSheet = (data, meta) => {
  const { rows = [] } = data || {};

  const topToolCols = [
    { header: 'Tool', key: 'tool_name' },
    { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
  ];
  const topTools = rows.slice(0, 20).map(t => ({
    tool_name: t.tool_name,
    calls: t.calls ?? 0,
  }));

  const toolCols = [
    { header: 'Tool', key: 'tool_name' },
    { header: 'Calls', key: 'calls', numFmt: ExcelFormats.integer },
    { header: 'Users', key: 'users', numFmt: ExcelFormats.integer },
    { header: 'Avg Latency (ms)', key: 'avg_duration_ms', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
  ];

  return {
    sheetName: 'Tools',
    metadata: buildMetadata('Tools', meta),
    sections: [
      {
        title: 'Most Popular Tools',
        columns: topToolCols,
        rows: topTools.length > 0 ? topTools : emptyRow(topToolCols, NO_DATA_MSG),
      },
      {
        title: 'Tool Details',
        columns: toolCols,
        rows: rows.length > 0 ? rows : emptyRow(toolCols, NO_DATA_MSG),
      },
    ],
  };
};

const buildUsersSheet = (data, meta) => {
  const { rows = [] } = data || {};

  const userCols = [
    { header: 'User', key: 'user_email' },
    { header: 'Active Days', key: 'active_days', numFmt: ExcelFormats.integer },
    { header: 'LLM Calls', key: 'llm_events', numFmt: ExcelFormats.integer },
    { header: 'Tool Calls', key: 'tool_events', numFmt: ExcelFormats.integer },
    { header: 'Agent & Pipeline Runs', key: 'agent_events', numFmt: ExcelFormats.integer },
    { header: 'Chat Messages', key: 'chat_events', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
    { header: 'Total Tokens', key: 'total_tokens', numFmt: ExcelFormats.integer },
    { header: 'Input Tokens', key: 'input_tokens', numFmt: ExcelFormats.integer },
    { header: 'Output Tokens', key: 'output_tokens', numFmt: ExcelFormats.integer },
    { header: 'Total Cost (USD)', key: 'llm_cost', numFmt: ExcelFormats.currency },
    { header: 'Input Token Cost (USD)', key: 'input_cost', numFmt: ExcelFormats.currency },
    { header: 'Output Token Cost (USD)', key: 'output_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Read Tokens', key: 'cache_read_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Write Tokens', key: 'cache_creation_tokens', numFmt: ExcelFormats.integer },
    { header: 'Cache Read Cost (USD)', key: 'cache_read_cost', numFmt: ExcelFormats.currency },
    { header: 'Cache Write Cost (USD)', key: 'cache_creation_cost', numFmt: ExcelFormats.currency },
  ];

  return {
    sheetName: 'Users',
    metadata: buildMetadata('Users', meta),
    sections: [
      {
        title: 'User Activity',
        columns: userCols,
        rows:
          rows.length > 0
            ? rows.map(u => ({ ...u, user_email: u.user_email || `User ${u.user_id}` }))
            : emptyRow(userCols, NO_DATA_MSG),
      },
    ],
  };
};

const buildHealthSheet = (overviewData, meta) => {
  const { health = [], daily_activity = [] } = overviewData || {};

  const sections = [];

  const trendCols = [
    { header: 'Date', key: 'date' },
    { header: 'Total Requests', key: 'events', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
    { header: 'Error Rate (%)', key: 'errorRate', numFmt: ExcelFormats.percent },
  ];
  const trendRows = daily_activity.map(d => ({
    date: d.date,
    events: d.events ?? 0,
    errors: d.errors ?? 0,
    errorRate: d.events > 0 ? Number(((d.errors / d.events) * 100).toFixed(2)) : 0,
  }));
  sections.push({
    title: 'Requests vs Errors',
    columns: trendCols,
    rows: trendRows.length > 0 ? trendRows : emptyRow(trendCols, NO_DATA_MSG),
  });

  const healthCols = [
    { header: 'Event Type', key: 'event_type' },
    { header: 'Total', key: 'total', numFmt: ExcelFormats.integer },
    { header: 'Errors', key: 'errors', numFmt: ExcelFormats.integer },
    { header: 'Error Rate (%)', key: 'error_rate', numFmt: ExcelFormats.percent },
    { header: 'Avg Latency (ms)', key: 'avg_duration_ms', numFmt: ExcelFormats.integer },
  ];
  sections.push({
    title: 'Health by Event Type',
    columns: healthCols,
    rows: health.length > 0 ? health : emptyRow(healthCols, NO_DATA_MSG),
  });

  return {
    sheetName: 'Health',
    metadata: buildMetadata('Health', meta),
    sections,
  };
};

export const analyticsExportFileName = ({ projectName, dateFrom, dateTo }) => {
  const from = fmtISODate(dateFrom);
  const to = fmtISODate(dateTo);

  return `${sanitizeFileNamePart(projectName)}_${from}-${to}.xlsx`;
};

export const fetchAllAnalyticsData = async (dispatch, endpoints, { projectId, dateFrom, dateTo }) => {
  const [overviewResult, costsResult, agentsResult, toolsResult, usersResult] = await Promise.all([
    dispatch(endpoints.projectAnalytics.initiate({ projectId, dateFrom, dateTo })),
    dispatch(endpoints.analyticsCosts.initiate({ projectId, dateFrom, dateTo })),
    dispatch(
      endpoints.analyticsAgents.initiate({
        projectId,
        dateFrom,
        dateTo,
        limit: EXPORT_LIMIT,
        offset: 0,
        search: '',
      }),
    ),
    dispatch(
      endpoints.analyticsTools.initiate({
        projectId,
        dateFrom,
        dateTo,
        limit: EXPORT_LIMIT,
        offset: 0,
        search: '',
      }),
    ),
    dispatch(
      endpoints.analyticsUsers.initiate({
        projectId,
        dateFrom,
        dateTo,
        limit: EXPORT_LIMIT,
        offset: 0,
        search: '',
      }),
    ),
  ]);

  return {
    overview: overviewResult.data,
    costs: costsResult.data,
    agents: agentsResult.data,
    tools: toolsResult.data,
    users: usersResult.data,
  };
};

export const buildAnalyticsSheets = ({ overview, costs, agents, tools, users, meta, isPersonalProject }) => [
  buildOverviewSheet(overview, meta, isPersonalProject),
  buildCostsSheet(costs, meta),
  buildTokensSheet(costs, meta),
  buildAgentsSheet(agents, meta),
  buildToolsSheet(tools, meta),
  buildUsersSheet(users, meta),
  buildHealthSheet(overview, meta),
];
