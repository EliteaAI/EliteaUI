import { AnalyticsTabConstants } from '@/[fsd]/shared/lib/constants';

const { ANALYTICS_TAB_IDS } = AnalyticsTabConstants;

export const TOP_LIST_SIZE = 10;

export const LS_ANALYTICS_COSTS_INFO_DISMISSED = 'analytics:costs-info-popover:dismissed';

export const COSTS_ESTIMATE_DISCLAIMER =
  'Costs are estimated from a local model-price table; actual provider invoices may differ.';

export const MODEL_CHART_SIZE = 15;

export const ENTITY_DETAIL_TAB = 'all';

export const ENTITY_KIND = {
  agent: 'agent',
  pipeline: 'pipeline',
};

export const ENTITY_KIND_LABELS = {
  agent: 'Agent',
  pipeline: 'Pipeline',
};

// usage_event.trigger_source of every run; `manual` is the legacy value of runs recorded before sources existed
export const TRIGGER_SOURCE_LABELS = {
  chat: 'Chat',
  api: 'API',
  mcp: 'MCP',
  webhook: 'Webhook',
  scheduled: 'Scheduled',
  schedule_manual: 'Schedule run now',
  index: 'Index runs',
  manual: 'Manual (legacy)',
};

// Embedding calls are metered as llm events, so every token, call and cost figure covers both (#6878)
const MODEL_REQUESTS = 'LLM and embedding model requests';
const EMBEDDING_OUTPUT_NOTE = 'Embedding model requests produce no output tokens.';
const SKILL_AGENT_CHAT_USES =
  'Times a skill was used inside an agent or chat during the selected date range, because it was mentioned in a message or the model loaded it. Counted once per skill per reply for each way it was used. Uses add no tokens or cost here; that cost is on the agent or chat.';
const SKILL_AGENTS_USING =
  'Different Agents that used this skill. An Agent that runs inside a Pipeline counts as that Pipeline. Chats with only a model are not counted. One agent using it 10 times counts as 1.';
const SKILL_USERS = 'Distinct users who ran this skill or used it in an agent or chat.';

export const SKILL_SOURCE_LABELS = {
  load_skill: 'Loaded by the agent',
  mention: 'Mentioned in a message',
};

export const VERSION_UNKNOWN_LABEL = 'Unknown version';

export const AGENT_MODEL_UNKNOWN_LABEL = 'Unknown model';

export const AGENT_DETAIL_EMPTY_MESSAGE =
  'No data is available for this Agent or Pipeline in the selected date range.';

export const ANALYTICS_SEARCH_PARAMS = {
  tab: 'tab',
  range: 'range',
  from: 'from',
  to: 'to',
  agentId: 'agent_id',
  skillId: 'skill_id',
  skillProjectId: 'skill_project_id',
  chatId: 'chat_id',
};

export const CHAT_DETAIL_EMPTY_MESSAGE = 'No data is available for this chat in the selected date range.';

export const CHAT_PARTICIPANT_TYPE_LABELS = {
  model: 'Direct model',
  agent: 'Agents',
  pipeline: 'Pipelines',
  skill: 'Skills',
};

export const TOOLTIP_TEXTS = {
  overview: {
    TEAM: 'Shows active project members out of all project members. Active members performed at least one tracked action during the selected date range. Runs from Webhook, Scheduled, Schedule run now, and Index runs are not counted as member activity.',
    AI_ACTIVE:
      'Number of members who used AI features during the selected date range, including LLM calls, tool runs, or Agent and Pipeline runs. Automated runs (Webhook, Scheduled, Schedule run now, Index runs) do not make a member AI active.',
    LLM_CALLS: `Total ${MODEL_REQUESTS} during the selected date range.`,
    TOOL_RUNS:
      'Total tool executions during the selected date range. This includes tools, sub-agents, and sub-pipelines invoked by Agents or Pipelines.',
    CHAT_MSG:
      'Total user messages sent through Chat, Agent, and Pipeline chat interfaces during the selected date range.',
    AGENT_PIPELINE_RUNS:
      'Total Agent and Pipeline runs. Each initial run and every continuation after a static or dynamic interrupt is counted as a separate run.',
    SKILL_RUNS:
      'Total skill runs during the selected date range: a skill run on its own or as a chat participant. Each reply the skill generates is one run. A skill used inside an Agent or chat is part of that run and is not counted here.',
    TOKENS: `Total input and output tokens used by ${MODEL_REQUESTS} during the selected date range.`,
    COST: `Estimated USD cost of ${MODEL_REQUESTS} during the selected date range. Costs are calculated from the platform's local model-price table and may differ from provider invoices.`,
    LEADERBOARD:
      'Ranks users by combined LLM calls, tool runs, and Agent & Pipeline runs during the selected date range. Only manually started activity (Chat, API, or MCP) is ranked. Webhook, Scheduled, Schedule run now, and Index runs are not ranked.',
    LEADERBOARD_SKILL_RUNS:
      'Model and tool calls made by skill runs count toward the score; the Skill figure shows how many skill runs they came from.',
    AUTOMATED_ACTIVITY:
      'Runs started automatically by Webhook, Scheduled, Schedule run now, or Index runs during the selected date range. They are included in project totals and cost, but are not counted as activity of the user who configured them.',
    MODEL_USAGE:
      "Shows LLM usage by model, including calls/runs, unique users for Team Projects, and each model's share of total LLM usage.",
    MODEL_USAGE_PRIVATE:
      "Shows LLM usage by model, including calls/runs and each model's share of total LLM usage.",
    DAILY_ACTIVITY:
      'Shows daily AI usage for the selected period, including LLM Calls, Tool Runs, and Agent & Pipeline Runs. For Team Projects, it also shows the number of distinct active users per day, excluding automated runs.',
    DAILY_ACTIVITY_PRIVATE:
      'Shows daily AI usage for the selected period, including LLM Calls, Tool Runs, and Agent & Pipeline Runs.',
    DAILY_ACTIVITY_SKILL_RUNS: 'Skill Runs shows skills run on their own or as a chat participant.',
  },
  costs: {
    TOTAL_COST: `Estimated total USD cost of ${MODEL_REQUESTS}. It includes input-token, output-token, cache read, and cache write costs.`,
    INPUT_TOKEN_COST:
      'Estimated USD cost of tokens sent to AI models, including prompts, instructions, and chat history.',
    OUTPUT_TOKEN_COST: 'Estimated USD cost of tokens generated by AI models in responses.',
    CACHE_READ_COST: 'Estimated USD cost of tokens served from the provider prompt cache.',
    CACHE_WRITE_COST: 'Estimated USD cost of tokens written to the provider prompt cache.',
    EVALUATION_COST:
      'Estimated USD cost of evaluation runs, including the evaluated Agent or Pipeline calls and judge calls. It is already included in Total Cost.',
    BY_AGENT_PIPELINE:
      'Shows estimated LLM cost attributed to Agents and Pipelines during the selected date range. Evaluation runs are excluded and shown in Cost by Evaluation.',
    BY_SKILL:
      'Shows estimated LLM cost of skill runs during the selected date range. Skills used inside agents or chats add no cost of their own; that cost is counted on the agent or chat.',
    BY_EVALUATION:
      'Shows estimated LLM cost of evaluation runs by the evaluated Agent or Pipeline version, including judge calls. Share is relative to the total evaluation cost.',
    TOTAL_TOKENS: `Combined number of input and output tokens used by ${MODEL_REQUESTS} during the selected date range.`,
    INPUT_TOKENS:
      'Tokens sent to the model, including prompts, instructions, chat history, and other request content.',
    OUTPUT_TOKENS: `Tokens generated by the model in responses. ${EMBEDDING_OUTPUT_NOTE}`,
  },
  tokens: {
    TOTAL_TOKENS: `Combined number of input, output, cache read, and cache write tokens used by ${MODEL_REQUESTS} during the selected date range.`,
    INPUT_TOKENS:
      'Tokens sent to AI models, including prompts, instructions, chat history, and other request content.',
    OUTPUT_TOKENS: `Tokens generated by AI models in responses during the selected date range. ${EMBEDDING_OUTPUT_NOTE}`,
    CACHE_READ_TOKENS: 'Tokens served from the provider prompt cache during the selected date range.',
    CACHE_WRITE_TOKENS: 'Tokens written to the provider prompt cache during the selected date range.',
    DAILY_TOKEN_USAGE: `Shows daily total, input, and output token usage for ${MODEL_REQUESTS} in the selected date range.`,
    BY_USER: 'Shows token usage attributed to each project user during the selected date range.',
    BY_MODEL: 'Shows token usage for each AI model used in the selected date range.',
    BY_AGENT_PIPELINE: 'Shows token usage attributed to Agents and Pipelines during the selected date range.',
    BY_SKILL:
      'Shows token usage of skill runs during the selected date range. Skills used inside agents or chats add no tokens of their own; those tokens are counted on the agent or chat.',
  },
  agents: {
    CHAT_MESSAGES:
      'Shows the number of user messages sent each day through Chat, Agent, and Pipeline chat interfaces.',
    MOST_ACTIVE:
      'Shows the Agents and Pipelines with the most runs during the selected date range. Interrupt continuations are counted as additional runs.',
    ACTIVITY_COUNT: 'Number of Agents and Pipelines with recorded activity during the selected date range.',
  },
  chats: {
    ACTIVE_CHATS: 'Number of chats with at least one AI response during the selected date range.',
    TOTAL_COST:
      'Estimated USD cost of all model calls made in chats, including input, output, cache read and cache write costs.',
    TOTAL_TOKENS: 'Combined input, output, cache read and cache write tokens used in chats.',
    RESPONSES:
      'Number of AI replies generated in chats. Regenerating or continuing a reply counts as an additional response.',
    CHAT_USERS:
      'Distinct project members who received at least one AI response in a chat. Not shown for Private Projects.',
    SHARE_OF_PROJECT_COST:
      'Total chat cost as a percentage of the project total estimated cost in the same date range.',
    ERRORS: 'Responses in which at least one model or tool call failed.',
    TOP_CHATS:
      'The chats with the highest cost (or tokens / responses) in the selected date range. Only the top 10 are loaded when the tab opens.',
    COST_BY_PARTICIPANT:
      'Splits chat usage into Direct model, Agents, Pipelines and Skills. Usage of an Agent or Pipeline inside a chat is also included on the Agents & Pipelines tab — the two tabs overlap and must not be added together.',
    DAILY_USAGE: 'Daily cost and tokens of chat usage in the selected date range.',
    ACTIVITY_COUNT: 'All chats with at least one AI response in the selected date range.',
  },
  chatDetail: {
    RESPONSES: 'Total AI replies generated in this chat in the selected date range.',
    UNIQUE_USERS: 'Distinct users who received at least one AI response in this chat.',
    TOTAL_COST: 'Estimated USD cost of all model calls in this chat.',
    ALL_TIME_COST:
      "Running total cost since this chat started tracking usage — the same value as Approx. cost in the chat's Context management panel. All other figures cover only the selected date range.",
    ERRORS: 'Responses in which at least one model or tool call failed.',
  },
  skills: {
    RUNS: 'Times a skill answered by itself during the selected date range: from its Run panel, as a chat participant, or through the API or MCP. Each reply is one run, with its own tokens and cost.',
    SKILLS_USED:
      'Number of different skills that were run or used in an agent or chat during the selected date range. Each skill counts once, however many times it was used.',
    IN_AGENT_USES: SKILL_AGENT_CHAT_USES,
    AGENTS_USING: SKILL_AGENTS_USING,
    USERS: SKILL_USERS,
    COST: 'Total estimated cost of all skill runs during the selected date range. Each model call is priced by the model it used. Uses inside agents or chats are not included; that cost is on the agent or chat.',
    MOST_USED: 'Skills with the most runs and agent & chat uses during the selected date range.',
    ACTIVITY_COUNT:
      'Skills in the table below that were run or used during the selected date range. Follows the search.',
  },
  skillDetail: {
    RUNS: 'Runs of this skill on its own, as a chat participant, or through the API or MCP during the selected date range.',
    IN_AGENT_USES:
      'Times this skill was used inside an agent or chat during the selected date range, mentioned in a message or loaded by the model.',
    UNIQUE_USERS: SKILL_USERS,
    AGENTS_USING: SKILL_AGENTS_USING,
    TOTAL_COST: 'Estimated USD cost of this skill’s runs. Agent & chat uses add no cost of their own.',
    TOTAL_TOKENS: 'Tokens used by this skill’s runs. Agent & chat uses add no tokens of their own.',
    AVG_LATENCY: 'Average duration of the model calls made by this skill’s runs.',
    ERRORS: 'Number of this skill’s runs that ended with a detected error.',
    AVG_BODY_TOKENS:
      'Estimated average size, in tokens, of the skill instructions added to the prompt on each use.',
    VERSIONS: 'Runs and uses per skill version. Unknown version means the version was not recorded.',
    MODELS: 'Model calls made by this skill’s runs, per model.',
    USERS: SKILL_USERS,
    TRIGGERS:
      'How the runs and uses started: Chat, API, MCP, Webhook, Scheduled, Schedule run now, or Index runs.',
    AGENTS:
      'Agents that used this skill, by number of uses. An Agent that runs inside a Pipeline is listed as that Pipeline.',
    SOURCES: 'How this skill was used: loaded on demand (load_skill) or mentioned in the message.',
    RECENT_RUNS: 'The latest runs of this skill. Open a run to see its own analytics.',
  },
  agentDetail: {
    TOTAL_RUNS:
      'Total runs for this Agent or Pipeline during the selected date range. Each interrupt continuation is counted as an additional run.',
    UNIQUE_USERS: 'Number of distinct users who ran this Agent or Pipeline during the selected date range.',
    TOTAL_COST:
      'Estimated total USD cost attributed to this Agent or Pipeline, including input-token and output-token costs.',
    INPUT_TOKEN_COST: 'Estimated cost of tokens sent to AI models by this Agent or Pipeline.',
    OUTPUT_TOKEN_COST: 'Estimated cost of tokens generated by AI models for this Agent or Pipeline.',
    TOTAL_TOKENS: 'Combined input and output tokens used by this Agent or Pipeline.',
    INPUT_TOKENS: 'Tokens sent to AI models by this Agent or Pipeline.',
    OUTPUT_TOKENS: `Tokens generated by AI models for this Agent or Pipeline. ${EMBEDDING_OUTPUT_NOTE}`,
    CACHE_READ_TOKENS: 'Tokens served from the provider prompt cache for this Agent or Pipeline.',
    CACHE_WRITE_TOKENS: 'Tokens written to the provider prompt cache for this Agent or Pipeline.',
    EVALUATION_TOKENS:
      'Exact number of tokens spent on evaluating this Agent or Pipeline (batch runs and judge calls) during the selected date range. Not included in the other token and cost figures on this page.',
    CACHE_READ_COST:
      'Estimated USD cost of tokens served from the provider prompt cache for this Agent or Pipeline.',
    CACHE_WRITE_COST:
      'Estimated USD cost of tokens written to the provider prompt cache for this Agent or Pipeline.',
    AVG_LATENCY: 'Average time required to complete a run for this Agent or Pipeline.',
    ERRORS: 'Number of runs that ended with a detected error during the selected date range.',
    USERS_SECTION: 'Number of distinct users who ran this Agent or Pipeline during the selected date range.',
    TOOLS_SECTION:
      'Number of distinct tools, including nested sub-agents and sub-pipelines, used by this Agent or Pipeline during the selected date range.',
    SKILLS_SECTION:
      "Skills used in this Agent's runs, or by the Agents inside this Pipeline, during the selected date range, loaded by the model or mentioned in a message. Counted once per skill per run for each way it was used.",
    VERSIONS_SECTION:
      'Shows runs, token usage, and estimated cost by the Agent or Pipeline version used during execution.',
    MODELS_SECTION:
      'Shows models used during execution, including distinct runs, LLM calls, token usage, and estimated cost. A run using multiple models is counted in each applicable model row. Only LLM calls are included, so tool calls add no tokens or cost here.',
    TRIGGERS_SECTION:
      'Shows how runs were initiated (Chat, API, MCP, Webhook, Scheduled, Schedule run now, or Index runs), with their token usage and estimated cost. Runs recorded before sources existed appear as Manual (legacy).',
    RECENT_RUNS_SECTION:
      'Shows individual runs during the selected period. Select a start time to open that run’s Analytics page.',
  },
  userDetail: {
    ACTIVE_DAYS:
      'Number of calendar days on which this user had at least one tracked activity during the selected date range.',
    LLM_CALLS: `Number of ${MODEL_REQUESTS} this user sent during the selected date range.`,
    TOOL_CALLS:
      'Number of tool runs triggered by this user, including sub-agents and sub-pipelines invoked by Agents or Pipelines.',
    AGENT_PIPELINE_RUNS:
      'Number of Agent and Pipeline runs initiated by this user. Each interrupt continuation is counted as an additional run.',
    CHAT_MSG: 'Number of messages this user sent through Chat, Agent, and Pipeline chat interfaces.',
    ERRORS: "Number of this user's tracked requests or runs that ended with a detected error.",
    TOTAL_TOKENS: `Combined input and output tokens used by this user's ${MODEL_REQUESTS}.`,
    INPUT_TOKENS: "Tokens sent to AI models by this user's requests.",
    OUTPUT_TOKENS: `Tokens generated by AI models in response to this user's requests. ${EMBEDDING_OUTPUT_NOTE}`,
    CACHE_READ_TOKENS: "Tokens served from the provider prompt cache for this user's requests.",
    CACHE_WRITE_TOKENS: "Tokens written to the provider prompt cache for this user's requests.",
    CACHE_READ_COST:
      "Estimated USD cost of tokens served from the provider prompt cache for this user's requests.",
    CACHE_WRITE_COST:
      "Estimated USD cost of tokens written to the provider prompt cache for this user's requests.",
    TOTAL_COST: `Estimated total USD cost of this user's ${MODEL_REQUESTS}, including input-token and output-token costs.`,
    INPUT_TOKEN_COST: "Estimated cost of tokens sent to AI models by this user's requests.",
    OUTPUT_TOKEN_COST: "Estimated cost of tokens generated in response to this user's requests.",
    DAILY_ACTIVITY:
      "Shows this user's daily activity by type, including LLM calls, tool calls, Agent & Pipeline runs, chat messages, and errors.",
    TOOLS_SECTION:
      'Number of distinct tools used by this user during the selected date range, including nested sub-agents and sub-pipelines.',
    AGENTS_SECTION:
      'Number of distinct Agents and Pipelines run by this user during the selected date range.',
  },
};

export const GUIDE_SECTIONS = [
  {
    title: 'Overview Tab',
    metrics: [
      {
        name: 'TEAM',
        description:
          'Shown as "X of Y" where X is the number of unique active users, and Y is the total number of users in the project during the selected time period. This helps understand what portion of your team is currently active.',
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
          'Total number of Large Language Model invocations. Every time the system sends a prompt to an AI model (Claude, GPT, Gemini, etc.) and gets a response, it counts as one LLM call. Embedding model requests are counted as LLM calls too.',
        calculation: 'Count of events where event_type = "llm".',
        source: 'Captured when the SDK calls ChatAnthropic, ChatOpenAI, ChatBedrock, etc.',
      },
      {
        name: 'TOOL RUNS',
        description:
          'Total number of tool executions. This includes standard tools, as well as sub-agents and sub-pipelines invoked by an Agent or Pipeline.',
        calculation: 'Count of events where event_type = "tool".',
        source: 'Captured when the SDK executes any tool via LangChain tool calling.',
      },
      {
        name: 'CHAT MSG',
        description:
          'Total number of user messages sent through Chat, Agent, and Pipeline chat interfaces during the selected date range.',
        calculation: 'Count of events where action = "SIO chat_predict".',
        source: 'Captured from the WebSocket chat_predict event when a user sends a message.',
      },
      {
        name: 'AGENT & PIPELINE RUNS',
        description:
          'Total number of Agent and Pipeline runs. An initial execution counts as one run. Each continuation or resumed execution after a static or dynamic interrupt counts as an additional run.',
        calculation: 'Count of events where entity_type = "application".',
        source:
          'Captured from application-related RPC calls that include an application_id, including Agent and Pipeline executions.',
      },
      {
        name: 'COST',
        description: `Estimated USD cost of ${MODEL_REQUESTS} during the selected date range.`,
      },
    ],
  },
  {
    title: 'Overview Charts',
    metrics: [
      {
        name: 'Daily Activity',
        description:
          'Shows daily AI usage for the selected period, including LLM Calls, Tool Runs, and Agent & Pipeline Runs. For Team Projects, it also shows the number of distinct active users per day. Active Users is not shown for Private Projects.',
      },
      {
        name: 'Model Usage Breakdown',
        description:
          'Table showing which AI models are used most frequently. Columns include Model, Calls/Runs, Users (for Team Projects), and Share percentage relative to total LLM usage.',
      },
      {
        name: 'Automated Activity',
        description:
          'Shows runs that were started automatically rather than by a person: Webhook, Scheduled, Schedule run now, and Index runs. Each source lists its runs, LLM calls, tool runs, and estimated cost. These runs are part of the project totals and cost, and are still billed to the user who configured them, but they are excluded from TEAM, AI ACTIVE, active users, Top 5 AI Adopters, and the Users and Activity tabs.',
        calculation:
          'Rows are grouped by trigger source and entity type (Agent or Pipeline). The Entity type column shows a dash when a run has no entity type. Runs recorded before trigger sources existed show as Manual (legacy).',
      },
    ],
  },
  {
    title: 'Costs Tab',
    metrics: [
      {
        name: 'About',
        description: `The Costs tab shows estimated USD costs for ${MODEL_REQUESTS} during the selected date range. Costs are calculated using the platform's local model-price table and may differ from the final invoice issued by the AI provider.`,
      },
      {
        name: 'TOTAL COST',
        description: `Estimated total USD cost of ${MODEL_REQUESTS} during the selected date range.`,
        calculation:
          'Total Cost = Input Token Cost + Output Token Cost. Calculated from input and output token usage and the configured local price for each model.',
      },
      {
        name: 'INPUT TOKEN COST',
        description:
          'Estimated USD cost of tokens sent to AI models, including prompts, instructions, chat history, and other request content.',
        calculation: 'Calculated from input-token usage and the configured input-token price for each model.',
      },
      {
        name: 'OUTPUT TOKEN COST',
        description: 'Estimated USD cost of tokens generated by AI models in responses.',
        calculation:
          'Calculated from output-token usage and the configured output-token price for each model.',
      },
      {
        name: 'TOTAL TOKENS',
        description: `The combined number of input and output tokens used by ${MODEL_REQUESTS}.`,
      },
      {
        name: 'INPUT TOKENS',
        description:
          'Tokens sent to the model as prompts, instructions, chat history, and other request content.',
      },
      {
        name: 'OUTPUT TOKENS',
        description: `Tokens generated by the model in responses. ${EMBEDDING_OUTPUT_NOTE}`,
      },
      {
        name: 'Daily Cost Trend',
        description: 'Shows estimated LLM cost by day for the selected date range.',
      },
      {
        name: 'Cost by User',
        description:
          'Shows estimated LLM cost attributed to each project user. The table includes Total Cost, Input Token Cost, Output Token Cost, and Share.',
      },
      {
        name: 'Cost by Model',
        description:
          'Shows estimated LLM cost by model. The table includes Model, Total Cost, Input Token Cost, Output Token Cost, and Share.',
      },
      {
        name: 'Cost by Agent & Pipeline',
        description:
          'Shows estimated LLM cost attributed to Agents and Pipelines. The table includes Agent/Pipeline, Type, Total Cost, Input Token Cost, Output Token Cost, and Share. Evaluation runs are excluded.',
      },
      {
        name: 'EVALUATION COST',
        description:
          'Estimated USD cost of evaluation runs during the selected date range, including the evaluated Agent or Pipeline calls and judge calls.',
        calculation: 'A subset of Total Cost, not added on top of it.',
      },
      {
        name: 'Cost by Evaluation',
        description:
          'Shows estimated evaluation cost by the evaluated Agent or Pipeline version. The table includes Agent/Pipeline, Type, Version, Runs, Total Cost, Input Token Cost, Output Token Cost, and Share of the total evaluation cost.',
      },
    ],
  },
  {
    title: 'Tokens Tab',
    metrics: [
      {
        name: 'About',
        description: `The Tokens tab shows token usage of ${MODEL_REQUESTS} for the selected project and date range. Token usage is split into total, input, and output tokens and can be reviewed by day, user, model, and Agent or Pipeline.`,
      },
      {
        name: 'TOTAL TOKENS',
        description: `The combined number of input and output tokens used by ${MODEL_REQUESTS} during the selected date range.`,
        calculation: 'Total Tokens = Input Tokens + Output Tokens.',
      },
      {
        name: 'INPUT TOKENS',
        description:
          'Tokens sent to an AI model as part of prompts, system instructions, chat history, and other request content.',
      },
      {
        name: 'OUTPUT TOKENS',
        description: `Tokens generated by an AI model in its response. ${EMBEDDING_OUTPUT_NOTE}`,
      },
      {
        name: 'Daily Token Usage',
        description:
          'Shows total, input, and output token usage for each day in the selected date range. Use this chart to identify token-consumption trends and high-usage days.',
      },
      {
        name: 'Token Usage by User',
        description:
          'Shows total, input, and output token usage attributed to each project user. Share represents the user’s percentage of total project token usage for the selected date range.',
      },
      {
        name: 'Token Usage by Model',
        description:
          'Shows total, input, and output token usage for each AI model. Share represents the model’s percentage of total project token usage for the selected date range.',
      },
      {
        name: 'Token Usage by Agent & Pipeline',
        description:
          'Shows total, input, and output token usage attributed to Agents and Pipelines. Share represents the Agent or Pipeline’s percentage of total project token usage for the selected date range.',
      },
    ],
  },
  {
    title: 'Agents & Pipelines Tab',
    metrics: [
      {
        name: 'Most Active Agents & Pipelines',
        description: 'Shows the top Agents and Pipelines ranked by runs during the selected date range.',
      },
      {
        name: 'Agent & Pipeline Activity',
        description:
          'Lists Agents and Pipelines in the project and shows Runs, Users, Total Cost, Input Token Cost, Output Token Cost, Total Tokens, Input Tokens, Output Tokens, Average Latency, and Errors. For Private Projects, the Users column is not shown because the project has one owner.',
      },
      {
        name: 'Agent & Pipeline Detail View',
        description:
          'Selecting an Agent or Pipeline opens a detail view with its total runs, unique users, total cost, input-token cost, output-token cost, token usage, evaluation tokens, latency, errors, and daily runs. Below them, Versions and Models show runs, tokens, and cost per executed version and per model (a run that used several models counts once in each model row, and only LLM calls are included); Users, Tools, and Skills show who ran it, which tools it called, and which skills it loaded or mentioned; Trigger Sources shows runs, tokens, and cost per initiating trigger, where the source is Chat, API, MCP, Webhook, Scheduled, Schedule run now, or Index runs, and older runs recorded before sources existed show as Manual (legacy). Recent Runs lists every run with its user, version, models, tokens, cost, and Error or Success status, sorted and paged across the whole date range. Select a run start time to open that run’s Analytics page; the browser Back button returns to the same detail view and date range. Runs of a Catalog or deleted Agent or Pipeline have no run page and show their start time as plain text. The Export button downloads all of these tables, including every Recent Run with its run URL.',
      },
    ],
  },
  {
    tabId: ANALYTICS_TAB_IDS.chats,
    title: 'Chats Tab',
    items: [
      {
        title: 'About',
        description:
          'The Chats tab shows token usage and estimated cost of conversations on the Chats page for the selected project and date range. It counts every model and tool call made in a chat, whether the reply came directly from a model, from an Agent or Pipeline added to the chat, or from a skill participant. Agent and Pipeline Run History runs, index runs and Support Bot conversations are not included.',
      },
      {
        title: 'ACTIVE CHATS',
        description:
          'Number of chats with at least one AI response during the selected date range. Calculation: distinct chats among the model and tool calls recorded with a chat id.',
      },
      {
        title: 'TOTAL CHAT COST',
        description:
          "Estimated USD cost of all model calls made in chats, including input-token, output-token, cache read and cache write costs. Costs are calculated from the platform's local model-price table when the call is made and may differ from provider invoices.",
      },
      {
        title: 'TOTAL CHAT TOKENS',
        description:
          'Combined input, output, cache read and cache write tokens used in chats. Calculation: billable input + output + cache read + cache write tokens.',
      },
      {
        title: 'AI RESPONSES',
        description:
          'Number of replies generated in chats. Each reply is one response; regenerating or continuing a reply counts as an additional response.',
      },
      {
        title: 'CHAT USERS',
        description:
          'Distinct project members who received at least one AI response in a chat. Not shown for Private Projects.',
      },
      {
        title: 'SHARE OF PROJECT COST',
        description:
          "Total chat cost as a percentage of the project's total estimated cost in the same date range.",
      },
      {
        title: 'ERRORS',
        description: 'Responses in which at least one model or tool call failed.',
      },
      {
        title: 'Top Chats',
        description:
          'The chats with the highest cost (or tokens / responses, depending on the selected metric) in the selected date range. Only the top 10 are loaded when the tab opens; use Show all chats to browse the rest.',
      },
      {
        title: 'Cost by Participant',
        description:
          'Splits chat usage into Direct model, Agents, Pipelines and Skills. Usage of an Agent or Pipeline inside a chat is also included in that Agent or Pipeline on the Agents & Pipelines tab, so the two tabs overlap and must not be added together.',
      },
      {
        title: 'Chat Activity',
        description:
          'Lists chats with Responses, Users and Owner (Team Projects), Total/Input/Output/Cache costs, token counts, Avg Cost per Response, Models, Avg Latency, Errors and Last Activity. In Team Projects private chats of other members are counted but shown as "Private chat". Deleted chats keep their usage and are marked as deleted.',
      },
      {
        title: 'Chat Detail View',
        description:
          "Selecting a chat opens its KPIs, usage by day, participants, models, users (Team Projects), tools and every response with its user, participant, model, tokens, cost and status. Select a response start time to open its Run Analytics page. All-time cost shows the running total kept since the chat started tracking usage — the same value as Approx. cost in the chat's Context management panel — whereas all other figures cover only the selected date range.",
      },
    ],
  },
  {
    title: 'Skills Tab',
    tabId: ANALYTICS_TAB_IDS.skills,
    metrics: [
      {
        name: 'Skill Runs',
        description:
          'A skill runs on its own (Run panel) or as a participant in a chat. Each reply the skill generates is one run, and the run carries its own tokens and cost.',
        calculation: 'Distinct runs among the model calls whose root entity is the skill.',
      },
      {
        name: 'Agent & Chat Uses',
        description: SKILL_AGENT_CHAT_USES,
        calculation: 'Skill use events, once per skill per run for each way it was used.',
      },
      {
        name: 'Tokens and Cost',
        description:
          'Skill tokens and cost come from skill runs only, so they are part of the totals on the Costs and Tokens tabs and are never counted twice.',
      },
      {
        name: 'Deleted Skills',
        description: 'A deleted skill keeps its last known name and is marked as deleted.',
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
        name: 'User Activity',
        description:
          'Lists users who were active during the selected date range. For each user, the table shows Active Days, LLM Calls, Tool Calls, Agent/Pipeline Runs, Chat Messages, Errors, Total Tokens, Input Tokens, Output Tokens, Total Cost, Input Token Cost, and Output Token Cost.',
      },
      {
        name: 'User Detail View',
        description:
          'Selecting a user opens a detail view showing Active Days, LLM Calls, Tool Calls, Agent & Pipeline Runs, Chat Messages, Errors, token usage, estimated total cost, input-token cost, and output-token cost.',
      },
    ],
  },
  {
    title: 'Activity Tab',
    metrics: [
      {
        name: 'Active Users Trend',
        description:
          'Shows how many distinct people were active per calendar day, week, or month, split into Active Users (anyone with any event) and AI Active Users (only those who triggered an LLM or tool call). Comparing the two lines shows how much of the active team is actually using AI rather than only browsing.',
        calculation:
          'Active Users = count of distinct user IDs per bucket across all event types. AI Active Users = count of distinct user IDs per bucket restricted to metered LLM and tool events.',
        source:
          'Active Users from audit events; AI Active Users from metered usage events, which is the same source the billing figures use.',
      },
      {
        name: 'Granularity',
        description:
          'Switches the bucket size between Day, Week, and Month. Weeks and months are calendar-aligned, so a week starts on Monday and a month on the 1st; partial buckets at either end of the date range are reported as-is rather than being padded.',
      },
      {
        name: 'Role Filter',
        description:
          'Restricts the trend to members holding one or more selected project roles. Leaving it empty includes every member. A role that currently has no members legitimately shows zero rather than falling back to everyone.',
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
          'All Analytics metrics are filtered by the selected date range. Use Today, Last 7d, Last 30d, or Last 90d for calendar-day ranges. Each preset starts at 00:00 on its first day and ends at 23:59 today, including the entire final minute. Last 7d, Last 30d, and Last 90d include today in their day count. To view the last 24 hours or another exact period, set the From and To dates and times manually. The Custom selector appears when a custom range is active.',
      },
      {
        name: 'Project Scope',
        description:
          'All data shown is specific to the currently selected project. Switch projects using the project selector in the sidebar to view analytics for different teams.',
      },
    ],
  },
];

export const SKILLS_EMPTY_STATE = {
  title: 'No skill usage in this period',
  description:
    'Skills appear here once they are used. Run a skill from the Skills page, add it to a chat as a participant, or attach it to an agent so it can be loaded when needed.',
};

export const RUN_NO_DATA_MESSAGE = 'No analytics data is available for this run.';

// Run History → Analytics reuses the Costs/Tokens tabs; their date-range wording is re-scoped to the single run
export const RUN_TOOLTIP_TEXTS = {
  costs: {
    ...TOOLTIP_TEXTS.costs,
    TOTAL_COST: `Estimated total USD cost of ${MODEL_REQUESTS} in this run. It includes input-token, output-token, cache read, and cache write costs.`,
    INPUT_TOKEN_COST:
      'Estimated USD cost of tokens sent to AI models in this run, including prompts, instructions, and chat history.',
    OUTPUT_TOKEN_COST: 'Estimated USD cost of tokens generated by AI models in responses in this run.',
    CACHE_READ_COST: 'Estimated USD cost of tokens served from the provider prompt cache in this run.',
    CACHE_WRITE_COST: 'Estimated USD cost of tokens written to the provider prompt cache in this run.',
  },
  tokens: {
    ...TOOLTIP_TEXTS.tokens,
    TOTAL_TOKENS: `Combined number of input, output, cache read, and cache write tokens used by ${MODEL_REQUESTS} in this run.`,
    INPUT_TOKENS:
      'Tokens sent to AI models in this run, including prompts, instructions, chat history, and other request content.',
    OUTPUT_TOKENS: `Tokens generated by AI models in responses in this run. ${EMBEDDING_OUTPUT_NOTE}`,
    CACHE_READ_TOKENS: 'Tokens served from the provider prompt cache in this run.',
    CACHE_WRITE_TOKENS: 'Tokens written to the provider prompt cache in this run.',
    BY_USER:
      'Shows token usage attributed to each user in this run. Share represents the percentage of this run’s total tokens.',
    BY_MODEL:
      'Shows token usage for each AI model used in this run. Share represents the percentage of this run’s total tokens.',
  },
};

export const EVAL_RUN_NO_DATA_MESSAGE =
  'Analytics is unavailable for this evaluation run because tracking data is missing.';

// Evaluation Results History → Analytics: one evaluation run, covering Agent execution and LLM-as-judge scoring
export const EVAL_RUN_TOOLTIP_TEXTS = {
  costs: {
    ...TOOLTIP_TEXTS.costs,
    TOTAL_COST:
      'Estimated USD cost of this evaluation run, including Agent execution and LLM-as-judge scoring. It includes input-token, output-token, cache read, and cache write costs.',
    INPUT_TOKEN_COST:
      'Estimated USD cost of tokens sent to AI models in this evaluation run, including Agent execution and LLM-as-judge scoring.',
    OUTPUT_TOKEN_COST:
      'Estimated USD cost of tokens generated by AI models in this evaluation run, including Agent execution and LLM-as-judge scoring.',
    CACHE_READ_COST:
      'Estimated USD cost of tokens served from the provider prompt cache in this evaluation run.',
    CACHE_WRITE_COST:
      'Estimated USD cost of tokens written to the provider prompt cache in this evaluation run.',
  },
  tokens: {
    ...TOOLTIP_TEXTS.tokens,
    TOTAL_TOKENS:
      'Combined number of input, output, cache read, and cache write tokens used in this evaluation run, including Agent execution and LLM-as-judge scoring.',
    INPUT_TOKENS:
      'Tokens sent to AI models in this evaluation run, including prompts, instructions, test-case inputs, and judge requests.',
    OUTPUT_TOKENS: `Tokens generated by AI models in this evaluation run, including judge responses. ${EMBEDDING_OUTPUT_NOTE}`,
    CACHE_READ_TOKENS: 'Tokens served from the provider prompt cache in this evaluation run.',
    CACHE_WRITE_TOKENS: 'Tokens written to the provider prompt cache in this evaluation run.',
    BY_USER:
      'Shows token usage attributed to each user in this evaluation run. Share represents the percentage of this evaluation run’s total tokens.',
    BY_MODEL:
      'Shows token usage for each AI model used in this evaluation run, including judge models. Share represents the percentage of this evaluation run’s total tokens.',
  },
};

export const RUN_SCOPE_TYPE = {
  run: 'run',
  evalRun: 'evalRun',
};

export const RUN_CALL_EVENT_TYPE = {
  llm: 'llm',
  tool: 'tool',
};
