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
    id: 'notifications',
    target: SIDEBAR_TOUR_TARGETS.notifications,
    placement: 'right',
    title: 'Notifications',
    content: `The **Notifications** bell icon keeps you informed about platform events — published agents, indexing results, bucket expiration warnings, token expiry alerts, and more. Notifications arrive in real time via a live connection; a dot indicator signals unread items.

Click the bell to open a quick panel showing your most recent notifications. Use **View all** to open the full Notification Center.`,
    skip: false,
  },
  {
    id: 'project-switcher',
    target: SIDEBAR_TOUR_TARGETS.projectSwitcher,
    placement: 'right',
    title: 'Project Switcher',
    content: `The **Project Switcher** is a dropdown in the sidebar that controls which project is currently active. All content in ELITEA — agents, pipelines, toolkits, credentials, artifacts, and chats — is scoped to the selected project. Switching projects immediately updates everything you see in the platform.

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

- **Chats** — starts a new chat
- **Agents** — opens the new agent creation form
- **Pipelines** — opens the new pipeline creation form
- **Skills** — opens the new skill creation form
- **Toolkits** — opens the new toolkit creation form
- **MCPs** — opens the new MCP creation form
- **Credentials** — opens the new credential creation form
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
    title: 'Chats',
    content: `**ELITEA Chats** is the central hub where all platform capabilities come together. It provides a conversational interface where you can interact with AI models, agents, pipelines, toolkits, and MCP servers — all in one place, using natural language.

Each chat is an independent dialogue session. Context is not shared between separate chats. All chats are stored on the ELITEA server and accessible from any device.`,
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
    id: 'skills',
    target: SIDEBAR_TOUR_TARGETS.navSkills,
    placement: 'right',
    title: 'Skills',
    content: `**ELITEA Skills** are reusable prompt templates that encapsulate specific expertise or tasks. Each skill defines a focused instruction set that can be attached to agents or used directly in chat to guide the AI's behaviour for a particular purpose — such as code review, summarization, translation, or data extraction.

Skills let you standardize and share prompt engineering across your team without duplicating effort.`,
  },
  {
    id: 'toolkits',
    target: SIDEBAR_TOUR_TARGETS.navToolkits,
    placement: 'right',
    title: 'Toolkits',
    content: `**ELITEA Toolkits** are modular integrations that connect AI agents, pipelines, and chats to external platforms and services. Each toolkit packages the connection configuration and a set of tools — specific actions the AI can perform on that service, such as creating issues, querying databases, or searching documents.

Once configured, a toolkit can be attached to any agent or pipeline and used directly in Chat, enabling the AI to automate tasks across different systems without manual intervention.`,
  },
  {
    id: 'mcps',
    target: SIDEBAR_TOUR_TARGETS.navMcps,
    placement: 'right',
    title: 'MCPs',
    content: `**ELITEA MCPs** (Model Context Protocol servers) are external tool providers that follow the MCP specification to expose specialized capabilities to your agents, pipelines, and chats. Unlike native toolkits, MCPs connect to independently hosted servers — local or remote — that supply their own set of tools.

Once configured, MCP tools are available everywhere toolkits are used: in agents, pipelines, and Chat, enabling automation that spans browser control, repository operations, API integrations, and other domain-specific tasks.`,
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
    id: 'applications',
    target: SIDEBAR_TOUR_TARGETS.navApplications,
    placement: 'right',
    title: 'Applications',
    content: `**ELITEA Applications** are purpose-built AI applications that extend ELITEA beyond agents and pipelines. Each application provides a dedicated interface and a ready-to-use set of tools that can also be referenced in agents and pipelines.`,
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
    id: 'settings',
    target: SIDEBAR_TOUR_TARGETS.settings,
    placement: 'right',
    title: 'Settings',
    content: `**Settings** is the project-level administration area where you configure AI integrations, manage access, and control platform behaviour. It opens as a panel with a navigation drawer listing all available sections.

Settings are divided into **PROJECT** settings (AI Configuration, Project Params, Secrets, Users, Analytics) and **PERSONAL** settings (Personalization, Personal Tokens, Notifications, Log out).`,
  },
  {
    id: 'agent-hub',
    target: SIDEBAR_TOUR_TARGETS.agentHub,
    placement: 'right',
    title: 'Agents HUB',
    content: `**Agents HUB** is a shared library of community-published agents. Unlike the Agents menu — where you create and manage your own agents — HUB gives you read-only access to agents published by other users across all projects.

Each agent in HUB is a fully configured AI assistant built for a specific purpose. You can browse, preview, and start chats with any published agent without building one from scratch.`,
  },
  {
    id: 'resources',
    target: SIDEBAR_TOUR_TARGETS.resources,
    placement: 'right',
    title: 'Help Center',
    content: `The **Help Center** page is a central hub for learning and reference material. It provides quick access to documentation, release notes, video walkthroughs, tutorials, and interactive tours — all in one place, without leaving the platform.

The page also displays the current ELITEA version and any installed plugin versions in the header area.`,
  },
  {
    id: 'support-assistant',
    target: SIDEBAR_TOUR_TARGETS.supportAssistant,
    placement: 'right',
    title: 'Support Assistant',
    content: `The Support Assistant is a context-aware AI chatbot embedded directly in the ELITEA platform. It provides instant help, answers questions about features, and guides you through workflows — without leaving your current page.`,
  },
];
