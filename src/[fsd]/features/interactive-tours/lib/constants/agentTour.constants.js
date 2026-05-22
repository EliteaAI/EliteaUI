import { AGENT_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/agentTourTargets.constants';

export const AGENT_TOUR_ID = 'agent';

export const AGENT_TOUR_COMPLETION = {
  keepExploring: [
    { label: 'How to Use Chat', tourId: 'chat' },
    { label: 'How to Create Pipeline', tourId: 'pipeline' },
    { label: 'How to Create Index', tourId: 'index' },
  ],
};

export const agentTourSteps = [
  {
    id: 'what-is-agent',
    target: AGENT_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What are ELITEA Agents?',
    content: `ELITEA Agents are customizable AI-powered virtual assistants that automate tasks and streamline workflows. Each agent is built around three core components:

- **Instructions** — define what the agent does and how it behaves
- **Toolkits** — connect external services (GitHub, Jira, Confluence, SQL, and more) and internal tools
- **AI Model** — the language model that powers the agent's reasoning and responses

Once configured, an agent can autonomously execute complex, multi-step tasks such as reviewing code, generating documentation, creating Jira tickets, or querying databases — all without constant human input.`,
  },
  {
    id: 'instructions',
    target: AGENT_TOUR_TARGETS.instructions,
    placement: 'right',
    title: 'Instructions (System Prompt)',
    content: `**Instructions** are the core of every agent — write clear, step-by-step guidance for the AI and reference the toolkits it should use.

- **Variables** — add \`{{variable_name}}\` placeholders for values that change between runs; a Variables section appears automatically to set default values
- **Autosuggest** — type \`/\` inside the Instructions field to quickly reference attached Agents, Pipelines, Toolkits, or MCPs; selecting a Toolkit or MCP opens a second dropdown to pick a specific tool`,
  },
  {
    id: 'tools',
    target: AGENT_TOUR_TARGETS.tools,
    placement: 'right',
    title: 'Toolkits',
    content: `Toolkits extend the agent's capabilities by connecting it to external services and other ELITEA resources. Attach them using the buttons in the TOOLKITS section — existing items can be selected from a dropdown, or new ones can be created inline without leaving the agent page.

- **+ Toolkit** — attach an external integration (GitHub, Jira, SQL, etc.); select from existing or create a new one inline
- **+ MCP** — attach a Model Context Protocol server for additional tool capabilities
- **+ Agent** — delegate tasks to another agent within this agent's workflow
- **+ Pipeline** — invoke a pipeline as a step in the agent's execution`,
  },
  {
    id: 'conversation-starters',
    target: AGENT_TOUR_TARGETS.conversationStarters,
    placement: 'right',
    title: 'Conversation Starters',
    content: `**Conversation Starters** are predefined prompt buttons that let users launch common tasks with a single click, without typing anything.

Add starters that represent the most frequent or useful tasks for your agent. Users can click any starter to send it immediately as their first message.`,
  },
  {
    id: 'advanced-settings',
    target: AGENT_TOUR_TARGETS.advancedSettings,
    placement: 'right',
    title: 'Internal Tools & AI Model',
    content: `**Internal Tools** are built-in capabilities available to every agent without external credentials. Enable them directly from the agent configuration:

- **Attachments** — lets users upload files and images for the agent to analyze
- **Data Analysis** — processes CSV/Excel files, runs statistical analysis, creates charts
- **Python Sandbox** — executes Python code securely using Pyodide
- **Image Creation** — generates images from text prompts
- **Planner** — breaks complex tasks into structured step-by-step plans
- **Swarm Mode** — enables multiple child agents to collaborate and hand off to each other
- **Smart Tools Selection** — reduces token usage when many toolkits are attached

**AI Model Configuration** lets you choose the language model powering the agent:

- **Reasoning models** (e.g. GPT-5.1) — choose a reasoning depth: Low, Medium, or High
- **Standard models** (e.g. GPT-4o) — set a Creativity level (1–5) and Max Completion Tokens`,
  },
  {
    id: 'welcome-message',
    target: AGENT_TOUR_TARGETS.welcomeMessage,
    placement: 'right',
    title: 'Welcome Message',
    content: `The **Welcome Message** is a greeting shown when the agent is opened in Chat. Use it to explain the agent's purpose and set expectations for the user.`,
  },
  {
    id: 'versions',
    target: AGENT_TOUR_TARGETS.versions,
    placement: 'bottom',
    title: 'Version Management',
    content: `Every save creates or updates the **base** version. Use **Save As Version** to snapshot a stable state with a named version. Switch between versions via the version dropdown, and roll back at any time.

You can also **Export** any saved version as a \`.zip\` or \`.md\` file to back it up or share it outside the platform, **Import** a previously exported file to restore or reuse a configuration, and **Fork** an agent directly into another project — creating an independent copy without downloading any files.`,
  },
  {
    id: 'publish',
    target: AGENT_TOUR_TARGETS.publish,
    placement: 'bottom',
    title: 'Publishing to Agents Studio',
    content: `Publish an agent to **Agents Studio** — a shared community library accessible to all users across projects. Published agents appear as read-only cards in Studio. Other users can start conversations with them, like them, and add them to their own chats.

Once submitted, a published version goes through a moderation review. You will receive a notification when it is approved or rejected.`,
  },
  {
    id: 'test-chat',
    target: AGENT_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'Embedded Test Chat',
    content: `The agent configuration page includes a live chat panel so you can test the agent as you build it — no need to navigate away. Any change to the instructions, toolkits, or model settings takes effect immediately in the next message you send.

**Voice input** — click the **microphone** icon in the test chat to dictate instead of type. Speech is converted to text in real time at the cursor position. Stop recording at any time to finalize the transcript.`,
  },
  {
    id: 'run-history',
    target: AGENT_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'Run History',
    content: `Every agent execution is logged automatically. Open the **Run History** panel to browse past runs, inspect inputs and outputs, replay conversations step by step, and restore a previous run's message history to the test chat for further debugging.`,
  },
];
