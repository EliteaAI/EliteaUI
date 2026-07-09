import { CHAT_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/chatTourTargets.constants';

export const CHAT_TOUR_ID = 'chat';

export const CHAT_TOUR_COMPLETION = {
  keepExploring: [{ label: 'Sidebar Interactive Tour', tourId: 'sidebar' }],
};

export const chatTourSteps = [
  {
    id: 'what-is-elitea-chat',
    target: CHAT_TOUR_TARGETS.workspace,
    placement: 'left',
    title: 'What is ELITEA Chat?',
    content: `ELITEA Chat is the central hub where all platform capabilities come together. It provides a conversational interface where you can interact with AI models, agents, pipelines, toolkits, and MCP servers — all in one place, using natural language.

Each conversation is an independent dialogue session. Context is not shared between separate conversations. All conversations are stored on the ELITEA server and accessible from any device.`,
  },
  {
    id: 'conversation-list',
    target: CHAT_TOUR_TARGETS.conversations,
    placement: 'right',
    title: 'Chats',
    content: `Every interaction in Chats takes place inside a chat. Chats are automatically named based on your first message and organized by time period (Today, Yesterday, This Week, Older). Pinned chats always appear at the top.

Chats can be **Private** (visible only to you) or **Public** (shared with all project members who can join and collaborate).

Use the **search** icon in the CHATS header to filter chats by name — results update as you type.

**Chat actions** (three-dot menu on any chat):

- **Edit** — Rename the chat
- **Move to** — Move the chat into a folder; create a new folder inline if needed
- **Make Public** — Share the chat with all project members; cannot be reversed
- **Share** — Copy a direct link to the chat to your clipboard (team projects only)
- **Playback** — Replay the chat step by step without re-engaging models; use arrow keys or on-screen controls to navigate; designed for demos
- **Pin on top** — Pin the chat to the top of the list
- **Delete** — Permanently delete the chat`,
  },
  {
    id: 'conversation-participants',
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
    id: 'conversation-messaging',
    target: CHAT_TOUR_TARGETS.messageInput,
    placement: 'bottom',
    title: 'Messaging',
    content: `- **Mentioning tools** — type \`/\` in the message input to direct the AI to use a specific tool from an already-added toolkit. Select the toolkit, then select the tool — the mention is embedded as \`/{ToolkitName}/{ToolName}\`. Multiple mentions can be combined in a single message.
- **Mentioning users** — type \`@\` in the message input to mention a participant in the conversation.
- **Voice input** — click the **microphone** icon to dictate instead of type. Speech is converted to text in real time at the cursor position. Stop recording at any time to finalize the transcript.`,
  },
  {
    id: 'conversation-internal-tools',
    target: CHAT_TOUR_TARGETS.internalTools,
    placement: 'bottom',
    title: 'Modules',
    content: `Use this button to enable built-in modules for the current conversation. The popup shows only the modules available in the current project configuration.

- **Data Analysis** — work with CSV and Excel files using natural language
- **Python Sandbox** — execute Python code securely with Pyodide
- **Image Creation** — generate images when an image provider is available
- **Planner** — create and track tasks inside the conversation
- **Smart Tools Selection** — reduce token usage when many toolkits are attached
- **Swarm Mode** — let multiple child agents collaborate and hand off tasks

Turn on only the tools you need for this conversation.`,
  },
  {
    id: 'conversation-model-settings',
    target: CHAT_TOUR_TARGETS.modelSettings,
    placement: 'bottom',
    title: 'Model & Settings',
    content: `Choose a language model from the model selector in the message input area. Click the settings (⚙️) icon to fine-tune response generation:

- **Reasoning models** (e.g. GPT-5.1) — choose a Reasoning depth: Low, Medium, or High
- **Standard models** (e.g. GPT-4o) — set a Creativity level and Max Completion Tokens`,
  },
];
