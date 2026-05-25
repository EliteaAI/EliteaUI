import { AGENT_STUDIO_TOUR_TARGETS } from '@/[fsd]/features/interactive-tours/lib/constants/agentStudioTourTargets.constants';

export const AGENT_STUDIO_TOUR_ID = 'agent-studio';

export const AGENT_STUDIO_TOUR_COMPLETION = {
  keepExploring: [],
};

export const agentStudioTourSteps = [
  {
    id: 'what-is-agents-studio',
    target: AGENT_STUDIO_TOUR_TARGETS.workspace,
    placement: 'center',
    title: 'What is ELITEA Agents Studio?',
    content: `Agents Studio is a shared library of community-published agents. Unlike the Agents menu — where you create and manage your own agents — Studio gives you read-only access to agents published by other users across all projects.

Each agent in Studio is a fully configured AI assistant built for a specific purpose. You can browse, preview, and start conversations with any published agent without building one from scratch.`,
  },
  {
    id: 'search-and-category-filters',
    target: AGENT_STUDIO_TOUR_TARGETS.searchAndCategoryFilters,
    placement: 'bottom',
    title: 'Search & Category Filters',
    content: `Use search and category filters together to narrow the agent library to what you need:

- **Search** — find agents by name or description; results update as you type
- **Category filters** — filter by Trending, My Liked, or domain categories such as Development, Documentation, Business Analysis, Test Management, Learning, Elitea, and Other
- Multiple category filters can be active simultaneously`,
  },
  {
    id: 'agent-discovery',
    target: AGENT_STUDIO_TOUR_TARGETS.agentCard,
    placement: 'bottom',
    title: 'Agent Discovery',
    content: `Published agents are displayed as cards organized by category. Each card shows the agent name, creator, and like count. Click a card to open a full detail view with the agent's description, read-only instructions, welcome message, and conversation starters — giving you a complete picture of what the agent does before starting a conversation.`,
  },

  {
    id: 'liking-agents',
    target: AGENT_STUDIO_TOUR_TARGETS.likeButton,
    placement: 'top',
    title: 'Liking Agents',
    content: `Click the **heart icon** on any agent card or detail view to like or unlike an agent. Liked agents are saved under the **My Liked** category filter so you can find them quickly later.`,
  },
  {
    id: 'starting-a-conversation',
    target: AGENT_STUDIO_TOUR_TARGETS.startConversationButton,
    placement: 'left',
    title: 'Starting a Conversation',
    content: `From the agent detail view, click **Start Conversation** or click any conversation starter. ELITEA opens a new Chat conversation with the agent already added as a participant and its conversation starters ready to use.

Published agents can also be added directly from Chat without visiting Agents Studio. Use the \`#\` mention or the **+** button in the Participants panel to search for and add any published agent to an ongoing conversation.`,
  },
  {
    id: 'what-you-can-modify-in-a-conversation',
    target: AGENT_STUDIO_TOUR_TARGETS.workspace,
    skip: true, // No specific target element for this step, so attach to workspace
    placement: 'center',
    title: 'What You Can Modify in a Conversation',
    content: `When using a published agent in Chat, you can adjust certain settings for your session without affecting the original agent or how it appears to other users.

Modifiable settings:

- LLM model selection
- Model parameters (temperature, top-P, top-K, max tokens)
- Variable values

Read-only (cannot be changed):

- Agent instructions
- Welcome message
- Conversation starters
- Toolkits attached to the agent

All modifications apply only to your current conversation and do not affect the published agent for other users.`,
  },
];
