import { SHARED_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/interactiveTour.constants';
import { TOOLKIT_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/toolkitTourTargets.constants';

export const TOOLKIT_TOUR_ID = 'toolkit';

export const TOOLKIT_TOUR_COMPLETION = {
  keepExploring: [
    // { label: 'How to Create Agent', tourId: 'agent' },
    // { label: 'How to Create Pipeline', tourId: 'pipeline' },
  ],
};

export const toolkitTourSteps = [
  {
    id: 'what-is-toolkit',
    target: SHARED_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What are ELITEA Toolkits?',
    content: `ELITEA Toolkits are modular integrations that connect AI agents, pipelines, and conversations to external platforms and services. Each toolkit packages the connection configuration and a set of tools — specific actions the AI can perform on that service, such as creating issues, querying databases, or searching documents.

Once configured, a toolkit can be attached to any agent or pipeline and used directly in Chat, enabling the AI to automate tasks across different systems without manual intervention.`,
  },
  {
    id: 'configuration-form',
    target: SHARED_TOUR_TARGETS.configurationForm,
    placement: 'right',
    title: 'Configuration',
    content: `The configuration form contains the fields needed to connect and shape the toolkit. Common fields across most toolkits include:

- **Name** — a descriptive name for the toolkit
- **Description** — a short summary of the toolkit's purpose
- **Configurations** — the saved credential used to authenticate with the service
- **PgVector** — optional vector storage connection for document indexing and semantic search tools
- **Embedding Model** — required when using semantic search tools
- **Parameters** — service-specific settings such as URLs, project IDs, or endpoints`,
  },
  {
    id: 'tools',
    target: SHARED_TOUR_TARGETS.tools,
    placement: 'right',
    title: 'Tool Selection',
    content: `Each toolkit exposes a set of tools — discrete actions the AI can perform, such as *Create Issue*, *Search Confluence*, or *Run SQL Query*. Enable only the tools your use case requires; limiting tool selection improves performance and reduces unnecessary access.

Tools that require **PgVector** and an **Embedding Model** — such as *Index data*, *Search index*, *Stepback search index*, *Stepback summary index*, *List collections*, and *Remove index* — become available once those configurations are set.`,
  },
  {
    id: 'indexes-tab',
    target: TOOLKIT_TOUR_TARGETS.indexesTab,
    placement: 'bottom',
    title: 'Indexes',
    content: `Toolkits that support document processing provide an **Indexes** tab for managing indexed content. Indexing enables the AI to perform semantic search over documents from the connected service — finding content by meaning rather than exact keywords.

From the Indexes tab, create and manage indexes for any supported content source. Once indexed, the AI can use semantic search tools to query the data during a conversation.`,
  },
  {
    id: 'raw-json',
    target: SHARED_TOUR_TARGETS.rawJsonTab,
    placement: 'bottom',
    title: 'Raw JSON Mode',
    content: `Switch to **Raw JSON** mode to edit the full toolkit configuration directly as a JSON object. This is useful for bulk edits, copying configurations between toolkits, or setting complex parameter structures that the form UI does not expose.`,
  },
  {
    id: 'test-settings',
    target: SHARED_TOUR_TARGETS.testSettings,
    placement: 'left',
    title: 'Test Settings',
    content: `The toolkit detail page includes a built-in test interface. Select a model, choose a tool, provide any required parameters, and click **RUN TOOL** to execute it in real time. Results appear inline so you can verify the integration works correctly before attaching it to an agent or pipeline.`,
  },
  {
    id: 'run-history',
    target: SHARED_TOUR_TARGETS.runHistory,
    placement: 'left',
    title: 'Run History',
    content: `Every tool execution is logged automatically. Open the **Run History** panel to browse past executions, inspect inputs and outputs at each step, and debug failed runs.`,
  },
];
