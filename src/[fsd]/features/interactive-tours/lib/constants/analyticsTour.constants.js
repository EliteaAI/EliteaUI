import { ANALYTICS_TOUR_TARGETS } from './analyticsTourTargets.constants';
import { ANALYTICS_TOUR_ID } from './tourIds.constants';

export { ANALYTICS_TOUR_ID };

export const ANALYTICS_TOUR_COMPLETION = {
  keepExploring: [],
};

export const analyticsTourSteps = [
  {
    id: 'what-is-analytics',
    target: ANALYTICS_TOUR_TARGETS.page,
    placement: 'center',
    title: 'What is ELITEA Analytics?',
    content: `Analytics provides real-time visibility into how your team uses the platform — from AI model invocations and tool executions to agent runs and user activity. All data is scoped to the currently selected project and is available to all project members.`,
  },
  {
    id: 'date-range-controls',
    target: ANALYTICS_TOUR_TARGETS.dateFilter,
    placement: 'bottom',
    title: 'Date Range Controls',
    content: `All tabs share a single date filter that controls the data shown across the entire page.

- **Quick presets** — **Last 24h**, **Last 7d**, **Last 30d**, **Last 90d**; the page loads with **Last 7d** pre-selected
- **Custom range** — set a precise **From / To** window for targeted analysis

Data is cached for up to 5 minutes.`,
  },
  {
    id: 'overview-tab',
    tabIndex: 0,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Overview Tab',
    content: `The Overview tab provides a project-wide summary for the selected period. Six KPI cards display the key metrics at a glance:

- **TEAM** — active members vs. all users ever seen in the project
- **AI ACTIVE** — users with at least one LLM, tool, or agent event; includes an adoption rate
- **LLM CALLS** — total AI model invocations
- **TOOL RUNS** — total tool executions
- **CHAT MSG** — total user messages sent in chat
- **AGENT RUNS** — total interactions with agents and pipelines

Below the cards: a **Daily Activity** area chart, a **Top 5 AI Adopters** leaderboard, and a **Model Usage Breakdown** table. Click any user in the leaderboard to open their detailed view.`,
  },
  {
    id: 'agents-tab',
    tabIndex: 1,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Agents Tab',
    content: `The **Agents** tab shows usage and reliability for each agent in the project. A bar chart highlights the top 20 agents by event count.

The **Agent Activity** table lists all agents with total events, distinct users, average latency, and error count. Click any agent row to open a drill-down with daily usage trends, a per-user breakdown, and the tools called by that agent.`,
  },
  {
    id: 'tools-tab',
    tabIndex: 2,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Tools Tab',
    content: `The **Tools** tab shows which tools are being called and how reliably. A bar chart shows the top 20 tools by call count.

The **Tool Details** table lists all tools with call count, distinct users, average latency, and error count (highlighted in red when > 0). Click any tool row to see daily usage trends, the users who triggered it, and the agents that invoked it.`,
  },
  {
    id: 'users-tab',
    tabIndex: 3,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Users Tab',
    content: `The **Users** tab provides a per-person activity breakdown across the selected period. The **User Activity** table lists all active users with event counts by type (LLM, Tool, Agent, Chat), active days, and error count.

Click any user row to open a drill-down showing a daily activity chart broken down by event type, and lists of the models, tools, and agents that user worked with.`,
  },
  {
    id: 'health-tab',
    tabIndex: 4,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Health Tab',
    content: `The **Health** tab shows system reliability metrics for the selected period. A dual-series chart displays total requests vs. errors per day, making it easy to spot degradation or outage windows at a glance.

The **Health by Event Type** table shows error rate and average latency for each event type (\`api\`, \`socketio\`, \`llm\`, \`tool\`, \`agent\`, \`rpc\`). Error rates above 5% are highlighted in red.`,
  },
  {
    id: 'guide-tab',
    tabIndex: 5,
    target: ANALYTICS_TOUR_TARGETS.tabSection,
    placement: 'right',
    title: 'Guide Tab',
    content: `The **Guide** tab is a built-in glossary embedded directly in the Analytics page. It explains every KPI, chart column, and event type — including the exact calculation formula and data source for each metric.

Start here if you are new to Analytics or need to verify how a specific number is calculated.`,
  },
];
