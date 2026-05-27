import { SIDEBAR_TOUR_TARGETS } from './sidebarTourTargets.constants.js';

export const SIDEBAR_TOUR_ID = 'sidebar';

export const SIDEBAR_TOUR_COMPLETION = {
  keepExploring: [
    { label: 'Chat Interactive Tour', tourId: 'chat' },
    // { label: 'How to Create Agent', tourId: 'agent' },
    // { label: 'How to Create Pipeline', tourId: 'pipeline' },
  ],
};

export const sidebarTourSteps = [
  {
    id: 'sidebar-logo',
    target: SIDEBAR_TOUR_TARGETS.logo,
    placement: 'right',
    title: 'ELITEA Logo',
    content: `The **ELITEA Logo** in the sidebar shows the server status.

Green mark points that server is working.
Red mark points that server is updating.`,
    skip: false,
  },
  {
    id: 'switch-dark-light-mode',
    target: SIDEBAR_TOUR_TARGETS.themeToggle,
    placement: 'right',
    title: 'Switch Dark/Light Mode',
    content: `The **Switch Dark/Light Mode** button allows you to toggle between dark and light themes for the ELITEA interface.`,
    skip: false,
  },
  {
    id: 'project-switcher',
    target: SIDEBAR_TOUR_TARGETS.projectSwitcher,
    placement: 'right',
    title: 'Project Switcher',
    content: `The **Project Switcher** is a dropdown in the sidebar that controls which project is currently active. All content in ELITEA — agents, pipelines, toolkits, credentials, artifacts, and conversations — is scoped to the selected project. Switching projects immediately updates everything you see in the platform.

**Project Types**

The dropdown lists all projects you have access to, in a fixed order:

- **Private** — your personal workspace; content here is visible only to you, even when credentials or toolkits from it are used in team projects
- **Team projects** — all other projects you are a member of, listed alphabetically below Private

Click the dropdown and select any project to switch to it. If you switch while unsaved work is open or a response is streaming, a confirmation dialog will appear before navigating away.`,
  },
  {
    id: 'create-button',
    target: SIDEBAR_TOUR_TARGETS.createButton,
    placement: 'right',
    title: '+ Create Button',
    content: `The **+ Create** button is a context-aware shortcut that creates a new item for whichever section you are currently viewing. Its action updates automatically as you navigate — so you never need to find a separate "New" button inside each page.

When the sidebar is collapsed, only the **+** icon is shown. Hover over it to see a tooltip confirming what will be created.

The button detects your current page and adjusts its action accordingly:

- **Chat** — starts a new conversation
- **Agents** — opens the new agent creation form
- **Pipelines** — opens the new pipeline creation form
- **Credentials** — opens the new credential creation form
- **Toolkits** — opens the new toolkit creation form
- **MCPs** — opens the new MCP creation form
- **Artifacts** — opens the new bucket creation form
- **Settings → AI Configuration** — opens the new model integration creation form
- **Settings → Personal Tokens** — opens the new personal token creation form
- **Settings → Secrets** — adds a new secret row inline in the secrets table
- **Settings → Users** — opens the Invite Users dialog

The button is disabled when you do not have permission to create the item for the current section.`,
  },
  {
    id: 'chat',
    target: SIDEBAR_TOUR_TARGETS.navChat,
    placement: 'right',
    title: 'Chat',
    content: `**ELITEA Chat** is the central hub where all platform capabilities come together. It provides a conversational interface where you can interact with AI models, agents, pipelines, toolkits, and MCP servers — all in one place, using natural language.

Each conversation is an independent dialogue session. Context is not shared between separate conversations. All conversations are stored on the ELITEA server and accessible from any device.`,
  },
  {
    id: 'agents',
    target: SIDEBAR_TOUR_TARGETS.navAgents,
    placement: 'right',
    title: 'Agents',
    content: `**ELITEA Agents** are customizable AI-powered virtual assistants that automate tasks and streamline workflows. Each agent is built around three core components:

- **Instructions** — define what the agent does and how it behaves
- **Toolkits** — connect external services (GitHub, Jira, Confluence, SQL, and more) and internal tools
- **AI Model** — the language model that powers the agent's reasoning and responses

Once configured, an agent can autonomously execute complex, multi-step tasks such as reviewing code, generating documentation, creating Jira tickets, or querying databases — all without constant human input.`,
  },
  {
    id: 'pipelines',
    target: SIDEBAR_TOUR_TARGETS.navPipelines,
    placement: 'right',
    title: 'Pipelines',
    content: `**ELITEA Pipelines** are visual workflow automation tools that let you design and execute complex, multi-step processes by connecting a series of nodes. Each pipeline can combine LLM calls, toolkit actions, agent interactions, conditional logic, and custom code into a single automated flow.

Unlike a simple agent that responds turn-by-turn, a pipeline follows a defined execution graph — branching, looping, and passing data between steps — so it can handle sophisticated orchestration scenarios end-to-end.`,
  },
  {
    id: 'credentials',
    target: SIDEBAR_TOUR_TARGETS.navCredentials,
    placement: 'right',
    title: 'Credentials',
    content: `**ELITEA Credentials** are saved authentication configurations that let agents, pipelines, and toolkits securely connect to external services. Instead of entering API keys or passwords each time you configure a toolkit, you store them once as a credential and reference that credential by name wherever it is needed.

Credentials are reusable across multiple toolkits and projects, and they can be kept private or shared with team members.`,
  },
  {
    id: 'toolkits',
    target: SIDEBAR_TOUR_TARGETS.navToolkits,
    placement: 'right',
    title: 'Toolkits',
    content: `**ELITEA Toolkits** are modular integrations that connect AI agents, pipelines, and conversations to external platforms and services. Each toolkit packages the connection configuration and a set of tools — specific actions the AI can perform on that service, such as creating issues, querying databases, or searching documents.

Once configured, a toolkit can be attached to any agent or pipeline and used directly in Chat, enabling the AI to automate tasks across different systems without manual intervention.`,
  },
  {
    id: 'applications',
    target: SIDEBAR_TOUR_TARGETS.navApplications,
    placement: 'right',
    title: 'Applications',
    content: `**ELITEA Applications** are purpose-built AI applications that extend ELITEA beyond agents and pipelines. Each application provides a dedicated interface and a ready-to-use set of tools that can also be referenced in agents and pipelines.`,
  },
  {
    id: 'mcps',
    target: SIDEBAR_TOUR_TARGETS.navMcps,
    placement: 'right',
    title: 'MCPs',
    content: `**ELITEA MCPs** (Model Context Protocol servers) are external tool providers that follow the MCP specification to expose specialized capabilities to your agents, pipelines, and conversations. Unlike native toolkits, MCPs connect to independently hosted servers — local or remote — that supply their own set of tools.

Once configured, MCP tools are available everywhere toolkits are used: in agents, pipelines, and Chat, enabling automation that spans browser control, repository operations, API integrations, and other domain-specific tasks.`,
  },
  {
    id: 'artifacts',
    target: SIDEBAR_TOUR_TARGETS.navArtifacts,
    placement: 'right',
    title: 'Artifacts',
    content: `**ELITEA Artifacts** is a file storage system built into the platform. Files are organized into **buckets** — named containers with configurable retention policies. Buckets can hold any file type and support nested folder structures up to 10 levels deep.

Artifacts are used to store outputs generated by agents and pipelines, share files across team workflows, and keep reference data accessible within the platform.`,
  },
  {
    id: 'agents-studio',
    target: SIDEBAR_TOUR_TARGETS.agentsStudio,
    placement: 'right',
    title: 'Agents Studio',
    content: `**Agents Studio** is a shared library of community-published agents. Unlike the Agents menu — where you create and manage your own agents — Studio gives you read-only access to agents published by other users across all projects.

Each agent in Studio is a fully configured AI assistant built for a specific purpose. You can browse, preview, and start conversations with any published agent without building one from scratch.`,
  },
  {
    id: 'settings',
    target: SIDEBAR_TOUR_TARGETS.settings,
    placement: 'right',
    title: 'Settings',
    content: `**Settings** is the project-level administration area where you configure AI integrations, manage access, and control platform behaviour. It opens as a panel with a navigation drawer listing all available sections.

Settings are project-specific — the sections available depend on which project is selected and what permissions your role grants.`,
  },
  {
    id: 'resources',
    target: SIDEBAR_TOUR_TARGETS.resources,
    placement: 'right',
    title: 'Resources',
    content: `The **Resources** page is a central hub for learning and reference material. It provides quick access to documentation, release notes, video walkthroughs, tutorials, and interactive tours — all in one place, without leaving the platform.

The page also displays the current ELITEA version and any installed plugin versions in the header area.`,
  },
  {
    id: 'notifications',
    target: SIDEBAR_TOUR_TARGETS.notifications,
    placement: 'right',
    title: 'Notifications',
    content: `## What is the Notifications?

The Notification Center keeps you informed about platform events — published agents, indexing results, bucket expiration warnings, token expiry alerts, and more. Notifications arrive in real time via a live connection; a dot indicator on the sidebar button signals unread items.`,
    skip: false,
  },
  {
    id: 'user',
    target: SIDEBAR_TOUR_TARGETS.user,
    placement: 'right',
    title: 'User Menu',
    content: `The **User Menu** gives you quick access to your profile settings and the logout option. Click it to open a dropdown with **Personalization** — where you can manage your profile — and **Logout** to end your session.`,
  },
  {
    id: 'support-assistant',
    target: SIDEBAR_TOUR_TARGETS.supportAssistant,
    placement: 'right',
    title: 'Support Assistant',
    content: `The Support Assistant is a context-aware AI chatbot embedded directly in the ELITEA platform. It provides instant help, answers questions about features, and guides you through workflows — without leaving your current page.`,
  },
];
