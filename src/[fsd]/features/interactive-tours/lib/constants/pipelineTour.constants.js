import { PIPELINE_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/pipelineTourTargets.constants';

import { AGENT_TOUR_TARGETS } from './agentTourTargets.constants';
import { CHAT_TOUR_TARGETS } from './chatTourTargets.constants';
import { SHARED_TOUR_TARGETS } from './interactiveTour.constants';

export const PIPELINE_TOUR_ID = 'pipeline';

export const PIPELINE_TOUR_COMPLETION = {
  keepExploring: [
    // { label: 'How to Use Chat', tourId: 'chat' },
    // { label: 'How to Create Agent', tourId: 'agent' },
    // { label: 'How to Explore Sidebar', tourId: 'sidebar' },
  ],
};

export const pipelineTourSteps = [
  {
    id: 'what-is-pipeline',
    target: PIPELINE_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What are ELITEA Pipelines?',
    content: `ELITEA Pipelines are visual workflow automation tools that let you design and execute complex, multi-step processes by connecting a series of nodes. Each pipeline can combine LLM calls, toolkit actions, agent interactions, conditional logic, and custom code into a single automated flow.

Unlike a simple agent that responds turn-by-turn, a pipeline follows a defined execution graph — branching, looping, and passing data between steps — so it can handle sophisticated orchestration scenarios end-to-end.`,
  },
  {
    id: 'flow-designer',
    target: PIPELINE_TOUR_TARGETS.flowDesigner,
    placement: 'left',
    title: 'Flow Designer',
    content: `The Flow Designer is a drag-and-drop canvas for visually connecting nodes into a pipeline. Add nodes using the **+** button, then connect them by dragging edges between them. Every pipeline ends with an **End** node that marks completion.

Pipeline settings — including General info, Toolkits, Variables, State, and Advanced options — are managed from the configuration form alongside the canvas.`,
  },
  {
    id: 'yaml-editor',
    target: PIPELINE_TOUR_TARGETS.yamlEditor,
    placement: 'bottom',
    title: 'YAML Editor',
    content: `The YAML Editor provides a code-based view of the same pipeline configuration. Use it for advanced logic, fine-tuned parameters, and complex branching that is easier to express in text than on the canvas. Switch between Flow and YAML at any time using the **Flow/YAML toggle** — changes in one mode are reflected in the other.`,
  },
  {
    id: 'nodes',
    target: PIPELINE_TOUR_TARGETS.nodes,
    placement: 'bottom',
    title: 'Nodes',
    content: `Nodes are the building blocks of a pipeline. Each node represents a single step — such as calling an LLM, running a toolkit action, executing code, or making a routing decision. Connect nodes by dragging edges between them. Every pipeline ends with an **End** node that marks completion.

Four categories of nodes are available:

- **Interaction** — LLM, Agent: generate AI responses or delegate to a specialized agent
- **Execution** — Toolkit, MCP, Code, Custom: run external integrations, MCP tools, or custom scripts
- **Control Flow** — Router, Decision: branch or loop execution based on conditions
- **Utility** — State Modifier, Printer: read/write pipeline state or output values for debugging`,
  },
  {
    id: 'tools',
    target: AGENT_TOUR_TARGETS.tools,
    placement: 'right',
    title: 'Toolkits, Agents, MCPs & Nested Pipelines',
    content: `Extend the pipeline's capabilities by attaching external resources. Use the buttons in the TOOLKITS section — existing items can be selected from a dropdown, or new ones can be created inline without leaving the pipeline page.

- **+ Toolkit** — attach an external integration (GitHub, Jira, SQL, etc.)
- **+ MCP** — attach a Model Context Protocol server for additional tool capabilities
- **+ Agent** — delegate tasks to a specialized agent within the flow
- **+ Pipeline** — nest other pipelines to compose complex multi-step workflows`,
  },
  {
    id: 'state-management',
    target: PIPELINE_TOUR_TARGETS.state,
    placement: 'left',
    title: 'State Management',
    content: `Pipeline **State** is a set of key-value variables that persist across the entire execution. Any node can read or write state, enabling data to be passed between steps without explicit connections.

Two default state variables are always available:

- **\`inputs\`** — captures user input provided at execution time
- **\`messages\`** — stores the full conversation history

Add custom variables in the **State** section using **+ Context**.`,
  },
  {
    id: 'model-settings',
    target: CHAT_TOUR_TARGETS.modelSettings,
    placement: 'left',
    title: 'AI Model Configuration',
    content: `Choose the language model that powers the pipeline and tune how it generates responses. The available settings depend on the model type:

- **Reasoning models** (e.g. GPT-5.1) — choose a Reasoning depth: Low, Medium, or High
- **Standard models** (e.g. GPT-4o) — set a Creativity level (1–5) and Max Completion Tokens`,
  },
  {
    id: 'welcome-message',
    target: AGENT_TOUR_TARGETS.welcomeMessage,
    placement: 'right',
    title: 'Welcome Message',
    content: `**Welcome Message** — a greeting shown when the pipeline is opened in Chat; use it to explain the pipeline's purpose and set expectations.`,
  },
  {
    id: 'conversation-starters',
    target: AGENT_TOUR_TARGETS.conversationStarters,
    placement: 'right',
    title: 'Chat Starters',
    content: `Chat Starters are predefined prompt buttons that let users launch common workflows with a single click, without typing anything.`,
  },
  {
    id: 'versions',
    target: AGENT_TOUR_TARGETS.versions,
    placement: 'bottom',
    title: 'Version Management',
    content: `Every save updates the **base** version. Use **Save As Version** to create a named snapshot. Switch between versions from the version dropdown and roll back at any time.

You can also export any saved version as a **.zip** or **.md** file, import a previously exported file into any project, and fork a pipeline directly into another project without downloading any files.`,
  },
  {
    id: 'test-chat',
    target: CHAT_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'Embedded Test Chat',
    content: `The pipeline configuration page includes a live chat panel so you can test the pipeline as you build it — no need to navigate away. Any change to the nodes, toolkits, or model settings takes effect immediately in the next execution.

**Voice input** — click the **microphone** icon in the test chat to dictate instead of type. Speech is converted to text in real time at the cursor position. Stop recording at any time to finalize the transcript.`,
  },
  {
    id: 'run-history',
    target: SHARED_TOUR_TARGETS.runHistory,
    placement: 'left',
    title: 'Run History',
    content: `Every pipeline execution is logged automatically. Open the **Run History** panel (clock icon in the test chat header) to browse past executions, inspect inputs and outputs, track state evolution step by step, and replay previous runs for debugging.`,
  },
];
