import { SHARED_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/interactiveTour.constants';
import { MCP_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/mcpTourTargets.constants';
import RouteDefinitions from '@/routes';

const shouldSkipConnectionStatusStep = () => {
  if (typeof window === 'undefined') return false;

  return window.location.pathname.includes(RouteDefinitions.CreateMCP);
};

export const MCP_TOUR_ID = 'mcp';

export const MCP_TOUR_COMPLETION = {
  keepExploring: [],
};

export const mcpTourSteps = [
  {
    id: 'what-are-mcps',
    target: SHARED_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What are ELITEA MCPs?',
    content: `ELITEA MCPs (Model Context Protocol servers) are external tool providers that follow the MCP specification to expose specialized capabilities to your agents, pipelines, and conversations. Unlike native toolkits, MCPs connect to independently hosted servers — local or remote — that supply their own set of tools.

Once configured, MCP tools are available everywhere toolkits are used: in agents, pipelines, and Chat, enabling automation that spans browser control, repository operations, API integrations, and other domain-specific tasks.`,
  },
  {
    id: 'tool-selection',
    target: SHARED_TOUR_TARGETS.tools,
    placement: 'right',
    scrollBlock: 'start',
    title: 'Tool Selection',
    content: `Each MCP exposes a set of tools — discrete actions the AI can perform against the connected server. Enable only the tools your use case requires; limiting tool selection improves performance and reduces unnecessary access.`,
  },
  {
    id: 'raw-json-mode',
    target: SHARED_TOUR_TARGETS.rawJsonTab,
    placement: 'bottom',
    title: 'Raw JSON Mode',
    content: `Switch to **Raw JSON** mode to edit the full MCP configuration directly as a JSON object. This is useful for advanced setups, copying configurations between MCPs, or setting parameters that the form UI does not expose.`,
  },
  {
    id: 'connection-status',
    target: MCP_TOUR_TARGETS.connectionStatus,
    placement: 'bottom',
    // The status pill is not rendered on create flows before the MCP exists.
    skip: shouldSkipConnectionStatusStep(),
    title: 'Connection Status',
    content: `Each MCP card displays its current connection status so you can quickly identify and resolve connectivity issues:

- **Connected** — the MCP server is reachable and its tools are available for use
- **Disconnected** — ELITEA cannot reach the server; tools are unavailable until the connection is restored

For Local MCPs, the connection depends on the Elitea MCP Client running on your machine. For Remote MCPs, it depends on the server URL and authentication credentials being valid.`,
  },
  {
    id: 'test-settings',
    target: SHARED_TOUR_TARGETS.testSettings,
    placement: 'left',
    title: 'Test Settings',
    content: `The MCP detail page includes a built-in test interface. Select a model, choose a tool, provide any required parameters, and click **RUN TOOL** to execute it in real time. Results appear inline so you can verify the integration works correctly before attaching it to an agent or pipeline.`,
  },
  {
    id: 'run-history',
    target: SHARED_TOUR_TARGETS.runHistory,
    placement: 'left',
    title: 'Run History',
    content: `Every tool execution is logged automatically. Open the **Run History** panel to browse past executions, inspect inputs and outputs at each step, and debug failed runs.`,
  },
];
