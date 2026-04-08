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
      text: 'Enable AI-powered image generation capabilities',
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
      text: 'Enable data analysis capabilities using',
      linkText: 'Pandas',
      linkUrl: 'https://pandas.pydata.org/docs/',
      suffix: '. Works with files from conversation attachments.',
    },
    toolkitNames: ['data_analysis'],
  },
  {
    name: 'planner',
    title: 'Planner',
    icon: 'CalendarIcon',
    infoTooltip: {
      text: 'Enable managing and tracking todo items for task planning',
    },
    toolkitNames: ['planner'],
  },
  {
    name: 'pyodide',
    title: 'Python sandbox',
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
    title: 'Smart Tools Selection',
    icon: 'GearIcon',
    infoTooltip: {
      text: 'Reduces token usage by using meta-tools instead of binding all tools directly. Recommended when using many toolkits.',
    },
    toolkitNames: ['lazy_tools_mode'],
  },
];
