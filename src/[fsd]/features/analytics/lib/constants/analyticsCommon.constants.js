export const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

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

export const GUIDE_SECTIONS = [
  {
    title: 'Overview Tab',
    metrics: [
      {
        name: 'TEAM',
        description:
          'Shown as "X of Y" where X is the number of unique users active during the selected time period, and Y is the total number of users ever seen in this project. This helps understand what portion of your team is currently active.',
        calculation:
          'X = Count of distinct user IDs with at least one event in the date range. Y = Count of distinct user IDs in the project (all time, no date filter).',
        source: 'All event types (api, socketio, llm, tool, agent, rpc).',
      },
      {
        name: 'AI ACTIVE',
        description:
          'Number of users who actually used AI capabilities - meaning they triggered at least one LLM call, tool execution, or application interaction. Users who only browsed the interface without using AI features are not counted here.',
        calculation:
          'Count of distinct user IDs where event_type in ("llm", "tool") or entity_type = "application".',
        source: 'Events with LLM/tool event types or application entity interactions.',
      },
      {
        name: 'Adoption Rate',
        description:
          'The percentage shown next to AI ACTIVE (e.g. "84.2% adoption"). Represents the ratio of AI-active users to total team members. A higher percentage means more of your team is actively leveraging AI features.',
        calculation: 'AI ACTIVE / TEAM x 100%.',
        source: 'Derived from TEAM and AI ACTIVE metrics.',
      },
      {
        name: 'LLM CALLS',
        description:
          'Total number of Large Language Model invocations. Every time the system sends a prompt to an AI model (Claude, GPT, Gemini, etc.) and gets a response, it counts as one LLM call.',
        calculation: 'Count of events where event_type = "llm".',
        source: 'Captured when the SDK calls ChatAnthropic, ChatOpenAI, ChatBedrock, etc.',
      },
      {
        name: 'TOOL RUNS',
        description:
          'Total number of tool executions. When an AI agent uses a tool (e.g. web search, Slack message, Jira query, database lookup), each execution is counted as one tool run.',
        calculation: 'Count of events where event_type = "tool".',
        source: 'Captured when the SDK executes any tool via LangChain tool calling.',
      },
      {
        name: 'CHAT MSG',
        description:
          'Total number of user messages sent in the chat interface. Each time a user sends a message (chat predict request), it counts as one chat message.',
        calculation: 'Count of events where action = "SIO chat_predict".',
        source: 'Captured from the WebSocket chat_predict event when a user sends a message.',
      },
      {
        name: 'AGENT RUNS',
        description:
          'Total number of interactions with agents and pipelines. Each time a user triggers an agent predict or pipeline execution, it counts as one agent run.',
        calculation: 'Count of events where entity_type = "application".',
        source: 'Captured from RPC calls that include an application_id (agent or pipeline predictions).',
      },
    ],
  },
  {
    title: 'Overview Charts',
    metrics: [
      {
        name: 'Daily Activity',
        description:
          'Shows the trend of platform usage over time with two lines: total events per day (blue) and unique users per day (green). Helps identify usage patterns, peak days, and adoption trends.',
      },
      {
        name: 'Event Type Breakdown',
        description:
          'Horizontal bar chart showing the distribution of events by type. Helps understand what the platform is primarily used for - API interactions, chat conversations, LLM calls, tool executions, etc.',
      },
      {
        name: 'Model Usage Breakdown',
        description:
          'Table showing which AI models are used most frequently. Columns include the model name, number of calls, number of distinct users, and the share percentage relative to total LLM calls.',
      },
    ],
  },
  {
    title: 'Agents Tab',
    metrics: [
      {
        name: 'Chat Messages Chart',
        description:
          'Daily line chart showing the number of user messages (SIO chat_predict) per day. Helps track chat engagement trends over time.',
        calculation: 'Count of events where action = "SIO chat_predict", grouped by day.',
      },
      {
        name: 'Most Active Agents',
        description:
          'Bar chart showing the top 20 agents ranked by number of events. Helps identify which agents are used most frequently.',
      },
      {
        name: 'Agent Activity Table',
        description:
          'Server-side paginated table listing all agents (applications). Shows events, users, avg latency, and errors. Click any agent row to drill down.',
        calculation: 'Aggregated from events where entity_type = "application", grouped by entity_id.',
      },
      {
        name: 'Agent Detail View',
        description:
          'Drill-down view for a single agent showing KPIs, daily usage chart, which users interacted with it, and which tools it used (resolved via trace_id correlation).',
      },
    ],
  },
  {
    title: 'Tools Tab',
    metrics: [
      {
        name: 'Most Popular Tools',
        description:
          'Bar chart showing the top 20 tools ranked by number of calls. Tool names on X axis, call count on Y axis.',
      },
      {
        name: 'Tool Details Table',
        description:
          'Server-side paginated table with search. Shows each tool with total calls, distinct users, avg latency, and errors. Click any tool row to drill down.',
        calculation: 'Aggregated from events where event_type = "tool", grouped by tool_name.',
      },
      {
        name: 'Tool Detail View',
        description:
          'Drill-down view for a single tool showing KPIs (calls, users, latency, error rate), daily usage chart, which users called it, and which agents used it (resolved via trace_id correlation).',
      },
    ],
  },
  {
    title: 'Users Tab',
    metrics: [
      {
        name: 'User Activity Table',
        description:
          'Server-side paginated table listing all users in the project. For each user, shows: total events, active days, and per-type breakdown (LLM, Tool, Agent, Chat Msg, Errors). Click on any user row to drill down.',
        calculation: 'Each row is aggregated from all events for that user_id within the date range.',
      },
      {
        name: 'User Detail View',
        description:
          'Drill-down view for a single user showing KPIs, daily activity chart (by event type), models used, tools called, and agents interacted with. Lists are scrollable for users with many items.',
      },
      {
        name: 'Active Days',
        description:
          'Number of distinct calendar days on which the user had at least one event. Higher numbers indicate consistent, regular usage.',
        calculation: 'Count of distinct dates (timestamp cast to date) for the user.',
      },
    ],
  },
  {
    title: 'Health Tab',
    metrics: [
      {
        name: 'Requests vs Errors Chart',
        description:
          'Dual-line area chart showing total requests (blue) and errors (red) per day. The error line at the bottom helps visualize the error volume in context of total traffic. Spikes in the red line indicate potential issues.',
      },
      {
        name: 'Health by Event Type Table',
        description:
          'Breaks down reliability metrics per event type. For each type shows: total events, error count, error rate percentage, and average latency. Use this to identify which parts of the system are experiencing issues.',
      },
      {
        name: 'Error Rate',
        description:
          'Percentage of events that resulted in an error, calculated per event type. An error is flagged when the system detects a failed response (HTTP 5xx, exception, timeout, etc.).',
        calculation: 'Errors / Total x 100% for each event type.',
      },
      {
        name: 'Avg Latency',
        description:
          'Average time it took to complete an operation, measured in milliseconds or seconds. High latency on LLM calls is expected (model inference), but high latency on API or RPC calls may indicate performance issues.',
        calculation: 'Average of duration_ms across all events of that type.',
      },
    ],
  },
  {
    title: 'General Concepts',
    metrics: [
      {
        name: 'Event Types',
        description:
          'Every action on the platform is recorded as an event with a type:\n- api: HTTP API calls (REST endpoints, UI actions)\n- socketio: WebSocket events (chat, real-time features)\n- llm: AI model calls (Claude, GPT, Gemini, etc.)\n- tool: Tool executions (Slack, Jira, search, etc.)\n- agent: Agent workflow runs\n- rpc: Internal service-to-service calls',
      },
      {
        name: 'Date Range',
        description:
          'All metrics are filtered by the selected date range (From/To pickers at the top). Use the preset buttons (Last 24h, 7d, 30d, 90d) for quick selection. The default is the last 7 days.',
      },
      {
        name: 'Project Scope',
        description:
          'All data shown is specific to the currently selected project. Switch projects using the project selector in the sidebar to view analytics for different teams.',
      },
    ],
  },
];
