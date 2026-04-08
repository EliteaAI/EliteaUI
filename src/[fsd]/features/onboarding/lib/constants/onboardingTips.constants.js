// Import all onboarding tip images
import tip14 from '@/assets/onbording/add-assistants.png';
import tip45 from '@/assets/onbording/add-from-panel.png';
import tip39 from '@/assets/onbording/add-teammates.png';
import tip27 from '@/assets/onbording/add-toolkit-to-agent.png';
import tip24 from '@/assets/onbording/agent-created.png';
import tip21 from '@/assets/onbording/agent-first-save.png';
import tip18 from '@/assets/onbording/agent-instructions.png';
import tip23 from '@/assets/onbording/agent-model-settings.png';
import tip17 from '@/assets/onbording/agent-required-fields.png';
import tip22 from '@/assets/onbording/agent-select-model.png';
import tip20 from '@/assets/onbording/agent-starters.png';
import tip19 from '@/assets/onbording/agent-welcome.png';
import tip38 from '@/assets/onbording/attach-files.png';
import tip37 from '@/assets/onbording/attachment-setup.png';
import tip47 from '@/assets/onbording/chat-folders.png';
import tip16 from '@/assets/onbording/create-agent-start.png';
import tip10 from '@/assets/onbording/create-credentials.png';
import tip29 from '@/assets/onbording/create-pipeline-start.png';
import tip08 from '@/assets/onbording/create-toolkit-start.png';
import tip34 from '@/assets/onbording/design-workflow.png';
import tip26 from '@/assets/onbording/edit-agent.png';
import tip41 from '@/assets/onbording/edit-in-canvas.png';
import tip12 from '@/assets/onbording/enable-tools.png';
import tip04 from '@/assets/onbording/first-chat.png';
import tip06 from '@/assets/onbording/first-message.png';
import tip32 from '@/assets/onbording/flow-editor-tab.png';
import tip40 from '@/assets/onbording/mention-teammates.png';
import tip42 from '@/assets/onbording/message-actions.png';
import tip48 from '@/assets/onbording/message-details.png';
import tip05 from '@/assets/onbording/model-selection.png';
import tip43 from '@/assets/onbording/multi-assistant.png';
import tip07 from '@/assets/onbording/participants-panel.png';
import tip30 from '@/assets/onbording/pipeline-config.png';
import tip35 from '@/assets/onbording/pipeline-model-toolkits.png';
import tip33 from '@/assets/onbording/pipeline-nodes.png';
import tip31 from '@/assets/onbording/pipeline-save-first.png';
import tip03 from '@/assets/onbording/project-selector.png';
import tip46 from '@/assets/onbording/search-conversations.png';
import tip02 from '@/assets/onbording/sidebar-navigation.png';
import tip44 from '@/assets/onbording/switch-assistant.png';
import tip25 from '@/assets/onbording/test-agent.png';
import tip36 from '@/assets/onbording/test-pipeline.png';
import tip11 from '@/assets/onbording/toolkit-configuration.png';
import tip13 from '@/assets/onbording/toolkit-in-chat.png';
import tip09 from '@/assets/onbording/toolkit-types.png';
import tip01 from '@/assets/onbording/welcome-interface.png';
import tip15 from '@/assets/onbording/what-are-agents.png';
import tip28 from '@/assets/onbording/what-are-pipelines.png';

export const onboardingTips = [
  {
    tip: '### Tip 1: Welcome to ELITEA\n\nELITEA is your AI-powered workspace where you create intelligent agents, automate workflows with pipelines, and chat with powerful AI models. Everything you need is organized in the left sidebar for easy access.\n\n**Quick Action:** Click the ELITEA logo (top-left) to explore all available menus.',
    image: tip01,
  },
  {
    tip: '### Tip 2: Navigate the Sidebar\n\nYour main navigation lives in the left sidebar: Chat for conversations, Agents for AI assistants, Pipelines for workflows, Collections for organization, and more. Each menu gives you quick access to create and manage your AI resources.\n\n**Quick Action:** Hover over each sidebar icon to see what it does.',
    image: tip02,
  },
  {
    tip: '### Tip 3: Switch Between Projects\n\nUse the Project Selector at the top of the sidebar to switch between your **Private** workspace and "**Team**" Projects. Your Private project is your personal sandbox for experimentation.\n\n**Quick Action:** Click the project dropdown to see all available workspaces.',
    image: tip03,
  },
  {
    tip: '### Tip 4: Chat is Your Command Center\n\nThe Chat menu is where everything happens! You can talk to AI models, create toolkits, agents and pipelines on the fly, add teammates, attach files, and edit everything using Canvas—all without leaving your conversation.\n\n**Quick Action:** Navigate to Chat and click "+ Create" to start a conversation.',
    image: tip04,
  },
  {
    tip: '### Tip 5: Choose Your AI Model\n\nIn any conversation, you can select from multiple AI models (GPT-4o, Anthropic Claude 3.7 Sonnet, and more) using the model dropdown at the bottom of Chat. Different models excel at different tasks—experiment to find what works best!\n\n**Quick Action:** Click the model selector dropdown at the bottom of Chat to explore models.',
    image: tip05,
  },
  {
    tip: '### Tip 6: Send Your First Message\n\nReady to interact with AI? Type your message in the chat input box at the bottom and press Enter or click Send. Try asking: "Create a brief article about Smoke Testing." Watch the AI generate a response instantly!\n\n**Quick Action:** Type "Create a brief article about Smoke Testing." and click **Send** icon.',
    image: tip06,
  },
  {
    tip: '### Tip 7: Understanding Participants\n\nThe Participants panel on the right shows everyone in your conversation—both AI assistants (agents, pipelines, toolkits, MCPs) and human teammates. Each collapsible section lets you add or remove participants. This is your collaboration hub!\n\n**Quick Action:** Look at the Participants panel to see all available participant types.',
    image: tip07,
  },
  {
    tip: '### Tip 8: Connect Your First Toolkit from Chat\n\nToolkits connect AI to external services like Jira, GitHub, Confluence, and more. Start by clicking **+** next to "Toolkits" in the Participants panel, then click "**+ Create new Toolkit**".\n\n**Quick Action:** Click + next to Toolkits > Click "+ Create new Toolkit".',
    image: tip08,
  },
  {
    tip: '### Tip 9: Configure Jira Toolkit\n\nSelect "**Jira**" as the toolkit type from the dropdown. Fill in the required fields: **Name*** (e.g., "My Jira Integration") and **Description*** (what this toolkit will be used for).\n\n**Quick Action:** Select Jira type > Fill Name and Description fields.',
    image: tip09,
  },
  {
    tip: '### Tip 10: Create Credentials from Toolkit\n\nIn the toolkit configuration, you\'ll need credentials to connect. Click the "**+ Create**" button next to the Credentials dropdown. A new page opens (in new tab) where you enter your Jira API token, email, and server URL. Save the credential.\n\n**Quick Action:** Click "+ Create" next to Credentials > Fill in API details > Save.',
    image: tip10,
  },
  {
    tip: '### Tip 11: Return and Select Your Credential\n\nAfter saving your credential, return to the toolkit configuration page. Click the **Refresh** icon next to the Credentials dropdown. Your newly created credential now appears in the list—select it!\n\n**Quick Action:** Click refresh icon > Select your new credential from dropdown.',
    image: tip11,
  },
  {
    tip: '### Tip 12: Enable Jira Tools\n\nScroll to the TOOLS section and check the tools you want to use. For Jira, try enabling "search_issues", "Create issue", and "Get issue". Only enable what you need—this improves security and performance!\n\n**Quick Action:** Check "search_issues", "Create issue", "Get issue" in TOOLS section.',
    image: tip12,
  },
  {
    tip: '### Tip 13: Save and Use Your Toolkit\n\nClick **Save** to create your toolkit. Close the Canvas (X button). Your Jira toolkit now appears in the Participants panel. The AI can automatically use it when you ask Jira-related questions!\n\n**Quick Action:** Click Save > Close Canvas > Ask "What are recently opened Jira issues?"',
    image: tip13,
  },
  {
    tip: '### Tip 14: Add AI Assistants with #\n\nType **#** in the chat input to search for Agents, Pipelines, Toolkits, or MCP servers. Select one from the dropdown—it appears as a chip above the input box. Click on it to make it active for your next message!\n\n**Quick Action:** Type # in chat, select an assistant, then click it to activate.',
    image: tip14,
  },
  {
    tip: '### Tip 15: What Are Agents?\n\nAgents are AI assistants with specific instructions and capabilities. They can search the web, create tickets, analyze data, or handle any task you define. Each agent combines an AI model with custom instructions and optional toolkits to become a specialized teammate!\n\n**Quick Action:** In Chat, type # and browse existing agents to see examples.',
    image: tip15,
  },
  {
    tip: '### Tip 16: Start Creating an Agent\n\nIn the Participants panel, click the **+** icon next to "Agents", then click "**+ Create new**". The Agent Canvas interface opens—this is your visual editor for configuring everything about your agent!\n\n**Quick Action:** Click + next to Agents > Click "+ Create new".',
    image: tip16,
  },
  {
    tip: '### Tip 17: Fill Required Agent Fields\n\nIn the Canvas interface, start with the GENERAL section. Enter a **Name*** (e.g., "Code Review Assistant") and **Description*** (what your agent does). Required fields are marked with * and must be filled before you can save!\n\n**Quick Action:** Fill in Name and Description fields in the GENERAL section.',
    image: tip17,
  },
  {
    tip: '### Tip 18: Write Agent Instructions\n\nIn the INSTRUCTIONS section, tell your agent exactly how to behave. Example: "You are a code reviewer that checks for security issues, performance concerns, and best practices. Always be constructive and specific." Clear instructions = better results!\n\n**Quick Action:** Write detailed instructions in the INSTRUCTIONS section.',
    image: tip18,
  },
  {
    tip: '### Tip 19: Add Welcome Message (Optional)\n\nIn the WELCOME MESSAGE section, write what users see when they first interact with your agent. Example: "Hello! I\'m your code review assistant. Share your code and I\'ll help identify improvements!"\n\n**Quick Action:** Add a friendly welcome message for your agent.',
    image: tip19,
  },
  {
    tip: '### Tip 20: Add Conversation Starters\n\nIn the CONVERSATION STARTERS section, click "+ Starter" to add helpful prompts (maximum 4). Examples: "Review this code", "Check for security issues", "Explain best practices". Guide users on how to use your agent!\n\n**Quick Action:** Click "+ Starter" and add 2-3 useful prompts.',
    image: tip20,
  },
  {
    tip: '### Tip 21: Save Initial Configuration\n\nAfter filling required fields and instructions, click the **Save** button. This creates your agent and opens the advanced configuration interface where you can select AI models, add toolkits, and fine-tune settings!\n\n**Quick Action:** Click Save to proceed to advanced configuration.',
    image: tip21,
  },
  {
    tip: '### Tip 22: Select AI Model for Agent\n\nIn the advanced configuration, click "**Select LLM Model**" to choose which AI model powers your agent (GPT-4, Claude, etc.). Each model has different strengths—choose based on your agent\'s task!\n\n**Quick Action:** Click "Select LLM Model" and choose a model.',
    image: tip22,
  },
  {
    tip: '### Tip 23: Configure Model Settings\n\nClick the **Model Settings** icon (⚙️) next to the model selector to fine-tune parameters. Set Temperature (0.1=focused, 1.0=creative), Top P, and Max Completion Tokens. Click Apply to save these settings!\n\n**Quick Action:** Click ⚙️ icon, adjust Temperature, click Apply.',
    image: tip23,
  },
  {
    tip: '### Tip 24: Your Agent is Created!\n\nAfter configuring model settings, click the **X** to close Canvas. Your new agent appears in the Participants panel under "Agents" and is immediately ready to use in your conversation!\n\n**Quick Action:** Close Canvas to see your agent in the Participants panel.',
    image: tip24,
  },
  {
    tip: '### Tip 25: Test Your New Agent\n\nTo test your agent, type **#YourAgentName** in the chat input and select it. Click on the agent chip to make it active (it will be highlighted). Now type a message or click a conversation starter and send—watch your agent respond!\n\n**Quick Action:** Type #[AgentName], click the chip, send a test message.',
    image: tip25,
  },
  {
    tip: '### Tip 26: Edit Agents Anytime\n\nNeed to update your agent? In the Participants panel, hover over the agent and click the **Edit** icon that appears. The Canvas interface reopens with all current settings—modify anything and save. Changes apply immediately!\n\n**Quick Action:** Hover over agent in Participants, click Edit icon.',
    image: tip26,
  },
  {
    tip: '### Tip 27: Add Toolkits to Agents\n\nSupercharge your agent by adding toolkits! In the agent configuration, find the TOOLKITS section and select from your created toolkits (like Jira, GitHub, Confluence). Your agent can now interact with those external services automatically!\n\n**Quick Action:** Open agent settings, scroll to TOOLKITS, select a toolkit, Save.',
    image: tip27,
  },
  {
    tip: '### Tip 28: What Are Pipelines?\n\nPipelines are automated workflows that chain together multiple AI steps, decisions, loops, and tool calls. Perfect for complex processes like "read ticket → analyze → create subtasks → update status"—all happening automatically!\n\n**Quick Action:** In Chat, type # and browse existing pipelines to see examples.',
    image: tip28,
  },
  {
    tip: '### Tip 29: Start Creating a Pipeline\n\nIn the Participants panel, click the **+** icon next to "Pipelines", then click "**+ Create new**". The Pipeline Canvas interface opens with Configuration and Flow Editor tabs—this is where you build your automated workflows!\n\n**Quick Action:** Click + next to Pipelines > Click "+ Create new".',
    image: tip29,
  },
  {
    tip: '### Tip 30: Configure Pipeline Basics\n\nIn the Configuration tab, fill the GENERAL section with **Name*** (e.g., "Customer Feedback Pipeline") and **Description***. Add optional Welcome Message and Conversation Starters just like with agents. Configure step limit in ADVANCED section (default: 25 steps).\n\n**Quick Action:** Fill Name and Description, optionally add starters.',
    image: tip30,
  },
  {
    tip: '### Tip 31: Save to Unlock Flow Editor\n\nClick **Save** to create your pipeline. Important: The Flow Editor tab is disabled until you save! After saving, the advanced configuration opens where you can design your visual workflow in the Flow Editor tab.\n\n**Quick Action:** Click Save to unlock the Flow Editor tab.',
    image: tip31,
  },
  {
    tip: '### Tip 32: Access the Flow Editor\n\nAfter saving, click the **Flow Editor** tab to design your workflow visually. The Flow Editor uses a drag-and-drop canvas where you connect nodes to create your automation logic. This is where pipelines come to life!\n\n**Quick Action:** Click the "Flow Editor" tab after initial save.',
    image: tip32,
  },
  {
    tip: '### Tip 33: Add Nodes to Your Workflow\n\nIn Flow Editor, click **+ Add Node** to see available node types: Agent (AI conversations), Function (tool calls), Condition (if/else logic), Loop (repetition), Router (multiple paths), and more. Each node performs a specific workflow step!\n\n**Quick Action:** Click "+ Add Node" to explore node types.',
    image: tip33,
  },
  {
    tip: '### Tip 34: Design Your Workflow Visually\n\nDrag nodes onto the canvas and connect them by drawing lines between connection points. Each connection shows the flow of data and control through your pipeline. Build complex logic without writing code!\n\n**Quick Action:** Drag an Agent node onto the canvas and connect it.',
    image: tip34,
  },
  {
    tip: '### Tip 35: Configure Pipeline Model & Toolkits\n\nReturn to the Configuration tab to select the LLM model for your pipeline and add toolkits, nested agents, or nested pipelines. Pipelines can use everything agents can—plus they orchestrate multiple steps!\n\n**Quick Action:** Click Configuration tab, select model, add toolkits.',
    image: tip35,
  },
  {
    tip: '### Tip 36: Save and Test Your Pipeline\n\nAfter designing your workflow, click **Save** and close the Canvas (X button). Your pipeline appears in the Participants panel. Add it to Chat with **#PipelineName**, activate it, and send a message to watch it execute each step!\n\n**Quick Action:** Save pipeline, add to Chat with #, test it.',
    image: tip36,
  },
  {
    tip: '### Tip 37: Enable File Attachments\n\nClick the paperclip icon (📎) in Chat. First time, an "Attachment settings" popup appears. Select an existing Artifact Toolkit or create a new one to store files. Save the configuration. Now the attachment feature is enabled for this conversation!\n\n**Quick Action:** Click 📎, configure Artifact Toolkit, save settings.',
    image: tip37,
  },
  {
    tip: '### Tip 38: Attach Files to Chat\n\nOnce enabled, click the paperclip icon again to see "Attach files" and "Attachment settings". Click "Attach files", select images or documents, type a message describing what you want the AI to do, and send. AI analyzes your files!\n\n**Quick Action:** Click 📎 > Attach files > Select file > Type message > Send.',
    image: tip38,
  },
  {
    tip: '### Tip 39: Add Human Teammates (Team Projects Only)\n\nCollaborate with colleagues! In the Participants panel, click the **users icon** next to your avatar to see "Add users" option. Click it, search for teammates by name, select them, and click Add. They join the conversation and can interact!\n\n**Quick Action:** Click users icon in Participants > Add users > Select > Add.',
    image: tip39,
  },
  {
    tip: '### Tip 40: Mention Teammates with @\n\nTo get a teammate\'s attention, type **@** in your message followed by their name (e.g., "@John Doe, can you review this?"). They receive a notification. Use "@All Users" to notify everyone in the conversation!\n\n**Quick Action:** Type @ in message, select teammate, complete message.',
    image: tip40,
  },
  {
    tip: '### Tip 41: Edit Participants Using Canvas\n\nHover over any agent, pipeline, or toolkit in the Participants panel and click the **Edit** icon (or click ⚙️ settings icon). The Canvas editor opens where you can modify all settings—instructions, models, toolkits, workflow design—and save changes instantly!\n\n**Quick Action:** Hover over participant > Click Edit icon > Modify > Save.',
    image: tip41,
  },
  {
    tip: '### Tip 42: Copy and Regenerate Responses\n\nHover over any AI response to see action buttons: **Copy** (paste elsewhere), **Regenerate** (get a different response). Make AI outputs actionable and collaborative!\n\n**Quick Action:** Hover over AI message to reveal action buttons.',
    image: tip42,
  },
  {
    tip: '### Tip 43: Multi-Assistant Collaboration\n\nAdd multiple agents or pipelines to one conversation! They can work together—one agent gathers data, another analyzes it, a third creates tickets. Build powerful multi-step workflows where specialists collaborate automatically!\n\n**Quick Action:** Add 2+ agents using #, activate each when needed.',
    image: tip43,
  },
  {
    tip: '### Tip 44: Switch Active Participants\n\nAt the bottom of the chat input, click the "Switch assistant" icon to quickly change which agent or pipeline is active. The active participant will respond to your next message. Switch seamlessly between different AI specialists!\n\n**Quick Action:** Click the assistant switcher at the bottom of chat input.',
    image: tip44,
  },
  {
    tip: '### Tip 45: Add Participants from Panel\n\nClick the **+** icon next to any section in the Participants panel (Agents, Pipelines, Toolkits, MCPs, or Users) to browse and add participants. They\'ll appear in the list and be ready to use in your conversation.\n\n**Quick Action:** Click + next to "Agents" in Participants to see available agents.',
    image: tip45,
  },
  {
    tip: '### Tip 46: Search Your Conversations\n\nUse the search bar at the top of the Chat sidebar to find specific conversations by name or content. Filter by date, participants, or project. Never lose track of important conversations!\n\n**Quick Action:** Click search icon in Chat sidebar, enter search terms.',
    image: tip46,
  },
  {
    tip: '### Tip 47: Organize Chats with Folders\n\nKeep conversations organized by clicking "+ Create folder" in the Chat sidebar. Name your folder (like "Work Projects" or "Experiments"), then drag conversations into it. Public and private folders help you structure your workspace!\n\n**Quick Action:** Click "+ Create folder" in Chat sidebar and name it.',
    image: tip47,
  },
  {
    tip: '### Tip 48: View Message Execution Details\n\nClick on any AI response message in Chat to expand execution details. See timing information, execution logs, and which tools were called. Perfect for understanding performance and debugging workflows!\n\n**Quick Action:** Click any AI message to expand execution details.',
    image: tip48,
  },
];
