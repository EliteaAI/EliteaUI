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
      text: 'Allow the agent to use uploaded files and images as context during conversations.',
    },
    // Hidden by default for LLM chats (always enabled), only shown for agents
    agentOnly: true,
    toolkitNames: ['attachments', 'Attachments'],
  },
  {
    name: 'image_generation',
    title: 'Image Creation',
    icon: 'ImageSvgIcon',
    infoTooltip: {
      text: 'Generate images from the chat.',
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
      text: 'Perform ',
      linkText: 'Pandas-based',
      linkUrl: 'https://pandas.pydata.org/docs/',
      suffix: ' data analysis on uploaded files.',
    },
    toolkitNames: ['data_analysis'],
  },
  {
    name: 'internal_mcp',
    title: 'Agent & Pipeline Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and edit agents and pipelines from the chat.',
    },
    toolkitNames: ['internal_mcp'],
  },
  {
    name: 'skill_builder',
    title: 'Skill Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and edit skills from the chat.',
    },
    toolkitNames: ['skill_builder'],
  },
  {
    name: 'project_context_builder',
    title: 'Project Context Builder',
    icon: 'McpIcon',
    infoTooltip: {
      text: 'Create and edit your project context from the chat.',
    },
    toolkitNames: ['project_context_builder'],
  },
  {
    name: 'ask_user',
    title: 'Ask User',
    icon: 'ChatIcon',
    infoTooltip: {
      text: 'Allow agents to ask you clarifying questions instead of guessing.',
    },
    toolkitNames: ['ask_user'],
  },
  {
    name: 'planner',
    title: 'Planner',
    icon: 'CalendarIcon',
    infoTooltip: {
      text: 'Create, manage, and track tasks and action items from the chat.',
    },
    toolkitNames: ['planner'],
  },
  {
    name: 'pyodide',
    title: 'Python Sandbox',
    icon: 'CodeIcon',
    infoTooltip: {
      text: 'Execute Python code in a secure sandbox using ',
      linkText: 'Pyodide',
      linkUrl: 'https://pyodide.org/en/stable/usage/packages-in-pyodide.html',
      suffix: '.',
    },
    toolkitNames: ['pyodide'],
  },
  {
    name: 'swarm',
    title: 'Swarm Mode',
    icon: 'UsersIcon',
    infoTooltip: {
      text: 'Enable multi-agent collaboration by sharing the full conversation history and control between agents.',
    },
    toolkitNames: ['swarm'],
  },
  {
    name: 'lazy_tools_mode',
    title: 'Smart Tools Selection',
    icon: 'GearIcon',
    infoTooltip: {
      text: 'Reduce token usage when working with many toolkits by using meta-tools instead of binding all tools directly.',
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
  ask_user: 'default_agent_ask_user_enabled',
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
