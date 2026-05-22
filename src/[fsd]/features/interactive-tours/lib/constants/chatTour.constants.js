import { CHAT_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/chatTourTargets.constants';

export const CHAT_TOUR_ID = 'chat';

export const CHAT_TOUR_COMPLETION = {
  keepExploring: [
    // { label: 'How to Create Agent', tourId: 'agent' },
    // { label: 'How to Create Pipeline', tourId: 'pipeline' },
    // { label: 'How to Create Index', tourId: 'index' },
  ],
};

export const chatTourSteps = [
  {
    id: 'what-is-chat',
    target: CHAT_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What is ELITEA Chat?',
    // markdown — rendered via mui-markdown in InteractiveTourCard
    content: `ELITEA Chat is the central hub where all platform capabilities come together. It provides a conversational interface where you can interact with AI models, agents, pipelines, toolkits, and MCP servers — all in one place, using natural language.

Each conversation is an independent dialogue session. Context is not shared between separate conversations. All conversations are stored on the ELITEA server and accessible from any device.`,
  },
  {
    id: 'conversations',
    target: CHAT_TOUR_TARGETS.conversations,
    placement: 'right',
    title: 'Conversations',
    content: `Every interaction in Chat takes place inside a conversation. Conversations are automatically named based on your first message and organized by time period (Today, Yesterday, This Week, Older). Pinned conversations always appear at the top.

Conversations can be **Private** (visible only to you) or **Public** (shared with all project members who can join and collaborate).

Use the **search** icon in the CONVERSATIONS header to filter conversations by name — results update as you type.

**Conversation actions** (three-dot menu on any conversation):

- **Edit** — Rename the conversation
- **Move to** — Move the conversation into a folder; create a new folder inline if needed
- **Make Public** — Share the conversation with all project members; cannot be reversed
- **Share** — Copy a direct link to the conversation to your clipboard (team projects only)
- **Playback** — Replay the conversation step by step without re-engaging models; use arrow keys or on-screen controls to navigate; designed for demos
- **Pin on top** — Pin the conversation to the top of the list
- **Delete** — Permanently delete the conversation`,
  },
  {
    id: 'folders',
    target: CHAT_TOUR_TARGETS.folders,
    placement: 'right',
    title: 'Folders',
    content: `Conversations can be organized into folders. Create a folder using the **+ Folder** button, then move conversations into it by dragging and dropping or using the three-dot menu. Folders follow the same private/public rules as conversations.

- **Edit** — Rename the folder
- **Delete** — Remove the folder; conversations inside are moved back to the main list`,
  },
  {
    id: 'participants',
    target: CHAT_TOUR_TARGETS.participants,
    placement: 'left',
    title: 'Participants',
    content: `Participants define what a conversation can do. Five types are available:

- **Models** — A language model to generate AI responses
- **Agents** — A configured AI assistant with instructions and toolkits
- **Pipelines** — An automated multi-step workflow
- **Toolkits & MCPs** — Integrations with external services or Model Context Protocol servers
- **Users** — Team members in public project conversations

Add participants by clicking **+** in the PARTICIPANTS section, or by typing \`#\` in the message input to search and select from a dropdown.

Agents, pipelines, toolkits, and MCPs can also be created or edited directly from Chat without navigating away. Use the **Create new** option in the PARTICIPANTS section to open the entity's canvas editor inline — any changes take effect in the current conversation immediately.`,
  },
  {
    id: 'messaging',
    target: CHAT_TOUR_TARGETS.messageInput,
    placement: 'bottom',
    title: 'Messaging',
    content: `- **Mentioning tools** — type \`/\` in the message input to direct the AI to use a specific tool from an already-added toolkit. Select the toolkit, then select the tool — the mention is embedded as \`/{ToolkitName}/{ToolName}\`. Multiple mentions can be combined in a single message.
- **Mentioning users** — type \`@\` in the message input to mention a participant in the conversation.
- **Voice input** — click the **microphone** icon to dictate instead of type. Speech is converted to text in real time at the cursor position. Stop recording at any time to finalize the transcript.`,
  },
  {
    id: 'internal-tools',
    target: CHAT_TOUR_TARGETS.internalTools,
    placement: 'top',
    title: 'Internal Tools',
    content: `Use this button to enable built-in tools for the current conversation. The popup shows only the tools available in the current project configuration.

- **Data Analysis** — work with CSV and Excel files using natural language
- **Python Sandbox** — execute Python code securely with Pyodide
- **Image Creation** — generate images when an image provider is available
- **Planner** — create and track tasks inside the conversation
- **Smart Tools Selection** — reduce token usage when many toolkits are attached
- **Swarm Mode** — let multiple child agents collaborate and hand off tasks

Turn on only the tools you need for this conversation.`,
  },
  {
    id: 'model-settings',
    target: CHAT_TOUR_TARGETS.modelSettings,
    placement: 'top',
    title: 'Model & Settings',
    content: `Choose a language model from the model selector in the message input area. Click the settings (⚙️) icon to fine-tune response generation:

- **Reasoning models** (e.g. GPT-5.1) — choose a Reasoning depth: Low, Medium, or High
- **Standard models** (e.g. GPT-4o) — set a Creativity level and Max Completion Tokens`,
  },
  {
    id: 'context-budget',
    target: CHAT_TOUR_TARGETS.contextBudget,
    placement: 'left',
    title: 'Context Budget',
    content: `The **Context Budget** widget displays real-time token usage for the current conversation and automatically manages context as it approaches the model's token limit. It appears in the PARTICIPANTS panel after the first message is sent.

Key capabilities:

- **Real-time token tracking** — see how many tokens have been used and how many remain
- **Automatic pruning** — old messages are removed or summarized when the limit is approached
- **Manual optimization** — trigger context cleanup at any time when usage exceeds 100%
- **Pruning strategies** — choose between \`oldest_first\` or \`importance_based\`
- **Message preservation** — configure how many recent messages are always protected from pruning
- **Summarization** — automatically condense older messages to reduce token usage while preserving context`,
  },
  {
    id: 'canvas-mode',
    target: CHAT_TOUR_TARGETS.canvasMode,
    placement: 'left',
    title: 'Canvas Mode',
    content: `When a response contains editable content, a **Pencil** icon (✏️) appears alongside the output. Clicking it opens an inline editor for that content:

- **Code** — Edit code with syntax highlighting; select language; undo/redo; copy to clipboard
- **Table** — Edit cells, add/delete rows and columns, sort, filter, hide columns, import from CSV, download as XLSX
- **Mermaid diagram** — Edit diagram code with a live visual preview; download as JPG, PNG, or SVG
- **DOCX** — Full WYSIWYG document editing (opened via Artifacts)

Canvas editing is available when interacting with Models, Agents, and Pipelines. Multiple team members can edit the same canvas content simultaneously — changes appear in real time for all participants.`,
  },
  {
    id: 'message-feedback',
    target: CHAT_TOUR_TARGETS.messageFeedback,
    placement: 'top',
    title: 'Message Feedback',
    content: `Each AI response includes feedback controls:

- **Thumbs Up** — like the response
- **Thumbs Down** — dislike the response; a **Leave comment** field appears so you can describe the issue and submit it as feedback
- **Regenerate** (🔄) — re-runs the last prompt to get a different response`,
  },
];
