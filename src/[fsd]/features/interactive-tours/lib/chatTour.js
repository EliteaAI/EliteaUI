// MVP: steps are hardcoded here.
// Phase 2+: these will be loaded from the .md file referenced by
// resources_interactive_tours_links[menuKey="chat"].url
// (e.g. /interactive-tours/chat-tour.md), parsed via frontmatter + body sections.
// The step shape stays identical — only the source changes.

export const CHAT_TOUR_ID = 'chat';

export const CHAT_TOUR_COMPLETION = {
  keepExploring: [
    { label: 'How to Create Agent', tourId: 'agent' },
    { label: 'How to Create Pipeline', tourId: 'pipeline' },
    { label: 'How to Create Index', tourId: 'index' },
  ],
};

export const chatTourSteps = [
  {
    id: 'what-is-chat',
    target: '[data-tour="chat-workspace"]',
    placement: 'center',
    title: 'What is ELITEA Chat?',
    // markdown — rendered via mui-markdown in InteractiveTourCard
    content: `ELITEA Chat is your workspace for interacting with AI. You can:

- **Agents**: Pre-configured automated workflows or specialized bots designed for specific tasks.
- **Pipelines**: Multi-step automated processes that orchestrate multiple agents and tools.
- **Toolkits**: Collections of tools and integrations that extend chat capabilities (e.g., GitHub, Jira, Confluence).
- **Models**: Directly chat with any configured LLM without an agent wrapper.

Send messages, attach files, and review past conversations — all in one place.`,
  },
  {
    id: 'conversations',
    target: '[data-tour="chat-conversations"]',
    placement: 'right',
    title: 'Conversations',
    content: `Every chat you start is saved here. You can:

- **Pin** conversations you use most so they always appear at the top.
- **Rename** any conversation to make it easier to find later.
- **Reopen** a past conversation to continue where you left off.`,
  },
  {
    id: 'folders',
    target: '[data-tour="chat-conversations"]',
    placement: 'right',
    title: 'Folders',
    content: `Group related conversations into folders to keep your sidebar organized:

- **Create** a folder and give it a meaningful name.
- **Drag** conversations into folders or move them between folders.
- **Reorder** folders by dragging them up or down in the list.`,
  },
  {
    id: 'participants',
    target: '[data-tour="chat-participants"]',
    placement: 'left',
    title: 'Participants',
    content: `Participants define what a conversation can do. Five types are available:

- **Models** — A language model to generate AI responses
- **Agents** — A configured AI assistant with instructions and toolkits
- **Pipelines** — An automated multi-step workflow
- **Toolkits & MCPs** — Integrations with external services or Model Context Protocol servers
- **Users** — Team members in public project conversations

Add participants by clicking **+** in the PARTICIPANTS section, or by typing '#' in the message input to search and select from a dropdown.

Agents, pipelines, toolkits, and MCPs can also be created or edited directly from Chat without navigating away. Use the **Create new** option in the PARTICIPANTS section to open the entity's canvas editor inline — any changes take effect in the current conversation immediately.`,
  },
];
