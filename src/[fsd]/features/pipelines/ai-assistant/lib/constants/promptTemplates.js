/**
 * AI Assistant prompt templates for different field types in pipeline nodes
 */

export const AI_PROMPT_TEMPLATES = {
  system: {
    servicePromptKey: 'llm_system_assistant',
    description: 'System message generation for LLM node',
  },
  task: {
    servicePromptKey: 'llm_task_assistant',
    description: 'Human/task message generation for LLM node',
  },
  code: {
    servicePromptKey: 'code_assistant',
    description: 'Code generation or improvement for Code node',
    requiresStateVariables: true,
  },
  router: {
    servicePromptKey: 'router_assistant',
    description: 'Routing condition generation for Router node',
    requiresStateVariables: true,
    requiresAvailableNodes: true,
  },
  template: {
    servicePromptKey: 'state_modifier_assistant',
    description: 'Jinja2 template generation for State Modifier node',
    requiresStateVariables: true,
  },
  decision: {
    servicePromptKey: 'decision_assistant',
    description: 'Description generation for Decision node',
    requiresStateVariables: true,
    requiresAvailableNodes: true,
  },
  final_message: {
    servicePromptKey: 'printer_assistant',
    description: 'Final message generation for Printer node',
    requiresStateVariables: false,
  },
};

/**
 * Field name aliases - maps alternative field names to their corresponding template keys
 * Use this to support multiple field names pointing to the same template
 */
const TEMPLATE_ALIASES = {
  condition: 'router', // Maps 'Condition' field (case-insensitive) to router template
  'final message': 'final_message',
  final_message: 'final_message',
  printer: 'final_message',
  description: 'decision',
};

/**
 * Resolve a Service Prompt key for a given fieldName.
 * Returns null for fields that do not have a dedicated AI prompt template.
 * @param {string} fieldName
 * @returns {string|null}
 */
export const getServicePromptKeyForFieldName = fieldName => {
  const template = getPromptTemplate(fieldName);
  return template?.servicePromptKey || null;
};

/**
 * Get the template configuration for a specific field
 * @param {string} fieldName - The name of the field (e.g., 'system', 'task', 'code', 'condition', etc.)
 * @returns {Object|null} - The template configuration or null if no custom template exists
 */
export const getPromptTemplate = fieldName => {
  const normalizedFieldName = fieldName?.toLowerCase();
  // Resolve alias to actual template key
  const templateKey = TEMPLATE_ALIASES[normalizedFieldName] || normalizedFieldName;
  return AI_PROMPT_TEMPLATES[templateKey] || null;
};

/**
 * Build the AI prompt with field-specific context
 * Standardized approach: base prompt + state variables + available nodes + user query + current content
 * @param {string} userQuery - The user's prompt/query
 * @param {string} fieldName - The name of the field
 * @param {string} currentContent - The current content (optional)
 * @param {string} stateVariablesInfo - Formatted state variables info (optional)
 * @param {string} availableNodesInfo - Formatted available nodes info (optional)
 * @returns {string} - The complete prompt to send to the LLM
 */
export const buildFieldContextPrompt = (
  userQuery,
  fieldName,
  currentContent = '',
  stateVariablesInfo = '',
  availableNodesInfo = '',
  options = {},
) => {
  const template = getPromptTemplate(fieldName);

  if (!template) {
    // No custom template, return basic prompt
    return `Current content:\n\n\n\`\`\`\n${currentContent}\n\`\`\`\n\nInstruction: ${userQuery}\n\nIMPORTANT: Return ONLY the final improved version. Do NOT include:\n- The original content again\n- Explanations or comments\n- Markdown code blocks around the result\n- "Here's the improved version" or similar phrases\n\nStart with the first character of the improved content:`;
  }

  const basePromptOverride = options?.basePromptOverride;
  const basePrompt = String(basePromptOverride || '').trim();

  if (!basePrompt) {
    return `Current content:\n\n\n\`\`\`\n${currentContent}\n\`\`\`\n\nInstruction: ${userQuery}\n\nIMPORTANT: Return ONLY the final improved version. Do NOT include:\n- The original content again\n- Explanations or comments\n- Markdown code blocks around the result\n- "Here's the improved version" or similar phrases\n\nStart with the first character of the improved content:`;
  }

  // Start with the base prompt
  const sections = [basePrompt];

  // Add state variables info if required and provided
  if (template.requiresStateVariables && stateVariablesInfo) {
    sections.push('\n-----\n');
    sections.push(stateVariablesInfo);
  }

  // Add available nodes info if required and provided
  if (template.requiresAvailableNodes && availableNodesInfo) {
    sections.push('\n-----\n');
    sections.push(availableNodesInfo);
  }

  // Add separator before user query
  sections.push('\n-----\n');
  sections.push('User request and instructions: ```');
  sections.push(userQuery);
  sections.push('```');

  // Add current content if provided
  if (currentContent && currentContent.trim()) {
    sections.push('\n\nCurrent content:\n\n```\n');
    sections.push(currentContent);
    sections.push('\n```');
    sections.push(
      '\n\nIMPORTANT: Return ONLY the final improved version. Do NOT include:\n- The original content again\n- Explanations or comments\n- Markdown code blocks around the result\n- "Here\'s the improved version" or similar phrases\n\nStart with the first character of the improved content:',
    );
  }
  return sections.join('');
};
