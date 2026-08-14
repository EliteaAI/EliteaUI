// Toolkit type key used to check if image generation is available via provider plugin
export const IMAGE_GENERATION_TOOLKIT_TYPE = 'ImageGenServiceProvider_ImageGen';

// Default bucket name for file attachments (must match backend constant)
export const DEFAULT_ATTACHMENT_BUCKET = 'attachments';

export const INTERNAL_TOOLS_LIST = [
  {
    name: 'attachments',
    title: 'Attachments',
    icon: 'AttachSvgIcon',
    infoTooltip: {
      text: 'Enable file attachment capabilities for document upload, indexing, and search operations in conversations.',
    },
    // Hidden by default for LLM chats (always enabled), only shown for agents
    agentOnly: true,
    toolkitNames: ['attachments', 'Attachments'],
  },
  {
    name: 'image_generation',
    title: 'Image creation',
    icon: 'ImageSvgIcon',
    infoTooltip: {
      text: 'Enable AI-powered image generation capabilities.',
    },
    // Requires ImageGenServiceProvider_ImageGen toolkit to be available
    requiredToolkitType: IMAGE_GENERATION_TOOLKIT_TYPE,
    toolkitNames: ['ImageGen', 'image_generation'],
  },
  {
    name: 'data_analysis',
    title: 'Data Analysis',
    icon: 'DatabaseIcon',
    infoTooltip: {
      text: 'Enable data analysis capabilities using.',
      linkText: 'Pandas',
      linkUrl: 'https://pandas.pydata.org/docs/',
      suffix: '. Works with files from conversation attachments.',
    },
    toolkitNames: ['data_analysis'],
  },
  {
    name: 'internal_mcp',
    title: 'Agents & Pipeline Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and update agents and pipelines directly from chat.',
    },
    toolkitNames: ['internal_mcp'],
  },
  {
    name: 'skill_builder',
    title: 'Skill Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and update skills from chat using internal Elitea MCP tools.',
    },
    toolkitNames: ['skill_builder'],
  },
  {
    name: 'project_context_builder',
    title: 'Project Context Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and update project context from chat using internal Elitea MCP tools.',
    },
    toolkitNames: ['project_context_builder'],
  },
  {
    name: 'planner',
    title: 'Planner',
    icon: 'CalendarIcon',
    infoTooltip: {
      text: 'Enable managing and tracking todo items for task planning.',
    },
    toolkitNames: ['planner'],
  },
  {
    name: 'pyodide',
    title: 'Python Sandbox',
    icon: 'CodeIcon',
    infoTooltip: {
      text: 'Enable Python code execution in a secure sandbox using',
      linkText: 'Pyodide',
      linkUrl: 'https://pyodide.org/en/stable/usage/packages-in-pyodide.html',
      suffix: '.',
    },
    toolkitNames: ['pyodide'],
  },
  {
    name: 'ask_user',
    title: 'Ask User',
    icon: 'ChatIcon',
    infoTooltip: {
      text: 'Let the agent pause and ask you a clarifying question (multiple choice or free text) when it is uncertain, instead of guessing.',
    },
    toolkitNames: ['ask_user'],
  },
  {
    name: 'swarm',
    title: 'Swarm Mode',
    icon: 'UsersIcon',
    infoTooltip: {
      text: 'Enable swarm-style multi-agent collaboration. When enabled, all child agents share the full conversation history and can hand off control to each other.',
    },
    toolkitNames: ['swarm'],
  },
  {
    name: 'lazy_tools_mode',
    title: 'Smart Tool Selection',
    icon: 'GearIcon',
    infoTooltip: {
      text: 'Reduces token usage by using meta-tools instead of binding all tools directly. Recommended when using many toolkits.',
    },
    toolkitNames: ['lazy_tools_mode'],
  },
];

export const INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP = {
  internal_mcp: 'default_internal_mcp_enabled',
  skill_builder: 'default_skill_builder_enabled',
  project_context_builder: 'default_project_context_builder_enabled',
  ask_user: 'default_ask_user_enabled',
  image_generation: 'default_image_generation_enabled',
  data_analysis: 'default_data_analysis_enabled',
  planner: 'default_planner_enabled',
  pyodide: 'default_pyodide_enabled',
  swarm: 'default_swarm_enabled',
  lazy_tools_mode: 'default_lazy_tools_mode_enabled',
};

export const INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP = {
  internal_mcp: 'default_agent_internal_mcp_enabled',
  skill_builder: 'default_agent_skill_builder_enabled',
  project_context_builder: 'default_agent_project_context_builder_enabled',
  image_generation: 'default_agent_image_generation_enabled',
  data_analysis: 'default_agent_data_analysis_enabled',
  planner: 'default_agent_planner_enabled',
  pyodide: 'default_agent_pyodide_enabled',
  swarm: 'default_agent_swarm_enabled',
  lazy_tools_mode: 'default_agent_lazy_tools_mode_enabled',
};

export const getEnabledInternalToolNames = personalization => {
  return Object.entries(INTERNAL_TOOL_PERSONALIZATION_FIELD_MAP)
    .filter(([, fieldName]) => personalization?.[fieldName])
    .map(([toolName]) => toolName);
};

export const getEnabledAgentInternalToolNames = personalization => {
  return Object.entries(INTERNAL_TOOL_AGENT_PERSONALIZATION_FIELD_MAP)
    .filter(([, fieldName]) => personalization?.[fieldName])
    .map(([toolName]) => toolName);
};
